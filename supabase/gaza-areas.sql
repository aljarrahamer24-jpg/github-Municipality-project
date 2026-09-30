-- ============================================================================
--  تحويل مناطق المنصة إلى مناطق قطاع غزة (لقاعدة بيانات تعمل مسبقاً)
--  ---------------------------------------------------------------------------
--  يُنفّذ مرة واحدة في SQL Editor. آمن للتكرار.
--  • المناطق التجريبية القديمة تُعاد تسميتها وتُنقل لأحياء غزة (بنفس المعرّفات، فلا تنكسر أي علاقة).
--  • البلاغات التجريبية القريبة من المناطق القديمة تُنقل معها بنفس المسافات النسبية
--    (حتى تبقى الخريطة الحرارية والمشاكل المتكررة منطقية). البلاغات الحقيقية داخل غزة لا تتغير.
--  • تُضاف باقي مناطق القطاع، ويُضبط التوقيت على Asia/Gaza.
--  الإحداثيات تقريبية لمركز كل منطقة، ويمكن تعديلها من لوحة المدير ← المناطق.
-- ============================================================================

do $$
declare
  m record;
  v_old public.areas;
  v_dlat double precision;
  v_dlng double precision;
begin
  -- المنطقة القديمة (التجريبية) ← منطقة في غزة
  for m in
    select * from (values
      ('وسط البلد',        'الرمال',      31.5215, 34.4440, 'high'),
      ('حي النزهة',        'الشيخ رضوان', 31.5318, 34.4640, 'high'),
      ('حي الروضة',        'الشجاعية',    31.5055, 34.4770, 'medium'),
      ('حي الياسمين',      'تل الهوى',    31.5075, 34.4400, 'low'),
      ('حي الجامعة',       'النصر',       31.5255, 34.4560, 'medium'),
      ('الحي الشرقي',      'الزيتون',     31.4935, 34.4580, 'high'),
      ('حي الورود',        'الشاطئ',      31.5335, 34.4435, 'high'),
      ('المنطقة الصناعية', 'الصبرة',      31.5010, 34.4555, 'medium')
    ) as t(old_name, new_name, lat, lng, risk)
  loop
    select * into v_old from public.areas where name = m.old_name;
    continue when not found;
    -- إذا كانت المنطقة الجديدة موجودة مسبقاً (تنفيذ سابق) نتجاوز
    continue when exists (select 1 from public.areas where name = m.new_name);

    v_dlat := m.lat - v_old.latitude;
    v_dlng := m.lng - v_old.longitude;

    -- نقل البلاغات التجريبية القريبة من المنطقة القديمة فقط (ضمن 5 كم)
    update public.complaints c
    set latitude = c.latitude + v_dlat,
        longitude = c.longitude + v_dlng,
        address = replace(c.address, m.old_name, m.new_name)
    where c.area_id = v_old.id
      and private.distance_m(c.latitude, c.longitude, v_old.latitude, v_old.longitude) < 5000;

    update public.complaint_contributions cc
    set latitude = cc.latitude + v_dlat, longitude = cc.longitude + v_dlng
    where cc.complaint_id in (select id from public.complaints where area_id = v_old.id)
      and cc.latitude is not null
      and private.distance_m(cc.latitude, cc.longitude, v_old.latitude, v_old.longitude) < 5000;

    update public.areas
    set name = m.new_name, latitude = m.lat, longitude = m.lng, flood_risk = m.risk::public.risk_level, description = null
    where id = v_old.id;
  end loop;
end
$$;

-- باقي مناطق قطاع غزة (من الشمال إلى الجنوب)
insert into public.areas (name, description, latitude, longitude, flood_risk) values
  -- "غزة" بدون إحداثيات: يختارها المواطن يدوياً، ولا تُربط تلقائياً بالموقع (تُفضَّل الأحياء الأدق)
  ('غزة',          'مدينة غزة — عام', null,    null,    'medium'),
  ('بيت حانون',    'محافظة شمال غزة', 31.5395, 34.5360, 'medium'),
  ('بيت لاهيا',    'محافظة شمال غزة', 31.5507, 34.4966, 'high'),
  ('جباليا',       'محافظة شمال غزة', 31.5306, 34.4833, 'high'),
  ('الرمال',       'مدينة غزة',       31.5215, 34.4440, 'high'),
  ('الشيخ رضوان',  'مدينة غزة',       31.5318, 34.4640, 'high'),
  ('النصر',        'مدينة غزة',       31.5255, 34.4560, 'medium'),
  ('الشاطئ',       'مدينة غزة',       31.5335, 34.4435, 'high'),
  ('تل الهوى',     'مدينة غزة',       31.5075, 34.4400, 'low'),
  ('الصبرة',       'مدينة غزة',       31.5010, 34.4555, 'medium'),
  ('الزيتون',      'مدينة غزة',       31.4935, 34.4580, 'high'),
  ('الشجاعية',     'مدينة غزة',       31.5055, 34.4770, 'medium'),
  ('الدرج',        'مدينة غزة',       31.5095, 34.4660, 'medium'),
  ('التفاح',       'مدينة غزة',       31.5165, 34.4745, 'medium'),
  ('الشيخ عجلين',  'مدينة غزة',       31.4930, 34.4310, 'low'),
  ('النصيرات',     'المحافظة الوسطى', 31.4470, 34.3930, 'medium'),
  ('البريج',       'المحافظة الوسطى', 31.4395, 34.4030, 'medium'),
  ('المغازي',      'المحافظة الوسطى', 31.4215, 34.3860, 'medium'),
  ('الزوايدة',     'المحافظة الوسطى', 31.4385, 34.3730, 'low'),
  ('دير البلح',    'المحافظة الوسطى', 31.4180, 34.3510, 'medium'),
  ('القرارة',      'محافظة خان يونس', 31.3730, 34.3370, 'low'),
  ('خان يونس',     'محافظة خان يونس', 31.3440, 34.3060, 'medium'),
  ('بني سهيلا',    'محافظة خان يونس', 31.3405, 34.3260, 'low'),
  ('عبسان الكبيرة','محافظة خان يونس', 31.3190, 34.3480, 'low'),
  ('رفح',          'محافظة رفح',      31.2880, 34.2520, 'medium'),
  ('تل السلطان',   'محافظة رفح',      31.2960, 34.2420, 'low')
on conflict (name) do update
  set description = excluded.description, latitude = excluded.latitude, longitude = excluded.longitude;

-- التوقيت المحلي للتقارير والإحصائيات الشهرية
update public.app_settings set value = jsonb_set(value, '{timezone}', '"Asia/Gaza"') where key = 'general';

-- المناطق بعد التحويل
select name, description, latitude, longitude, flood_risk,
       (select count(*) from public.complaints c where c.area_id = a.id) as complaints
from public.areas a order by latitude desc;
