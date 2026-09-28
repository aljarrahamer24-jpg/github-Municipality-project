import { useState, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { Modal } from './Misc'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface Props<T> {
  rows: T[]
  columns: Column<T>[]
  getId: (row: T) => string
  searchText: (row: T) => string
  addLabel: string
  form: (row: T | null) => ReactNode
  entity: string
  toolbar?: ReactNode
}

// جدول إدارة عام (CRUD) — جدول على الشاشات الكبيرة وبطاقات على الموبايل + نافذة إضافة/تعديل + تأكيد حذف
export function DataTable<T>({ rows, columns, getId, searchText, addLabel, form, entity, toolbar }: Props<T>) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<T | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<T | null>(null)
  const list = rows.filter((r) => searchText(r).includes(q.trim()))
  const [title, ...rest] = columns

  const actions = (r: T) => (
    <div className="flex items-center justify-end gap-1">
      <button onClick={() => setEditing(r)} className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-muted hover:text-primary-700" aria-label="تعديل">
        <Pencil className="size-4" />
      </button>
      <button onClick={() => setDeleting(r)} className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-error-50 hover:text-error-600" aria-label="حذف">
        <Trash2 className="size-4" />
      </button>
    </div>
  )

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="h-10 w-full rounded-md border border-line-strong ps-10 pe-3 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none" />
          </div>
          {toolbar}
          <Button icon={Plus} onClick={() => setEditing(null)} className="sm:ms-auto">
            {addLabel}
          </Button>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/70 text-xs text-ink-2">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-start font-semibold whitespace-nowrap">{c.header}</th>
                ))}
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((r) => (
                <tr key={getId(r)} className="hover:bg-canvas">
                  {columns.map((c) => (
                    <td key={c.key} className={c.className ?? 'px-4 py-3 text-ink-2'}>{c.render(r)}</td>
                  ))}
                  <td className="px-4 py-2">{actions(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-line md:hidden">
          {list.map((r) => (
            <li key={getId(r)} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">{title.render(r)}</div>
                {actions(r)}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {rest.filter((c) => !c.hideOnMobile).map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-xs text-ink-3">{c.header}</dt>
                    <dd className="mt-0.5 truncate">{c.render(r)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-3 text-sm text-ink-3">عدد السجلات: {list.length}</div>
      </Card>

      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? `تعديل ${entity}` : `إضافة ${entity}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(undefined)}>إلغاء</Button>
            <Button onClick={() => setEditing(undefined)}>حفظ</Button>
          </>
        }
      >
        {editing !== undefined && <div className="space-y-4">{form(editing)}</div>}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`حذف ${entity}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>إلغاء</Button>
            <Button variant="danger" onClick={() => setDeleting(null)}>تأكيد الحذف</Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-2">هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.</p>
      </Modal>
    </>
  )
}
