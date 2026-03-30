import { useEffect, useRef, useState, useCallback } from 'react'
import GlobeComponent from 'react-globe.gl'
import * as THREE from 'three'

const SUPABASE_URL = 'https://stxanozxvkerwfvbruzr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODQzMzMsImV4cCI6MjA5MDQ2MDMzM30.Re9XtQo5SoeqJIOxjXiomDsXXLR19qGQmiXYUAH3PBc'
const OPENSKY_API = `${SUPABASE_URL}/functions/v1/flights`

// Airport hubs for arc destinations
const MAJOR_AIRPORTS: Array<{ code: string; lat: number; lng: number; city: string }> = [
  { code: 'JFK', lat: 40.6413, lng: -73.7781, city: 'New York' },
  { code: 'LAX', lat: 33.9416, lng: -118.4085, city: 'Los Angeles' },
  { code: 'ORD', lat: 41.9742, lng: -87.9073, city: 'Chicago' },
  { code: 'DFW', lat: 32.8998, lng: -97.0403, city: 'Dallas' },
  { code: 'ATL', lat: 33.6407, lng: -84.4277, city: 'Atlanta' },
  { code: 'SFO', lat: 37.6213, lng: -122.379, city: 'San Francisco' },
  { code: 'LAS', lat: 36.084, lng: -115.1537, city: 'Las Vegas' },
  { code: 'MIA', lat: 25.7959, lng: -80.287, city: 'Miami' },
  { code: 'SEA', lat: 47.4502, lng: -122.3088, city: 'Seattle' },
  { code: 'DEN', lat: 39.8561, lng: -104.6737, city: 'Denver' },
  { code: 'BOS', lat: 42.3656, lng: -71.0096, city: 'Boston' },
  { code: 'PHX', lat: 33.4484, lng: -112.074, city: 'Phoenix' },
  { code: 'IAH', lat: 29.9902, lng: -95.3368, city: 'Houston' },
  { code: 'MCO', lat: 28.4312, lng: -81.3081, city: 'Orlando' },
  { code: 'EWR', lat: 40.6895, lng: -74.1745, city: 'Newark' },
]

type GlobeEl = any

const ARC_COLOR_HIGH = () => new THREE.Color('#06b6d4')
const ARC_COLOR_MED  = () => new THREE.Color('#3b82f6')
const ARC_COLOR_LOW  = () => new THREE.Color('#8b5cf6')
const DOT_COLOR      = () => new THREE.Color('#fbbf24')

export default function GlobeView() {
  const globeRef = useRef<GlobeEl>(null)
  const [flights, setFlights] = useState<Array<{ lat: number; lng: number; altitude: number; callsign: string; country: string }>>([])
  const [arcs, setArcs] = useState<Array<{ startLat: number; startLng: number; endLat: number; endLng: number; callsign: string; altitude: number }>>([])
  const [loading, setLoading] = useState(true)
  const [arcCount, setArcCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchFlights = useCallback(async () => {
    try {
      const r = await fetch(OPENSKY_API, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      })
      if (!r.ok) return
      const d = await r.json()
      const rawFlights = (d.flights || []) as Array<{
        latitude: number | null
        longitude: number | null
        baro_altitude: number | null
        callsign: string
        origin_country: string
      }>

      const validFlights = rawFlights
        .filter(f => f.latitude != null && f.longitude != null)
        .map(f => ({
          lat: f.latitude as number,
          lng: f.longitude as number,
          altitude: f.baro_altitude ?? 0,
          callsign: f.callsign,
          country: f.origin_country,
        }))

      setFlights(validFlights)

      const arcData = validFlights.slice(0, 60).map(f => {
        let nearest = MAJOR_AIRPORTS[0]
        let minDist = Infinity
        for (const airport of MAJOR_AIRPORTS) {
          const dist = Math.sqrt(
            (f.lat - airport.lat) ** 2 + (f.lng - airport.lng) ** 2
          )
          if (dist < minDist) { minDist = dist; nearest = airport }
        }
        return {
          startLat: f.lat,
          startLng: f.lng,
          endLat: nearest.lat,
          endLng: nearest.lng,
          callsign: f.callsign,
          altitude: f.altitude,
        }
      })

      setArcs(arcData)
      setArcCount(arcData.length)
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFlights()
    const id = setInterval(fetchFlights, 30000)
    return () => clearInterval(id)
  }, [fetchFlights])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!globeRef.current) return
      const controls = globeRef.current.controls?.()
      if (controls) {
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.4
      }
      globeRef.current.pointOfView?.({ lat: 30, lng: -60, altitude: 2.5 })
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const arcAltitude = (obj: object) => {
    const d = obj as { altitude: number }
    return Math.max(0.1, (d.altitude / 40000) * 0.8)
  }

  const arcColor = (obj: object) => {
    const d = obj as { altitude: number }
    if (d.altitude > 30000) return ARC_COLOR_HIGH().getStyle()
    if (d.altitude > 15000) return ARC_COLOR_MED().getStyle()
    return ARC_COLOR_LOW().getStyle()
  }

  const flightLabel = (obj: object) => {
    const f = obj as { callsign: string; country: string; lat: number; lng: number; altitude: number }
    return `
      <div style="
        background: rgba(15,23,42,0.92);
        border: 1px solid rgba(6,182,212,0.4);
        border-radius: 8px;
        padding: 8px 12px;
        font-family: monospace;
        font-size: 12px;
        color: #e2e8f0;
        backdrop-filter: blur(8px);
        min-width: 140px;
      ">
        <div style="color: #06b6d4; font-weight: bold; font-size: 13px;">${f.callsign || 'UNKNOWN'}</div>
        <div style="color: #94a3b8; margin-top: 4px;">${f.country || 'Unknown'}</div>
        <div style="color: #f8fafc; margin-top: 4px;">
          ${f.lat.toFixed(2)}°, ${f.lng.toFixed(2)}°
        </div>
        <div style="color: #fbbf24; margin-top: 2px;">
          ${f.altitude ? Math.round(f.altitude).toLocaleString() + ' ft' : '—'}
        </div>
      </div>
    `
  }

  const width  = containerRef.current?.offsetWidth ?? 900
  const height = 520

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-blue-400">✈️ Live Globe</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time flight positions from OpenSky Network
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Live Positions</div>
            <div className="text-2xl font-bold text-cyan-400">{flights.length.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Active Routes</div>
            <div className="text-2xl font-bold text-purple-400">{arcCount}</div>
          </div>
        </div>
      </div>

      {/* Globe container */}
      <div
        ref={containerRef}
        className="rounded-2xl overflow-hidden border border-slate-700 relative"
        style={{ height }}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80">
            <div className="text-center">
              <div className="airplane-loader mb-3" />
              <div className="text-cyan-400 text-sm font-medium">Acquiring satellite feed...</div>
            </div>
          </div>
        )}

        <GlobeComponent
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

          // Flight dots
          pointsData={flights}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={0.008}
          pointRadius={0.4}
          pointColor={() => DOT_COLOR().getStyle()}
          pointLabel={flightLabel as any}

          // Arc routes
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="startLng"
          arcAltitude={arcAltitude}
          arcColor={arcColor}
          arcStroke={0.4}
          arcDashLength={0.3}
          arcDashGap={0.15}
          arcDashAnimateTime={2000}

          // Atmosphere
          atmosphereColor="#06b6d4"
          atmosphereAltitude={0.18}

          enablePointerInteraction={true}
          width={width}
          height={height}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { color: 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]', label: 'High altitude (30k+ ft)' },
          { color: 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]', label: 'Mid altitude (15k–30k ft)' },
          { color: 'bg-purple-500 shadow-[0_0_6px_rgba(139,92,246,0.8)]', label: 'Low altitude (<15k ft)' },
          { color: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]', label: 'Flight position' },
        ].map(item => (
          <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${item.color} inline-block`} />
            <span className="text-xs text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
