/* ==========================================================================
   maps.js — الخرائط باستخدام مكتبة Leaflet (نسخة محلية في assets/vendor)
   الاستخدام:
     Maps.location(el, lat, lng)            عرض موقع بلاغ واحد
     Maps.picker(el, onPick)                اختيار موقع بالنقر أو سحب الدبوس
     Maps.complaints(el, data, onSelect)    نقاط البلاغات + طبقة حرارية
     Maps.risk(el, areas)                   دوائر خطورة المناطق
   ========================================================================== */

const Maps = (() => {
  const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  const pin = L.divIcon({
    className: '',
    html: '<svg width="34" height="44" viewBox="0 0 34 44"><path d="M17 43s15-14.3 15-26A15 15 0 0 0 2 17c0 11.7 15 26 15 26z" fill="#0b5d51" stroke="#fff" stroke-width="2"/><circle cx="17" cy="17" r="6" fill="#fff"/></svg>',
    iconSize: [34, 44],
    iconAnchor: [17, 43],
  })

  function base(el, center = MAP_CENTER, zoom = 14) {
    el.classList.add('map')
    const map = L.map(el, { center, zoom, scrollWheelZoom: false, attributionControl: false })
    L.tileLayer(TILES).addTo(map)
    return map
  }

  function location(el, lat, lng) {
    const map = base(el, [lat, lng], 16)
    L.marker([lat, lng], { icon: pin }).addTo(map)
    return map
  }

  function picker(el, onPick) {
    const map = base(el)
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
  function complaints(el, data, onSelect) {
    const map = base(el)
    const heat = L.layerGroup().addTo(map)
    const markers = L.layerGroup().addTo(map)
    function draw(list, mode) {
      heat.clearLayers()
      markers.clearLayers()
      if (mode !== 'markers') {
        // طبقة حرارية مبسطة: دوائر شفافة متراكبة — يزداد اللون كثافة بزيادة عدد البلاغات
        list.forEach((c) => L.circle([c.lat, c.lng], { radius: 380, stroke: false, fillColor: '#ef4444', fillOpacity: 0.13 }).addTo(heat))
      }
      if (mode !== 'heat') {
        list.forEach((c) =>
          L.circleMarker([c.lat, c.lng], { radius: 8, color: '#fff', weight: 2, fillColor: STATUS_COLOR[c.status], fillOpacity: 1 })
            .on('click', () => onSelect(c))
            .addTo(markers),
        )
      }
    }
    return { map, draw }
  }

  function risk(el, areas) {
    const map = base(el, MAP_CENTER, 13)
    const color = { high: '#dc2626', medium: '#d97706', low: '#16a34a' }
    areas.forEach((a) =>
      L.circle([a.lat, a.lng], { radius: 250 + a.count * 60, color: color[a.risk], weight: 2, fillColor: color[a.risk], fillOpacity: 0.25 })
        .bindPopup(`<b>${a.name}</b><br>${a.count} بلاغ فيضانات سابقة`)
        .addTo(map),
    )
    return map
  }

  return { location, picker, complaints, risk }
})()
