import { useState } from 'react'
import { Lock, Send } from 'lucide-react'
import type { Comment } from '../../data/types'
import { cn, formatDateTime } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Form'
import { Avatar } from '../ui/Misc'

// محادثة البلاغ — المواطن لا يرى الملاحظات الداخلية
export function Comments({ comments, viewer, allowInternal }: { comments: Comment[]; viewer: 'citizen' | 'staff'; allowInternal?: boolean }) {
  const [text, setText] = useState('')
  const [internal, setInternal] = useState(false)
  const visible = viewer === 'citizen' ? comments.filter((c) => !c.internal) : comments
  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {visible.map((c) => {
          const mine = viewer === 'citizen' ? c.role === 'citizen' : c.role !== 'citizen'
          return (
            <li key={c.id} className={cn('flex gap-3', mine && 'flex-row-reverse')}>
              <Avatar name={c.author} size="sm" />
              <div className={cn('max-w-[85%] space-y-1', mine && 'text-end')}>
                <div className={cn('flex flex-wrap items-center gap-2 text-xs text-ink-3', mine && 'justify-end')}>
                  <span className="font-semibold text-ink-2">{c.author}</span>
                  {c.internal && (
                    <Badge tone="gold" icon={Lock}>
                      ملاحظة داخلية
                    </Badge>
                  )}
                  <span>{formatDateTime(c.at)}</span>
                </div>
                <p
                  className={cn(
                    'inline-block rounded-lg px-3.5 py-2.5 text-start text-sm leading-relaxed',
                    c.internal ? 'border border-dashed border-secondary-300 bg-secondary-50' : mine ? 'bg-primary-700 text-white' : 'bg-muted text-ink',
                  )}
                >
                  {c.body}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="rounded-lg border border-line bg-canvas p-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={internal ? 'اكتب ملاحظة داخلية (لا تظهر للمواطن)...' : 'اكتب تعليقك...'} className="min-h-20 bg-surface" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {allowInternal ? (
            <label className="inline-flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="size-4 accent-secondary-600" />
              ملاحظة داخلية
            </label>
          ) : (
            <span />
          )}
          <Button size="sm" icon={Send} disabled={!text.trim()} onClick={() => setText('')}>
            إرسال
          </Button>
        </div>
      </div>
    </div>
  )
}
