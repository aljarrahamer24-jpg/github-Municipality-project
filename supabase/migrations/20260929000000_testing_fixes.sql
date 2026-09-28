-- ============================================================================
--  إصلاحات مرحلة الاختبار الشامل
--  ---------------------------------------------------------------------------
--  يُنفّذ مرة واحدة بعد 20260928000000_init.sql
--  (Supabase Dashboard → SQL Editor → New query → الصق → Run)
--  آمن للتنفيذ أكثر من مرة.
--
--  1. منع تزوير تاريخ الحل/الإغلاق (resolved_at / closed_at) بتحديث مباشر
--     بدون تغيير الحالة — كان يسمح بالتلاعب بمتوسط زمن الحل في الإحصائيات.
--  2. فهارس للمفاتيح الأجنبية غير المفهرسة (أداء الحذف والربط والسياسات).
-- ============================================================================

-- 1. قواعد تحديث البلاغ
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

  -- تواريخ الحل والإغلاق: يحددها الخادم فقط عند تغيير الحالة (لا يمكن تزويرها من التطبيق)
  if auth.uid() is not null then
    new.resolved_at := old.resolved_at;
    new.closed_at := old.closed_at;
  end if;
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

-- 2. فهارس المفاتيح الأجنبية
create index if not exists complaint_images_uploaded_by_idx on public.complaint_images (uploaded_by);
create index if not exists status_history_changed_by_idx on public.complaint_status_history (changed_by);
create index if not exists assignments_department_idx on public.complaint_assignments (department_id);
create index if not exists assignments_employee_idx on public.complaint_assignments (employee_id);
create index if not exists assignments_assigned_by_idx on public.complaint_assignments (assigned_by);
create index if not exists profiles_area_idx on public.profiles (area_id);
create index if not exists weather_events_created_by_idx on public.weather_events (created_by);
create index if not exists ratings_citizen_idx on public.complaint_ratings (citizen_id);
create index if not exists internal_notes_author_idx on public.internal_notes (author_id);
create index if not exists notifications_complaint_idx on public.notifications (complaint_id);
create index if not exists weather_event_areas_area_idx on public.weather_event_areas (area_id);
create index if not exists comments_author_idx on public.complaint_comments (author_id);
