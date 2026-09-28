/* تحليل رضا المواطنين — إحصاءات التقييمات + تكرار الكلمات المفتاحية في التعليقات (بدون ذكاء اصطناعي) */
App.page({ roles: ['admin'] }, async () => {

  async function render() {
    const v = $('#period').value
    const from = v ? new Date(Date.now() - Number(v) * 86400000).toISOString() : null
    const s = await load($('#dist'), () => API.satisfaction(from, null))
    if (!s) return

    $('#stats').innerHTML = [
      statCard({ label: 'متوسط التقييم', value: s.avg != null ? `${s.avg} من 5` : '—', icon: 'star', accent: 'gold' }),
      statCard({ label: 'نسبة الرضا', value: s.satisfied_pct != null ? `${s.satisfied_pct}%` : '—', icon: 'face-slightly-smiling', accent: 'success', hint: '4 نجوم فأكثر' }),
      statCard({ label: 'عدد التقييمات', value: formatNumber(s.count), icon: 'message-square' }),
      statCard({ label: 'نسبة عدم الرضا', value: s.unsatisfied_pct != null ? `${s.unsatisfied_pct}%` : '—', icon: 'face-slightly-frowning', accent: 'error', hint: 'نجمتان أو أقل' }),
    ].join('')

    $('#avg').textContent = s.avg ?? '—'
    $('#avg-stars').innerHTML = stars(s.avg || 0)
    $('#total').textContent = s.count
    $('#dist').innerHTML = s.distribution
      .map((r) => `<div class="dist-row"><span class="s">${r.stars}${icon('star')}</span>${progress(s.count ? (r.count / s.count) * 100 : 0, r.stars >= 4 ? 'success' : r.stars === 3 ? 'gold' : 'error')}<span class="n num">${r.count}</span></div>`)
      .join('')

    Charts.line(Charts.host('chart-months'), s.by_month.map((m) => ({ month: monthName(m.month), value: Number(m.value) })), { domain: [1, 5], height: 260 })
    Charts.hbar(Charts.host('chart-depts'), s.by_department.map((d) => ({ name: d.name.replace(/^قسم /, ''), value: Number(d.avg) })), { unit: 'من 5', name: 'التقييم', max: 5 })

    // أسباب عدم الرضا = الكلمات المفتاحية السلبية الأكثر تكراراً
    const negative = s.keywords.filter((k) => k.sentiment === 'negative' && k.hits > 0)
    const maxR = Math.max(1, ...negative.map((r) => r.hits))
    $('#reasons').innerHTML = negative.length
      ? negative
          .slice(0, 6)
          .map(
            (r, i) => `<div class="hot-item">
          <div class="flex items-center justify-between gap-2 text-sm"><span class="flex items-center gap-2 fw-500"><span class="rank r2">${i + 1}</span>«${esc(r.keyword)}» — ${esc(r.topic)}</span><span class="c-2 num">${r.hits} مرة</span></div>
          ${progress((r.hits / maxR) * 100, 'error')}</div>`,
          )
          .join('')
      : empty('message-square', 'لا توجد أسباب سلبية متكررة', 'لم تظهر أي كلمة مفتاحية سلبية في تعليقات هذه الفترة.')

    const positive = s.keywords.filter((k) => k.sentiment !== 'negative' && k.hits > 0)
    const tags = s.tags || []
    $('#keywords-extra').innerHTML =
      (positive.length ? `<p class="text-sm fw-600 mb-3">كلمات إيجابية / محايدة</p><div class="chips">${positive.map((k) => badge(`«${k.keyword}» ${k.hits}`, k.sentiment === 'positive' ? 'success' : 'neutral')).join('')}</div>` : '') +
      (tags.length ? `<p class="text-sm fw-600 mb-3 mt-4">اختيارات المواطنين عند التقييم</p><div class="chips">${tags.map((t) => badge(`${t.tag} (${t.count})`, 'primary')).join('')}</div>` : '')

    $('#feedback').innerHTML = s.recent.length
      ? s.recent
          .slice(0, 6)
          .map(
            (f) => `<div class="stack-sm">
        <div class="flex items-center justify-between"><p class="fw-600">${esc(f.citizen)}</p>${stars(f.rating, 'sm')}</div>
        <p class="text-sm c-2 leading-loose">«${esc(f.comment)}»</p>
        <div class="flex items-center justify-between text-xs c-3">${f.rating >= 4 ? badge('إيجابي', 'success', 'thumbs-up') : f.rating === 3 ? badge('محايد', 'neutral') : badge('سلبي', 'error', 'face-slightly-frowning')}<span>${esc(f.department || '')} · ${formatDate(f.created_at)}</span></div>
      </div>`,
          )
          .join('')
      : `<div style="grid-column:1/-1">${empty('message-square', 'لا توجد تعليقات بعد')}</div>`
  }

  $('#period').addEventListener('change', render)
  render()
})
