-- ============================================================================
--  طلبات صلاحيات الموظف (بموافقة المدير)
--  ---------------------------------------------------------------------------
--  يُنفّذ مرة واحدة في SQL Editor. آمن للتكرار.
--  • أي حساب جديد يبقى "مواطن" دائماً (كما كان). لا يوجد أي طريق لاختيار دور.
--  • الموظف الحقيقي يرسل "طلب صلاحيات موظف" (عند التسجيل أو من صفحة حسابي) ويختار قسمه.
--  • المدير فقط يوافق أو يرفض. عند الموافقة يصبح الحساب "موظف" في القسم المحدد.
--  • لا يمكن طلب صلاحية "مدير" إطلاقاً — المدير فقط يعيّن مديراً آخر من صفحة الموظفين.
-- ============================================================================

create table if not exists public.staff_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  department_id   uuid not null references public.departments (id) on delete cascade,
  job_title       text check (char_length(job_title) <= 100),
  employee_number text check (char_length(employee_number) <= 30),
  note            text check (char_length(note) <= 500),
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,
  review_note     text check (char_length(review_note) <= 500),
  created_at      timestamptz not null default now()
);
-- طلب معلّق واحد فقط لكل مستخدم
create unique index if not exists staff_requests_one_pending on public.staff_requests (user_id) where status = 'pending';
create index if not exists staff_requests_status_idx on public.staff_requests (status, created_at desc);
create index if not exists staff_requests_department_idx on public.staff_requests (department_id);
create index if not exists staff_requests_reviewed_by_idx on public.staff_requests (reviewed_by);

-- إنشاء الطلب (داخلي): يتحقق من القسم والدور، ويُشعر المدراء
create or replace function private.create_staff_request(p_user uuid, p_department uuid, p_job_title text, p_employee_number text, p_note text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_name text;
  v_dept text;
begin
  if p_user is null or not exists (select 1 from public.profiles p where p.id = p_user and p.role = 'citizen') then
    raise exception 'طلب صلاحيات الموظف متاح لحسابات المواطنين فقط' using errcode = '42501';
  end if;
  select d.name into v_dept from public.departments d where d.id = p_department and d.is_active;
  if v_dept is null then
    raise exception 'اختر قسماً صحيحاً' using errcode = '23514';
  end if;
  if exists (select 1 from public.staff_requests r where r.user_id = p_user and r.status = 'pending') then
    raise exception 'لديك طلب قيد المراجعة بالفعل' using errcode = '23505';
  end if;
  insert into public.staff_requests (user_id, department_id, job_title, employee_number, note)
  values (p_user, p_department, nullif(left(trim(p_job_title), 100), ''), nullif(left(trim(p_employee_number), 30), ''), nullif(left(trim(p_note), 500), ''))
  returning id into v_id;

  v_name := coalesce(private.profile_name(p_user), 'مستخدم');
  insert into public.notifications (user_id, title, body, type)
  select p.id, 'طلب صلاحيات موظف جديد', v_name || ' — ' || v_dept || '. راجِع الطلب من صفحة الموظفين.', 'info'
  from public.profiles p where p.role = 'admin' and p.is_active;
  return v_id;
end
$$;

-- من صفحة "حسابي"
create or replace function public.submit_staff_request(p_department uuid, p_job_title text default null, p_employee_number text default null, p_note text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
begin
  if private.user_role() is distinct from 'citizen' then
    raise exception 'طلب صلاحيات الموظف متاح لحسابات المواطنين فقط' using errcode = '42501';
  end if;
  return private.create_staff_request(auth.uid(), p_department, p_job_title, p_employee_number, p_note);
end
$$;

-- إلغاء الطلب من صاحبه
create or replace function public.cancel_staff_request()
returns void
language sql security definer set search_path = ''
as $$
  update public.staff_requests set status = 'cancelled' where user_id = auth.uid() and status = 'pending'
$$;

-- المدير يوافق أو يرفض
create or replace function public.review_staff_request(p_id uuid, p_approve boolean, p_department uuid default null, p_note text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r public.staff_requests;
  v_dept uuid;
begin
  if not private.is_admin() then
    raise exception 'هذه العملية متاحة للمدير فقط' using errcode = '42501';
  end if;
  select * into r from public.staff_requests where id = p_id for update;
  if not found or r.status <> 'pending' then
    raise exception 'الطلب غير موجود أو تمت مراجعته مسبقاً' using errcode = 'P0002';
  end if;
  v_dept := coalesce(p_department, r.department_id);

  update public.staff_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      department_id = v_dept, reviewed_by = auth.uid(), reviewed_at = now(), review_note = nullif(left(trim(p_note), 500), '')
  where id = p_id;

  if p_approve then
    -- الترقية تمر عبر حماية profiles (مسموحة للمدير فقط) — ولا ترقّي أبداً إلى مدير
    update public.profiles set role = 'employee', department_id = v_dept where id = r.user_id and role = 'citizen';
    perform private.notify(r.user_id, 'تمت الموافقة على طلبك', 'أصبح حسابك حساب موظف. سجّل الدخول من جديد لتظهر لوحة الموظف.', 'info', null);
  else
    perform private.notify(r.user_id, 'تم رفض طلب صلاحيات الموظف', coalesce('السبب: ' || nullif(trim(p_note), ''), 'تواصل مع إدارة البلدية للاستفسار.'), 'info', null);
  end if;
end
$$;

-- التسجيل: إنشاء الملف الشخصي (كما كان) + طلب الموظف إن أُرسل
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone, area_id)
  values (
    new.id,
    new.email,
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''),
    left(new.raw_user_meta_data ->> 'phone', 30),
    (select a.id from public.areas a where a.id = private.try_uuid(new.raw_user_meta_data ->> 'area_id'))
  );
  -- (إضافة) طلب صلاحيات موظف أثناء التسجيل: يُسجّل كطلب معلّق فقط، والحساب يبقى "مواطن"
  -- أي خطأ في الطلب (قسم غير صالح مثلاً) لا يمنع إنشاء الحساب — يمكن إعادة الطلب من صفحة حسابي
  if jsonb_typeof(new.raw_user_meta_data -> 'staff_request') = 'object' then
    begin
      perform private.create_staff_request(
      new.id,
      private.try_uuid(new.raw_user_meta_data -> 'staff_request' ->> 'department_id'),
      new.raw_user_meta_data -> 'staff_request' ->> 'job_title',
      new.raw_user_meta_data -> 'staff_request' ->> 'employee_number',
      new.raw_user_meta_data -> 'staff_request' ->> 'note');
    exception when others then
      null;
    end;
  end if;
  return new;
end
$$;

alter table public.staff_requests enable row level security;
drop policy if exists "staff requests: read own or admin" on public.staff_requests;
create policy "staff requests: read own or admin" on public.staff_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
-- لا إضافة ولا تعديل مباشر — عبر الدوال فقط
revoke insert, update, delete on public.staff_requests from anon, authenticated;
revoke select on public.staff_requests from anon;

revoke execute on function private.create_staff_request(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.submit_staff_request(uuid, text, text, text), public.cancel_staff_request(), public.review_staff_request(uuid, boolean, uuid, text) from public, anon;
grant execute on function public.submit_staff_request(uuid, text, text, text), public.cancel_staff_request(), public.review_staff_request(uuid, boolean, uuid, text) to authenticated;
