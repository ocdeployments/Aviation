import { useState, useEffect } from 'react'
import GlobalHeatmap from './components/GlobalHeatmap'
import TexasIncidents from './components/TexasIncidents'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

type Tab = 'flights' | 'airports' | 'incidents' | 'global-map' | 'texas'

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

  // Live flights polling
  useEffect(() => {
    if (tab !== 'flights') return
    let cancelled = false
    ;(async () => {
      setError(null)
      setLoading(true)
      try {
        const r = await fetch(`${API}/api/flights`)
        if (!r.ok) throw new Error(`Flights API error: ${r.status}`)
        const d = await r.json()
        if (!cancelled) {
          setFlights(d.flights || [])
          setLiveCount(d.total || 0)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (err: unknown) { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch flights') }
      finally { if (!cancelled) setLoading(false) }
    })()
    const id = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/flights`)
        if (!r.ok) throw new Error(`Poll error: ${r.status}`)
        const d = await r.json()
        if (!cancelled) {
          setFlights(d.flights || [])
          setLiveCount(d.total || 0)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (err: unknown) { if (!cancelled) setError(err instanceof Error ? err.message : 'Poll failed') }
    }, 30000)
    return () => { cancelled = true; clearInterval(id) }
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
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Search failed') }
    finally { setLoading(false) }
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
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load airports') }
    finally { setLoading(false) }
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
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load incidents') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (tab === 'airports') loadAirports() }, [tab, airportSearch])
  useEffect(() => { if (tab === 'incidents') loadIncidents() }, [tab])

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'flights', label: '🛫 Flights' },
    { id: 'airports', label: '🛬 Airports' },
    { id: 'incidents', label: '⚠️ Incidents' },
    { id: 'global-map', label: '🌍 Global Map' },
    { id: 'texas', label: '🤠 Texas' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">✈️ AviationHub</h1>
            <p className="text-xs text-slate-400">Free flight tracking · $0 cost</p>
          </div>
          <nav className="flex gap-1 flex-wrap">
            {tabs.map(t => (
              <button key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Global Map tab */}
        {tab === 'global-map' && <GlobalHeatmap />}

        {/* Texas tab */}
        {tab === 'texas' && <TexasIncidents />}

        {/* Live Stats Bar */}
        {tab === 'flights' && (
          <div className="mb-6 flex items-center gap-4 flex-wrap">
            <div className="bg-slate-800 rounded-xl px-5 py-3 border border-slate-700">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Live Flights Tracked</div>
              <div className="text-3xl font-bold text-blue-400">{liveCount.toLocaleString()}</div>
            </div>
            {lastUpdated && (
              <div className="bg-slate-800 rounded-xl px-5 py-3 border border-slate-700">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Last Updated</div>
                <div className="text-lg font-mono text-slate-300">{lastUpdated}</div>
              </div>
            )}
            <div className="bg-slate-800 rounded-xl px-5 py-3 border border-slate-700">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Data Source</div>
              <div className="text-lg text-green-400">OpenSky Network</div>
            </div>
          </div>
        )}

        {/* Search */}
        {tab === 'flights' && (
          <div className="mb-6 flex gap-3">
            <input
              value={flightSearch}
              onChange={e => setFlightSearch(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && searchFlights()}
              placeholder="Search callsign (e.g. UAL123)..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button onClick={searchFlights} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">Search</button>
          </div>
        )}

        {tab === 'airports' && (
          <div className="mb-6 flex gap-3">
            <input
              value={airportSearch}
              onChange={e => setAirportSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadAirports()}
              placeholder="Search airports..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button onClick={loadAirports} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">Search</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-xl px-5 py-3 text-red-300 text-sm">
            <strong>Error:</strong> {error} <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="mb-6 flex items-center justify-center py-8 gap-3">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400 text-sm">Loading...</span>
          </div>
        )}

        {/* Flights Table */}
        {!loading && tab === 'flights' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 text-slate-300">
                  <tr>
                    <th className="text-left px-4 py-3">Callsign</th>
                    <th className="text-left px-4 py-3">Country</th>
                    <th className="text-right px-4 py-3">Alt (ft)</th>
                    <th className="text-right px-4 py-3">Speed (km/h)</th>
                    <th className="text-right px-4 py-3">Heading</th>
                    <th className="text-center px-4 py-3">Ground?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {flights.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No flights found</td></tr>}
                  {flights.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-750">
                      <td className="px-4 py-3 font-mono font-bold text-blue-300">{f.callsign}</td>
                      <td className="px-4 py-3 text-slate-300">{f.origin_country}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{f.baro_altitude?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{f.velocity ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{f.true_track ?? '—'}°</td>
                      <td className="px-4 py-3 text-center">{f.on_ground ? '✕' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Airports Table */}
        {!loading && tab === 'airports' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 text-slate-300">
                  <tr>
                    <th className="text-left px-4 py-3">Ident</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-right px-4 py-3">Elevation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {airports.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No airports found</td></tr>}
                  {airports.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-750">
                      <td className="px-4 py-3 font-mono font-bold text-green-300">{a.ident}</td>
                      <td className="px-4 py-3"><span className="bg-slate-700 px-2 py-0.5 rounded text-xs">{a.type}</span></td>
                      <td className="px-4 py-3 text-slate-200">{a.name}</td>
                      <td className="px-4 py-3 text-slate-400">{a.municipality}, {a.country}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{a.elevation_ft ?? '—'} ft</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Incidents */}
        {!loading && tab === 'incidents' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 text-slate-300">
                  <tr>
                    <th className="text-left px-4 py-3">Airport</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Operator</th>
                    <th className="text-left px-4 py-3">Aircraft</th>
                    <th className="text-left px-4 py-3">Species</th>
                    <th className="text-center px-4 py-3">Damage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {incidents.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No incidents found</td></tr>}
                  {incidents.map((inc, i) => (
                    <tr key={i} className="hover:bg-slate-750">
                      <td className="px-4 py-3 text-slate-200">{inc.airport}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{inc.date}</td>
                      <td className="px-4 py-3 text-slate-300">{inc.operator}</td>
                      <td className="px-4 py-3 text-slate-300">{inc.aircraft}</td>
                      <td className="px-4 py-3 text-yellow-300">{inc.species}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs ${inc.damage?.includes('Destroyed') ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{inc.damage}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Data Sources */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Flight Data</div>
            <div className="text-sm text-white font-medium">OpenSky Network</div>
            <div className="text-xs text-green-400 mt-1">✓ Free · No API key · 25k+ aircraft</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Airport Data</div>
            <div className="text-sm text-white font-medium">Supabase DB</div>
            <div className="text-xs text-green-400 mt-1">✓ Free tier · Ourania DB</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Incident Data</div>
            <div className="text-sm text-white font-medium">FAA Bird Strike DB</div>
            <div className="text-xs text-green-400 mt-1">✓ Free · Public dataset</div>
          </div>
        </div>
      </main>
    </div>
  )
}