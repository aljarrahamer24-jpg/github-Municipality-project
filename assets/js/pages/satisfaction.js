/* رضا المواطنين */
;(() => {
  const total = ratingDistribution.reduce((a, r) => a + r.count, 0)
  const avg = ratingDistribution.reduce((a, r) => a + r.stars * r.count, 0) / total
  const pct = (list) => ((list.reduce((a, r) => a + r.count, 0) / total) * 100).toFixed(0)
  const satisfied = pct(ratingDistribution.filter((r) => r.stars >= 4))
  const unsatisfied = pct(ratingDistribution.filter((r) => r.stars <= 2))

  $('#stats').innerHTML = [
    statCard({ label: 'متوسط التقييم', value: `${avg.toFixed(1)} من 5`, icon: 'star', accent: 'gold', trend: { value: '0.2', up: true }, hint: 'عن الفترة السابقة' }),
    statCard({ label: 'نسبة الرضا', value: `${satisfied}%`, icon: 'face-slightly-smiling', accent: 'success' }),
    statCard({ label: 'عدد التقييمات', value: total, icon: 'message-square' }),
    statCard({ label: 'نسبة عدم الرضا', value: `${unsatisfied}%`, icon: 'face-slightly-frowning', accent: 'error' }),
  ].join('')

  $('#avg').textContent = avg.toFixed(1)
  $('#avg-stars').innerHTML = stars(avg)
  $('#total').textContent = total
  $('#dist').innerHTML = ratingDistribution
    .map((r) => `<div class="dist-row"><span class="s">${r.stars}${icon('star')}</span>${progress((r.count / total) * 100, r.stars >= 4 ? 'success' : r.stars === 3 ? 'gold' : 'error')}<span class="n num">${r.count}</span></div>`)
    .join('')

  Charts.line($('#chart-months'), satisfactionByMonth, { domain: [3, 5], height: 260 })
  Charts.hbar($('#chart-depts'), byDepartment.map((d) => ({ name: d.name, value: d.satisfaction })), { unit: 'من 5', name: 'التقييم', max: 5 })

  const maxR = Math.max(...dissatisfactionReasons.map((r) => r.count))
  $('#reasons').innerHTML = dissatisfactionReasons
    .map(
      (r, i) => `<div class="hot-item">
      <div class="flex items-center justify-between gap-2 text-sm"><span class="flex items-center gap-2 fw-500"><span class="rank r2">${i + 1}</span>${esc(r.reason)}</span><span class="c-2 num">${r.count}</span></div>
      ${progress((r.count / maxR) * 100, 'error')}
      <p class="text-xs c-3">الكلمة المفتاحية: «${esc(r.keyword)}»</p></div>`,
    )
    .join('')

  $('#feedback').innerHTML = recentFeedback
    .map(
      (f) => `<div class="stack-sm">
      <div class="flex items-center justify-between"><p class="fw-600">${esc(f.name)}</p>${stars(f.rating, 'sm')}</div>
      <p class="text-sm c-2 leading-loose">«${esc(f.text)}»</p>
      <div class="flex items-center justify-between text-xs c-3">${f.rating >= 4 ? badge('إيجابي', 'success', 'thumbs-up') : badge('سلبي', 'error', 'face-slightly-frowning')}<span>${esc(f.dept)}</span></div>
    </div>`,
    )
    .join('')
})()
