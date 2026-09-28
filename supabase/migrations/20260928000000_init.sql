-- ============================================================================
--  منصة إدارة شكاوى وطلبات خدمات البلدية — قاعدة البيانات الكاملة (Supabase)
--  ---------------------------------------------------------------------------
--  يُنفّذ هذا الملف مرة واحدة في: Supabase Dashboard → SQL Editor → New query
--  المحتويات:
--    1.  الأنواع (Enums) والمخطط الخاص (private)
--    2.  الجداول والفهارس
--    3.  دوال مساعدة (الصلاحيات، المسافة، الإشعارات، رقم البلاغ)
--    4.  المشغلات (Triggers)
--    5.  دوال التطبيق (RPC) والتحليلات
--    6.  أمان مستوى الصفوف (RLS) والسياسات
--    7.  الصلاحيات (Grants)
--    8.  التخزين (Storage) للصور
--    9.  Realtime
--    10. الإعدادات الافتراضية
--  ملاحظة: لا يوجد أي ذكاء اصطناعي — كل التحليلات SQL وقواعد منطقية وإحصاءات.
-- ============================================================================

-- ============ 1. الأنواع والمخطط الخاص ============

create schema if not exists private; -- دوال داخلية غير مكشوفة عبر الـ API

create type public.user_role as enum ('citizen', 'employee', 'admin');
create type public.complaint_status as enum ('new', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected');
create type public.complaint_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.image_kind as enum ('citizen', 'before', 'after');
create type public.risk_level as enum ('low', 'medium', 'high');
create type public.keyword_sentiment as enum ('positive', 'negative', 'neutral');

-- ============ 2. الجداول ============

create table public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 100),
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.areas (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 100),
  description text,
  latitude    double precision check (latitude between -90 and 90),
  longitude   double precision check (longitude between -180 and 180),
  flood_risk  public.risk_level not null default 'low',
  population  integer check (population >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  email         text,
  phone         text,
  role          public.user_role not null default 'citizen',
  avatar        text,
  department_id uuid references public.departments (id) on delete set null,
  area_id       uuid references public.areas (id) on delete set null,
  preferences   jsonb not null default '{}'::jsonb,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create index profiles_department_idx on public.profiles (department_id);

create table public.problem_categories (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null unique check (char_length(name) between 2 and 100),
  description        text,
  icon               text not null default 'construction',
  color              text not null default '#0b5d51',
  department_id      uuid references public.departments (id) on delete set null,
  sla_days           integer not null default 3 check (sla_days between 1 and 365),
  default_priority   public.complaint_priority not null default 'medium',
  is_weather_related boolean not null default false, -- فيضانات / تصريف / تجمع مياه (لتحليل الطقس)
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index problem_categories_department_idx on public.problem_categories (department_id);

-- عداد أرقام البلاغات لكل سنة: BLD-2026-000001
create table public.complaint_counters (
  year       integer primary key,
  last_value integer not null default 0
);

create table public.complaints (
  id                   uuid primary key default gen_random_uuid(),
  complaint_number     text not null unique,
  citizen_id           uuid not null references public.profiles (id) on delete restrict,
  category_id          uuid not null references public.problem_categories (id) on delete restrict,
  department_id        uuid references public.departments (id) on delete set null,
  assigned_employee_id uuid references public.profiles (id) on delete set null,
  area_id              uuid references public.areas (id) on delete set null,
  title                text not null check (char_length(title) between 5 and 120),
  description          text not null check (char_length(description) between 10 and 2000),
  latitude             double precision not null check (latitude between -90 and 90),
  longitude            double precision not null check (longitude between -180 and 180),
  address              text check (char_length(address) <= 300),
  priority             public.complaint_priority not null default 'medium',
  status               public.complaint_status not null default 'new',
  due_at               timestamptz, -- الموعد النهائي حسب SLA نوع المشكلة (للبلاغات المتأخرة)
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  resolved_at          timestamptz,
  closed_at            timestamptz
);
create index complaints_citizen_idx on public.complaints (citizen_id);
create index complaints_department_idx on public.complaints (department_id);
create index complaints_assignee_idx on public.complaints (assigned_employee_id);
create index complaints_category_idx on public.complaints (category_id);
create index complaints_area_idx on public.complaints (area_id);
create index complaints_status_idx on public.complaints (status);
create index complaints_created_idx on public.complaints (created_at desc);

create table public.complaint_images (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  kind         public.image_kind not null,
  storage_path text not null unique,
  uploaded_by  uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  -- المسار يجب أن يبدأ بمعرّف البلاغ ونوع الصورة: {complaint_id}/{kind}/{file}
  constraint complaint_images_path_chk check (storage_path like complaint_id::text || '/' || kind::text || '/%')
);
create index complaint_images_complaint_idx on public.complaint_images (complaint_id);

create table public.complaint_status_history (
  id              bigint generated always as identity primary key,
  complaint_id    uuid not null references public.complaints (id) on delete cascade,
  old_status      public.complaint_status,
  new_status      public.complaint_status not null,
  changed_by      uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  note            text,
  created_at      timestamptz not null default now()
);
create index status_history_complaint_idx on public.complaint_status_history (complaint_id, created_at);

create table public.complaint_assignments (
  id            uuid primary key default gen_random_uuid(),
  complaint_id  uuid not null references public.complaints (id) on delete cascade,
  department_id uuid references public.departments (id) on delete set null,
  employee_id   uuid references public.profiles (id) on delete set null,
  assigned_by   uuid references public.profiles (id) on delete set null,
  assigned_at   timestamptz not null default now(),
  unassigned_at timestamptz
);
create index assignments_complaint_idx on public.complaint_assignments (complaint_id, assigned_at);

-- ملاحظات داخلية: للموظفين والإدارة فقط (لا تظهر للمواطن)
create table public.internal_notes (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  author_id    uuid references public.profiles (id) on delete set null default auth.uid(),
  author_name  text,
  body         text not null check (char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now()
);
create index internal_notes_complaint_idx on public.internal_notes (complaint_id, created_at);

create table public.complaint_comments (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  author_id    uuid references public.profiles (id) on delete set null default auth.uid(),
  author_name  text,
  author_role  public.user_role,
  body         text not null check (char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now()
);
create index comments_complaint_idx on public.complaint_comments (complaint_id, created_at);

create table public.complaint_ratings (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null unique references public.complaints (id) on delete cascade, -- تقييم واحد فقط لكل بلاغ
  citizen_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  rating       smallint not null check (rating between 1 and 5),
  comment      text check (char_length(comment) <= 1000),
  tags         text[] not null default '{}',
  created_at   timestamptz not null default now()
);
create index ratings_created_idx on public.complaint_ratings (created_at desc);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  title        text not null,
  body         text,
  type         text not null default 'info', -- status | comment | assignment | new | weather | rating | info
  complaint_id uuid references public.complaints (id) on delete cascade,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.feedback_keywords (
  id         uuid primary key default gen_random_uuid(),
  keyword    text not null unique check (char_length(keyword) between 2 and 60),
  sentiment  public.keyword_sentiment not null default 'negative',
  topic      text not null default 'عام', -- المحور: زمن الاستجابة، جودة الحل، التواصل...
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weather_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 3 and 150),
  event_type  text not null default 'rain' check (event_type in ('rain', 'flood', 'storm', 'wind', 'snow', 'heat', 'dust')),
  severity    public.risk_level not null default 'medium',
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  rainfall    text,
  wind        text,
  temperature text,
  checklist   jsonb not null default '[]'::jsonb, -- [{ "text": "...", "done": false }]
  created_by  uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint weather_events_dates_chk check (ends_at >= starts_at)
);

create table public.weather_event_areas (
  event_id uuid not null references public.weather_events (id) on delete cascade,
  area_id  uuid not null references public.areas (id) on delete cascade,
  primary key (event_id, area_id)
);

create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============ 3. دوال مساعدة ============

-- دور المستخدم الحالي (فقط إذا كان الحساب نشطاً)
create or replace function private.user_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active
$$;

create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.user_role() = 'admin', false)
$$;

create or replace function private.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.user_role() in ('employee', 'admin'), false)
$$;

create or replace function private.user_department()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.department_id from public.profiles p where p.id = auth.uid() and p.is_active
$$;

-- هل يستطيع المستخدم الحالي رؤية البلاغ؟ (المالك، المدير، موظف القسم أو الموظف المسند له)
create or replace function private.can_view_complaint(p_complaint uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.complaints c
    where c.id = p_complaint
      and private.user_role() is not null -- الحساب نشط
      and (
        c.citizen_id = auth.uid()
        or private.is_admin()
        or (private.user_role() = 'employee'
            and (c.department_id = private.user_department() or c.assigned_employee_id = auth.uid()))
      )
  )
$$;

create or replace function private.try_uuid(p text)
returns uuid
language plpgsql immutable
as $$
begin
  return p::uuid;
exception when others then
  return null;
end
$$;

-- المسافة بالمتر بين نقطتين (Haversine) — بدون الحاجة إلى PostGIS
create or replace function private.distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql immutable parallel safe
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

create or replace function private.status_label(s public.complaint_status)
returns text
language sql immutable
as $$
  select case s
    when 'new' then 'جديد'
    when 'under_review' then 'قيد المراجعة'
    when 'assigned' then 'تم التعيين'
    when 'in_progress' then 'قيد المعالجة'
    when 'resolved' then 'تم الحل'
    when 'closed' then 'مغلق'
    when 'rejected' then 'مرفوض'
  end
$$;

create or replace function private.setting(p_key text, p_field text, p_default text)
returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce((select s.value ->> p_field from public.app_settings s where s.key = p_key), p_default)
$$;

create or replace function private.app_tz()
returns text
language sql stable
as $$
  select private.setting('general', 'timezone', 'Asia/Amman')
$$;

create or replace function private.next_complaint_number(p_year integer)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v integer;
begin
  insert into public.complaint_counters (year, last_value) values (p_year, 1)
  on conflict (year) do update set last_value = public.complaint_counters.last_value + 1
  returning last_value into v;
  return 'BLD-' || p_year || '-' || lpad(v::text, 6, '0');
end
$$;

create or replace function private.notify(p_user uuid, p_title text, p_body text, p_type text, p_complaint uuid)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, title, body, type, complaint_id)
  select p_user, p_title, p_body, p_type, p_complaint
  where p_user is not null
$$;

create or replace function private.profile_name(p_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select nullif(p.full_name, '') from public.profiles p where p.id = p_id
$$;

-- ============ 4. المشغلات (Triggers) ============

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger departments_updated before update on public.departments for each row execute function private.set_updated_at();
create trigger areas_updated before update on public.areas for each row execute function private.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function private.set_updated_at();
create trigger categories_updated before update on public.problem_categories for each row execute function private.set_updated_at();
create trigger keywords_updated before update on public.feedback_keywords for each row execute function private.set_updated_at();
create trigger weather_updated before update on public.weather_events for each row execute function private.set_updated_at();
create trigger settings_updated before update on public.app_settings for each row execute function private.set_updated_at();

-- 4.1 إنشاء ملف المستخدم تلقائياً عند التسجيل — الدور دائماً "مواطن" مهما أرسل العميل
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
  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.sync_user_email()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.sync_user_email();

-- 4.2 حماية الأعمدة الحساسة في profiles: فقط المدير يغيّر الدور/القسم/التفعيل
create or replace function private.guard_profile_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.id <> old.id then
    raise exception 'لا يمكن تعديل معرّف المستخدم' using errcode = '42501';
  end if;

  if auth.uid() is not null and not private.is_admin() then
    if new.role is distinct from old.role
       or new.department_id is distinct from old.department_id
       or new.is_active is distinct from old.is_active
       or new.email is distinct from old.email then
      raise exception 'غير مسموح لك بتعديل الصلاحيات أو القسم' using errcode = '42501';
    end if;
  end if;

  -- الموظف يجب أن يكون مرتبطاً بقسم، والمواطن بدون قسم
  if new.role = 'citizen' then
    new.department_id := null;
  end if;

  -- منع إزالة آخر مدير نشط في النظام
  if old.role = 'admin' and old.is_active and (new.role <> 'admin' or not new.is_active) then
    if not exists (select 1 from public.profiles p where p.role = 'admin' and p.is_active and p.id <> old.id) then
      raise exception 'لا يمكن إزالة آخر مدير في النظام' using errcode = '42501';
    end if;
  end if;
  return new;
end
$$;

create trigger profiles_guard before update on public.profiles for each row execute function private.guard_profile_update();

-- 4.3 قبل إنشاء بلاغ: رقم البلاغ، القسم، الأولوية، الموعد النهائي، المنطقة الأقرب
create or replace function private.before_complaint_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_cat public.problem_categories;
begin
  select * into v_cat from public.problem_categories where id = new.category_id;
  if not found then
    raise exception 'نوع المشكلة غير موجود' using errcode = '23503';
  end if;

  if auth.uid() is not null then
    -- حماية من الإغراق: حد أقصى 10 بلاغات لكل مستخدم خلال ساعة
    if (select count(*) from public.complaints c where c.citizen_id = auth.uid() and c.created_at > now() - interval '1 hour') >= 10 then
      raise exception 'تجاوزت الحد المسموح لعدد البلاغات خلال ساعة. حاول لاحقاً.' using errcode = '23514';
    end if;
    -- الطلبات من التطبيق: لا يثق النظام بأي قيمة حساسة يرسلها العميل
    if not v_cat.is_active then
      raise exception 'نوع المشكلة غير متاح حالياً' using errcode = '23514';
    end if;
    new.citizen_id := auth.uid();
    new.status := 'new';
    new.assigned_employee_id := null;
    new.priority := v_cat.default_priority;
    new.created_at := now();
    new.resolved_at := null;
    new.closed_at := null;
  end if;

  new.id := coalesce(new.id, gen_random_uuid());
  new.department_id := coalesce(new.department_id, v_cat.department_id);
  if auth.uid() is not null then
    new.department_id := v_cat.department_id;
  end if;
  new.due_at := new.created_at + make_interval(days => v_cat.sla_days);
  new.updated_at := new.created_at;

  -- المنطقة: إن لم تُحدد نختار أقرب منطقة للإحداثيات
  if new.area_id is null or not exists (select 1 from public.areas a where a.id = new.area_id) then
    select a.id into new.area_id
    from public.areas a
    where a.latitude is not null and a.longitude is not null
    order by private.distance_m(new.latitude, new.longitude, a.latitude, a.longitude)
    limit 1;
  end if;

  new.complaint_number := private.next_complaint_number(extract(year from timezone(private.app_tz(), new.created_at))::integer);
  return new;
end
$$;

create trigger complaints_before_insert before insert on public.complaints for each row execute function private.before_complaint_insert();

-- 4.4 قبل تحديث بلاغ: قواعد الصلاحيات والتواريخ والتعيين
create or replace function private.before_complaint_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_is_admin boolean := private.is_admin();
  v_assignee public.profiles;
begin
  -- حقول لا تتغير أبداً من التطبيق
  if auth.uid() is not null then
    if new.complaint_number <> old.complaint_number or new.citizen_id <> old.citizen_id or new.created_at <> old.created_at then
      raise exception 'لا يمكن تعديل بيانات إنشاء البلاغ' using errcode = '42501';
    end if;

    if not v_is_admin then
      if new.title <> old.title or new.description <> old.description or new.category_id <> old.category_id
         or new.latitude <> old.latitude or new.longitude <> old.longitude
         or new.address is distinct from old.address or new.area_id is distinct from old.area_id
         or new.department_id is distinct from old.department_id or new.due_at is distinct from old.due_at then
        raise exception 'غير مسموح لك بتعديل هذه البيانات' using errcode = '42501';
      end if;
      if old.status in ('closed', 'rejected') and new.status <> old.status then
        raise exception 'البلاغ مغلق ولا يمكن إعادة فتحه إلا من المدير' using errcode = '42501';
      end if;
    end if;
  end if;

  -- التحقق من الموظف المسند
  if new.assigned_employee_id is distinct from old.assigned_employee_id and new.assigned_employee_id is not null then
    select * into v_assignee from public.profiles where id = new.assigned_employee_id;
    if not found or v_assignee.role not in ('employee', 'admin') or not v_assignee.is_active then
      raise exception 'لا يمكن إسناد البلاغ إلا لموظف نشط' using errcode = '23514';
    end if;
    if auth.uid() is not null and not v_is_admin and v_assignee.role = 'employee'
       and v_assignee.department_id is distinct from new.department_id then
      raise exception 'لا يمكن إسناد البلاغ لموظف من قسم آخر' using errcode = '42501';
    end if;
    -- عند الإسناد يتحول البلاغ الجديد تلقائياً إلى "تم التعيين"
    if new.status = old.status and new.status in ('new', 'under_review') then
      new.status := 'assigned';
    end if;
  end if;

  -- تحويل البلاغ لقسم آخر: يلغى إسناد الموظف إن لم يكن من القسم الجديد
  if new.department_id is distinct from old.department_id and new.assigned_employee_id is not null
     and new.assigned_employee_id is not distinct from old.assigned_employee_id then
    if exists (select 1 from public.profiles p where p.id = new.assigned_employee_id and p.role = 'employee'
               and p.department_id is distinct from new.department_id) then
      new.assigned_employee_id := null;
    end if;
  end if;

  -- تواريخ الحل والإغلاق
  if new.status is distinct from old.status then
    if new.status = 'resolved' then
      new.resolved_at := now();
    elsif new.status = 'closed' then
      new.closed_at := now();
      new.resolved_at := coalesce(new.resolved_at, now());
    elsif new.status in ('new', 'under_review', 'assigned', 'in_progress') then
      new.resolved_at := null;
      new.closed_at := null;
    end if;
  end if;

  new.updated_at := now();
  return new;
end
$$;

create trigger complaints_before_update before update on public.complaints for each row execute function private.before_complaint_update();

-- 4.5 بعد إنشاء بلاغ: سجل الحالة + التعيين للقسم + الإشعارات
create or replace function private.after_complaint_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  v_cat text;
begin
  select name into v_cat from public.problem_categories where id = new.category_id;

  insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, note, created_at)
  values (new.id, null, new.status, new.citizen_id, 'النظام', 'تم استلام البلاغ وإرسال رقم المتابعة للمواطن.', new.created_at);

  if new.department_id is not null then
    insert into public.complaint_assignments (complaint_id, department_id, employee_id, assigned_by, assigned_at)
    values (new.id, new.department_id, new.assigned_employee_id, null, new.created_at);
  end if;

  perform private.notify(new.citizen_id, 'تم إنشاء البلاغ',
    'تم استلام بلاغك رقم ' || new.complaint_number || ' وسيتم مراجعته قريباً.', 'new', new.id);

  -- إشعار المدراء وموظفي القسم المختص ببلاغ جديد
  for r in
    select p.id from public.profiles p
    where p.is_active and (p.role = 'admin' or (p.role = 'employee' and p.department_id = new.department_id))
  loop
    perform private.notify(r.id, 'بلاغ جديد',
      new.complaint_number || ' — ' || coalesce(v_cat, '') || ': ' || new.title, 'new', new.id);
  end loop;
  return new;
end
$$;

create trigger complaints_after_insert after insert on public.complaints for each row execute function private.after_complaint_insert();

-- 4.6 بعد تحديث بلاغ: سجل الحالة + سجل التعيينات + الإشعارات
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

create trigger complaints_after_update after update on public.complaints for each row execute function private.after_complaint_update();

-- 4.7 التعليقات: اسم وصفة الكاتب تُحفظ من الخادم + إشعار الطرف الآخر
create or replace function private.before_comment_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.author_id := auth.uid();
    new.created_at := now();
  end if;
  select coalesce(nullif(p.full_name, ''), 'مستخدم'), p.role into new.author_name, new.author_role
  from public.profiles p where p.id = new.author_id;
  return new;
end
$$;

create trigger comments_before_insert before insert on public.complaint_comments for each row execute function private.before_comment_insert();

create or replace function private.after_comment_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  c public.complaints;
  r record;
begin
  select * into c from public.complaints where id = new.complaint_id;
  if new.author_role = 'citizen' then
    if c.assigned_employee_id is not null then
      perform private.notify(c.assigned_employee_id, 'تعليق جديد من المواطن', c.complaint_number || ': ' || left(new.body, 120), 'comment', c.id);
    else
      for r in select p.id from public.profiles p
               where p.is_active and p.role = 'employee' and p.department_id = c.department_id
      loop
        perform private.notify(r.id, 'تعليق جديد من المواطن', c.complaint_number || ': ' || left(new.body, 120), 'comment', c.id);
      end loop;
    end if;
  elsif new.author_id is distinct from c.citizen_id then
    perform private.notify(c.citizen_id, 'رد جديد على بلاغك', c.complaint_number || ': ' || left(new.body, 120), 'comment', c.id);
  end if;
  return new;
end
$$;

create trigger comments_after_insert after insert on public.complaint_comments for each row execute function private.after_comment_insert();

-- 4.8 الملاحظات الداخلية: الكاتب يُحدد من الخادم
create or replace function private.before_note_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.author_id := auth.uid();
    new.created_at := now();
  end if;
  new.author_name := coalesce(private.profile_name(new.author_id), 'موظف');
  return new;
end
$$;

create trigger notes_before_insert before insert on public.internal_notes for each row execute function private.before_note_insert();

-- 4.9 الصور والتقييمات: صاحب السجل يُحدد من الخادم
create or replace function private.set_uploader()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.uploaded_by := auth.uid();
    new.created_at := now();
  end if;
  return new;
end
$$;

create trigger images_before_insert before insert on public.complaint_images for each row execute function private.set_uploader();

-- حد أقصى لعدد الصور لكل بلاغ ولكل نوع (من الإعدادات، الافتراضي 5)
create or replace function private.limit_images()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.complaint_images i where i.complaint_id = new.complaint_id and i.kind = new.kind)
     >= private.setting('complaints', 'max_images', '5')::integer then
    raise exception 'تم الوصول للحد الأقصى لعدد الصور في هذا البلاغ' using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger images_limit before insert on public.complaint_images for each row execute function private.limit_images();

create or replace function private.set_rating_owner()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.citizen_id := auth.uid();
    new.created_at := now();
  end if;
  return new;
end
$$;

create trigger ratings_before_insert before insert on public.complaint_ratings for each row execute function private.set_rating_owner();

-- ============ 5. دوال التطبيق (RPC) ============

-- 5.1 تحديث البلاغ من لوحة الموظف/المدير مع ملاحظة تظهر في سجل الحالات
create or replace function public.update_complaint(
  p_id uuid,
  p_status public.complaint_status default null,
  p_priority public.complaint_priority default null,
  p_department uuid default null,
  p_assignee uuid default null,
  p_clear_assignee boolean default false,
  p_note text default null
)
returns public.complaints
language plpgsql security invoker set search_path = ''
as $$
declare
  v public.complaints;
begin
  if not private.is_staff() then
    raise exception 'هذه العملية متاحة للموظفين فقط' using errcode = '42501';
  end if;
  perform set_config('app.status_note', coalesce(left(p_note, 1000), ''), true);

  update public.complaints c set
    status = coalesce(p_status, c.status),
    priority = coalesce(p_priority, c.priority),
    department_id = coalesce(p_department, c.department_id),
    assigned_employee_id = case when p_clear_assignee then null else coalesce(p_assignee, c.assigned_employee_id) end
  where c.id = p_id
  returning * into v;

  if not found then
    raise exception 'البلاغ غير موجود أو لا تملك صلاحية تعديله' using errcode = 'P0002';
  end if;
  perform set_config('app.status_note', '', true);
  return v;
end
$$;

-- 5.2 متابعة بلاغ برقمه (بدون تسجيل دخول) — بيانات محدودة فقط بدون أي معلومات شخصية
create or replace function public.track_complaint(p_number text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'complaint_number', c.complaint_number,
    'status', c.status,
    'category', cat.name,
    'department', d.name,
    'area', a.name,
    'created_at', c.created_at,
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('status', h.new_status, 'created_at', h.created_at) order by h.created_at)
      from public.complaint_status_history h where h.complaint_id = c.id
    ), '[]'::jsonb)
  )
  from public.complaints c
  left join public.problem_categories cat on cat.id = c.category_id
  left join public.departments d on d.id = c.department_id
  left join public.areas a on a.id = c.area_id
  where c.complaint_number = upper(trim(p_number))
$$;

-- 5.3 إحصائيات عامة للصفحة الرئيسية (أرقام مجمّعة فقط)
create or replace function public.public_stats()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.complaints),
    'closed_rate', (select round(100.0 * count(*) filter (where status in ('resolved', 'closed')) / nullif(count(*), 0)) from public.complaints),
    'avg_days', (select round((avg(extract(epoch from (resolved_at - created_at))) / 86400)::numeric, 1) from public.complaints where resolved_at is not null),
    'avg_rating', (select round(avg(rating)::numeric, 1) from public.complaint_ratings)
  )
$$;

-- 5.4 إحصائيات اللوحة — تحترم RLS (المواطن يرى أرقامه، الموظف قسمه، المدير الكل)
create or replace function public.dashboard_stats()
returns jsonb
language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'total', count(*),
    'new', count(*) filter (where status in ('new', 'under_review')),
    'assigned', count(*) filter (where status = 'assigned'),
    'in_progress', count(*) filter (where status in ('assigned', 'in_progress')),
    'resolved', count(*) filter (where status = 'resolved'),
    'closed', count(*) filter (where status = 'closed'),
    'rejected', count(*) filter (where status = 'rejected'),
    'done', count(*) filter (where status in ('resolved', 'closed')),
    'open', count(*) filter (where status in ('new', 'under_review', 'assigned', 'in_progress')),
    'overdue', count(*) filter (where status in ('new', 'under_review', 'assigned', 'in_progress') and due_at < now()),
    'closed_rate', round(100.0 * count(*) filter (where status in ('resolved', 'closed')) / nullif(count(*) filter (where status <> 'rejected'), 0)),
    'avg_days', round((avg(extract(epoch from (resolved_at - created_at))) filter (where resolved_at is not null) / 86400)::numeric, 1),
    'avg_rating', (select round(avg(r.rating)::numeric, 1) from public.complaint_ratings r),
    'this_month', count(*) filter (where created_at >= date_trunc('month', now())),
    'last_month', count(*) filter (where created_at >= date_trunc('month', now()) - interval '1 month' and created_at < date_trunc('month', now()))
  )
  from public.complaints
$$;

-- 5.5 تحليلات عامة لفترة: حسب النوع/القسم/المنطقة/الشهر
create or replace function public.analytics_breakdown(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb
language sql stable security invoker set search_path = ''
as $$
  with base as (
    select c.* from public.complaints c
    where (p_from is null or c.created_at >= p_from) and (p_to is null or c.created_at < p_to)
  )
  select jsonb_build_object(
    'by_category', coalesce((
      select jsonb_agg(x order by x.value desc) from (
        select cat.name, count(*) as value from base b join public.problem_categories cat on cat.id = b.category_id group by cat.name
      ) x), '[]'::jsonb),
    'by_department', coalesce((
      select jsonb_agg(x order by x.value desc) from (
        select coalesce(d.name, 'غير محدد') as name, count(*) as value,
               count(*) filter (where b.status in ('resolved', 'closed')) as done,
               round(100.0 * count(*) filter (where b.status in ('resolved', 'closed')) / nullif(count(*) filter (where b.status <> 'rejected'), 0)) as close_rate,
               round((avg(extract(epoch from (b.resolved_at - b.created_at))) filter (where b.resolved_at is not null) / 86400)::numeric, 1) as avg_days,
               (select round(avg(r.rating)::numeric, 1) from public.complaint_ratings r join base b2 on b2.id = r.complaint_id where b2.department_id is not distinct from b.department_id) as avg_rating
        from base b left join public.departments d on d.id = b.department_id group by d.name, b.department_id
      ) x), '[]'::jsonb),
    'by_area', coalesce((
      select jsonb_agg(x order by x.value desc) from (
        select coalesce(a.name, 'غير محدد') as name, count(*) as value from base b left join public.areas a on a.id = b.area_id group by a.name
      ) x), '[]'::jsonb),
    'by_status', coalesce((
      select jsonb_object_agg(status, n) from (select status, count(*) n from base group by status) s), '{}'::jsonb)
  )
$$;

-- 5.6 البلاغات حسب الشهر (المستلمة / المغلقة) لآخر N شهر
create or replace function public.monthly_trend(p_months integer default 6)
returns table (month date, received bigint, closed bigint)
language sql stable security invoker set search_path = ''
as $$
  with months as (
    select (date_trunc('month', timezone(private.app_tz(), now())) - make_interval(months => g))::date as m
    from generate_series(0, greatest(p_months, 1) - 1) g
  )
  select m.m,
    (select count(*) from public.complaints c where date_trunc('month', timezone(private.app_tz(), c.created_at))::date = m.m),
    (select count(*) from public.complaints c where c.resolved_at is not null and date_trunc('month', timezone(private.app_tz(), c.resolved_at))::date = m.m)
  from months m
  order by m.m
$$;

-- 5.7 المناطق الساخنة: عدد البلاغات لكل منطقة في فترات مختلفة
create or replace function public.hotspot_areas(
  p_days integer default null,
  p_category uuid default null,
  p_status public.complaint_status default null
)
returns table (
  area_id uuid, name text, latitude double precision, longitude double precision,
  total bigint, last_30 bigint, last_90 bigint, last_180 bigint, open_count bigint, top_category text
)
language sql stable security invoker set search_path = ''
as $$
  with base as (
    select c.* from public.complaints c
    where (p_days is null or c.created_at >= now() - make_interval(days => p_days))
      and (p_category is null or c.category_id = p_category)
      and (p_status is null or c.status = p_status)
  )
  select a.id, a.name, a.latitude, a.longitude,
    count(b.id),
    count(b.id) filter (where b.created_at >= now() - interval '30 days'),
    count(b.id) filter (where b.created_at >= now() - interval '90 days'),
    count(b.id) filter (where b.created_at >= now() - interval '180 days'),
    count(b.id) filter (where b.status in ('new', 'under_review', 'assigned', 'in_progress')),
    (select cat.name from base b2 join public.problem_categories cat on cat.id = b2.category_id
     where b2.area_id = a.id group by cat.name order by count(*) desc, cat.name limit 1)
  from public.areas a
  left join base b on b.area_id = a.id
  group by a.id
  having count(b.id) > 0
  order by count(b.id) desc, a.name
$$;

-- 5.8 اكتشاف المشاكل المتكررة (بدون ذكاء اصطناعي):
--   نفس نوع المشكلة + ضمن مسافة R متر + خلال آخر M شهر + عدد البلاغات ≥ N
--   الخوارزمية: لكل بلاغ نحسب جيرانه المطابقين، ثم نختار المراكز الأكثر كثافة (Greedy)
--   ونستبعد البلاغات التي دخلت في مجموعة سابقة حتى لا تتكرر المجموعات.
create or replace function public.recurring_problems(
  p_radius_m integer default null,
  p_months integer default null,
  p_min_count integer default null
)
returns table (
  category_id uuid, category_name text, category_icon text, is_weather_related boolean,
  area_name text, complaints_count integer, open_count integer,
  first_at timestamptz, last_at timestamptz, period_days integer,
  center_lat double precision, center_lng double precision,
  complaint_ids uuid[], severity text, recommendation text
)
language plpgsql stable security invoker set search_path = ''
as $$
declare
  v_radius integer := coalesce(p_radius_m, private.setting('recurring', 'radius_m', '200')::integer);
  v_months integer := coalesce(p_months, private.setting('recurring', 'months', '6')::integer);
  v_min integer := coalesce(p_min_count, private.setting('recurring', 'min_count', '3')::integer);
  v_covered uuid[] := '{}';
  v_members uuid[];
  cand record;
begin
  for cand in
    with recent as (
      select c.id, c.category_id, c.latitude, c.longitude, c.created_at
      from public.complaints c
      where c.created_at >= now() - make_interval(months => v_months) and c.status <> 'rejected'
    )
    select a.id, a.category_id, array_agg(b.id order by b.created_at) as ids, count(*) as n
    from recent a
    join recent b on b.category_id = a.category_id
      and private.distance_m(a.latitude, a.longitude, b.latitude, b.longitude) <= v_radius
    group by a.id, a.category_id
    having count(*) >= v_min
    order by count(*) desc, a.id
  loop
    if cand.id = any (v_covered) then
      continue;
    end if;
    select array_agg(x) into v_members from unnest(cand.ids) x where not (x = any (v_covered));
    if coalesce(array_length(v_members, 1), 0) < v_min then
      continue;
    end if;
    v_covered := v_covered || v_members;

    return query
      select cat.id, cat.name, cat.icon, cat.is_weather_related,
        (select ar.name from public.complaints c2 join public.areas ar on ar.id = c2.area_id
         where c2.id = any (v_members) group by ar.name order by count(*) desc limit 1),
        count(*)::integer,
        (count(*) filter (where c.status in ('new', 'under_review', 'assigned', 'in_progress')))::integer,
        min(c.created_at), max(c.created_at),
        greatest(1, extract(day from max(c.created_at) - min(c.created_at))::integer),
        avg(c.latitude), avg(c.longitude),
        v_members,
        case when count(*) >= 8 then 'critical' when count(*) >= 5 then 'high' else 'medium' end,
        case
          when count(*) >= 6 and cat.is_weather_related then 'إعادة تأهيل شبكة التصريف في الموقع'
          when count(*) >= 6 then 'تحتاج صيانة جذرية'
          when cat.is_weather_related then 'تنظيف وفحص شبكة التصريف قبل موسم الأمطار'
          when count(*) >= 4 then 'تحتاج فحصاً ميدانياً شاملاً'
          else 'متابعة ورصد'
        end
      from public.complaints c
      join public.problem_categories cat on cat.id = c.category_id
      where c.id = any (v_members)
      group by cat.id;
  end loop;
end
$$;

-- 5.9 المناطق الحساسة للحالات الجوية: تاريخ البلاغات المرتبطة بالأمطار والتصريف
create or replace function public.weather_risk_areas(p_event_id uuid default null)
returns table (
  area_id uuid, name text, latitude double precision, longitude double precision,
  flood_risk public.risk_level, weather_complaints bigint, open_weather_complaints bigint,
  last_incident timestamptz, is_affected boolean, top_category text
)
language sql stable security invoker set search_path = ''
as $$
  select a.id, a.name, a.latitude, a.longitude, a.flood_risk,
    count(c.id),
    count(c.id) filter (where c.status in ('new', 'under_review', 'assigned', 'in_progress')),
    max(c.created_at),
    exists (select 1 from public.weather_event_areas wa where wa.event_id = p_event_id and wa.area_id = a.id),
    (select cat.name from public.complaints c2 join public.problem_categories cat on cat.id = c2.category_id
     where c2.area_id = a.id and cat.is_weather_related group by cat.name order by count(*) desc limit 1)
  from public.areas a
  left join public.complaints c on c.area_id = a.id
    and c.category_id in (select id from public.problem_categories where is_weather_related)
  group by a.id
  order by exists (select 1 from public.weather_event_areas wa where wa.event_id = p_event_id and wa.area_id = a.id) desc,
           count(c.id) desc, a.flood_risk desc, a.name
$$;

-- 5.10 إرسال تنبيه جوي لجميع الموظفين (المدير فقط)
create or replace function public.notify_staff_weather(p_event_id uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  e public.weather_events;
  n integer;
begin
  if not private.is_admin() then
    raise exception 'هذه العملية متاحة للمدير فقط' using errcode = '42501';
  end if;
  select * into e from public.weather_events where id = p_event_id;
  if not found then
    raise exception 'الحالة الجوية غير موجودة' using errcode = 'P0002';
  end if;
  insert into public.notifications (user_id, title, body, type)
  select p.id, 'تنبيه جوي: ' || e.title,
         'من ' || to_char(timezone(private.app_tz(), e.starts_at), 'YYYY-MM-DD') || ' إلى ' || to_char(timezone(private.app_tz(), e.ends_at), 'YYYY-MM-DD') || coalesce(' — ' || e.description, ''),
         'weather'
  from public.profiles p
  where p.is_active and p.role in ('employee', 'admin');
  get diagnostics n = row_count;
  return n;
end
$$;

-- 5.11 تحليل رضا المواطنين (تقييمات + كلمات مفتاحية) لفترة
create or replace function public.satisfaction_summary(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb
language sql stable security invoker set search_path = ''
as $$
  with r as (
    select rt.*, c.department_id
    from public.complaint_ratings rt join public.complaints c on c.id = rt.complaint_id
    where (p_from is null or rt.created_at >= p_from) and (p_to is null or rt.created_at < p_to)
  )
  select jsonb_build_object(
    'count', (select count(*) from r),
    'avg', (select round(avg(rating)::numeric, 2) from r),
    'satisfied_pct', (select round(100.0 * count(*) filter (where rating >= 4) / nullif(count(*), 0)) from r),
    'unsatisfied_pct', (select round(100.0 * count(*) filter (where rating <= 2) / nullif(count(*), 0)) from r),
    'distribution', (select jsonb_agg(jsonb_build_object('stars', s, 'count', (select count(*) from r where rating = s)) order by s desc) from generate_series(1, 5) s),
    'by_department', coalesce((
      select jsonb_agg(x order by x.avg desc) from (
        select coalesce(d.name, 'غير محدد') as name, round(avg(r.rating)::numeric, 2) as avg, count(*) as count
        from r left join public.departments d on d.id = r.department_id group by d.name
      ) x), '[]'::jsonb),
    'by_month', coalesce((
      select jsonb_agg(x order by x.month) from (
        select date_trunc('month', timezone(private.app_tz(), created_at))::date as month, round(avg(rating)::numeric, 2) as value, count(*) as count
        from r group by 1
      ) x), '[]'::jsonb),
    -- تكرار الكلمات المفتاحية في تعليقات التقييم (مطابقة نصية بسيطة)
    'keywords', coalesce((
      select jsonb_agg(x order by x.hits desc) from (
        select k.id, k.keyword, k.sentiment, k.topic,
          (select count(*) from r where r.comment ilike '%' || k.keyword || '%') as hits,
          (select count(*) from r where r.comment ilike '%' || k.keyword || '%' and r.rating <= 3) as low_hits
        from public.feedback_keywords k where k.is_active
      ) x), '[]'::jsonb),
    'tags', coalesce((
      select jsonb_agg(x order by x.count desc) from (
        select t as tag, count(*) as count from r, unnest(r.tags) t group by t
      ) x), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(x order by x.created_at desc) from (
        select r.rating, r.comment, r.created_at, coalesce(nullif(p.full_name, ''), 'مواطن') as citizen, d.name as department
        from r left join public.profiles p on p.id = r.citizen_id left join public.departments d on d.id = r.department_id
        where r.comment is not null and r.comment <> ''
        order by r.created_at desc limit 6
      ) x), '[]'::jsonb)
  )
$$;

-- 5.12 التقرير الشهري الكامل
create or replace function public.monthly_report(p_month date)
returns jsonb
language plpgsql stable security invoker set search_path = ''
as $$
declare
  v_tz text := private.app_tz();
  v_from timestamptz := (date_trunc('month', p_month)::timestamp) at time zone v_tz;
  v_to timestamptz := ((date_trunc('month', p_month) + interval '1 month')::timestamp) at time zone v_tz;
  v_prev_from timestamptz := ((date_trunc('month', p_month) - interval '1 month')::timestamp) at time zone v_tz;
  v_kpi jsonb;
  v_prev bigint;
begin
  select jsonb_build_object(
    'total', count(*),
    'closed', count(*) filter (where status in ('resolved', 'closed')),
    'open', count(*) filter (where status in ('new', 'under_review', 'assigned', 'in_progress')),
    'rejected', count(*) filter (where status = 'rejected'),
    'overdue', count(*) filter (where status in ('new', 'under_review', 'assigned', 'in_progress') and due_at < now()),
    'closed_rate', round(100.0 * count(*) filter (where status in ('resolved', 'closed')) / nullif(count(*) filter (where status <> 'rejected'), 0), 1),
    'avg_days', round((avg(extract(epoch from (resolved_at - created_at))) filter (where resolved_at is not null) / 86400)::numeric, 1)
  ) into v_kpi
  from public.complaints where created_at >= v_from and created_at < v_to;

  select count(*) into v_prev from public.complaints where created_at >= v_prev_from and created_at < v_from;

  return jsonb_build_object(
    'month', to_char(p_month, 'YYYY-MM'),
    'kpis', v_kpi,
    'previous_total', v_prev,
    'breakdown', public.analytics_breakdown(v_from, v_to),
    'satisfaction', public.satisfaction_summary(v_from, v_to),
    'recurring', (select coalesce(jsonb_agg(jsonb_build_object(
        'category', rp.category_name, 'area', rp.area_name, 'count', rp.complaints_count, 'recommendation', rp.recommendation)), '[]'::jsonb)
      from public.recurring_problems() rp)
  );
end
$$;

-- 5.13 تعليم كل الإشعارات كمقروءة
create or replace function public.mark_all_notifications_read()
returns void
language sql security invoker set search_path = ''
as $$
  update public.notifications set is_read = true where user_id = auth.uid() and not is_read
$$;

-- ============ 6. أمان مستوى الصفوف (RLS) ============

alter table public.departments enable row level security;
alter table public.areas enable row level security;
alter table public.profiles enable row level security;
alter table public.problem_categories enable row level security;
alter table public.complaint_counters enable row level security; -- بدون سياسات = لا وصول إلا عبر الدوال
alter table public.complaints enable row level security;
alter table public.complaint_images enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.complaint_assignments enable row level security;
alter table public.internal_notes enable row level security;
alter table public.complaint_comments enable row level security;
alter table public.complaint_ratings enable row level security;
alter table public.notifications enable row level security;
alter table public.feedback_keywords enable row level security;
alter table public.weather_events enable row level security;
alter table public.weather_event_areas enable row level security;
alter table public.app_settings enable row level security;

-- profiles
create policy "profiles: read own, staff, or admin" on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_admin())
    or ((select private.is_staff()) and (role in ('employee', 'admin') or exists (select 1 from public.complaints c where c.citizen_id = profiles.id)))
  );
create policy "profiles: update own or admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

-- departments / categories / areas: قراءة عامة، كتابة للمدير
create policy "departments: read" on public.departments for select to anon, authenticated using (true);
create policy "departments: admin insert" on public.departments for insert to authenticated with check ((select private.is_admin()));
create policy "departments: admin update" on public.departments for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "departments: admin delete" on public.departments for delete to authenticated using ((select private.is_admin()));

create policy "categories: read" on public.problem_categories for select to anon, authenticated using (is_active or (select private.is_staff()));
create policy "categories: admin insert" on public.problem_categories for insert to authenticated with check ((select private.is_admin()));
create policy "categories: admin update" on public.problem_categories for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "categories: admin delete" on public.problem_categories for delete to authenticated using ((select private.is_admin()));

create policy "areas: read" on public.areas for select to anon, authenticated using (true);
create policy "areas: admin insert" on public.areas for insert to authenticated with check ((select private.is_admin()));
create policy "areas: admin update" on public.areas for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "areas: admin delete" on public.areas for delete to authenticated using ((select private.is_admin()));

-- complaints
create policy "complaints: read" on public.complaints for select to authenticated
  using (
    ((select private.user_role()) is not null and citizen_id = (select auth.uid()))
    or (select private.is_admin())
    or ((select private.user_role()) = 'employee'
        and (department_id = (select private.user_department()) or assigned_employee_id = (select auth.uid())))
  );
create policy "complaints: citizen create own" on public.complaints for insert to authenticated
  with check (citizen_id = (select auth.uid()) and (select private.user_role()) is not null);
create policy "complaints: staff update" on public.complaints for update to authenticated
  using (
    (select private.is_admin())
    or ((select private.user_role()) = 'employee'
        and (department_id = (select private.user_department()) or assigned_employee_id = (select auth.uid())))
  )
  with check (
    (select private.is_admin())
    or ((select private.user_role()) = 'employee'
        and (department_id = (select private.user_department()) or assigned_employee_id = (select auth.uid())))
  );
create policy "complaints: admin delete" on public.complaints for delete to authenticated using ((select private.is_admin()));

-- complaint_images
create policy "images: read if can view complaint" on public.complaint_images for select to authenticated
  using (private.can_view_complaint(complaint_id));
create policy "images: insert by owner or staff" on public.complaint_images for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and (
      (kind = 'citizen' and exists (select 1 from public.complaints c where c.id = complaint_id and c.citizen_id = (select auth.uid())))
      or (kind in ('before', 'after') and (select private.is_staff()) and private.can_view_complaint(complaint_id))
    )
  );
create policy "images: delete own or admin" on public.complaint_images for delete to authenticated
  using (uploaded_by = (select auth.uid()) or (select private.is_admin()));

-- status history (كتابة عبر المشغلات فقط)
create policy "history: read if can view complaint" on public.complaint_status_history for select to authenticated
  using (private.can_view_complaint(complaint_id));

-- assignments (للموظفين والمدير فقط)
create policy "assignments: staff read" on public.complaint_assignments for select to authenticated
  using ((select private.is_staff()) and private.can_view_complaint(complaint_id));

-- internal notes (للموظفين والمدير فقط — المواطن لا يراها إطلاقاً)
create policy "notes: staff read" on public.internal_notes for select to authenticated
  using ((select private.is_staff()) and private.can_view_complaint(complaint_id));
create policy "notes: staff insert" on public.internal_notes for insert to authenticated
  with check (author_id = (select auth.uid()) and (select private.is_staff()) and private.can_view_complaint(complaint_id));
create policy "notes: admin delete" on public.internal_notes for delete to authenticated using ((select private.is_admin()));

-- comments
create policy "comments: read if can view complaint" on public.complaint_comments for select to authenticated
  using (private.can_view_complaint(complaint_id));
create policy "comments: insert if can view complaint" on public.complaint_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.can_view_complaint(complaint_id)
    and ((select private.is_staff())
         or exists (select 1 from public.complaints c where c.id = complaint_id and c.status not in ('closed', 'rejected')))
  );
create policy "comments: admin delete" on public.complaint_comments for delete to authenticated using ((select private.is_admin()));

-- ratings: المواطن يقيّم بلاغه المغلق مرة واحدة (UNIQUE) ولا يعدّل بعدها
create policy "ratings: read" on public.complaint_ratings for select to authenticated
  using (citizen_id = (select auth.uid()) or ((select private.is_staff()) and private.can_view_complaint(complaint_id)));
create policy "ratings: citizen insert on own closed complaint" on public.complaint_ratings for insert to authenticated
  with check (
    citizen_id = (select auth.uid())
    and exists (select 1 from public.complaints c where c.id = complaint_id and c.citizen_id = (select auth.uid()) and c.status = 'closed')
  );

-- notifications
create policy "notifications: read own" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: update own" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: delete own" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

-- keywords / weather / settings
create policy "keywords: staff read" on public.feedback_keywords for select to authenticated using ((select private.is_staff()));
create policy "keywords: admin insert" on public.feedback_keywords for insert to authenticated with check ((select private.is_admin()));
create policy "keywords: admin update" on public.feedback_keywords for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "keywords: admin delete" on public.feedback_keywords for delete to authenticated using ((select private.is_admin()));

create policy "weather: staff read" on public.weather_events for select to authenticated using ((select private.is_staff()));
create policy "weather: admin insert" on public.weather_events for insert to authenticated with check ((select private.is_admin()));
create policy "weather: admin update" on public.weather_events for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "weather: admin delete" on public.weather_events for delete to authenticated using ((select private.is_admin()));

create policy "weather areas: staff read" on public.weather_event_areas for select to authenticated using ((select private.is_staff()));
create policy "weather areas: admin insert" on public.weather_event_areas for insert to authenticated with check ((select private.is_admin()));
create policy "weather areas: admin delete" on public.weather_event_areas for delete to authenticated using ((select private.is_admin()));

create policy "settings: read" on public.app_settings for select to authenticated using (true);
create policy "settings: admin insert" on public.app_settings for insert to authenticated with check ((select private.is_admin()));
create policy "settings: admin update" on public.app_settings for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ============ 7. الصلاحيات (Grants) ============

grant usage on schema private to anon, authenticated;

-- الدوال الداخلية الحساسة لا تُستدعى مباشرة
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.user_role(), private.is_admin(), private.is_staff(), private.user_department(),
  private.can_view_complaint(uuid), private.try_uuid(text),
  private.distance_m(double precision, double precision, double precision, double precision),
  private.status_label(public.complaint_status), private.setting(text, text, text), private.app_tz()
to anon, authenticated;

-- الإشعارات: المستخدم يغيّر حالة القراءة فقط
revoke update on public.notifications from anon, authenticated;
grant update (is_read) on public.notifications to authenticated;

-- الدوال العامة
revoke execute on all functions in schema public from public, anon;
grant execute on function public.track_complaint(text), public.public_stats() to anon, authenticated;
grant execute on function
  public.update_complaint(uuid, public.complaint_status, public.complaint_priority, uuid, uuid, boolean, text),
  public.dashboard_stats(), public.analytics_breakdown(timestamptz, timestamptz), public.monthly_trend(integer),
  public.hotspot_areas(integer, uuid, public.complaint_status), public.recurring_problems(integer, integer, integer),
  public.weather_risk_areas(uuid), public.notify_staff_weather(uuid), public.satisfaction_summary(timestamptz, timestamptz),
  public.monthly_report(date), public.mark_all_notifications_read()
to authenticated;

-- ============ 8. التخزين (Storage) ============

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-images', 'complaint-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- مسار الملف: {complaint_id}/{citizen|before|after}/{اسم عشوائي}
create or replace function private.can_upload_complaint_file(p_name text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case (storage.foldername(p_name))[2]
    when 'citizen' then exists (
      select 1 from public.complaints c
      where c.id = private.try_uuid((storage.foldername(p_name))[1]) and c.citizen_id = auth.uid())
    when 'before' then private.is_staff() and private.can_view_complaint(private.try_uuid((storage.foldername(p_name))[1]))
    when 'after' then private.is_staff() and private.can_view_complaint(private.try_uuid((storage.foldername(p_name))[1]))
    else false
  end
$$;
grant execute on function private.can_upload_complaint_file(text) to authenticated;

create policy "complaint images: read if can view complaint" on storage.objects for select to authenticated
  using (bucket_id = 'complaint-images' and private.can_view_complaint(private.try_uuid((storage.foldername(name))[1])));
create policy "complaint images: upload by owner or staff" on storage.objects for insert to authenticated
  with check (bucket_id = 'complaint-images' and private.can_upload_complaint_file(name));
create policy "complaint images: delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'complaint-images' and (owner_id = (select auth.uid()::text) or (select private.is_admin())));

-- ============ 9. Realtime ============
-- الإشعارات تصل لحظياً (RLS تضمن أن كل مستخدم يستلم إشعاراته فقط)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;

-- ============ 10. الإعدادات الافتراضية ============
insert into public.app_settings (key, value) values
  ('general', '{"municipality_name": "بلدية المدينة", "platform_name": "منصة إدارة شكاوى وطلبات خدمات البلدية", "emergency_phone": "1800-000-000", "email": "info@municipality.example", "timezone": "Asia/Amman", "welcome_text": "منصة موحّدة لتقديم الشكاوى وطلبات الخدمات البلدية ومتابعتها بشفافية."}'),
  ('complaints', '{"max_images": 5, "max_image_mb": 5}'),
  ('recurring', '{"min_count": 3, "radius_m": 200, "months": 6}')
on conflict (key) do nothing;
