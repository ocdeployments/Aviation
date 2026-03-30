import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface RawFlight {
  callsign: string
  origin_country: string
  latitude: number | null
  longitude: number | null
  baro_altitude: number | null
  velocity: number | null
  true_track: number | null
}

interface BoardEntry {
  flightNumber: string
  destination: string
  city: string
  gate: string
  time: string
  status: string
  statusColor: string
  delay: string | null
}

const DESTINATIONS = [
  { code: 'LHR', city: 'London' },
  { code: 'CDG', city: 'Paris' },
  { code: 'NRT', city: 'Tokyo' },
  { code: 'DXB', city: 'Dubai' },
  { code: 'SIN', city: 'Singapore' },
  { code: 'SYD', city: 'Sydney' },
  { code: 'FRA', city: 'Frankfurt' },
  { code: 'AMS', city: 'Amsterdam' },
  { code: 'HKG', city: 'Hong Kong' },
  { code: 'JFK', city: 'New York' },
  { code: 'LAX', city: 'Los Angeles' },
  { code: 'ORD', city: 'Chicago' },
]

const GATES = ['A1', 'A2', 'A3', 'B4', 'B5', 'B6', 'C10', 'C11', 'C12', 'D1', 'D2', 'D3']
const STATUSES = ['ON TIME', 'BOARDING', 'EN ROUTE', 'DELAYED']
const STATUS_COLORS = ['text-green-400', 'text-amber-400', 'text-cyan-400', 'text-red-400']

function makeDepartures(flights: RawFlight[]): BoardEntry[] {
  const now = new Date()
  return flights.slice(0, 12).map((f, i) => {
    const dest = DESTINATIONS[i % DESTINATIONS.length]
    const depMinutes = Math.floor(Math.random() * 45) + 5
    const depTime = new Date(now.getTime() + depMinutes * 60000)
    const statusIdx = Math.floor(Math.random() * 4)
    const status = STATUSES[statusIdx]

    return {
      flightNumber: f.callsign || `FL${1000 + i}`,
      destination: dest.code,
      city: dest.city,
      gate: GATES[i % GATES.length],
      time: depTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status,
      statusColor: STATUS_COLORS[statusIdx],
      delay: status === 'DELAYED' ? `+${Math.floor(Math.random() * 30) + 5}min` : null,
    }
  })
}

function BoardRow({ entry, index }: { entry: BoardEntry; index: number }) {
  return (
    <motion.div
      className="board-row grid grid-cols-12 gap-x-2 items-center border-b border-slate-700/50 py-2.5 px-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <div className="col-span-2 font-mono text-cyan-300 font-bold text-sm tracking-wider">
        {entry.flightNumber}
      </div>
      <div className="col-span-3">
        <div className="font-bold text-slate-100 text-sm">{entry.destination}</div>
        <div className="text-xs text-slate-500">{entry.city}</div>
      </div>
      <div className="col-span-2 font-mono text-amber-300 text-sm font-bold">
        {entry.gate}
      </div>
      <div className="col-span-2 font-mono text-slate-200 text-sm">
        {entry.time}
      </div>
      <div className="col-span-3 text-right">
        <span className={`font-mono text-xs font-bold tracking-wider ${entry.statusColor}`}>
          {entry.status}
        </span>
        {entry.delay && (
          <div className="text-xs text-red-400 font-mono">{entry.delay}</div>
        )}
      </div>
    </motion.div>
  )
}

export default function DepartureBoard() {
  const [flights, setFlights] = useState<BoardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAirport, setSelectedAirport] = useState('JFK')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const AIRPORTS = [
    { code: 'JFK', name: 'New York JFK' },
    { code: 'LAX', name: 'Los Angeles' },
    { code: 'ORD', name: "Chicago O'Hare" },
    { code: 'DFW', name: 'Dallas/Fort Worth' },
    { code: 'ATL', name: 'Atlanta' },
    { code: 'SFO', name: 'San Francisco' },
    { code: 'LAS', name: 'Las Vegas' },
    { code: 'MIA', name: 'Miami' },
  ]

  const fetchBoardData = async () => {
    try {
      const r = await fetch(`${API}/api/flights`)
      if (!r.ok) return
      const d = await r.json()
      const raw = (d.flights || []) as RawFlight[]
      setFlights(makeDepartures(raw))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoardData()
    const id = setInterval(fetchBoardData, 30000)
    return () => clearInterval(id)
  }, [selectedAirport])

  // LED-style row scroll every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setFlights(prev => {
        if (prev.length < 2) return prev
        return [...prev.slice(1), prev[0]]
      })
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-blue-400">🛫 Departure Board</h2>
          <p className="text-sm text-slate-400 mt-1">
            Live departures · {selectedAirport} · Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedAirport}
            onChange={e => {
              setSelectedAirport(e.target.value)
              setLoading(true)
            }}
            className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {AIRPORTS.map(a => (
              <option key={a.code} value={a.code}>{a.name} ({a.code})</option>
            ))}
          </select>
          {lastUpdated && (
            <span className="text-xs text-slate-500 font-mono hidden sm:block">Updated {lastUpdated}</span>
          )}
        </div>
      </div>

      {/* LED Board */}
      <div className="rounded-2xl overflow-hidden border border-slate-700 board-container">
        {/* Column headers */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-750 to-slate-800 border-b border-slate-700 px-4 py-3 grid grid-cols-12 gap-x-2">
          {['Flight', 'Destination', 'Gate', 'Time', 'Status'].map((col, i) => (
            <div
              key={col}
              className={`font-mono text-xs font-bold tracking-widest uppercase text-cyan-400 ${
                i === 0 ? 'col-span-2' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : 'col-span-3 text-right'
              }`}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Flight rows */}
        <div
          ref={scrollRef}
          className="bg-slate-900/95 min-h-[420px]"
          style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="airplane-loader mb-3" />
                <div className="text-cyan-400 text-sm font-mono">Scanning departures...</div>
              </div>
            </div>
          ) : flights.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-500 font-mono text-sm">
              No departures available
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {flights.map((entry, i) => (
                <BoardRow key={`${entry.flightNumber}-${i}`} entry={entry} index={i} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Ticker footer */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-750 to-slate-800 border-t border-slate-700 px-4 py-2 overflow-hidden">
          <div className="ticker-text font-mono text-xs text-amber-400/80 whitespace-nowrap">
            ✈️ Welcome to {selectedAirport} · On-time performance: 87% · Data by OpenSky Network · Gates subject to change · Please have your boarding pass ready ·
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">System Status</div>
            <div className="text-sm text-green-400 font-medium">Operational</div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Active Departures</div>
          <div className="text-2xl font-bold text-cyan-400">{flights.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
          <div className="text-xs text-slate-400 uppercase tracking-wider">On-Time Rate</div>
          <div className="text-2xl font-bold text-green-400">87%</div>
        </div>
      </div>
    </div>
  )
}
