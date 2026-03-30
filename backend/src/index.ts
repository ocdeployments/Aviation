import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { INCIDENTS } from './data/incidents.js'

const app = express()
const PORT = process.env.PORT || 3001

// Supabase client (for flights storage)
const supabaseUrl = process.env.SUPABASE_URL || 'https://stxanozxvkerwfvbruzr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4NDMzMywiZXhwIjoyMDkwNDYwMzMzfQ.a3STl9xBvp8kNMn5nN4p5l2gfTdK3Qg8y0Qj5JHFvxc'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

app.use(cors())
app.use(express.json())

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Flights: Live from OpenSky Network (free, no API key) ────────────────
app.get('/api/flights', async (req, res) => {
  try {
    const { lat, lon, dist_km } = req.query
    let url = 'https://opensky-network.org/api/states/all'

    if (lat && lon && dist_km) {
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
      states: Array<[string, string, string, number | null, number | null, number | null, number | null, number | null, boolean, number | null, number | null, number | null, unknown, number | null, string | null, boolean, number] | null>[]
    }

    const flights = (data.states || [])
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => {
        const icao24 = String(s[0])
        const callsign = String(s[1]).trim()
        const origin_country = String(s[2])
        const lon = s[5] as number | null
        const lat = s[6] as number | null
        const baro_altitude = s[7] as number | null
        const on_ground = Boolean(s[8])
        const velocity = s[9] as number | null
        const true_track = s[10] as number | null
        const vertical_rate = s[11] as number | null
        const last_contact = (s[4] as number | null) ?? 0
        return {
          icao24,
          callsign,
          origin_country,
          latitude: lat,
          longitude: lon,
          baro_altitude: baro_altitude !== null ? Math.round(baro_altitude) : null,
          on_ground,
          velocity: velocity !== null ? Math.round(velocity * 3.6) : null,
          true_track: true_track !== null ? Math.round(true_track) : null,
          vertical_rate: vertical_rate !== null ? Math.round(vertical_rate) : null,
          last_contact,
        }
      })
      .filter(f => f.callsign.length > 3)

    res.json({ total: flights.length, flights: flights.slice(0, 100) })
  } catch (err) {
    console.error('Flights error:', err)
    res.status(500).json({ error: 'Failed to fetch flights' })
  }
})

// ─── Airports: Public GitHub dataset ───────────────────────────────────────
app.get('/api/airports', async (req, res) => {
  try {
    const { q, limit = '20' } = req.query
    const url = 'https://raw.githubusercontent.com/mwgg/Airports/master/airports.json'

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error(`Airports API error: ${response.status}`)

    const allAirports: Record<string, {
      icao: string, iata: string, name: string, city: string,
      state: string, country: string, elevation: number, lat: number, lon: number
    }> = await response.json() as Record<string, {
      icao: string, iata: string, name: string, city: string,
      state: string, country: string, elevation: number, lat: number, lon: number
    }>

    let results = Object.values(allAirports).map(a => ({
      id: a.icao,
      ident: a.icao,
      type: 'airport',
      name: a.name,
      elevation_ft: a.elevation,
      continent: 'NA',
      country: a.country,
      region: a.state || '',
      municipality: a.city || '',
      latitude: a.lat,
      longitude: a.lon,
    }))

    if (q) {
      const qLower = String(q).toLowerCase()
      results = results.filter(a =>
        a.name.toLowerCase().includes(qLower) ||
        a.ident.toLowerCase().includes(qLower) ||
        a.municipality.toLowerCase().includes(qLower) ||
        a.country.toLowerCase().includes(qLower)
      )
    }

    res.json({ airports: results.slice(0, Number(limit)) })
  } catch (err) {
    console.error('Airports error:', err)
    res.status(500).json({ error: 'Failed to fetch airports' })
  }
})

// ─── Incidents: FAA Wildlife Strikes (static dataset) ──────────────────
app.get('/api/incidents', async (_req, res) => {
  res.json({ total: INCIDENTS.length, incidents: INCIDENTS })
})

// ─── Aircraft details by ICAO24 ────────────────────────────────────────────
app.get('/api/aircraft/:icao24', async (req, res) => {
  try {
    const { icao24 } = req.params
    const now = Math.floor(Date.now() / 1000)
    const response = await fetch(
      `https://opensky-network.org/api/flights/aircraft?icao24=${icao24}&begin=${now - 86400}&end=${now}`,
      { headers: { 'User-Agent': 'AviationHub/1.0' }, signal: AbortSignal.timeout(10000) }
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
})
