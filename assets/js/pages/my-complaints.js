/* بلاغاتي — تبويبات + بحث */
;(() => {
  const isOpen = (s) => ['new', 'in_review', 'in_progress'].includes(s)
  let tab = 'all'
  let q = ''
  $('#tab-all').textContent = myComplaints.length
  $('#tab-open').textContent = myComplaints.filter((c) => isOpen(c.status)).length
  $('#tab-done').textContent = myComplaints.filter((c) => !isOpen(c.status)).length

  function render() {
    const list = myComplaints.filter((c) => (tab === 'all' ? true : tab === 'open' ? isOpen(c.status) : !isOpen(c.status))).filter((c) => `${c.number} ${c.title}`.includes(q))
    $('#list').innerHTML = list.length
      ? `<div class="divider" style="padding:8px">${list.map((c) => complaintCard(c, `complaint.html?id=${c.id}`)).join('')}</div>`
      : empty('file-text', 'لا توجد بلاغات', 'لم يتم العثور على بلاغات مطابقة.', `<a class="btn btn-primary" href="new.html">${icon('plus')}قدّم بلاغاً جديداً</a>`)
  }
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]')
    if (!b) return
    tab = b.dataset.tab
    $$('[data-tab]').forEach((x) => x.classList.toggle('active', x === b))
    render()
  })
  $('#search').addEventListener('input', (e) => {
    q = e.target.value.trim()
    render()
  })
  render()
})()
