-- ============================================================================
--  إسناد البلاغ تلقائياً لموظف من القسم المختص
--  ---------------------------------------------------------------------------
--  يُنفّذ مرة واحدة في SQL Editor. آمن للتكرار.
--  عند إنشاء بلاغ جديد يختار النظام موظفاً نشطاً من قسم البلاغ — الأقل عبئاً
--  (أقل عدد بلاغات مفتوحة مسندة إليه) — ويصبح البلاغ "تم التعيين".
--  إذا لم يوجد موظف في القسم يبقى البلاغ "جديد" بدون موظف كما كان.
--  يبقى بإمكان المدير تغيير الموظف يدوياً من صفحة البلاغ.
-- ============================================================================

-- الموظف الأقل عبئاً في القسم (عند التساوي: الأقدم إسناداً)
create or replace function private.least_busy_employee(p_department uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.role = 'employee' and p.is_active and p.department_id = p_department
  order by
    (select count(*) from public.complaints c
      where c.assigned_employee_id = p.id
        and c.status in ('new', 'under_review', 'assigned', 'in_progress')),
    (select max(a.assigned_at) from public.complaint_assignments a where a.employee_id = p.id) nulls first,
    p.created_at
  limit 1
$$;

-- قبل إنشاء بلاغ: نفس القواعد السابقة + الإسناد التلقائي في آخرها
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

  -- المنطقة: إن لم تُحدد نختار أقرب منطقة للإحداثيات — فقط إذا كانت ضمن 3 كم
  if new.area_id is null or not exists (select 1 from public.areas a where a.id = new.area_id) then
    new.area_id := (
      select a.id from public.areas a
      where a.latitude is not null and a.longitude is not null
        and private.distance_m(new.latitude, new.longitude, a.latitude, a.longitude) <= 3000
      order by private.distance_m(new.latitude, new.longitude, a.latitude, a.longitude)
      limit 1
    );
  end if;

  -- الإسناد التلقائي لموظف من القسم
  if new.assigned_employee_id is null and new.department_id is not null and new.status = 'new' then
    new.assigned_employee_id := private.least_busy_employee(new.department_id);
    if new.assigned_employee_id is not null then
      new.status := 'assigned';
    end if;
  end if;

  new.complaint_number := private.next_complaint_number(extract(year from timezone(private.app_tz(), new.created_at))::integer);
  return new;
end
$$;

-- بعد إنشاء بلاغ: سجل الحالة (استلام ثم إسناد) + التعيين + الإشعارات
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
  values (new.id, null, case when new.status = 'assigned' then 'new' else new.status end,
          new.citizen_id, 'النظام', 'تم استلام البلاغ وإرسال رقم المتابعة للمواطن.', new.created_at);

  if new.status = 'assigned' and new.assigned_employee_id is not null then
    insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, note, created_at)
    values (new.id, 'new', 'assigned', null, 'النظام',
            'تم إسناد البلاغ تلقائياً إلى ' || coalesce(private.profile_name(new.assigned_employee_id), 'موظف القسم') || '.',
            new.created_at + interval '1 millisecond');
    perform private.notify(new.assigned_employee_id, 'تم إسناد بلاغ إليك',
      new.complaint_number || ' — ' || new.title, 'assignment', new.id);
  end if;

  if new.department_id is not null then
    insert into public.complaint_assignments (complaint_id, department_id, employee_id, assigned_by, assigned_at)
    values (new.id, new.department_id, new.assigned_employee_id, null, new.created_at);
  end if;

  perform private.notify(new.citizen_id, 'تم إنشاء البلاغ',
    'تم استلام بلاغك رقم ' || new.complaint_number || ' وسيتم مراجعته قريباً.', 'new', new.id);

  -- إشعار المدراء وموظفي القسم المختص ببلاغ جديد (الموظف المسند وصله إشعار الإسناد)
  for r in
    select p.id from public.profiles p
    where p.is_active and (p.role = 'admin' or (p.role = 'employee' and p.department_id = new.department_id))
      and p.id is distinct from new.assigned_employee_id
  loop
    perform private.notify(r.id, 'بلاغ جديد',
      new.complaint_number || ' — ' || coalesce(v_cat, '') || ': ' || new.title, 'new', new.id);
  end loop;
  return new;
end
$$;

-- البلاغات الجديدة الموجودة حالياً بدون موظف: تُسند الآن (واحداً واحداً ليتوزع العبء)
do $$
declare
  c record;
  v_emp uuid;
begin
  for c in
    select id, department_id from public.complaints
    where status = 'new' and assigned_employee_id is null and department_id is not null
    order by created_at
  loop
    v_emp := private.least_busy_employee(c.department_id);
    if v_emp is not null then
      perform set_config('app.status_note', 'تم إسناد البلاغ تلقائياً إلى ' || coalesce(private.profile_name(v_emp), 'موظف القسم') || '.', true);
      update public.complaints set assigned_employee_id = v_emp where id = c.id;
    end if;
  end loop;
  perform set_config('app.status_note', '', true);
end
$$;
