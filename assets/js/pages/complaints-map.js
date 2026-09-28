/* خريطة البلاغات + المناطق الساخنة */
;(() => {
  const f = { cat: '', dist: '', status: '', period: '120', mode: 'both' }
  const fill = (el, list, all) => (el.innerHTML = `<option value="">${all}</option>` + list.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join(''))
  fill($('#f-cat'), categories.map((c) => [c.id, c.name]), 'الكل')
  fill($('#f-dist'), districts.map((d) => [d.id, d.name]), 'كل المناطق')
  fill($('#f-status'), Object.entries(statusLabels), 'كل الحالات')

  $('#legend').innerHTML = Object.keys(STATUS_COLOR).map((s) => `<span><i style="background:${STATUS_COLOR[s]}"></i>${statusLabels[s]}</span>`).join('')

  const card = $('#selected')
  const m = Maps.complaints($('#map'), complaints, (c) => {
    card.hidden = false
    $('#sel-body').innerHTML = `<p class="text-xs c-3 num">${c.number}</p><p class="fw-600 mt-1">${esc(c.title)}</p>
      <p class="text-xs c-2 mt-1">${esc(getCategory(c.categoryId).name)} · ${esc(getDistrict(c.districtId).name)} · ${formatDate(c.createdAt)}</p>
      <div class="flex items-center justify-between mt-3">${statusBadge(c.status)}<a class="btn btn-primary btn-sm" href="complaint.html?id=${c.id}">التفاصيل</a></div>`
  })
  $('#sel-close').addEventListener('click', () => (card.hidden = true))

  function topCategory(list) {
    const counts = {}
    list.forEach((c) => (counts[c.categoryId] = (counts[c.categoryId] || 0) + 1))
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? getCategory(top[0]).name : '—'
  }

  function update() {
    const data = complaints.filter(
      (c) =>
        (!f.cat || c.categoryId === f.cat) &&
        (!f.dist || c.districtId === f.dist) &&
        (!f.status || c.status === f.status) &&
        (TODAY - new Date(c.createdAt)) / 86400000 <= Number(f.period),
    )
    m.draw(data, f.mode)
    $('#count').textContent = data.length

    const hot = districts
      .map((d) => {
        const list = data.filter((c) => c.districtId === d.id)
        return { name: d.name, count: list.length, top: topCategory(list) }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    const max = Math.max(1, ...hot.map((h) => h.count))
    $('#hot').innerHTML = hot
      .map(
        (h, i) => `<div class="hot-item">
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="flex items-center gap-2 fw-600"><span class="rank ${i === 0 ? 'r1' : i < 3 ? 'r2' : ''}">${i + 1}</span>${esc(h.name)}</span>
          <span class="fw-600 num">${h.count} بلاغ</span>
        </div>
        ${progress((h.count / max) * 100, i < 2 ? 'error' : 'warning')}
        <p class="text-xs c-3">الأكثر: ${esc(h.top)}</p></div>`,
      )
      .join('')
  }

  $('#filters').addEventListener('change', (e) => {
    if (e.target.dataset.f) f[e.target.dataset.f] = e.target.value
    update()
  })
  $('#modes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]')
    if (!b) return
    f.mode = b.dataset.mode
    $$('#modes button').forEach((x) => x.classList.toggle('active', x === b))
    update()
  })
  update()
})()
