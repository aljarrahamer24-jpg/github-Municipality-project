/* ==========================================================================
   charts.js — رسوم بيانية SVG مكتوبة يدوياً (بدون مكتبات)
   مهيأة للعربية: التسميات على اليمين، والزمن يتجه من اليمين إلى اليسار.
   الاستخدام:
     Charts.hbar(el, [{ name, value }], { unit })
     Charts.columns(el, [{ month, value }], { key, unit, name })
     Charts.area(el, data, [{ key, name, color }])
     Charts.line(el, [{ month, value }], { domain, unit, name })
   ========================================================================== */

const Charts = (() => {
  // لوحة ألوان تصنيفية مختبرة لعمى الألوان — تُسند بترتيب ثابت
  const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
  const SINGLE = '#1a7467' // لون السلسلة الواحدة = اللون الأساسي
  const NS = 'http://www.w3.org/2000/svg'

  // حساب أقصى قيمة "مرتبة" للمحور وعدد الخطوط
  function niceScale(max, ticks = 4) {
    const raw = max / ticks
    const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw
    return { max: step * ticks, step }
  }

  function tooltip(el) {
    let tip = el.querySelector('.chart-tip')
    if (!tip) {
      tip = document.createElement('div')
      tip.className = 'chart-tip'
      tip.hidden = true
      el.appendChild(tip)
    }
    return {
      show(x, y, html) {
        tip.innerHTML = html
        tip.hidden = false
        const w = el.clientWidth
        tip.style.left = Math.min(Math.max(x, 70), w - 70) + 'px'
        tip.style.top = y + 'px'
      },
      hide() {
        tip.hidden = true
      },
    }
  }

  const row = (color, name, value, unit) => `<p><i style="background:${color}"></i>${esc(name)}: <b>${esc(value)}</b> ${esc(unit || '')}</p>`

  // يرسم عند التحميل ويعيد الرسم عند تغيير حجم الحاوية
  function responsive(el, draw) {
    el.classList.add('chart')
    let last = 0
    const run = () => {
      const w = el.clientWidth
      if (!w || w === last) return
      last = w
      el.querySelector('svg')?.remove()
      el.insertAdjacentHTML('afterbegin', draw(w))
      bind()
    }
    let bind = () => {}
    const api = { onBind: (fn) => (bind = () => fn(el)) }
    new ResizeObserver(run).observe(el)
    requestAnimationFrame(run)
    return api
  }

  /* ---------- أعمدة أفقية (للتصنيفات ذات الأسماء الطويلة) ---------- */
  // لا توجد بيانات → حالة فارغة بدل رسم فارغ
  const noData = (el, data) => {
    if (data && data.length) return false
    el.innerHTML = `<div class="state-block">${icon('chart-column')}<p>لا توجد بيانات كافية للعرض خلال هذه الفترة.</p></div>`
    return true
  }

  function hbar(el, data, { unit = 'بلاغ', name = 'العدد', labelWidth = 130, max: fixedMax } = {}) {
    if (noData(el, data)) return
    const rowH = 34
    const top = 4
    const H = data.length * rowH + 28
    const { max, step } = fixedMax ? { max: fixedMax, step: fixedMax / 5 } : niceScale(Math.max(1, ...data.map((d) => Number(d.value) || 0)))
    const tip = tooltip(el)
    responsive(el, (W) => {
      const right = W - labelWidth - 8
      const left = 36
      const x = (v) => right - (v / max) * (right - left)
      let s = `<svg height="${H}" viewBox="0 0 ${W} ${H}" role="img">`
      const tickStep = right - left < 220 ? step * 2 : step // تقليل خطوط المحور على الشاشات الضيقة
      for (let v = 0; v <= max; v += tickStep) {
        s += `<line class="grid-line" x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${H - 22}"/><text x="${x(v)}" y="${H - 6}" text-anchor="middle">${v}</text>`
      }
      data.forEach((d, i) => {
        const y = top + i * rowH
        const bh = Math.min(22, rowH - 10)
        const by = y + (rowH - bh) / 2
        const bx = x(d.value)
        const len = right - bx
        const r = Math.min(4, len)
        // طرف البيانات مستدير (يسار) وطرف خط الأساس مستقيم (يمين)
        s += `<path class="bar" fill="${SINGLE}" d="M${right},${by} H${bx + r} Q${bx},${by} ${bx},${by + r} V${by + bh - r} Q${bx},${by + bh} ${bx + r},${by + bh} H${right} Z"/>`
        s += `<text class="val" x="${bx - 6}" y="${by + bh / 2 + 4}" text-anchor="end">${d.value}</text>`
        s += `<text class="lbl" x="${W - 2}" y="${by + bh / 2 + 4}" text-anchor="start" direction="rtl">${esc(d.name)}</text>`
        s += `<rect class="hit" data-i="${i}" x="0" y="${y}" width="${W}" height="${rowH}"/>`
      })
      return s + '</svg>'
    }).onBind((root) => {
      root.querySelectorAll('.hit').forEach((h) => {
        h.addEventListener('mouseenter', () => {
          const d = data[h.dataset.i]
          const y = Number(h.getAttribute('y'))
          tip.show(root.clientWidth / 2, y + 4, `<b>${esc(d.name)}</b>${row(SINGLE, name, d.value, unit)}`)
        })
        h.addEventListener('mouseleave', tip.hide)
      })
    })
  }

  /* ---------- محور زمني مشترك (أعمدة / خطوط) ---------- */
  function timeFrame(W, H, n, maxV, minV = 0) {
    const pad = { top: 22, bottom: 26, left: 8, right: 36 }
    const plotW = W - pad.left - pad.right
    const plotH = H - pad.top - pad.bottom
    const band = plotW / n
    // العنصر الأول (الأقدم) على اليمين
    const cx = (i) => W - pad.right - band * i - band / 2
    const y = (v) => pad.top + plotH - ((v - minV) / (maxV - minV)) * plotH
    return { pad, band, cx, y, plotH }
  }

  function axes(W, H, f, data, labelKey, maxV, step, minV = 0) {
    let s = ''
    for (let v = minV; v <= maxV + 1e-9; v += step) {
      const yy = f.y(v)
      s += `<line class="grid-line" x1="${f.pad.left}" x2="${W - f.pad.right}" y1="${yy}" y2="${yy}"/><text x="${W - f.pad.right + 6}" y="${yy + 4}">${+v.toFixed(1)}</text>`
    }
    const every = f.band < 52 ? 2 : 1 // إظهار تسمية كل شهرين إذا ضاقت المساحة
    data.forEach((d, i) => i % every === 0 && (s += `<text class="lbl" x="${f.cx(i)}" y="${H - 6}" text-anchor="middle">${esc(d[labelKey])}</text>`))
    return s
  }

  /* ---------- أعمدة عمودية لسلسلة واحدة ---------- */
  function columns(el, data, { key = 'value', unit = '', name = 'القيمة', height = 240 } = {}) {
    if (noData(el, data)) return
    const { max, step } = niceScale(Math.max(1, ...data.map((d) => Number(d[key]) || 0)))
    const tip = tooltip(el)
    responsive(el, (W) => {
      const f = timeFrame(W, height, data.length, max)
      let s = `<svg height="${height}" viewBox="0 0 ${W} ${height}" role="img">` + axes(W, height, f, data, 'month', max, step)
      data.forEach((d, i) => {
        const bw = Math.min(24, f.band * 0.6)
        const x0 = f.cx(i) - bw / 2
        const y0 = f.y(d[key])
        const base = f.y(0)
        s += `<path class="bar" fill="${SINGLE}" d="M${x0},${base} V${y0 + 4} Q${x0},${y0} ${x0 + 4},${y0} H${x0 + bw - 4} Q${x0 + bw},${y0} ${x0 + bw},${y0 + 4} V${base} Z"/>`
        s += `<text class="val" x="${f.cx(i)}" y="${y0 - 6}" text-anchor="middle">${d[key]}</text>`
        s += `<rect class="hit" data-i="${i}" x="${f.cx(i) - f.band / 2}" y="${f.pad.top}" width="${f.band}" height="${f.plotH}"/>`
      })
      return s + '</svg>'
    }).onBind((root) =>
      root.querySelectorAll('.hit').forEach((h) => {
        h.addEventListener('mouseenter', () => {
          const d = data[h.dataset.i]
          tip.show(Number(h.getAttribute('x')) + Number(h.getAttribute('width')) / 2, 30, `<b>${esc(d.month)}</b>${row(SINGLE, name, d[key], unit)}`)
        })
        h.addEventListener('mouseleave', tip.hide)
      }),
    )
  }

  /* ---------- خطوط / مساحات (سلسلة أو أكثر) ---------- */
  function lines(el, data, series, { height = 260, domain, unit = 'بلاغ', area = true, labels = false } = {}) {
    if (noData(el, data)) return
    const allMax = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)))
    const scale = domain ? { max: domain[1], step: (domain[1] - domain[0]) / 4 } : niceScale(allMax)
    const minV = domain ? domain[0] : 0
    const tip = tooltip(el)
    if (series.length > 1) {
      el.insertAdjacentHTML('beforebegin', `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>`)
    }
    responsive(el, (W) => {
      const f = timeFrame(W, height, data.length, scale.max, minV)
      let s = `<svg height="${height}" viewBox="0 0 ${W} ${height}" role="img">` + axes(W, height, f, data, 'month', scale.max, scale.step, minV)
      series.forEach((ser) => {
        const pts = data.map((d, i) => [f.cx(i), f.y(d[ser.key])])
        const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')
        if (area) s += `<path d="${path} L${pts.at(-1)[0]},${f.y(minV)} L${pts[0][0]},${f.y(minV)} Z" fill="${ser.color}" opacity="0.07"/>`
        s += `<path d="${path}" fill="none" stroke="${ser.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
        pts.forEach((p, i) => {
          s += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${ser.color}" stroke="#fff" stroke-width="2"/>`
          if (labels) s += `<text class="val" x="${p[0]}" y="${p[1] - 10}" text-anchor="middle">${data[i][ser.key]}</text>`
        })
      })
      data.forEach((_, i) => (s += `<rect class="hit" data-i="${i}" x="${f.cx(i) - f.band / 2}" y="${f.pad.top}" width="${f.band}" height="${f.plotH}"/>`))
      return s + '</svg>'
    }).onBind((root) =>
      root.querySelectorAll('.hit').forEach((h) => {
        h.addEventListener('mouseenter', () => {
          const d = data[h.dataset.i]
          tip.show(Number(h.getAttribute('x')) + Number(h.getAttribute('width')) / 2, 30, `<b>${esc(d.month)}</b>` + series.map((s) => row(s.color, s.name, d[s.key], unit)).join(''))
        })
        h.addEventListener('mouseleave', tip.hide)
      }),
    )
  }

  return {
    SERIES,
    hbar,
    columns,
    area: (el, data, series, opts) => lines(el, data, series, { ...opts, area: true }),
    line: (el, data, { domain = [1, 5], unit = 'من 5', name = 'متوسط التقييم', height = 240 } = {}) =>
      lines(el, data, [{ key: 'value', name, color: SINGLE }], { domain, unit, height, area: false, labels: true }),
  }
})()
