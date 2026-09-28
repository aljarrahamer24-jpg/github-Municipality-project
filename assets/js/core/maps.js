/* ==========================================================================
   maps.js — الخرائط باستخدام مكتبة Leaflet (نسخة محلية في assets/vendor)
   الاستخدام:
     Maps.location(el, lat, lng)                      عرض موقع بلاغ واحد
     Maps.picker(el, onPick, center)                  اختيار موقع بالنقر أو سحب الدبوس
     Maps.complaints(el, onSelect).draw(list, mode)   نقاط البلاغات + طبقة حرارية
     Maps.risk(el, areas)                             دوائر خطورة المناطق
     Maps.nearestArea(areas, lat, lng)                أقرب منطقة للإحداثيات
   ========================================================================== */

const Maps = (() => {
  const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  const pin = L.divIcon({
    className: '',
    html: '<svg width="34" height="44" viewBox="0 0 34 44"><path d="M17 43s15-14.3 15-26A15 15 0 0 0 2 17c0 11.7 15 26 15 26z" fill="#0b5d51" stroke="#fff" stroke-width="2"/><circle cx="17" cy="17" r="6" fill="#fff"/></svg>',
    iconSize: [34, 44],
    iconAnchor: [17, 43],
  })

  function base(el, center = APP_CONFIG.MAP_CENTER, zoom = APP_CONFIG.MAP_ZOOM) {
    el.classList.add('map')
    const map = L.map(el, { center, zoom, scrollWheelZoom: false, attributionControl: true })
    L.tileLayer(TILES, { attribution: '© OpenStreetMap © CARTO', maxZoom: 19 }).addTo(map)
    map.attributionControl.setPrefix('')
    return map
  }

  function location(el, lat, lng) {
    const map = base(el, [lat, lng], 16)
    L.marker([lat, lng], { icon: pin }).addTo(map)
    return map
  }

  function picker(el, onPick, center) {
    const map = base(el, center || APP_CONFIG.MAP_CENTER)
    let marker = null
    const set = (latlng, fly) => {
      if (!marker) {
        marker = L.marker(latlng, { icon: pin, draggable: true }).addTo(map)
        marker.on('dragend', () => onPick(marker.getLatLng()))
      } else marker.setLatLng(latlng)
      if (fly) map.flyTo(latlng, Math.max(map.getZoom(), 16), { duration: 0.6 })
      onPick(L.latLng(latlng))
    }
    map.on('click', (e) => set(e.latlng, false))
    return { map, set: (latlng) => set(latlng, true) }
  }

  // mode: 'markers' | 'heat' | 'both'
  function complaints(el, onSelect) {
    const map = base(el)
    const heat = L.layerGroup().addTo(map)
    const markers = L.layerGroup().addTo(map)
    let fitted = false
    function draw(list, mode) {
      heat.clearLayers()
      markers.clearLayers()
      if (!fitted && list.length) {
        map.fitBounds(L.latLngBounds(list.map((c) => [c.latitude, c.longitude])).pad(0.1), { maxZoom: 15 })
        fitted = true
      }
      if (mode !== 'markers') {
        // طبقة حرارية مبسطة: دوائر شفافة متراكبة — يزداد اللون كثافة بزيادة عدد البلاغات
        list.forEach((c) => L.circle([c.latitude, c.longitude], { radius: 380, stroke: false, fillColor: '#ef4444', fillOpacity: 0.13, interactive: false }).addTo(heat))
      }
      if (mode !== 'heat') {
        list.forEach((c) =>
          L.circleMarker([c.latitude, c.longitude], { radius: 8, color: '#fff', weight: 2, fillColor: STATUS_COLOR[c.status], fillOpacity: 1 })
            .on('click', () => onSelect(c))
            .addTo(markers),
        )
      }
    }
    return { map, draw }
  }

  function risk(el, areas) {
    const map = base(el, APP_CONFIG.MAP_CENTER, 13)
    const color = { high: '#dc2626', medium: '#d97706', low: '#16a34a' }
    const pts = []
    areas.forEach((a) => {
      if (a.latitude == null || a.longitude == null) return
      pts.push([a.latitude, a.longitude])
      L.circle([a.latitude, a.longitude], { radius: 250 + a.count * 60, color: color[a.risk], weight: a.affected ? 3 : 2, dashArray: a.affected ? null : '4 4', fillColor: color[a.risk], fillOpacity: a.affected ? 0.35 : 0.18 })
        .bindPopup(`<b>${esc(a.name)}</b><br>${a.count} بلاغ سابق مرتبط بالأمطار والتصريف${a.affected ? '<br><b>ضمن المناطق المتأثرة</b>' : ''}`)
        .addTo(map)
    })
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 14 })
    return map
  }

  // أقرب منطقة لإحداثيات معينة (لاقتراح الحي تلقائياً)
  function nearestArea(areas, lat, lng) {
    let best = null
    let bestD = Infinity
    for (const a of areas) {
      if (a.latitude == null || a.longitude == null) continue
      const d = L.latLng(lat, lng).distanceTo([a.latitude, a.longitude])
      if (d < bestD) {
        bestD = d
        best = a
      }
    }
    return best
  }

  return { location, picker, complaints, risk, nearestArea }
})()
