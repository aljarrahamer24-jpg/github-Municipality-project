/* ==========================================================================
   طلبات صلاحيات الموظف — تظهر للمدير أعلى صفحة الموظفين
   الموافقة والرفض عبر الدالة review_staff_request (للمدير فقط في قاعدة البيانات).
   الحساب لا يصبح موظفاً إلا بعد موافقة المدير، ولا يمكن طلب صلاحية "مدير".
   ========================================================================== */
const StaffRequests = {
  async mount(el, departments, onChange) {
    const rows = await run(
      sb
        .from('staff_requests')
        .select('id, job_title, employee_number, note, created_at, department_id, user:profiles!staff_requests_user_id_fkey(full_name, email, phone)')
        .eq('status', 'pending')
        .order('created_at'),
    ).catch(() => [])
    if (!rows.length) {
      el.innerHTML = ''
      return
    }
    const deptOpts = (sel) => departments.filter((d) => d.is_active).map((d) => `<option value="${d.id}" ${d.id === sel ? 'selected' : ''}>${esc(d.name)}</option>`).join('')
    el.innerHTML = `<div class="card mb-6">
      <div class="card-header"><div><h2 class="card-title">طلبات صلاحيات الموظف ${badge(String(rows.length), 'warning')}</h2>
        <p class="card-sub">حسابات مواطنين طلبت صلاحيات موظف. لا يتغير الحساب إلا بعد موافقتك.</p></div></div>
      <div class="card-body stack">${rows
        .map(
          (r) => `<div class="dup-item" data-req="${r.id}">
          <div class="flex items-center gap-3" style="min-width:0">${avatar(r.user?.full_name || r.user?.email, 'sm')}
            <div style="min-width:0"><p class="fw-600">${esc(r.user?.full_name || '—')} <span class="text-xs c-3 ltr">${esc(r.user?.email || '')}</span></p>
            <p class="text-xs c-3 mt-1">${esc(r.job_title || 'بدون مسمى')}${r.employee_number ? ` · رقم وظيفي: ${esc(r.employee_number)}` : ''} · ${formatDate(r.created_at)}${r.note ? ` · «${esc(r.note)}»` : ''}</p></div>
          </div>
          <div class="flex wrap items-center gap-2">
            <select class="select" data-dept style="width:auto;height:36px">${deptOpts(r.department_id)}</select>
            <button class="btn btn-primary btn-sm" data-approve>${icon('check')}موافقة</button>
            <button class="btn btn-ghost btn-sm" data-reject>رفض</button>
          </div>
        </div>`,
        )
        .join('')}</div></div>`

    el.onclick = async (e) => {
      const item = e.target.closest('[data-req]')
      const approve = e.target.closest('[data-approve]')
      const reject = e.target.closest('[data-reject]')
      if (!item || (!approve && !reject)) return
      let note = null
      if (approve) {
        const dept = $('[data-dept] option:checked', item)?.textContent
        if (!(await confirmDialog({ title: 'الموافقة على الطلب', message: `سيصبح هذا الحساب حساب موظف في "${dept}" ويرى بلاغات القسم. متابعة؟`, confirmText: 'موافقة' }))) return
      } else {
        if (!(await confirmDialog({ title: 'رفض الطلب', message: 'سيبقى الحساب حساب مواطن، ويصل لصاحبه إشعار بالرفض.', confirmText: 'رفض', danger: true }))) return
        note = 'لم تتم الموافقة على الطلب من إدارة البلدية.'
      }
      try {
        await withBusy(approve || reject, () =>
          run(sb.rpc('review_staff_request', { p_id: item.dataset.req, p_approve: !!approve, p_department: $('[data-dept]', item).value || null, p_note: note })),
        )
        toast(approve ? 'تمت الموافقة — أصبح الحساب حساب موظف' : 'تم رفض الطلب')
        await StaffRequests.mount(el, departments, onChange)
        onChange?.()
      } catch (err) {
        toast(toAppError(err).message, 'error')
      }
    }
  },
}
