-- ============================================================================
--  إضافة موظف لكل قسم (يُنفّذ مرة واحدة في SQL Editor — آمن للتكرار)
--  ---------------------------------------------------------------------------
--  ينشئ حساب موظف مفعّلاً لكل قسم من أقسام البلدية، ويربطه بقسمه.
--  كلمة المرور المؤقتة للجميع: Staff@2026  (غيّرها من صفحة "حسابي" بعد الدخول)
--
--    roads@baladiya.ps     قسم الطرق والأرصفة
--    clean@baladiya.ps     قسم النظافة العامة
--    lights@baladiya.ps    قسم الإنارة
--    water@baladiya.ps     قسم المياه والصرف
--    parks@baladiya.ps     قسم الحدائق والتشجير
--    control@baladiya.ps   قسم الرقابة والتنظيم
--
--  إذا كان الإيميل موجوداً مسبقاً، لا يُنشأ حساب جديد، بل يُضبط دوره وقسمه فقط.
-- ============================================================================

create or replace function pg_temp.staff_user(p_email text, p_name text, p_dept text, p_phone text)
returns text
language plpgsql
as $$
declare
  v_id uuid;
  v_dept uuid;
begin
  select id into v_dept from public.departments where name = p_dept;
  if v_dept is null then
    return p_email || ': القسم "' || p_dept || '" غير موجود — تم التجاوز';
  end if;

  select id into v_id from auth.users where email = p_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
      extensions.crypt('Staff@2026', extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', p_name, 'phone', p_phone), now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
            'email', now(), now(), now());
  end if;

  -- الملف الشخصي يُنشأ تلقائياً عند التسجيل؛ هنا نضبط الدور والقسم
  update public.profiles
     set role = 'employee', full_name = p_name, phone = p_phone,
         department_id = v_dept, is_active = true
   where id = v_id;
  return p_email || ': تم — ' || p_dept;
end
$$;

select pg_temp.staff_user('roads@baladiya.ps',   'محمد أبو سالم',   'قسم الطرق والأرصفة',   '0599100001')
union all
select pg_temp.staff_user('clean@baladiya.ps',   'خالد الهندي',     'قسم النظافة العامة',   '0599100002')
union all
select pg_temp.staff_user('lights@baladiya.ps',  'أحمد شحادة',      'قسم الإنارة',          '0599100003')
union all
select pg_temp.staff_user('water@baladiya.ps',   'سامي الدحدوح',    'قسم المياه والصرف',    '0599100004')
union all
select pg_temp.staff_user('parks@baladiya.ps',   'يوسف أبو عودة',   'قسم الحدائق والتشجير', '0599100005')
union all
select pg_temp.staff_user('control@baladiya.ps', 'إبراهيم النجار',  'قسم الرقابة والتنظيم', '0599100006');

-- الموظفون حسب القسم (للتأكد)
select d.name as "القسم", p.full_name as "الموظف", p.email as "الإيميل"
from public.departments d
left join public.profiles p on p.department_id = d.id and p.role = 'employee' and p.is_active
order by d.name, p.full_name;
