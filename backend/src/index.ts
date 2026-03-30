import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = process.env.PORT || 3001

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

app.use(cors())
app.use(express.json())

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Flights: Live from OpenSky Network (free, no API key) ────────────────
// OpenSky Network API: https://opensky-network.org/api
app.get('/api/flights', async (req, res) => {
  try {
    const { lat, lon, dist_km } = req.query
    let url = 'https://opensky-network.org/api/states/all'

    if (lat && lon && dist_km) {
      // Bounding box for area search
      const km = Number(dist_km)
      const latOffset = km / 111
      const lonOffset = km / (111 * Math.cos(Number(lat) * Math.PI / 180))
      const lamin = Number(lat) - latOffset
      const lomin = Number(lon) - lonOffset
      const lamax = Number(lat) + latOffset
      const lomax = Number(lon) + lonOffset
      url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'AviationHub/1.0 (educational)' }
    })

    if (!response.ok) throw new Error(`OpenSky error: ${response.status}`)

    const data = await response.json() as {
      states: Array<[string, string, string, string, number, number, number, boolean, number, number, number, string] | null>[]
    }

    const flights = (data.states || [])
      .filter(Boolean)
      .map((state) => {
        // OpenSky returns 17-element arrays: icao24, callsign, origin_country,
        // time_position, last_contact, lon, lat, baro_altitude, on_ground,
        // velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source
        const s = state as [string, string, string, number | null, number | null,
          number | null, number | null, number | null, boolean, number | null,
          number | null, number | null, number[] | null, number | null,
          string | null, boolean, number]
        return {
          icao24: s[0],
          callsign: s[1].trim(),
          origin_country: s[2],
          latitude: s[6],
          longitude: s[5],
          baro_altitude: s[7] ? Math.round(s[7]) : null,
          on_ground: s[8],
          velocity: s[9] ? Math.round(s[9] * 3.6) : null,
          true_track: s[10] ? Math.round(s[10]) : null,
          vertical_rate: s[11] ? Math.round(s[11]) : null,
          last_contact: s[4] ?? 0,
        } as FlightState
      })
      .filter(f => f.callsign && f.callsign.length > 3)

    res.json({ total: flights.length, flights: flights.slice(0, 100) })
  } catch (err) {
    console.error('Flights error:', err)
    res.status(500).json({ error: 'Failed to fetch flights' })
  }
})

// ─── Flights by callsign ────────────────────────────────────────────────────
interface FlightState {
  icao24: string
  callsign: string
  origin_country: string
  latitude: number | null
  longitude: number | null
  baro_altitude: number | null
  on_ground: boolean
  velocity: number | null
  true_track: number | null
  vertical_rate: number | null
  last_contact: number
}

app.get('/api/flights/search', async (req: { query: { q: unknown } }, res) => {
  try {
    const { q } = req.query
    if (!q || String(q).length < 3) {
      return res.status(400).json({ error: 'Query too short' })
    }

    const response = await fetch(
      'https://opensky-network.org/api/flights/callsign?' +
      new URLSearchParams({ callsign: String(q).toUpperCase() }),
      { headers: { 'User-Agent': 'AviationHub/1.0' } }
    )

    if (!response.ok) throw new Error(`OpenSky error: ${response.status}`)
    const data = await response.json()
    res.json({ results: Array.isArray(data) ? data : [] })
  } catch (err) {
    console.error('Flight search error:', err)
    res.status(500).json({ error: 'Failed to search flights' })
  }
})

// ─── Airports from Supabase ────────────────────────────────────────────────
app.get('/api/airports', async (req, res) => {
  try {
    const { q, limit = '20' } = req.query
    let query = supabase
      .from('airports')
      .select('*')
      .order('type')
      .limit(Number(limit))

    if (q) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query
    if (error) throw error
    res.json({ airports: data || [] })
  } catch (err) {
    console.error('Airports error:', err)
    res.status(500).json({ error: 'Failed to fetch airports' })
  }
})

// ─── Incidents from FAA API (free) ─────────────────────────────────────────
app.get('/api/incidents', async (req, res) => {
  try {
    // FAA Bird Strike database - public CSV endpoint
    const url = 'https://data.transportation.gov/api/views/k2ns-n3x5/rows.csv?accessType=DOWNLOAD'
    const response = await fetch(url)
    if (!response.ok) throw new Error(`FAA API error: ${response.status}`)

    const text = await response.text()
    const lines = text.split('\n').slice(1, 51) // first 50 rows
    const incidents = lines.map(line => {
      const [airport, date, operator, aircraft, species, damage] = line.split(',')
      return { airport, date, operator, aircraft, species, damage }
    }).filter(i => i.airport)

    res.json({ total: incidents.length, incidents })
  } catch (err) {
    console.error('Incidents error:', err)
    res.status(500).json({ error: 'Failed to fetch incidents' })
  }
})

// ─── Aircraft details by ICAO24 ────────────────────────────────────────────
app.get('/api/aircraft/:icao24', async (req: { params: { icao24: string } }, res) => {
  try {
    const { icao24 } = req.params
    // OpenSky owns the ICAO24 database
    const response = await fetch(
      `https://opensky-network.org/api/flights/aircraft?icao24=${icao24}&begin=${Date.now() / 1000 - 86400}&end=${Date.now() / 1000}`,
      { headers: { 'User-Agent': 'AviationHub/1.0' } }
    )
    if (!response.ok) throw new Error(`OpenSky error: ${response.status}`)
    const data = await response.json()
    res.json({ aircraft: data })
  } catch (err) {
    console.error('Aircraft error:', err)
    res.status(500).json({ error: 'Failed to fetch aircraft data' })
  }
})

app.listen(PORT, () => {
  console.log(`Aviation backend running on http://localhost:${PORT}`)
  console.log(`Supabase: ${supabaseUrl}`)
})
