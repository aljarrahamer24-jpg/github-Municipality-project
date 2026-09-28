import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// لوحة ألوان تصنيفية معتمدة ومفحوصة لعمى الألوان — تُسند بترتيب ثابت لا يتغير
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
// لون السلسلة الواحدة = اللون الأساسي للهوية
export const SINGLE = '#1a7467'

const axis = { stroke: '#7a8784', fontSize: 12, fontFamily: 'IBM Plex Sans Arabic' }
const grid = '#e2e8e6'

function TooltipBox({ active, payload, label, unit = 'بلاغ' }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div dir="rtl" className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-ink-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <b className="text-ink">{p.value}</b> {unit}
        </p>
      ))}
    </div>
  )
}

/* أعمدة أفقية — للتصنيفات ذات الأسماء الطويلة (النوع / المنطقة / القسم) */
export function HBarChart({ data, height = 280, unit, name = 'العدد' }: { data: { name: string; value: number }[]; height?: number; unit?: string; name?: string }) {
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, left: 28, bottom: 4 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={grid} />
          <XAxis type="number" reversed tick={axis} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" orientation="right" width={130} tick={{ ...axis, fill: '#43524f' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#eef2f1' }} content={<TooltipBox unit={unit} />} />
          <Bar dataKey="value" name={name} fill={SINGLE} maxBarSize={22} radius={[4, 0, 0, 4]}>
            <LabelList dataKey="value" position="right" style={{ fill: '#43524f', fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* أعمدة عمودية — لسلسلة واحدة عبر الزمن */
export function ColumnChart({ data, dataKey = 'value', height = 260, unit, name = 'القيمة', domain }: { data: Record<string, string | number>[]; dataKey?: string; height?: number; unit?: string; name?: string; domain?: [number, number] }) {
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...data].reverse()} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={grid} />
          <XAxis dataKey="month" interval={0} tick={axis} axisLine={false} tickLine={false} />
          <YAxis orientation="right" tick={axis} axisLine={false} tickLine={false} width={32} domain={domain} />
          <Tooltip cursor={{ fill: '#eef2f1' }} content={<TooltipBox unit={unit} />} />
          <Bar dataKey={dataKey} name={name} fill={SINGLE} maxBarSize={24} radius={[4, 4, 0, 0]}>
            <LabelList dataKey={dataKey} position="top" style={{ fill: '#43524f', fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* خط زمني بسلسلتين (المستلمة / المغلقة) */
export function TrendChart({ data, height = 280 }: { data: { month: string; received: number; closed: number }[]; height?: number }) {
  const series = [
    { key: 'received', name: 'المستلمة', color: SERIES[0] },
    { key: 'closed', name: 'المغلقة', color: SERIES[2] },
  ]
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-ink-2">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div dir="ltr" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...data].reverse()} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={grid} />
            <XAxis dataKey="month" interval={0} tick={axis} axisLine={false} tickLine={false} />
            <YAxis orientation="right" tick={axis} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<TooltipBox />} cursor={{ stroke: '#cbd5d2' }} />
            {series.map((s) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={0.06} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* خط بسيط لسلسلة واحدة (رضا المواطنين حسب الشهر) */
export function SimpleLine({ data, height = 240, domain = [1, 5], name = 'متوسط التقييم' }: { data: { month: string; value: number }[]; height?: number; domain?: [number, number]; name?: string }) {
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data].reverse()} margin={{ top: 16, right: 4, left: 12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={grid} />
          <XAxis dataKey="month" interval={0} tick={axis} axisLine={false} tickLine={false} />
          <YAxis orientation="right" domain={domain} tick={axis} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<TooltipBox unit="/ 5" />} cursor={{ stroke: '#cbd5d2' }} />
          <Line type="monotone" dataKey="value" name={name} stroke={SINGLE} strokeWidth={2} dot={{ r: 4, fill: SINGLE, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}>
            <LabelList dataKey="value" position="top" style={{ fill: '#43524f', fontSize: 11 }} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
