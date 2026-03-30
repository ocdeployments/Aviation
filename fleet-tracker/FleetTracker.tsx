import { useState, useMemo } from 'react'
import { fleetData, totalOrdered, totalDelivered, totalUpcoming, type AirlineFleet, type AircraftCategory } from './data'

const IATA_COLORS: Record<string, string> = {
  UA: 'bg-blue-600',
  AA: 'bg-red-600',
  DL: 'bg-sky-500',
  EK: 'bg-yellow-500 text-yellow-900',
  LH: 'bg-yellow-400 text-yellow-900',
  SQ: 'bg-blue-800',
  QR: 'bg-purple-700',
  BA: 'bg-blue-900',
  AF: 'bg-blue-500',
  JL: 'bg-red-500',
  CX: 'bg-red-700',
  AS: 'bg-teal-600',
}

function AirlineLogo({ airline }: { airline: AirlineFleet }) {
  const color = IATA_COLORS[airline.iata] ?? 'bg-slate-700'
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-lg ${color} flex flex-col items-center justify-center font-bold text-white shadow-md shrink-0`}
        aria-hidden="true"
      >
        <span className="text-sm leading-none">{airline.iata}</span>
        <span className="text-xs leading-none mt-0.5 opacity-80">{airline.country}</span>
      </div>
      <div>
        <div className="font-semibold text-white">{airline.airline}</div>
        <div className="text-xs text-slate-400">{airline.country}</div>
      </div>
    </div>
  )
}

function ProgressBar({ delivered, total }: { delivered: number; total: number }) {
  if (total === 0) return null
  const pct = Math.min(100, Math.round((delivered / total) * 100))
  const color =
    pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 30 ? 'bg-amber-500' : 'bg-orange-500'
  return (
    <div className="mt-1">
      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
        <span>{pct}% delivered</span>
        <span>
          {delivered} / {total}
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function AircraftRow({ ac }: { ac: AircraftCategory }) {
  const undelivered = ac.totalOrdered - ac.delivered
  const hasUpcoming = ac.upcomingDeliveries.length > 0
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-slate-700/50 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-200 leading-tight">{ac.aircraft}</div>
        <div className="text-xs text-slate-500 mt-0.5">
          ${ac.unitCostM}M/unit ·{' '}
          {undelivered > 0 ? (
            <span className="text-amber-400">{undelivered} remaining</span>
          ) : (
            <span className="text-emerald-400">fully delivered</span>
          )}
        </div>
        {hasUpcoming && (
          <div className="flex flex-wrap gap-1 mt-1">
            {ac.upcomingDeliveries.map((d: { year: number; count: number }) => (
              <span
                key={d.year}
                className="inline-flex items-center gap-0.5 text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded"
              >
                <span className="text-blue-400">{d.year}:</span>
                <span className="text-white">{d.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-mono text-white">{ac.delivered}</div>
        <div className="text-xs text-slate-500">/ {ac.totalOrdered}</div>
      </div>
    </div>
  )
}

function AirlineCard({ airline }: { airline: AirlineFleet }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'nb' | 'wb'>('nb')

  const nbTotal = totalOrdered({ ...airline, widebody: [] })
  const nbDelivered = totalDelivered({ ...airline, widebody: [] })
  const wbTotal = totalOrdered({ ...airline, narrowbody: [] })
  const wbDelivered = totalDelivered({ ...airline, narrowbody: [] })

  const grandTotal = totalOrdered(airline)
  const grandDelivered = totalDelivered(airline)
  const grandUpcoming = totalUpcoming(airline)

  const currentTab = tab === 'nb' ? airline.narrowbody : airline.widebody
  const tabTotal = tab === 'nb' ? nbTotal : wbTotal
  const tabDelivered = tab === 'nb' ? nbDelivered : wbDelivered

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
      {/* Card Header */}
      <div className="p-4 flex items-center justify-between gap-4">
        <AirlineLogo airline={airline} />
        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Delivered</div>
            <div className="text-lg font-bold font-mono text-white">{grandDelivered}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">On Order</div>
            <div className="text-lg font-bold font-mono text-blue-400">{grandTotal}</div>
          </div>
          {grandUpcoming > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Upcoming</div>
              <div className="text-lg font-bold font-mono text-amber-400">{grandUpcoming}</div>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pb-3">
        <ProgressBar delivered={grandDelivered} total={grandTotal} />
      </div>

      {/* Tabs — only show if airline has both categories */}
      {airline.narrowbody.length > 0 && airline.widebody.length > 0 && (
        <div className="flex border-t border-slate-700">
          <button
            onClick={() => setTab('nb')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'nb'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-750'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Narrowbody ({nbTotal})
          </button>
          <button
            onClick={() => setTab('wb')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'wb'
                ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-750'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Widebody ({wbTotal})
          </button>
        </div>
      )}

      {/* Tab summary (single category airlines) */}
      {airline.narrowbody.length > 0 &&
        airline.widebody.length === 0 && (
          <div className="px-4 py-2 border-t border-slate-700 flex justify-between text-xs text-slate-400 bg-slate-800/50">
            <span>Narrowbody fleet</span>
            <span>
              {nbDelivered} delivered · {nbTotal - nbDelivered} remaining
            </span>
          </div>
        )}
      {airline.widebody.length > 0 &&
        airline.narrowbody.length === 0 && (
          <div className="px-4 py-2 border-t border-slate-700 flex justify-between text-xs text-slate-400 bg-slate-800/50">
            <span>Widebody fleet</span>
            <span>
              {wbDelivered} delivered · {wbTotal - wbDelivered} remaining
            </span>
          </div>
        )}

      {/* Expand toggle */}
      {currentTab.length > 0 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 border-t border-slate-700/50 flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? (
            <>
              <span>▲ Collapse</span>
            </>
          ) : (
            <>
              <span>▼ Expand {tab === 'nb' ? 'narrowbody' : 'widebody'} breakdown</span>
            </>
          )}
        </button>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-700 px-4 py-2">
          <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
            {tab === 'nb' ? 'Narrowbody' : 'Widebody'} — {tabTotal} ordered, {tabDelivered} delivered
          </div>
          {currentTab.map((ac) => (
            <AircraftRow key={ac.variant} ac={ac} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatPill({
  label,
  value,
  color = 'text-white',
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-bold font-mono ${color}`}>{value.toLocaleString()}</span>
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  )
}

export default function FleetTracker() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | 'narrowbody' | 'widebody'>('all')

  const filtered = useMemo(() => {
    let list = fleetData
    if (category === 'narrowbody') list = list.filter((a) => a.narrowbody.length > 0)
    if (category === 'widebody') list = list.filter((a) => a.widebody.length > 0)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.airline.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q) ||
          a.iata.toLowerCase().includes(q),
      )
    }
    return list
  }, [search, category])

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, a) => ({
        ordered: acc.ordered + totalOrdered(a),
        delivered: acc.delivered + totalDelivered(a),
        upcoming: acc.upcoming + totalUpcoming(a),
      }),
      { ordered: 0, delivered: 0, upcoming: 0 },
    )
  }, [filtered])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">✈️ Fleet Tracker</h1>
        <p className="text-slate-400 text-sm">
          Aircraft orders &amp; deliveries by airline · Data sourced from Boeing/Airbus published reports
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-800 border border-slate-700 rounded-xl p-5">
        <StatPill label="Aircraft Ordered" value={totals.ordered} color="text-blue-400" />
        <StatPill label="Delivered" value={totals.delivered} color="text-emerald-400" />
        <StatPill label="Upcoming Deliveries" value={totals.upcoming} color="text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search airline or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 shrink-0">
          {(['all', 'narrowbody', 'widebody'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                category === cat
                  ? cat === 'all'
                    ? 'bg-blue-600 text-white'
                    : cat === 'narrowbody'
                      ? 'bg-blue-500 text-white'
                      : 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All' : cat === 'narrowbody' ? 'Narrowbody' : 'Widebody'}
            </button>
          ))}
        </div>
      </div>

      {/* Airline grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">🔍</div>
          <div>No airlines match your search</div>
          <button
            onClick={() => {
              setSearch('')
              setCategory('all')
            }}
            className="mt-3 text-sm text-blue-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {filtered.map((airline) => (
            <AirlineCard key={airline.iata} airline={airline} />
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 mt-10">
        Data based on Boeing Commercial Market Outlook &amp; Airbus orders/deliveries reports. Orders include
        options. Aircraft costs are list prices in millions USD.
      </p>
    </div>
  )
}
