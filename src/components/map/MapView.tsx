import { useEffect } from 'react'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { MAP_CENTER, getCategory, statusLabels } from '../../data/mock'
import type { Complaint, ComplaintStatus } from '../../data/types'
import { cn } from '../../lib/utils'

// ألوان الحالات على الخريطة (مطابقة لـ Badges)
export const statusColor: Record<ComplaintStatus, string> = {
  new: '#2563eb',
  in_review: '#7c3aed',
  in_progress: '#d97706',
  resolved: '#16a34a',
  closed: '#64748b',
  rejected: '#dc2626',
}

const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 43s15-14.3 15-26A15 15 0 0 0 2 17c0 11.7 15 26 15 26z" fill="#0b5d51" stroke="#fff" stroke-width="2"/><circle cx="17" cy="17" r="6" fill="#fff"/></svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 43],
})

function Base({ children, className, zoom = 14, center = MAP_CENTER }: { children?: React.ReactNode; className?: string; zoom?: number; center?: [number, number] }) {
  return (
    <div dir="ltr" className={cn('overflow-hidden rounded-lg border border-line', className)}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="size-full" attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {children}
      </MapContainer>
    </div>
  )
}

/* ---------- خريطة موقع واحد (تفاصيل البلاغ) ---------- */
export function LocationMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
  return (
    <Base center={[lat, lng]} zoom={16} className={className}>
      <Marker position={[lat, lng]} icon={pinIcon} />
    </Base>
  )
}

/* ---------- اختيار الموقع (إنشاء بلاغ) ---------- */
function ClickHandler({ onPick }: { onPick: (p: [number, number]) => void }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) })
  return null
}
function FlyTo({ pos }: { pos: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.flyTo(pos, Math.max(map.getZoom(), 16), { duration: 0.6 })
  }, [pos, map])
  return null
}
export function LocationPicker({ value, onChange, className }: { value: [number, number] | null; onChange: (p: [number, number]) => void; className?: string }) {
  return (
    <Base className={className}>
      <ClickHandler onPick={onChange} />
      <FlyTo pos={value} />
      {value && <Marker position={value} icon={pinIcon} draggable eventHandlers={{ dragend: (e) => onChange([e.target.getLatLng().lat, e.target.getLatLng().lng]) }} />}
    </Base>
  )
}

/* ---------- خريطة البلاغات (Markers + Heatmap) ---------- */
export function ComplaintsMap({ data, mode, className, onSelect }: { data: Complaint[]; mode: 'markers' | 'heat' | 'both'; className?: string; onSelect?: (c: Complaint) => void }) {
  return (
    <Base className={className} zoom={14}>
      {(mode === 'heat' || mode === 'both') &&
        data.map((c) => (
          // طبقة حرارية مبسطة: دوائر شفافة متراكبة — تزداد كثافة اللون بزيادة عدد البلاغات
          <Circle key={`h-${c.id}`} center={[c.lat, c.lng]} radius={380} pathOptions={{ stroke: false, fillColor: '#ef4444', fillOpacity: 0.13 }} />
        ))}
      {(mode === 'markers' || mode === 'both') &&
        data.map((c) => (
          <CircleMarker
            key={c.id}
            center={[c.lat, c.lng]}
            radius={8}
            pathOptions={{ color: '#fff', weight: 2, fillColor: statusColor[c.status], fillOpacity: 1 }}
            eventHandlers={{ click: () => onSelect?.(c) }}
          >
            <Popup>
              <div className="space-y-1 font-sans text-xs">
                <p className="font-bold">{c.number}</p>
                <p>{c.title}</p>
                <p className="text-ink-3">
                  {getCategory(c.categoryId).name} · {statusLabels[c.status]}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </Base>
  )
}

/* ---------- خريطة المناطق الحساسة (الطقس) ---------- */
export function RiskMap({ areas, className }: { areas: { lat: number; lng: number; count: number; risk: 'low' | 'medium' | 'high'; name: string }[]; className?: string }) {
  const color = { high: '#dc2626', medium: '#d97706', low: '#16a34a' }
  return (
    <Base className={className} zoom={13}>
      {areas.map((a) => (
        <Circle key={a.name} center={[a.lat, a.lng]} radius={250 + a.count * 60} pathOptions={{ color: color[a.risk], weight: 2, fillColor: color[a.risk], fillOpacity: 0.25 }}>
          <Popup>
            <div className="font-sans text-xs">
              <p className="font-bold">{a.name}</p>
              <p>{a.count} بلاغ فيضانات سابقة</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </Base>
  )
}
