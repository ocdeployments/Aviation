import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface IncidentMarker {
  airport: string
  date: string
  operator: string
  aircraft: string
  species: string
  damage: string
  lat: number
  lng: number
}

// FAA airport coords (subset of major airports for demo mapping)
const AIRPORT_COORDS: Record<string, [number, number]> = {
  'ATL': [33.6407, -84.4277],
  'ORD': [41.9742, -87.9073],
  'DFW': [32.8998, -97.0403],
  'DEN': [39.8561, -104.6737],
  'LAX': [33.9416, -118.4085],
  'JFK': [40.6413, -73.7781],
  'SFO': [37.6213, -122.379],
  'LAS': [36.084, -115.1537],
  'MIA': [25.7959, -80.287],
  'PHX': [33.4484, -112.074],
  'IAH': [29.9902, -95.3368],
  'MCO': [28.4312, -81.3081],
  'SEA': [47.4502, -122.3088],
  'EWR': [40.6895, -74.1745],
  'MSP': [44.8848, -93.2223],
  'DTW': [42.2167, -83.3554],
  'PHL': [39.8729, -75.2437],
  'CLT': [35.2144, -80.9473],
  'SLC': [40.7899, -111.9791],
  'BOS': [42.3656, -71.0096],
  'MDW': [41.7868, -87.7522],
  'STL': [38.7487, -90.37],
  'SAN': [32.7336, -117.1897],
  'TPA': [27.9755, -82.5332],
  'PDX': [45.5898, -122.5951],
  'AUS': [30.1945, -97.6699],
  'BWI': [39.1774, -76.6684],
  'DCA': [38.8512, -77.0403],
  'FLL': [26.0742, -80.1506],
  'SJC': [37.3639, -121.9289],
  'RDU': [35.8801, -78.788],
  'MCI': [39.2976, -94.7139],
  'CMH': [39.998, -82.8919],
  'MSY': [29.9934, -90.0715],
  'SAT': [29.5337, -98.4698],
  'IND': [39.7173, -86.2944],
  'MKE': [42.9472, -87.9096],
  'ABQ': [35.0402, -106.6092],
  'OAK': [37.7213, -122.2208],
  'BNA': [36.1263, -86.6774],
  'OMA': [41.2565, -95.9345],
  'MHT': [42.9342, -71.4373],
  'PIT': [40.4915, -80.2329],
  'RSW': [26.5362, -81.7552],
  'JAX': [30.4941, -81.6879],
  'CLE': [41.4117, -81.8498],
  'RIC': [37.5052, -77.3197],
  'ANC': [61.1741, -149.003],
  'SNA': [33.6757, -117.8682],
  'SMF': [38.6954, -121.5908],
}

function getColor(damage: string): string {
  if (damage?.includes('Destroyed')) return '#ef4444'
  if (damage?.includes('Substantial')) return '#f97316'
  if (damage?.includes('Minor')) return '#eab308'
  return '#22c55e'
}

function getRadius(damage: string): number {
  if (damage?.includes('Destroyed')) return 12
  if (damage?.includes('Substantial')) return 9
  return 6
}

export default function GlobalHeatmap() {
  const [incidents, setIncidents] = useState<IncidentMarker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API}/api/incidents`)
        const d = await r.json()
        const raw = d.incidents || []

        // Attach coords to incidents where we have them
        const mapped = raw
          .map((inc: { airport?: string; date?: string; operator?: string; aircraft?: string; species?: string; damage?: string }) => {
            // Try to match airport code from the airport name string
            const code = (inc.airport || '').split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '')
            const coords = AIRPORT_COORDS[code] || AIRPORT_COORDS[Object.keys(AIRPORT_COORDS).find(k => (inc.airport || '').toUpperCase().includes(k)) || '']
            return {
              ...inc,
              lat: coords ? coords[0] : undefined,
              lng: coords ? coords[1] : undefined,
            }
          })
          .filter((inc: { lat?: number }) => inc.lat != null) as IncidentMarker[]

        setIncidents(mapped)
      } catch (err) {
        console.error('Failed to load incidents for map:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-blue-400">🌍 Global Incident Heatmap</h2>
          <p className="text-sm text-slate-400 mt-1">FAA Wildlife Strike Database — Aviation Incidents 2026</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Minor</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Minor+</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Substantial</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Destroyed</span>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-slate-400">Loading map...</div>
      ) : incidents.length === 0 ? (
        <div className="h-96 flex items-center justify-center text-slate-400">No incident data available</div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-700">
          <MapContainer
            center={[39.8283, -98.5795]}
            zoom={4}
            style={{ height: 500, width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
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

      <div className="mt-4 text-xs text-slate-500">
        {incidents.length} incidents mapped · Data: FAA Wildlife Strike Database · Free &amp; open
      </div>
    </div>
  )
}