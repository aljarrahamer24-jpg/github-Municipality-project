-- ============================================================================
--  البيانات الأساسية (Reference Data)
--  تُنفّذ بعد ملف migrations مرة واحدة. آمنة للتكرار (on conflict do nothing).
--  يمكن تعديلها لاحقاً من لوحة المدير → إدارة النظام.
-- ============================================================================

insert into public.departments (name, description) values
  ('قسم الطرق والأرصفة', 'صيانة الطرق والحفر والأرصفة'),
  ('قسم النظافة العامة', 'جمع النفايات ونظافة الشوارع'),
  ('قسم الإنارة', 'صيانة أعمدة وشبكات الإنارة العامة'),
  ('قسم المياه والصرف', 'شبكات المياه والصرف الصحي وتصريف الأمطار'),
  ('قسم الحدائق والتشجير', 'الحدائق العامة والأشجار'),
  ('قسم الرقابة والتنظيم', 'مخالفات البناء وإشغال الطرق')
on conflict (name) do nothing;

insert into public.problem_categories (name, description, icon, color, department_id, sla_days, default_priority, is_weather_related)
select v.name, v.description, v.icon, v.color, d.id, v.sla_days, v.priority::public.complaint_priority, v.weather
from (values
  ('حفر في الطرق', 'حفر وهبوط في الإسفلت', 'construction', '#b45309', 'قسم الطرق والأرصفة', 7, 'high', false),
  ('تراكم النفايات', 'حاويات ممتلئة أو نفايات متراكمة', 'trash', '#15803d', 'قسم النظافة العامة', 2, 'medium', false),
  ('إنارة الشوارع', 'أعمدة إنارة معطلة أو أسلاك مكشوفة', 'lightbulb', '#ca8a04', 'قسم الإنارة', 5, 'medium', false),
  ('تسرب مياه', 'تسرب أو انكسار في خطوط المياه', 'droplets', '#2563eb', 'قسم المياه والصرف', 3, 'high', false),
  ('انسداد صرف صحي', 'طفح أو انسداد في المناهل', 'waves-horizontal', '#7c3aed', 'قسم المياه والصرف', 2, 'high', true),
  ('تجمع مياه الأمطار', 'تجمع مياه وفيضانات وضعف التصريف', 'cloud-rain', '#0891b2', 'قسم المياه والصرف', 1, 'urgent', true),
  ('الأشجار والحدائق', 'أشجار آيلة للسقوط وصيانة الحدائق', 'tree-pine', '#16a34a', 'قسم الحدائق والتشجير', 10, 'low', false),
  ('تلف الأرصفة', 'أرصفة مكسورة أو غير آمنة', 'footprints', '#9a3412', 'قسم الطرق والأرصفة', 10, 'low', false),
  ('مخالفات بناء', 'بناء دون ترخيص أو إشغال الطريق', 'building-complex', '#475569', 'قسم الرقابة والتنظيم', 14, 'medium', false)
) as v(name, description, icon, color, dept, sla_days, priority, weather)
join public.departments d on d.name = v.dept
on conflict (name) do nothing;

insert into public.areas (name, description, latitude, longitude, flood_risk, population) values
  ('وسط البلد', 'المركز التجاري والأسواق', 32.5556, 35.8502, 'high', 42000),
  ('حي النزهة', null, 32.5621, 35.8431, 'medium', 28000),
  ('حي الروضة', null, 32.5468, 35.8588, 'high', 35000),
  ('حي الياسمين', null, 32.5702, 35.8564, 'low', 19000),
  ('حي الجامعة', null, 32.5389, 35.8452, 'medium', 31000),
  ('الحي الشرقي', null, 32.5519, 35.8715, 'high', 24000),
  ('حي الورود', null, 32.5655, 35.8338, 'low', 16000),
  ('المنطقة الصناعية', null, 32.5412, 35.8298, 'medium', 8000)
on conflict (name) do nothing;

insert into public.feedback_keywords (keyword, sentiment, topic) values
  ('تأخير', 'negative', 'زمن الاستجابة'),
  ('متأخر', 'negative', 'زمن الاستجابة'),
  ('بطء', 'negative', 'زمن الاستجابة'),
  ('لم يتم الحل', 'negative', 'جودة الحل'),
  ('لم تحل', 'negative', 'جودة الحل'),
  ('تكررت', 'negative', 'جودة الحل'),
  ('لا يوجد رد', 'negative', 'التواصل'),
  ('سيء', 'negative', 'عام'),
  ('استجابة', 'positive', 'زمن الاستجابة'),
  ('سريع', 'positive', 'زمن الاستجابة'),
  ('ممتاز', 'positive', 'جودة الحل'),
  ('شكرا', 'positive', 'عام'),
  ('مقبول', 'neutral', 'عام')
on conflict (keyword) do nothing;
