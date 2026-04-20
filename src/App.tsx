import { useState, useEffect } from 'react'
import {
  IconDeviceLaptop,
  IconRefresh,
  IconSearch,
  IconLoader2,
  IconAlertCircle,
  IconPackage,
} from '@tabler/icons-react'
import { TestcallfromcustomconnectorService } from './generated/services/TestcallfromcustomconnectorService'
import './App.css'

const APP_VERSION = 'v1.1.0'

interface EquipmentItem {
  id?: number
  name?: string
  category?: string
  description?: string
  quantity?: number
  serial_number?: string
  status?: string
  location?: string
  assigned_to?: string
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

function getStatusCfg(status: string): { badge: string; dot: string } {
  if (status === 'פעיל' || status === 'זמין' || status === 'available') {
    return { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' }
  }
  if (status === 'לא פעיל' || status === 'תפוס') {
    return { badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' }
  }
  if (status === 'תקלה' || status === 'תקול' || status === 'fault') {
    return { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
  }
  return { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-gray-300">—</span>
  const cfg = getStatusCfg(status)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  )
}

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return <span className="text-gray-300">—</span>
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium whitespace-nowrap">
      {category}
    </span>
  )
}

function EquipmentCard({ item, idx }: { item: EquipmentItem; idx: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 shrink-0">#{item.id ?? idx + 1}</span>
            <h3 className="font-semibold text-gray-900 truncate">{item.name ?? '—'}</h3>
          </div>
          <CategoryBadge category={item.category} />
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.description && (
        <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm border-t border-gray-50 pt-3">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">מספר סריאלי</div>
          <div className="font-mono text-xs text-gray-700">{item.serial_number ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">כמות</div>
          <div className="text-gray-800 font-medium">{item.quantity ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">מיקום</div>
          <div className="text-gray-700">{item.location ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">משויך ל</div>
          <div className="text-gray-700">{item.assigned_to ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState('')

  async function fetchEquipment() {
    setLoadState('loading')
    setError('')
    try {
      const result = await TestcallfromcustomconnectorService.Run({})
      const raw = result.data?.response
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          const list: EquipmentItem[] = Array.isArray(parsed)
            ? (parsed as EquipmentItem[])
            : [parsed as EquipmentItem]
          setItems(list)
        } catch {
          setItems([{ name: raw }])
        }
      } else {
        setItems([])
      }
      setLoadState('loaded')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים')
      setLoadState('error')
    }
  }

  useEffect(() => { fetchEquipment() }, [])

  const filtered = items.filter((item) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [item.name, item.category, item.description, item.serial_number, item.status, item.location, item.assigned_to]
      .some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
  })

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f6fa] font-sans text-gray-900">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <IconDeviceLaptop size={26} className="text-blue-600 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                מערכת ציוד טכני
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">ציוד עבודה זמין לטכנאי מחשבים</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchEquipment}
              disabled={loadState === 'loading'}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {loadState === 'loading'
                ? <IconLoader2 size={15} className="animate-spin" />
                : <IconRefresh size={15} />}
              <span className="hidden sm:inline">{loadState === 'loading' ? 'טוען...' : 'רענן'}</span>
            </button>
            <span className="text-xs text-gray-300 hidden md:block">{APP_VERSION}</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="חיפוש ציוד..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-8 pl-3 py-2 border border-gray-200 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
          />
        </div>
        {loadState === 'loaded' && (
          <span className="text-sm text-gray-500">
            {filtered.length} פריט{filtered.length !== 1 ? 'ים' : ''}
          </span>
        )}
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">

        {loadState === 'loading' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 flex flex-col items-center gap-3 text-gray-400">
            <IconLoader2 size={38} className="animate-spin text-blue-500" />
            <p className="text-sm">טוען ציוד מהמערכת...</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <IconAlertCircle size={30} className="text-red-400 shrink-0 self-center" />
            <div className="flex-1 text-center sm:text-right">
              <p className="font-semibold text-red-800">שגיאה בטעינה</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={fetchEquipment}
              className="self-center sm:self-auto bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              נסה שוב
            </button>
          </div>
        )}

        {loadState === 'loaded' && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 flex flex-col items-center gap-3 text-gray-400">
            <IconPackage size={42} className="text-gray-200" />
            <p className="text-sm">{search ? 'לא נמצאו תוצאות לחיפוש' : 'אין ציוד זמין'}</p>
          </div>
        )}

        {loadState === 'loaded' && filtered.length > 0 && (
          <>
            {/* Mobile / tablet: card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:hidden">
              {filtered.map((item, idx) => (
                <EquipmentCard key={item.id ?? idx} item={item} idx={idx} />
              ))}
            </div>

            {/* Desktop: full table */}
            <div className="hidden xl:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-right font-semibold w-10">#</th>
                      <th className="px-4 py-3 text-right font-semibold">שם הפריט</th>
                      <th className="px-4 py-3 text-right font-semibold">קטגוריה</th>
                      <th className="px-4 py-3 text-right font-semibold">תיאור</th>
                      <th className="px-4 py-3 text-center font-semibold w-16">כמות</th>
                      <th className="px-4 py-3 text-right font-semibold">מספר סריאלי</th>
                      <th className="px-4 py-3 text-right font-semibold">סטטוס</th>
                      <th className="px-4 py-3 text-right font-semibold">מיקום</th>
                      <th className="px-4 py-3 text-right font-semibold">משויך ל</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((item, idx) => (
                      <tr key={item.id ?? idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{item.id ?? idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{item.name ?? '—'}</td>
                        <td className="px-4 py-3"><CategoryBadge category={item.category} /></td>
                        <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{item.description ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-gray-700 font-medium">{item.quantity ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{item.serial_number ?? '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{item.location ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{item.assigned_to ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
