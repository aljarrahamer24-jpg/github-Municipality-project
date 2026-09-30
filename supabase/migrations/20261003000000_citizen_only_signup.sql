-- ============================================================================
--  التسجيل للمواطنين فقط — المدير وحده يضيف الموظفين
--  ---------------------------------------------------------------------------
--  يُنفّذ مرة واحدة في SQL Editor. آمن للتنفيذ سواء نُفّذ ملف "طلبات صلاحيات الموظف" سابقاً أم لا.
--  • يحذف ميزة "طلب صلاحيات موظف" (الجدول والدوال) إن وُجدت.
--  • يعيد دالة إنشاء الحساب لأصلها: كل حساب جديد "مواطن" دائماً، ولا يُقرأ أي دور من المتصفح.
--  • الموظفون يضيفهم المدير فقط من صفحة الموظفين (أو يرقّي حساباً موجوداً من صفحة المستخدمين).
-- ============================================================================

drop function if exists public.submit_staff_request(uuid, text, text, text);
drop function if exists public.cancel_staff_request();
drop function if exists public.review_staff_request(uuid, boolean, uuid, text);
drop function if exists private.create_staff_request(uuid, uuid, text, text, text);
drop table if exists public.staff_requests;

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
