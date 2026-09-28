import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '../../lib/utils'

// منطقة رفع الصور — تعرض معاينات محلية فقط (بدون رفع فعلي في مرحلة التصميم)
export function FileUpload({ max = 5, label = 'اسحب الصور هنا أو اضغط للاختيار', compact }: { max?: number; label?: string; compact?: boolean }) {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const add = (list: FileList | null) => {
    if (!list) return
    const next = Array.from(list)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))
    setFiles((prev) => [...prev, ...next].slice(0, max))
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          add(e.dataTransfer.files)
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors',
          compact ? 'gap-1 px-4 py-5' : 'gap-2 px-4 py-8',
          drag ? 'border-primary-500 bg-primary-50' : 'border-line-strong bg-canvas hover:border-primary-400 hover:bg-primary-50/50',
        )}
      >
        <span className="grid size-11 place-items-center rounded-full bg-primary-100 text-primary-700">
          <ImagePlus className="size-5" />
        </span>
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-ink-3">PNG أو JPG — حتى {max} صور، بحد أقصى 5MB للصورة</span>
      </button>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {files.map((f, i) => (
            <div key={f.url} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
              <img src={f.url} alt={f.name} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
                aria-label="حذف الصورة"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
