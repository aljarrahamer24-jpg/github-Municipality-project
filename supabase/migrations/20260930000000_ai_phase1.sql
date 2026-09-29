-- ============================================================================
--  المرحلة 1 من طبقة الذكاء الاصطناعي: البلاغ بالصورة/النص/الصوت + كشف البلاغات المكررة
--  ---------------------------------------------------------------------------
--  يُنفّذ مرة واحدة بعد الملفات السابقة (SQL Editor → New query → Run). آمن للتكرار.
--  لا يحذف ولا يعيد تسمية أي جدول أو حقل موجود — إضافات فقط.
--
--  مصدر الحقيقة يبقى قاعدة البيانات:
--   • الذكاء الاصطناعي يقترح (النوع، الوصف، الاستعجال) ويُحفظ اقتراحه في ai_analyses للمراجعة.
--   • كشف التكرار حساب جغرافي حقيقي (Haversine) + نوع المشكلة + الحالة — بدون ذكاء اصطناعي.
--   • الموقع يأتي من GPS/الخريطة فقط، ولا يُخمَّن من الذكاء الاصطناعي.
-- ============================================================================

-- 1. نتائج تحليل الذكاء الاصطناعي (للتدقيق ولعرض الاقتراح للموظف)
create table if not exists public.ai_analyses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind         text not null check (kind in ('image', 'text')),
  input_text   text check (char_length(input_text) <= 2000),
  result       jsonb not null,
  provider     text not null,
  model        text not null,
  complaint_id uuid references public.complaints (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists ai_analyses_user_idx on public.ai_analyses (user_id, created_at desc);
create index if not exists ai_analyses_complaint_idx on public.ai_analyses (complaint_id);

-- 2. سجل طلبات الذكاء الاصطناعي (لتحديد عدد الطلبات لكل مستخدم — حماية من الإساءة والتكلفة)
create table if not exists public.ai_requests (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_requests_user_idx on public.ai_requests (user_id, created_at desc);

-- 3. مساهمات المواطنين في بلاغ موجود ("نعم، هذه نفس المشكلة")
create table if not exists public.complaint_contributions (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  citizen_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  comment      text check (char_length(comment) <= 1000),
  latitude     double precision check (latitude between -90 and 90),
  longitude    double precision check (longitude between -180 and 180),
  created_at   timestamptz not null default now(),
  unique (complaint_id, citizen_id)
);
create index if not exists contributions_citizen_idx on public.complaint_contributions (citizen_id);

-- إعدادات الذكاء الاصطناعي (قابلة للتعديل من جدول الإعدادات)
insert into public.app_settings (key, value) values
  ('ai', '{"enabled": true, "max_requests_per_hour": 20, "duplicate_radius_m": 50}')
on conflict (key) do nothing;

-- 4. بدء طلب ذكاء اصطناعي: التحقق من الحساب والحد المسموح ثم التسجيل
create or replace function public.ai_begin_request(p_action text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_max integer := coalesce(private.setting('ai', 'max_requests_per_hour', '20')::integer, 20);
begin
  if private.user_role() is null then
    raise exception 'يجب تسجيل الدخول بحساب نشط' using errcode = '42501';
  end if;
  if coalesce(private.setting('ai', 'enabled', 'true'), 'true') <> 'true' then
    raise exception 'ميزات الذكاء الاصطناعي معطلة حالياً' using errcode = 'P0001', hint = 'ai_disabled';
  end if;
  if (select count(*) from public.ai_requests r where r.user_id = auth.uid() and r.created_at > now() - interval '1 hour') >= v_max then
    raise exception 'تجاوزت الحد المسموح لطلبات المساعد الذكي خلال ساعة. حاول لاحقاً أو أكمل البلاغ يدوياً.' using errcode = 'P0001', hint = 'ai_rate_limit';
  end if;
  insert into public.ai_requests (user_id, action) values (auth.uid(), left(p_action, 40));
end
$$;

-- 5. ربط تحليل الذكاء الاصطناعي بالبلاغ بعد إنشائه (من صاحب التحليل وصاحب البلاغ فقط)
create or replace function public.link_ai_analysis(p_analysis uuid, p_complaint uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.ai_analyses a set complaint_id = p_complaint
  where a.id = p_analysis and a.user_id = auth.uid() and a.complaint_id is null
    and exists (select 1 from public.complaints c where c.id = p_complaint and c.citizen_id = auth.uid())
$$;

-- 6. البحث عن بلاغات مفتوحة قريبة (كشف التكرار) — حساب جغرافي حقيقي بدون ذكاء اصطناعي
--    يعيد بيانات محدودة فقط (بدون عنوان أو وصف أو اسم صاحب البلاغ) لحماية الخصوصية.
create or replace function public.find_nearby_complaints(
  p_lat double precision, p_lng double precision, p_category uuid default null, p_radius_m integer default null
)
returns table (
  id uuid, complaint_number text, category_name text, category_icon text, status public.complaint_status,
  created_at timestamptz, area_name text, distance_m integer, confirmations integer, is_mine boolean
)
language sql stable security definer set search_path = ''
as $$
  with p as (
    select least(greatest(coalesce(p_radius_m, private.setting('ai', 'duplicate_radius_m', '50')::integer), 10), 200) as r
  )
  select c.id, c.complaint_number, cat.name, cat.icon, c.status, c.created_at, a.name,
         round(private.distance_m(p_lat, p_lng, c.latitude, c.longitude))::integer,
         (select count(*) from public.complaint_contributions cc where cc.complaint_id = c.id)::integer,
         c.citizen_id = auth.uid()
  from public.complaints c
  cross join p
  join public.problem_categories cat on cat.id = c.category_id
  left join public.areas a on a.id = c.area_id
  where private.user_role() is not null
    and p_lat between -90 and 90 and p_lng between -180 and 180
    and c.status in ('new', 'under_review', 'assigned', 'in_progress')
    and (p_category is null or c.category_id = p_category)
    -- تصفية أولية بمربع حول النقطة ثم المسافة الدقيقة
    and c.latitude between p_lat - p.r / 111320.0 and p_lat + p.r / 111320.0
    and private.distance_m(p_lat, p_lng, c.latitude, c.longitude) <= p.r
  order by private.distance_m(p_lat, p_lng, c.latitude, c.longitude)
  limit 5
$$;

-- 7. تأكيد أن المشكلة نفسها: تسجيل مساهمة المواطن بدل إنشاء بلاغ جديد
create or replace function public.confirm_duplicate(p_complaint uuid, p_lat double precision, p_lng double precision, p_comment text default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  c public.complaints;
  v_radius integer := least(greatest(private.setting('ai', 'duplicate_radius_m', '50')::integer, 10), 200);
  v_dist double precision;
  v_id uuid;
  v_new boolean;
  r record;
begin
  if private.user_role() is null then
    raise exception 'يجب تسجيل الدخول بحساب نشط' using errcode = '42501';
  end if;
  select * into c from public.complaints where id = p_complaint;
  if not found or c.status not in ('new', 'under_review', 'assigned', 'in_progress') then
    raise exception 'البلاغ غير موجود أو لم يعد مفتوحاً' using errcode = 'P0002';
  end if;
  if c.citizen_id = auth.uid() then
    raise exception 'هذا البلاغ مسجل باسمك مسبقاً، يمكنك متابعته من صفحة بلاغاتي' using errcode = '23514';
  end if;
  v_dist := private.distance_m(p_lat, p_lng, c.latitude, c.longitude);
  if v_dist is null or v_dist > v_radius then
    raise exception 'موقعك بعيد عن البلاغ المحدد، لذلك لا يمكن تأكيده' using errcode = '23514';
  end if;

  insert into public.complaint_contributions (complaint_id, citizen_id, comment, latitude, longitude)
  values (c.id, auth.uid(), nullif(left(trim(p_comment), 1000), ''), p_lat, p_lng)
  on conflict (complaint_id, citizen_id) do update
    set comment = coalesce(excluded.comment, public.complaint_contributions.comment)
  returning id, (xmax = 0) into v_id, v_new;

  -- إشعار الموظف المسؤول أو موظفي القسم (مرة واحدة لكل مواطن)
  if v_new then
    for r in
      select p.id from public.profiles p
      where p.is_active and (p.id = c.assigned_employee_id
            or (c.assigned_employee_id is null and p.role = 'employee' and p.department_id = c.department_id))
    loop
      perform private.notify(r.id, 'مواطن آخر أكّد البلاغ', c.complaint_number || ' — ' || c.title, 'comment', c.id);
    end loop;
  end if;

  return jsonb_build_object('contribution_id', v_id, 'complaint_id', c.id, 'complaint_number', c.complaint_number, 'is_new', v_new);
end
$$;

-- 8. إشعار المساهمين عند تغيير حالة البلاغ (نفس الدالة السابقة + إضافة واحدة)
create or replace function private.after_complaint_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_note text := nullif(current_setting('app.status_note', true), '');
  v_actor_name text := coalesce(private.profile_name(auth.uid()), 'النظام');
  v_dept text;
  v_body text;
begin
  -- تغيير الحالة → سجل + إشعار المواطن
  if new.status is distinct from old.status then
    insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, note)
    values (new.id, old.status, new.status, auth.uid(), v_actor_name, v_note);

    v_body := case new.status
      when 'resolved' then 'تم حل المشكلة في بلاغك ' || new.complaint_number || '. شكراً لتعاونك.'
      when 'closed' then 'تم إغلاق بلاغك ' || new.complaint_number || '. يمكنك الآن تقييم الخدمة.'
      when 'rejected' then 'تم رفض بلاغك ' || new.complaint_number || coalesce(': ' || v_note, '.')
      else 'أصبحت حالة بلاغك ' || new.complaint_number || ': ' || private.status_label(new.status)
    end;
    perform private.notify(new.citizen_id,
      case new.status when 'resolved' then 'تم حل البلاغ' when 'closed' then 'تم إغلاق البلاغ' else 'تم تحديث حالة البلاغ' end,
      v_body, case when new.status = 'closed' then 'rating' else 'status' end, new.id);

    -- (إضافة المرحلة 1) إشعار المواطنين الذين أكدوا نفس المشكلة — بدون ربط بالبلاغ لأنهم لا يملكونه
    insert into public.notifications (user_id, title, body, type)
    select cc.citizen_id, 'تحديث على بلاغ أكدته',
           'البلاغ ' || new.complaint_number || ' أصبح: ' || private.status_label(new.status) || '. يمكنك متابعته برقم البلاغ.', 'status'
    from public.complaint_contributions cc
    where cc.complaint_id = new.id and cc.citizen_id is distinct from new.citizen_id;
  end if;

  -- تغيير القسم أو الموظف → سجل التعيينات + إشعارات
  if new.department_id is distinct from old.department_id or new.assigned_employee_id is distinct from old.assigned_employee_id then
    update public.complaint_assignments set unassigned_at = now()
    where complaint_id = new.id and unassigned_at is null;

    insert into public.complaint_assignments (complaint_id, department_id, employee_id, assigned_by)
    values (new.id, new.department_id, new.assigned_employee_id, auth.uid());

    if new.department_id is distinct from old.department_id and new.department_id is not null then
      select name into v_dept from public.departments where id = new.department_id;
      perform private.notify(new.citizen_id, 'تم تحويل البلاغ',
        'تم تحويل بلاغك ' || new.complaint_number || ' إلى ' || coalesce(v_dept, 'القسم المختص') || '.', 'assignment', new.id);
    end if;

    if new.assigned_employee_id is distinct from old.assigned_employee_id and new.assigned_employee_id is not null
       and new.assigned_employee_id is distinct from auth.uid() then
      perform private.notify(new.assigned_employee_id, 'تم إسناد بلاغ إليك',
        new.complaint_number || ' — ' || new.title, 'assignment', new.id);
    end if;
  end if;
  return new;
end
$$;

-- 9. صور المساهمين: يستطيع المواطن الذي أكد البلاغ إرفاق صورة (نوع citizen)
create or replace function private.can_upload_complaint_file(p_name text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case (storage.foldername(p_name))[2]
    when 'citizen' then exists (
      select 1 from public.complaints c
      where c.id = private.try_uuid((storage.foldername(p_name))[1])
        and (c.citizen_id = auth.uid()
             or exists (select 1 from public.complaint_contributions cc where cc.complaint_id = c.id and cc.citizen_id = auth.uid())))
    when 'before' then private.is_staff() and private.can_view_complaint(private.try_uuid((storage.foldername(p_name))[1]))
    when 'after' then private.is_staff() and private.can_view_complaint(private.try_uuid((storage.foldername(p_name))[1]))
    else false
  end
$$;

-- التحقق عبر دالة SECURITY DEFINER لأن المساهم لا يرى صف البلاغ نفسه (RLS)
create or replace function private.can_add_citizen_image(p_complaint uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.complaints c
    where c.id = p_complaint
      and (c.citizen_id = auth.uid()
           or exists (select 1 from public.complaint_contributions cc where cc.complaint_id = c.id and cc.citizen_id = auth.uid()))
  )
$$;
grant execute on function private.can_add_citizen_image(uuid) to authenticated;

drop policy if exists "images: insert by owner or staff" on public.complaint_images;
create policy "images: insert by owner or staff" on public.complaint_images for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and (
      (kind = 'citizen' and private.can_add_citizen_image(complaint_id))
      or (kind in ('before', 'after') and (select private.is_staff()) and private.can_view_complaint(complaint_id))
    )
  );

-- 10. الصلاحيات (RLS)
alter table public.ai_analyses enable row level security;
alter table public.ai_requests enable row level security;
alter table public.complaint_contributions enable row level security;

drop policy if exists "ai analyses: read own or staff" on public.ai_analyses;
create policy "ai analyses: read own or staff" on public.ai_analyses for select to authenticated
  using (user_id = (select auth.uid()) or (complaint_id is not null and (select private.is_staff()) and private.can_view_complaint(complaint_id)));
drop policy if exists "ai analyses: insert own" on public.ai_analyses;
create policy "ai analyses: insert own" on public.ai_analyses for insert to authenticated
  with check (user_id = (select auth.uid()) and complaint_id is null and (select private.user_role()) is not null);

drop policy if exists "ai requests: read own" on public.ai_requests;
create policy "ai requests: read own" on public.ai_requests for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "contributions: read own or staff" on public.complaint_contributions;
create policy "contributions: read own or staff" on public.complaint_contributions for select to authenticated
  using (citizen_id = (select auth.uid()) or ((select private.is_staff()) and private.can_view_complaint(complaint_id)));

revoke all on public.ai_requests from anon;
revoke all on public.ai_analyses from anon;
revoke all on public.complaint_contributions from anon;
revoke insert, update, delete on public.ai_requests, public.complaint_contributions from authenticated;
revoke update, delete on public.ai_analyses from authenticated;

revoke execute on function public.ai_begin_request(text), public.link_ai_analysis(uuid, uuid),
  public.find_nearby_complaints(double precision, double precision, uuid, integer),
  public.confirm_duplicate(uuid, double precision, double precision, text) from public, anon;
grant execute on function public.ai_begin_request(text), public.link_ai_analysis(uuid, uuid),
  public.find_nearby_complaints(double precision, double precision, uuid, integer),
  public.confirm_duplicate(uuid, double precision, double precision, text) to authenticated;
