// Airport Detail — click an airport → full info + live data
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

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

interface NearbyFlight {
  icao24: string
  callsign: string
  origin_country: string
  latitude: number | null
  longitude: number | null
  baro_altitude: number | null
  velocity: number | null
  true_track: number | null
}

interface Weather {
  temp: number
  wind_speed: number
  wind_dir: string
  condition: string
  humidity: number
  visibility: number
}

const SUPABASE_URL = 'https://stxanozxvkerwfvbruzr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODQzMzMsImV4cCI6MjA5MDQ2MDMzM30.Re9XtQo5SoeqJIOxjXiomDsXXLR19qGQmiXYUAH3PBc'
const OPENSKY_API = `${SUPABASE_URL}/functions/v1/flights`

// Wind direction label
function windDir(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

// Weather condition from WMO code
function wmoCondition(code: number): string {
  const map: Record<number, string> = {
    0: '☀️ Clear', 1: '🌤️ Mainly Clear', 2: '⛅ Partly Cloudy', 3: '☁️ Overcast',
    45: '🌫️ Fog', 48: '🌫️ Rime Fog', 51: '🌦️ Light Drizzle', 53: '🌦️ Drizzle',
    55: '🌦️ Heavy Drizzle', 61: '🌧️ Light Rain', 63: '🌧️ Rain', 65: '🌧️ Heavy Rain',
    71: '🌨️ Light Snow', 73: '🌨️ Snow', 75: '🌨️ Heavy Snow',
    80: '🌦️ Rain Showers', 81: '🌦️ Moderate Showers', 82: '🌧️ Violent Showers',
    95: '⛈️ Thunderstorm', 96: '⛈️ Thunderstorm + Hail',
  }
  return map[code] ?? '❓ Unknown'
}

// Format ICAO airline code from callsign
function airlineFromCallsign(callsign: string | null): string {
  if (!callsign) return '—'
  return callsign.trim().slice(0, 3)
}

// Unique airlines from flight list
function extractAirlines(flights: NearbyFlight[]): string[] {
  const set = new Set<string>()
  flights.forEach(f => {
    const code = airlineFromCallsign(f.callsign)
    if (code.length === 3 && /^[A-Z]+$/.test(code)) set.add(code)
  })
  return Array.from(set).sort()
}

export default function AirportDetail({ airport, onClose }: { airport: Airport; onClose: () => void }) {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [nearbyFlights, setNearbyFlights] = useState<NearbyFlight[]>([])
  const [flightsLoading, setFlightsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // ─── Weather from Open-Meteo (free, no API key) ───────────
  useEffect(() => {
    if (!airport.latitude || !airport.longitude) {
      setWeatherLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${airport.latitude}` +
          `&longitude=${airport.longitude}` +
          `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,visibility` +
          `&wind_speed_unit=kn&visibility_unit=m&timezone=auto`
        )
        if (!r.ok) throw new Error('Weather fetch failed')
        const d = await r.json()
        if (cancelled) return
        const cur = d.current
        setWeather({
          temp: Math.round(cur.temperature_2m),
          wind_speed: Math.round(cur.wind_speed_10m),
          wind_dir: windDir(cur.wind_direction_10m),
          condition: wmoCondition(cur.weather_code),
          humidity: cur.relative_humidity_2m,
          visibility: Math.round((cur.visibility ?? 10000) / 1000),
        })
      } catch {
        if (!cancelled) setWeather(null)
      } finally {
        if (!cancelled) setWeatherLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [airport.latitude, airport.longitude])

  // ─── Nearby flights from OpenSky (via Supabase edge function) ───
  const fetchNearbyFlights = useCallback(async () => {
    if (!airport.latitude || !airport.longitude) return
    try {
      const lat = Number(airport.latitude)
      const lon = Number(airport.longitude)
      const distKm = 50 // 50km radius
      const r = await fetch(
        `${OPENSKY_API}?lat=${lat}&lon=${lon}&dist_km=${distKm}`,
        { headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY } }
      )
      if (!r.ok) return
      const d = await r.json()
      const flights: NearbyFlight[] = (d.flights || [])
        .filter((f: NearbyFlight) => f.latitude != null && f.longitude != null)
        .slice(0, 20)
      setNearbyFlights(flights)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch { /* silent */ } finally { setFlightsLoading(false) }
  }, [airport.latitude, airport.longitude])

  useEffect(() => {
    fetchNearbyFlights()
    const id = setInterval(fetchNearbyFlights, 30000)
    return () => clearInterval(id)
  }, [fetchNearbyFlights])

  const airlines = extractAirlines(nearbyFlights)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-800 px-6 py-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-mono bg-blue-800 text-blue-200 px-2 py-0.5 rounded">
              {airport.ident}
            </span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
              {airport.country}
            </span>
            <span className="text-xs text-slate-400">{airport.type}</span>
          </div>
          <h2 className="text-xl font-bold text-white">{airport.name}</h2>
          <p className="text-slate-300 text-sm">
            {airport.municipality}{airport.region ? `, ${airport.region}` : ''}
            {airport.elevation_ft != null ? ` · Elevation ${airport.elevation_ft.toLocaleString()} ft` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-2xl leading-none px-2 transition"
        >
          ×
        </button>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Weather + Actions row ──────────────────────── */}
        <div className="flex flex-wrap gap-4">

          {/* Weather card */}
          <div className="flex-1 min-w-[200px] bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Current Weather</h3>
            {weatherLoading ? (
              <div className="h-16 flex items-center text-slate-500 text-sm">Loading weather...</div>
            ) : weather ? (
              <div className="space-y-1">
                <div className="text-3xl font-light text-white">{weather.temp}°C</div>
                <div className="text-sm text-slate-300">{weather.condition}</div>
                <div className="flex gap-4 text-xs text-slate-400 mt-2">
                  <span>💨 {weather.wind_speed} kt {weather.wind_dir}</span>
                  <span>💧 {weather.humidity}%</span>
                  <span>👁 {weather.visibility} km</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Weather unavailable</div>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex-1 min-w-[200px] bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Activity</h3>
            {flightsLoading ? (
              <div className="h-16 flex items-center text-slate-500 text-sm">Scanning airspace...</div>
            ) : (
              <div className="space-y-1">
                <div className="text-3xl font-light text-white">{nearbyFlights.length}</div>
                <div className="text-sm text-slate-300">aircraft within 50 km</div>
                {airlines.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {airlines.slice(0, 6).map(a => (
                      <span key={a} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">{a}</span>
                    ))}
                  </div>
                )}
                {lastUpdated && <p className="text-xs text-slate-600 mt-1">Updated {lastUpdated}</p>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-1 min-w-[200px] bg-slate-900 rounded-lg p-4 border border-slate-700 flex flex-col justify-center gap-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Book a Flight</h3>
            <a
              href={`https://www.skyscanner.com/transport/flights/?origin=${airport.ident}&destination=ANY&adultsv2=1&cabinclass=economy&preferDirects=false&ref=home`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
            >
              Search flights from {airport.ident}
            </a>
            <a
              href={`https://www.google.com/maps?q=${airport.latitude},${airport.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium py-2 px-4 rounded-lg transition"
            >
              📍 View on Maps
            </a>
          </div>
        </div>

        {/* ── Live flights nearby ─────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ✈️ Live Traffic ({nearbyFlights.length} aircraft)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={fetchNearbyFlights}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {nearbyFlights.length === 0 && !flightsLoading ? (
            <div className="bg-slate-900 rounded-lg p-6 text-center border border-slate-700">
              <p className="text-slate-400 text-sm">No aircraft detected within 50 km right now.</p>
              <p className="text-slate-500 text-xs mt-1">Try again — traffic changes constantly.</p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700 bg-slate-800/50">
                <span>Flight</span>
                <span>Alt</span>
                <span>Speed</span>
                <span>Heading</span>
                <span>Country</span>
              </div>
              {/* Rows */}
              {nearbyFlights.slice(0, 15).map((f, i) => (
                <div key={`${f.icao24}-${i}`} className="grid grid-cols-5 gap-2 px-4 py-2 text-sm border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition">
                  <span className="font-mono font-semibold text-cyan-400">
                    {f.callsign?.trim() || '—'}
                  </span>
                  <span className="text-slate-300">
                    {f.baro_altitude ? `${Math.round(f.baro_altitude / 100)}00 ft` : '—'}
                  </span>
                  <span className="text-slate-300">
                    {f.velocity ? `${f.velocity} kt` : '—'}
                  </span>
                  <span className="text-slate-300">
                    {f.true_track != null ? `${f.true_track}°` : '—'}
                  </span>
                  <span className="text-slate-400 text-xs truncate">{f.origin_country}</span>
                </div>
              ))}
            </div>
          )}
          {lastUpdated && (
            <p className="text-xs text-slate-600 mt-2">Last updated: {lastUpdated} · Data: OpenSky Network</p>
          )}
        </div>

      </div>
    </motion.div>
  )
}
