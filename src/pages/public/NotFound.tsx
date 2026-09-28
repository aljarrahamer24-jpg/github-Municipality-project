import { Home } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-7xl font-bold text-primary-700">404</p>
        <h1 className="mt-4 text-2xl font-bold">الصفحة غير موجودة</h1>
        <p className="mt-2 text-ink-2">ربما تم نقل الصفحة أو أن الرابط غير صحيح.</p>
        <Button to="/" icon={Home} className="mt-6">العودة للرئيسية</Button>
      </div>
    </div>
  )
}
