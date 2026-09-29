-- ============================================================================
--  بيانات تجريبية للاختبار فقط (اختياري)
--  ---------------------------------------------------------------------------
--  تنشئ حسابات تجريبية + بلاغات وتقييمات لتجربة جميع الشاشات.
--  ⚠️ لا تُنفّذ هذا الملف في النسخة الرسمية (Production).
--  النظام يعمل بشكل كامل بدون هذا الملف.
--
--  الحسابات (كلمة المرور للجميع: Demo@12345)
--    admin@demo.test          مدير البلدية
--    roads@demo.test          موظف — قسم الطرق والأرصفة
--    water@demo.test          موظف — قسم المياه والصرف
--    clean@demo.test          موظف — قسم النظافة العامة
--    citizen@demo.test        مواطن
--    citizen2@demo.test       مواطن
--    citizen3@demo.test       مواطن
--  يُنفّذ بعد: migrations ثم seed.sql
-- ============================================================================

create or replace function pg_temp.demo_user(p_email text, p_name text, p_role public.user_role, p_dept text, p_phone text)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
      extensions.crypt('Demo@12345', extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', p_name, 'phone', p_phone), now() - interval '200 days', now(),
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
            'email', now(), now(), now());
  end if;
  update public.profiles
     set role = p_role,
         full_name = p_name,
         phone = p_phone,
         department_id = (select id from public.departments where name = p_dept),
         created_at = now() - interval '200 days'
   where id = v_id;
  return v_id;
end
$$;

select pg_temp.demo_user('admin@demo.test', 'م. خالد العمري', 'admin', null, '0791000000');
select pg_temp.demo_user('roads@demo.test', 'أحمد سعيد', 'employee', 'قسم الطرق والأرصفة', '0791000001');
select pg_temp.demo_user('water@demo.test', 'سارة عودة', 'employee', 'قسم المياه والصرف', '0791000002');
select pg_temp.demo_user('clean@demo.test', 'محمد ناصر', 'employee', 'قسم النظافة العامة', '0791000003');
select pg_temp.demo_user('citizen@demo.test', 'عبدالله محمود', 'citizen', null, '0790000001');
select pg_temp.demo_user('citizen2@demo.test', 'مريم خليل', 'citizen', null, '0790000002');
select pg_temp.demo_user('citizen3@demo.test', 'طارق سليم', 'citizen', null, '0790000003');

-- ---------------------------------------------------------------------------
--  البلاغات التجريبية (عشوائية ثابتة) + مجموعات متقاربة لاختبار "المشاكل المتكررة"
-- ---------------------------------------------------------------------------
do $$
declare
  v_citizens uuid[] := array(select id from public.profiles where role = 'citizen' order by email);
  v_cat public.problem_categories;
  v_area public.areas;
  v_id uuid;
  v_emp uuid;
  v_days integer;
  v_created timestamptz;
  v_resolved timestamptz;
  v_closed timestamptz;
  v_span interval; -- المدة بين الإنشاء وآخر مرحلة (لترتيب السجل الزمني منطقياً)
  v_status public.complaint_status;
  v_lat double precision;
  v_lng double precision;
  v_cluster integer;
  v_titles text[];
  v_comments text[] := array[
    'استجابة سريعة جداً وتم الإصلاح خلال يومين. شكراً للفريق.',
    'عمل ممتاز وتعامل راقٍ من الموظفين.',
    'تم الحل لكن المشكلة تكررت بعد أسبوع.',
    'تأخير كبير في المعالجة ولا يوجد رد على استفساراتي.',
    'الخدمة مقبولة لكن هناك بطء في المتابعة.',
    'لم يتم الحل بشكل كامل وما زالت آثار المشكلة موجودة.',
    'شكرا على سرعة الاستجابة.',
    'متأخر جداً مقارنة بالمدة المعلنة.'
  ];
  i integer;
begin
  perform setseed(0.42);

  for i in 1..90 loop
    -- أول 15 بلاغاً تشكّل مجموعات متقاربة (مشاكل متكررة)
    v_cluster := case when i <= 6 then 1 when i <= 11 then 2 when i <= 15 then 3 else 0 end;
    if v_cluster = 1 then
      select * into v_cat from public.problem_categories where name = 'حفر في الطرق';
      select * into v_area from public.areas where name = 'النصر';
      v_lat := 31.5258 + (random() - 0.5) * 0.0008; v_lng := 34.4563 + (random() - 0.5) * 0.0008;
      v_days := 5 + floor(random() * 110)::integer;
    elsif v_cluster = 2 then
      select * into v_cat from public.problem_categories where name = 'تجمع مياه الأمطار';
      select * into v_area from public.areas where name = 'الرمال';
      v_lat := 31.5215 + (random() - 0.5) * 0.0008; v_lng := 34.4440 + (random() - 0.5) * 0.0008;
      v_days := 20 + floor(random() * 150)::integer;
    elsif v_cluster = 3 then
      select * into v_cat from public.problem_categories where name = 'انسداد صرف صحي';
      select * into v_area from public.areas where name = 'الزيتون';
      v_lat := 31.4935 + (random() - 0.5) * 0.0008; v_lng := 34.4580 + (random() - 0.5) * 0.0008;
      v_days := 3 + floor(random() * 80)::integer;
    else
      select * into v_cat from public.problem_categories order by random() limit 1;
      select * into v_area from public.areas order by random() limit 1;
      v_lat := v_area.latitude + (random() - 0.5) * 0.014; v_lng := v_area.longitude + (random() - 0.5) * 0.014;
      v_days := floor(random() * 180)::integer;
    end if;

    v_created := now() - make_interval(days => v_days, hours => floor(random() * 12)::integer);
    v_status := case
      when v_days > 45 then (array['closed', 'closed', 'closed', 'resolved', 'rejected', 'closed', 'closed']::public.complaint_status[])[1 + floor(random() * 7)::integer]
      when v_days > 12 then (array['closed', 'resolved', 'in_progress', 'assigned', 'closed', 'in_progress']::public.complaint_status[])[1 + floor(random() * 6)::integer]
      else (array['new', 'under_review', 'assigned', 'in_progress', 'new', 'in_progress']::public.complaint_status[])[1 + floor(random() * 6)::integer]
    end;

    v_titles := case v_cat.name
      when 'حفر في الطرق' then array['حفرة كبيرة في منتصف الشارع', 'هبوط في طبقة الإسفلت', 'حفر متعددة قرب الإشارة']
      when 'تراكم النفايات' then array['حاوية نفايات ممتلئة منذ أيام', 'نفايات متراكمة بجانب المدرسة', 'عدم انتظام جمع النفايات']
      when 'إنارة الشوارع' then array['عمود إنارة معطل', 'إنارة الشارع مطفأة بالكامل', 'أسلاك مكشوفة في عمود إنارة']
      when 'تسرب مياه' then array['تسرب مياه من خط رئيسي', 'انكسار ماسورة مياه', 'تسرب مياه على الرصيف']
      when 'انسداد صرف صحي' then array['طفح مناهل الصرف الصحي', 'روائح كريهة من شبكة الصرف', 'انسداد في منهل الصرف']
      when 'تجمع مياه الأمطار' then array['تجمع مياه الأمطار عند التقاطع', 'غرق النفق بمياه الأمطار', 'تصريف مياه الأمطار لا يعمل']
      when 'الأشجار والحدائق' then array['شجرة آيلة للسقوط', 'حديقة الحي تحتاج صيانة', 'أغصان تعيق الإنارة']
      when 'تلف الأرصفة' then array['رصيف مكسور يعيق المشاة', 'بلاط الرصيف مقتلع', 'رصيف غير صالح لذوي الإعاقة']
      else array['بناء دون ترخيص', 'إشغال الرصيف بمواد بناء', 'تعدٍّ على الارتداد']
    end;

    v_emp := null;
    if v_status in ('assigned', 'in_progress', 'resolved', 'closed') then
      select id into v_emp from public.profiles where role = 'employee' and department_id = v_cat.department_id limit 1;
    end if;
    -- لا يوجد موظف في هذا القسم: البلاغ يبقى قيد المراجعة بدل "تم التعيين" بدون موظف
    if v_emp is null and v_status = 'assigned' then
      v_status := 'under_review';
    end if;
    v_resolved := null; v_closed := null;
    if v_status in ('resolved', 'closed') then
      v_resolved := least(now() - interval '1 hour', v_created + make_interval(hours => (6 + floor(random() * v_cat.sla_days * 30))::integer));
    end if;
    if v_status = 'closed' then
      v_closed := least(now() - interval '30 minutes', v_resolved + interval '20 hours');
    end if;
    -- كل مراحل السجل تقع بين الإنشاء والحل (أو الآن) وبالترتيب الصحيح
    v_span := coalesce(v_resolved, least(now() - interval '10 minutes', v_created + interval '3 days')) - v_created;

    insert into public.complaints (citizen_id, category_id, area_id, title, description, latitude, longitude, address,
                                   priority, status, created_at, assigned_employee_id, resolved_at, closed_at)
    values (
      v_citizens[1 + (i % array_length(v_citizens, 1))], v_cat.id, v_area.id,
      v_titles[1 + floor(random() * 3)::integer],
      'لاحظت وجود المشكلة منذ عدة أيام وهي تسبب إزعاجاً وخطراً على المارة والسيارات. أرجو المتابعة والمعالجة في أقرب وقت ممكن.',
      v_lat, v_lng, v_area.name || ' — شارع ' || (array['الملك', 'الجامعة', 'البتراء', 'الحصن', 'السلام', 'فلسطين'])[1 + floor(random() * 6)::integer],
      (array['low', 'medium', 'medium', 'high', 'high', 'urgent']::public.complaint_priority[])[1 + floor(random() * 6)::integer],
      v_status, v_created, v_emp, v_resolved, v_closed
    ) returning id into v_id;

    -- سجل حالات واقعي بدل السجل التلقائي
    delete from public.complaint_status_history where complaint_id = v_id;
    insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by_name, note, created_at)
    values (v_id, null, 'new', 'النظام', 'تم استلام البلاغ وإرسال رقم المتابعة للمواطن.', v_created);
    if v_status <> 'new' then
      insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by_name, note, created_at)
      values (v_id, 'new', 'under_review', 'مركز الاستقبال', 'تمت مراجعة البلاغ والتحقق من البيانات.', v_created + v_span * 0.1);
    end if;
    if v_status = 'rejected' then
      insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by_name, note, created_at)
      values (v_id, 'under_review', 'rejected', 'مركز الاستقبال', 'البلاغ خارج نطاق صلاحيات البلدية.', v_created + v_span * 0.3);
    end if;
    if v_status in ('assigned', 'in_progress', 'resolved', 'closed') then
      insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, note, created_at)
      values (v_id, 'under_review', 'assigned', v_emp, 'مشرف القسم', 'تمت الإحالة إلى الموظف المختص.', v_created + v_span * 0.3);
    end if;
    if v_status in ('in_progress', 'resolved', 'closed') then
      insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, note, created_at)
      values (v_id, 'assigned', 'in_progress', v_emp, private.profile_name(v_emp), 'توجه الفريق الميداني إلى الموقع.', v_created + v_span * 0.6);
    end if;
    if v_status in ('resolved', 'closed') then
      insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, note, created_at)
      values (v_id, 'in_progress', 'resolved', v_emp, private.profile_name(v_emp), 'تمت المعالجة.', v_resolved);
    end if;
    if v_status = 'closed' then
      insert into public.complaint_status_history (complaint_id, old_status, new_status, changed_by_name, note, created_at)
      values (v_id, 'resolved', 'closed', 'مشرف القسم', 'تم إغلاق البلاغ بعد تأكيد المعالجة.', v_closed);
      -- تقييم لمعظم البلاغات المغلقة
      if random() < 0.75 then
        insert into public.complaint_ratings (complaint_id, citizen_id, rating, comment, created_at)
        select v_id, c.citizen_id,
               (array[5, 5, 4, 4, 5, 3, 2, 1, 4, 5])[1 + floor(random() * 10)::integer],
               v_comments[1 + floor(random() * array_length(v_comments, 1))::integer],
               least(now() - interval '5 minutes', v_closed + interval '3 hours')
        from public.complaints c where c.id = v_id;
      end if;
    end if;

    if v_emp is not null and random() < 0.6 then
      insert into public.complaint_comments (complaint_id, author_id, body, created_at)
      select v_id, c.citizen_id, 'هل يوجد موعد تقريبي للمعالجة؟', v_created + v_span * 0.4 from public.complaints c where c.id = v_id;
      insert into public.complaint_comments (complaint_id, author_id, body, created_at)
      values (v_id, v_emp, 'تمت جدولة الفريق الميداني خلال 48 ساعة.', v_created + v_span * 0.45);
      insert into public.internal_notes (complaint_id, author_id, body, created_at)
      values (v_id, v_emp, 'يحتاج الموقع إلى معدات إضافية، تم التنسيق مع المستودع.', v_created + v_span * 0.5);
    end if;
  end loop;
end
$$;

-- التقييمات المنخفضة تحصل على تعليقات سلبية لتكون التحليلات منطقية
update public.complaint_ratings set comment = 'تأخير كبير في المعالجة ولا يوجد رد على استفساراتي.' where rating <= 2;
update public.complaint_ratings set comment = 'تم الحل لكن المشكلة تكررت بعد أسبوع.' where rating = 3;

-- حالة جوية قادمة
insert into public.weather_events (title, event_type, severity, description, starts_at, ends_at, rainfall, wind, temperature, checklist)
select 'منخفض جوي وأمطار غزيرة', 'rain', 'high',
       'يتوقع هطول أمطار غزيرة مصحوبة بعواصف رعدية وتشكل سيول في المناطق المنخفضة.',
       date_trunc('day', now()) + interval '4 days', date_trunc('day', now()) + interval '6 days',
       '45 ملم', '55 كم/س', '12° — 18°',
       '[{"text": "تنظيف مناهل تصريف الأمطار في الرمال", "done": true},
         {"text": "تجهيز مضخات الشفط الاحتياطية", "done": true},
         {"text": "رفع جاهزية فرق الطوارئ", "done": false},
         {"text": "إغلاق النفق عند ارتفاع المنسوب", "done": false},
         {"text": "إشعار سكان المناطق الحساسة", "done": false}]'::jsonb
where not exists (select 1 from public.weather_events);

insert into public.weather_event_areas (event_id, area_id)
select e.id, a.id from public.weather_events e, public.areas a
where a.name in ('الرمال', 'الشيخ رضوان', 'الزيتون')
on conflict do nothing;

-- تنظيف إشعارات الإنشاء التجريبية وإضافة عدد بسيط منها
delete from public.notifications;
insert into public.notifications (user_id, title, body, type, complaint_id, is_read, created_at)
select c.citizen_id, 'تم تحديث حالة البلاغ', 'أصبحت حالة بلاغك ' || c.complaint_number || ': قيد المعالجة', 'status', c.id, false, now() - interval '2 hours'
from public.complaints c where c.status = 'in_progress' order by c.created_at desc limit 5;
insert into public.notifications (user_id, title, body, type, complaint_id, is_read, created_at)
select p.id, 'بلاغ جديد', c.complaint_number || ': ' || c.title, 'new', c.id, false, c.created_at
from public.complaints c join public.profiles p on p.role = 'admin' or (p.role = 'employee' and p.department_id = c.department_id)
where c.status = 'new';
