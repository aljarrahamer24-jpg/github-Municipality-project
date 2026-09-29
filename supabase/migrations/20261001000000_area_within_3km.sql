-- ============================================================================
--  اقتراح المنطقة تلقائياً ضمن 3 كم فقط
--  ---------------------------------------------------------------------------
--  يُنفّذ مرة واحدة في SQL Editor. آمن للتكرار.
--  كان النظام يربط البلاغ بأقرب منطقة مسجلة مهما كانت بعيدة، فيظهر اسم حي خاطئ
--  عندما يكون موقع المشكلة خارج المناطق المسجلة. الآن تبقى المنطقة فارغة في هذه الحالة.
-- ============================================================================

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
  -- (وإلا تبقى فارغة، ويكتب المواطن اسم منطقته في العنوان بدل ربطها بمنطقة بعيدة خاطئة)
  if new.area_id is null or not exists (select 1 from public.areas a where a.id = new.area_id) then
    new.area_id := (
      select a.id from public.areas a
      where a.latitude is not null and a.longitude is not null
        and private.distance_m(new.latitude, new.longitude, a.latitude, a.longitude) <= 3000
      order by private.distance_m(new.latitude, new.longitude, a.latitude, a.longitude)
      limit 1
    );
  end if;

  new.complaint_number := private.next_complaint_number(extract(year from timezone(private.app_tz(), new.created_at))::integer);
  return new;
end
$$;
