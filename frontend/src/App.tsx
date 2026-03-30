import { useState, useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Globe from './components/Globe'
import DepartureBoard from './components/DepartureBoard'


const SUPABASE_URL = 'https://stxanozxvkerwfvbruzr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODQzMzMsImV4cCI6MjA5MDQ2MDMzM30.Re9XtQo5SoeqJIOxjXiomDsXXLR19qGQmiXYUAH3PBc'
const OPENSKY_API = `${SUPABASE_URL}/functions/v1/flights`
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Types ────────────────────────────────────────────
interface Flight {
  icao24: string
  callsign: string
  origin_country: string
  latitude: number | null
  longitude: number | null
  baro_altitude: number | null
  on_ground: boolean
  velocity: number | null
  true_track: number | null
}

interface Airport {
  id: number
  ident: string
  type: string
  name: string
  elevation_ft: number | null
  continent: string
  country: string
  region: string
  municipality: string
  latitude: number | null
  longitude: number | null
}

interface Incident {
  airport: string
  date: string
  operator: string
  aircraft: string
  species: string
  damage: string
}

type Tab = 'flights' | 'airports' | 'incidents' | 'globe' | 'departures'

// ─── Page Transition Wrapper ─────────────────────────
function PageWrapper({ children, keyValue }: { children: ReactNode; keyValue: string }) {
  return (
    <motion.div
      key={keyValue}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

// ─── Stat Card with Count-Up ─────────────────────────
function StatCard({ label, value, sub, accent = 'text-cyan-400' }: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      className="bg-slate-800 rounded-xl px-5 py-3 border border-slate-700 stat-glow premium-card gradient-border"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={visible ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4 }}
    >
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
      <motion.div
        className={`text-3xl font-bold ${accent}`}
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {value}
      </motion.div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </motion.div>
  )
}

// ─── Tab Button ───────────────────────────────────────
function TabBtn({ label, active, onClick }: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${active ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {active && (
        <motion.span
          layoutId="activeTab"
          className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      {label}
    </motion.button>
  )
}

// ─── Main App ─────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>('flights')
  const [flights, setFlights] = useState<Flight[]>([])
  const [airports, setAirports] = useState<Airport[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flightSearch, setFlightSearch] = useState('')
  const [airportSearch, setAirportSearch] = useState('')
  const [liveCount, setLiveCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // ─── Live flights via Supabase Edge Function ───────────────────────
  const fetchFlights = async () => {
    const r = await fetch(OPENSKY_API, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    })
    if (!r.ok) throw new Error(`Flights error: ${r.status}`)
    return r.json()
  }

  // ─── Live flights polling ───────────────────────
  useEffect(() => {
    if (tab !== 'flights') return
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const d = await fetchFlights()
        if (!cancelled) {
          setFlights(d.flights || [])
          setLiveCount(d.total || 0)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch flights')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    const pollId = setInterval(async () => {
      try {
        const d = await fetchFlights()
        if (!cancelled) {
          setFlights(d.flights || [])
          setLiveCount(d.total || 0)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Poll failed')
      }
    }, 30000)
    return () => { cancelled = true; clearInterval(pollId) }
  }, [tab])

  const searchFlights = async () => {
    if (!flightSearch) return
    setError(null)
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/flights/search?q=${encodeURIComponent(flightSearch)}`)
      if (!r.ok) throw new Error(`Search failed: ${r.status}`)
      const d = await r.json()
      setFlights(d.results || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const loadAirports = async () => {
    setError(null)
    setLoading(true)
    try {
      const url = airportSearch
        ? `${API}/api/airports?q=${encodeURIComponent(airportSearch)}`
        : `${API}/api/airports?limit=30`
      const r = await fetch(url)
      if (!r.ok) throw new Error(`Airports error: ${r.status}`)
      const d = await r.json()
      setAirports(d.airports || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load airports')
    } finally {
      setLoading(false)
    }
  }

  const loadIncidents = async () => {
    if (tab !== 'incidents') return
    setError(null)
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/incidents`)
      if (!r.ok) throw new Error(`Incidents error: ${r.status}`)
      const d = await r.json()
      setIncidents(d.incidents || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (tab === 'airports') loadAirports() }, [tab, airportSearch])
  useEffect(() => { if (tab === 'incidents') loadIncidents() }, [tab])

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'flights',    label: '🛫 Flights' },
    { id: 'airports',   label: '🛬 Airports' },
    { id: 'incidents',  label: '⚠️ Incidents' },
    { id: 'globe',      label: '🌍 Globe' },
    { id: 'departures', label: '📋 Departures' },
  ]

  return (
    <div className="min-h-screen text-white">
      {/* Particle radar background */}
      <div className="radar-bg" aria-hidden="true" />

      {/* Header */}
      <header className="bg-slate-900/90 border-b border-slate-700/50 sticky top-0 z-20 glass">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold gradient-text tracking-tight">✈️ AviationHub</h1>
              <p className="text-xs text-slate-500 mt-0.5">Free flight tracking · $0 cost · OpenSky Network</p>
            </div>
            <nav className="flex items-center gap-1 flex-wrap">
              {tabs.map(t => (
                <TabBtn key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />
              ))}
              <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block" />
              <a
                href="/Aviation/community/"
                className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
              >
                📝 Community
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >

            {/* ── Globe Tab ────────────────────────── */}
            {tab === 'globe' && (
              <PageWrapper keyValue="globe">
                <Globe />
              </PageWrapper>
            )}

            {/* ── Departure Board Tab ───────────────── */}
            {tab === 'departures' && (
              <PageWrapper keyValue="departures">
                <DepartureBoard />
              </PageWrapper>
            )}

            {/* ── Flights Tab ──────────────────────── */}
            {tab === 'flights' && (
              <PageWrapper keyValue="flights">
                {/* Live Stats */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label="Live Flights Tracked" value={liveCount.toLocaleString()} sub="Updated live" accent="text-cyan-400" />
                  {lastUpdated && <StatCard label="Last Updated" value={lastUpdated} sub="Every 30 seconds" accent="text-blue-400" />}
                  <StatCard label="Data Source" value="OpenSky" sub="25k+ aircraft · Free" accent="text-green-400" />
                </div>

                {/* Search */}
                <div className="mb-6 flex gap-3">
                  <input
                    value={flightSearch}
                    onChange={e => setFlightSearch(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && searchFlights()}
                    placeholder="Search callsign (e.g. UAL123)..."
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors premium-card"
                  />
                  <motion.button
                    onClick={searchFlights}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium transition-colors premium-card"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Search
                  </motion.button>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-6 bg-red-900/40 border border-red-700/50 rounded-xl px-5 py-3 flex items-center gap-3">
                    <div className="radar-sweep flex-shrink-0" />
                    <div className="text-red-300 text-sm flex-1">{error}</div>
                    <button onClick={() => setError(null)} className="text-red-400 text-sm hover:text-red-300 ml-auto">✕</button>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="mb-6 flex items-center justify-center py-8 gap-3">
                    <div className="airplane-loader" />
                    <span className="text-slate-400 text-sm font-mono">Acquiring satellite feed...</span>
                  </div>
                )}

                {/* Flights Table */}
                {!loading && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden premium-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-700/80 text-slate-300">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold">Callsign</th>
                            <th className="text-left px-4 py-3 font-semibold">Country</th>
                            <th className="text-right px-4 py-3 font-semibold">Alt (ft)</th>
                            <th className="text-right px-4 py-3 font-semibold">Speed (km/h)</th>
                            <th className="text-right px-4 py-3 font-semibold">Heading</th>
                            <th className="text-center px-4 py-3 font-semibold">Ground</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {flights.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                No flights found. Try a different search.
                              </td>
                            </tr>
                          )}
                          {flights.map((f, i) => (
                            <motion.tr
                              key={f.icao24 ?? i}
                              className="hover:bg-slate-700/40 transition-colors"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02 }}
                            >
                              <td className="px-4 py-3 font-mono font-bold text-cyan-300">{f.callsign || '—'}</td>
                              <td className="px-4 py-3 text-slate-300">{f.origin_country}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-300">
                                {f.baro_altitude != null ? f.baro_altitude.toLocaleString() : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-300">{f.velocity ?? '—'}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-300">{f.true_track ?? '—'}°</td>
                              <td className="px-4 py-3 text-center">
                                {f.on_ground
                                  ? <span className="text-red-400 font-bold">✕</span>
                                  : <span className="text-slate-600">—</span>}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </PageWrapper>
            )}

            {/* ── Airports Tab ─────────────────────── */}
            {tab === 'airports' && (
              <PageWrapper keyValue="airports">
                <div className="mb-6 flex gap-3">
                  <input
                    value={airportSearch}
                    onChange={e => setAirportSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadAirports()}
                    placeholder="Search airports..."
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors premium-card"
                  />
                  <motion.button
                    onClick={loadAirports}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium transition-colors premium-card"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Search
                  </motion.button>
                </div>

                {error && (
                  <div className="mb-6 bg-red-900/40 border border-red-700/50 rounded-xl px-5 py-3 flex items-center gap-3">
                    <div className="radar-sweep flex-shrink-0" />
                    <div className="text-red-300 text-sm flex-1">{error}</div>
                    <button onClick={() => setError(null)} className="text-red-400 text-sm hover:text-red-300 ml-auto">✕</button>
                  </div>
                )}

                {loading && (
                  <div className="mb-6 flex items-center justify-center py-8 gap-3">
                    <div className="airplane-loader" />
                    <span className="text-slate-400 text-sm font-mono">Scanning database...</span>
                  </div>
                )}

                {!loading && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden premium-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-700/80 text-slate-300">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold">Ident</th>
                            <th className="text-left px-4 py-3 font-semibold">Type</th>
                            <th className="text-left px-4 py-3 font-semibold">Name</th>
                            <th className="text-left px-4 py-3 font-semibold">Location</th>
                            <th className="text-right px-4 py-3 font-semibold">Elevation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {airports.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No airports found</td>
                            </tr>
                          )}
                          {airports.map((a) => (
                            <motion.tr
                              key={a.id}
                              className="hover:bg-slate-700/40 transition-colors"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <td className="px-4 py-3 font-mono font-bold text-green-300">{a.ident}</td>
                              <td className="px-4 py-3">
                                <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300">{a.type}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-200">{a.name}</td>
                              <td className="px-4 py-3 text-slate-400">{a.municipality}, {a.country}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-300">{a.elevation_ft ?? '—'} ft</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </PageWrapper>
            )}

            {/* ── Incidents Tab ────────────────────── */}
            {tab === 'incidents' && (
              <PageWrapper keyValue="incidents">
                {loading && (
                  <div className="mb-6 flex items-center justify-center py-8 gap-3">
                    <div className="airplane-loader" />
                    <span className="text-slate-400 text-sm font-mono">Loading FAA data...</span>
                  </div>
                )}

                {!loading && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden premium-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-700/80 text-slate-300">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold">Airport</th>
                            <th className="text-left px-4 py-3 font-semibold">Date</th>
                            <th className="text-left px-4 py-3 font-semibold">Operator</th>
                            <th className="text-left px-4 py-3 font-semibold">Aircraft</th>
                            <th className="text-left px-4 py-3 font-semibold">Species</th>
                            <th className="text-center px-4 py-3 font-semibold">Damage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {incidents.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No incidents found</td>
                            </tr>
                          )}
                          {incidents.map((inc, i) => (
                            <motion.tr
                              key={i}
                              className="hover:bg-slate-700/40 transition-colors"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02 }}
                            >
                              <td className="px-4 py-3 text-slate-200">{inc.airport}</td>
                              <td className="px-4 py-3 font-mono text-slate-400">{inc.date}</td>
                              <td className="px-4 py-3 text-slate-300">{inc.operator}</td>
                              <td className="px-4 py-3 text-slate-300">{inc.aircraft}</td>
                              <td className="px-4 py-3 text-yellow-300">{inc.species}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  inc.damage?.includes('Destroyed')
                                    ? 'bg-red-900/60 text-red-300'
                                    : 'bg-yellow-900/40 text-yellow-300'
                                }`}>
                                  {inc.damage}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </PageWrapper>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Data Sources Footer ─────────────── */}
        <motion.div
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { label: 'Flight Data', title: 'OpenSky Network', note: '✓ Free · No API key · 25k+ aircraft', color: 'cyan' },
            { label: 'Airport Data', title: 'Supabase DB', note: '✓ Free tier · Ourania DB', color: 'green' },
            { label: 'Incident Data', title: 'FAA Bird Strike DB', note: '✓ Free · Public dataset', color: 'amber' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="bg-slate-800 rounded-xl p-4 border border-slate-700 gradient-border premium-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-sm text-white font-semibold">{item.title}</div>
              <div className={`text-xs mt-1 text-${item.color}-400`}>{item.note}</div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
