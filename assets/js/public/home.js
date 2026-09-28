/* الصفحة الرئيسية: أنواع الخدمات والإحصائيات من قاعدة البيانات */
App.page({}, async () => {
  const grid = $('#services-grid')

  // الإحصائيات العامة (أرقام مجمّعة فقط)
  API.publicStats()
    .then((s) => {
      const set = (k, v) => ($(`[data-stat="${k}"]`).textContent = v)
      set('total', formatNumber(s.total || 0))
      set('closed_rate', s.closed_rate != null ? `${s.closed_rate}%` : '—')
      set('avg_days', s.avg_days != null ? `${s.avg_days} يوم` : '—')
      set('avg_rating', s.avg_rating != null ? `${s.avg_rating} من 5` : '—')
    })
    .catch(() => {})

  const cats = await load(grid, () => API.categories())
  if (!cats) return
  grid.innerHTML = cats.length
    ? cats
        .map(
          (c) => `<a class="service" href="citizen/new.html?cat=${c.id}">
            <span class="icon-box">${icon(safeIcon(c.icon))}</span>
            <h3>${esc(c.name)}</h3>
            <p>المدة المتوقعة: ${c.sla_days} ${c.sla_days > 2 && c.sla_days < 11 ? 'أيام' : 'يوم'}</p>
          </a>`,
        )
        .join('')
    : `<div style="grid-column:1/-1">${empty('tags', 'لم تتم إضافة أنواع خدمات بعد')}</div>`
})
