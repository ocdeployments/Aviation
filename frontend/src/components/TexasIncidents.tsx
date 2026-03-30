import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Frisco, TX center
const FRISCO_CENTER: [number, number] = [33.1507, -96.8236]

interface TexasIncident {
  airport: string
  date: string
  operator: string
  aircraft: string
  species: string
  damage: string
  lat: number
  lng: number
}

// Texas airport coords
const TEXAS_AIRPORT_COORDS: Record<string, [number, number]> = {
  'DFW': [32.8998, -97.0403],
  'IAH': [29.9902, -95.3368],
  'AUS': [30.1945, -97.6699],
  'SAT': [29.5337, -98.4698],
  'HOU': [29.6454, -95.2789],
  'DAL': [32.8471, -96.8518],
  'AMA': [35.2194, -101.5924],
  'CRP': [27.7704, -97.5012],
  'ELP': [31.9423, -106.3993],
  'LBB': [33.5966, -101.8228],
  'MAF': [31.9425, -102.2019],
  'ACT': [31.6113, -97.2305],
  'CLL': [30.5886, -96.3638],
  'ABI': [32.4465, -99.8231],
  'SJT': [31.3787, -100.4964],
}

function getColor(damage: string): string {
  if (damage?.includes('Destroyed')) return '#ef4444'
  if (damage?.includes('Substantial')) return '#f97316'
  if (damage?.includes('Minor')) return '#eab308'
  return '#22c55e'
}

function getRadius(damage: string): number {
  if (damage?.includes('Destroyed')) return 14
  if (damage?.includes('Substantial')) return 10
  return 7
}

export default function TexasIncidents() {
  const [incidents, setIncidents] = useState<TexasIncident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API}/api/incidents`)
        const d = await r.json()
        const raw = d.incidents || []

        const mapped = raw
          .map((inc: { airport?: string; date?: string; operator?: string; aircraft?: string; species?: string; damage?: string }) => {
            const name = inc.airport || ''
            // Find matching Texas airport
            const match = Object.entries(TEXAS_AIRPORT_COORDS).find(([code]) =>
              name.toUpperCase().includes(code)
            )
            const coords = match ? match[1] : null
            return {
              ...inc,
              lat: coords ? coords[0] : undefined,
              lng: coords ? coords[1] : undefined,
            }
          })
          .filter((inc: { lat?: number }) => inc.lat != null) as TexasIncident[]

        setIncidents(mapped)
      } catch (err) {
        console.error('Failed to load Texas incidents:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-blue-400">🤠 Texas Incidents</h2>
          <p className="text-sm text-slate-400 mt-1">Wildlife strikes at Texas airports · FAA data 2026</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          <span className="text-xs text-slate-400">Frisco, TX overlay:</span>
          <span className="text-sm font-bold text-purple-400">📍 Frisco</span>
          <span className="text-xs text-slate-500">33.1507°N, 96.8236°W</span>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-slate-400">Loading Texas map...</div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-700">
          <MapContainer
            center={[31.5, -99.5]}
            zoom={6}
            style={{ height: 500, width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Frisco, TX city overlay */}
            <Circle
              center={FRISCO_CENTER}
              radius={8000}
              pathOptions={{
                color: '#a855f7',
                fillColor: '#a855f7',
                fillOpacity: 0.08,
                weight: 2,
              }}
            />
            <CircleMarker
              center={FRISCO_CENTER}
              radius={8}
              pathOptions={{
                color: '#a855f7',
                fillColor: '#a855f7',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-slate-800 text-sm">
                  <strong className="text-purple-600">📍 Frisco, TX</strong>
                  <br />
                  <span className="text-gray-500">33.1507°N, 96.8236°W</span>
                  <br />
                  <span className="text-xs text-gray-400">8km reference radius</span>
                </div>
              </Popup>
            </CircleMarker>

            {incidents.map((inc, i) => (
              <CircleMarker
                key={i}
                center={[inc.lat!, inc.lng!]}
                radius={getRadius(inc.damage)}
                pathOptions={{
                  color: getColor(inc.damage),
                  fillColor: getColor(inc.damage),
                  fillOpacity: 0.7,
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="text-slate-800 text-sm">
                    <strong className="text-base">{inc.airport}</strong>
                    <br />
                    <span className="text-gray-600">{inc.date}</span>
                    <br />
                    <strong>Aircraft:</strong> {inc.aircraft}
                    <br />
                    <strong>Operator:</strong> {inc.operator}
                    <br />
                    <strong>Species:</strong> {inc.species}
                    <br />
                    <span className={`font-bold ${inc.damage?.includes('Destroyed') ? 'text-red-600' : inc.damage?.includes('Substantial') ? 'text-orange-600' : 'text-yellow-600'}`}>
                      {inc.damage}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Legend</div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Minor</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Minor+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Substantial</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Destroyed</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Frisco (reference)</span>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Texas Incidents</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{incidents.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Texas airports with FAA wildlife strike reports</div>
        </div>
      </div>
    </div>
  )
}