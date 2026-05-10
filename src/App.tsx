import { useState, useEffect, useMemo } from 'react'
import {
  IconDeviceLaptop,
  IconRefresh,
  IconSearch,
  IconLoader2,
  IconAlertCircle,
  IconPackage,
  IconChartPie,
  IconX,
  IconFilter,
  IconFilterOff,
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

/* ── Chart colors ─────────────────────────────────────────── */
const CHART_COLORS = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
]

/* ── Donut chart (pure SVG) ───────────────────────────────── */
function CategoryDonut({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return null
  const R = 60, CX = 80, CY = 80, C = 2 * Math.PI * R
  let offset = 0

  return (
    <svg viewBox="0 0 160 160" className="w-48 h-48 mx-auto">
      {data.map((d) => {
        const pct = d.count / total
        const dash = pct * C
        const gap = C - dash
        const cur = offset
        offset += dash
        return (
          <circle
            key={d.label}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={d.color}
            strokeWidth={24}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-cur}
            className="transition-all duration-500"
          />
        )
      })}
      <text x={CX} y={CY - 6} textAnchor="middle" className="fill-gray-800 text-2xl font-bold">{total}</text>
      <text x={CX} y={CY + 14} textAnchor="middle" className="fill-gray-400 text-[11px]">פריטים</text>
    </svg>
  )
}

/* ── Side Drawer ──────────────────────────────────────────── */
function CategoryDrawer({
  open,
  onClose,
  items,
}: {
  open: boolean
  onClose: () => void
  items: EquipmentItem[]
}) {
  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((it) => {
      const cat = it.category ?? 'ללא קטגוריה'
      map.set(cat, (map.get(cat) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], i) => ({ label, count, color: CHART_COLORS[i % CHART_COLORS.length] }))
  }, [items])

  const statusData = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((it) => {
      const st = it.status ?? 'לא ידוע'
      map.set(st, (map.get(st) ?? 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [items])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[340px] sm:w-[400px] bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-out overflow-y-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}
        dir="rtl"
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconChartPie size={20} className="text-indigo-500" />
            <h2 className="font-bold text-gray-900">פילוח ציוד</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <IconX size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Donut chart */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">לפי קטגוריה</h3>
            <CategoryDonut data={chartData} />
            {/* Legend */}
            <div className="mt-4 space-y-2">
              {chartData.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-700 truncate">{d.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900 shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">לפי סטטוס</h3>
            <div className="space-y-2">
              {statusData.map(([st, count]) => {
                const pct = items.length > 0 ? Math.round((count / items.length) * 100) : 0
                const cfg = getStatusCfg(st)
                return (
                  <div key={st}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <StatusBadge status={st} />
                      <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cfg.dot}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  // Unique values for filter dropdowns
  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(), [items])
  const statuses = useMemo(() => [...new Set(items.map((i) => i.status).filter(Boolean))].sort(), [items])
  const locations = useMemo(() => [...new Set(items.map((i) => i.location).filter(Boolean))].sort(), [items])

  const hasActiveFilters = categoryFilter || statusFilter || locationFilter

  const filtered = items.filter((item) => {
    if (categoryFilter && item.category !== categoryFilter) return false
    if (statusFilter && item.status !== statusFilter) return false
    if (locationFilter && item.location !== locationFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return [item.name, item.category, item.description, item.serial_number, item.status, item.location, item.assigned_to]
      .some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
  })

  return (
    <div dir="rtl" className="min-h-screen font-sans text-gray-900 flex flex-col relative">
      {/* Background radial gradient for premium look overriding the grid subtly */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-white/0 to-transparent"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm sticky top-0 z-20">
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

      {/* Drawer */}
      <CategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={items} />

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <IconSearch size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="חיפוש חופשי..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-8 pl-3 py-2 border border-gray-200 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm bg-white px-2.5 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition cursor-pointer"
            >
              <option value="">כל הקטגוריות</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm bg-white px-2.5 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition cursor-pointer"
            >
              <option value="">כל הסטטוסים</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Location filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm bg-white px-2.5 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition cursor-pointer"
            >
              <option value="">כל המיקומים</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => { setCategoryFilter(''); setStatusFilter(''); setLocationFilter('') }}
                className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
              >
                <IconFilterOff size={15} />
                <span>נקה פילטרים</span>
              </button>
            )}
          </div>

          {/* Spacer + Chart button + Count */}
          <div className="flex items-center gap-3 sm:mr-auto">
            <button
              onClick={() => setDrawerOpen(true)}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              <IconChartPie size={16} />
              <span className="hidden sm:inline">פילוח</span>
            </button>
            {loadState === 'loaded' && (
              <span className="text-sm text-gray-500">
                {filtered.length} פריט{filtered.length !== 1 ? 'ים' : ''}
                {hasActiveFilters && <span className="text-indigo-500 mr-1">
                  <IconFilter size={13} className="inline -mt-0.5" /> מסונן
                </span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 flex-1 w-full relative z-10">

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

      {/* Footer */}
      <footer className="w-full bg-white/60 backdrop-blur-md border-t border-gray-200/60 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500">
              <IconDeviceLaptop size={20} className="text-blue-500" />
              <span className="text-sm font-medium">מערכת ניהול ציוד טכני © {new Date().getFullYear()}</span>
            </div>
            <div className="text-xs text-gray-400">
              פותח באהבה עבור צוות ה-IT
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
