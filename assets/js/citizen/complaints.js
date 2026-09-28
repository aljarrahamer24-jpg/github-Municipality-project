/* بلاغاتي — تبويبات + بحث (من قاعدة البيانات) */
App.page({ roles: ['citizen'] }, async ({ profile }) => {
  const DONE = ['resolved', 'closed', 'rejected']
  const state = { tab: 'all', q: '', page: 1 }
  const list = $('#list')
  const PAGE = 15

  // أعداد التبويبات
  API.stats()
    .then((s) => {
      $('#tab-all').textContent = s.total
      $('#tab-open').textContent = s.open
      $('#tab-done').textContent = s.done + s.rejected
    })
    .catch(() => {})

  async function render() {
    const filter = state.tab === 'open' ? { statuses: OPEN_STATUSES } : state.tab === 'done' ? { statuses: DONE } : {}
    const data = await load(list, () => API.complaints({ ...filter, citizenId: profile.id, search: state.q, page: state.page, pageSize: PAGE }))
    if (!data) return
    if (!data.rows.length) {
      list.innerHTML = state.q || state.tab !== 'all'
        ? empty('search-x', 'لا توجد بلاغات مطابقة', 'جرّب كلمة بحث أخرى أو تبويباً مختلفاً.')
        : empty('file-text', 'لا توجد بلاغات', 'لم تقدّم أي بلاغ بعد.', `<a class="btn btn-primary" href="new.html">${icon('plus')}قدّم أول بلاغ</a>`)
      return
    }
    const pages = Math.ceil(data.count / PAGE)
    list.innerHTML = `<div class="divider" style="padding:8px">${data.rows.map((c) => complaintCard(c, `complaint.html?id=${c.id}`)).join('')}</div>
      ${pages > 1 ? `<div class="pagination"><span>إجمالي <b class="c-ink">${data.count}</b> بلاغ</span><div class="pages">
        <button data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>السابق</button><span class="pg-info" style="display:inline">${state.page} / ${pages}</span>
        <button data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''}>التالي</button></div></div>` : ''}`
  }

  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]')
    if (!b) return
    state.tab = b.dataset.tab
    state.page = 1
    $$('#tabs [data-tab]').forEach((x) => x.classList.toggle('active', x === b))
    render()
  })
  $('#search').addEventListener(
    'input',
    debounce((e) => {
      state.q = e.target.value
      state.page = 1
      render()
    }),
  )
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-page]')
    if (!b) return
    state.page = Number(b.dataset.page)
    render()
  })
  render()
})
