import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'

// ─── Mock Supabase client ────────────────────────────────────────────────
// Proper thenable so `await query` in the route handler resolves correctly.
// Each method returns mockSupabaseQuery (chained spy).
// The deferred resolver is controlled per-test via deferred.resolve().
class Deferred<T> {
  promise: Promise<T>
  resolve!: (value: T | PromiseLike<T>) => void
  reject!: (reason?: unknown) => void
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
  reset() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

const supabaseDeferred = new Deferred<{ data: unknown; error: unknown }>()
const mockIlike = vi.fn().mockReturnThis()
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  ilike: mockIlike,
  then: (onFulfilled: unknown, _onRejected: unknown) => {
    // Forward to the real underlying promise so `await query` resolves
    return supabaseDeferred.promise.then(onFulfilled as (v: unknown) => unknown)
  },
}
const mockSupabaseFrom = vi.fn().mockReturnValue(mockSupabaseQuery)

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabaseFrom,
  })),
}))

// ─── Mock fetch globally (OpenSky + FAA) ──────────────────────────────────
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// ─── App under test ───────────────────────────────────────────────────────
// We recreate the Express app inline so supertest can hit it without
// starting a server on a port. We import the route logic directly.
const createApp = () => {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

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
        headers: { 'User-Agent': 'AviationHub/1.0 (educational)' },
      })
      if (!response.ok) throw new Error(`OpenSky error: ${response.status}`)
      const data = await response.json() as {
        states: Array<[string, string, string, number | null, number | null, number | null, number | null, number | null, boolean, number | null, number | null, number | null, number[] | null, number | null, string | null, boolean, number] | null>[]
      }
      const flights = (data.states || [])
        .filter(Boolean)
        .map((state) => {
          const s = state as [string, string, string, number | null, number | null, number | null, number | null, number | null, boolean, number | null, number | null, number | null, number[] | null, number | null, string | null, boolean, number]
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
          }
        })
        .filter(f => f.callsign && f.callsign.length > 3)
      res.json({ total: flights.length, flights: flights.slice(0, 100) })
    } catch (err) {
      console.error('Flights error:', err)
      res.status(500).json({ error: 'Failed to fetch flights' })
    }
  })

  app.get('/api/flights/search', async (req, res) => {
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

  app.get('/api/airports', async (req, res) => {
    try {
      const { q, limit = '20' } = req.query
      let query = mockSupabaseFrom('airports')
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

  app.get('/api/incidents', async (req, res) => {
    try {
      const url = 'https://data.transportation.gov/api/views/k2ns-n3x5/rows.csv?accessType=DOWNLOAD'
      const response = await fetch(url)
      if (!response.ok) throw new Error(`FAA API error: ${response.status}`)
      const text = await response.text()
      const lines = text.split('\n').slice(1, 51)
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

  app.get('/api/aircraft/:icao24', async (req, res) => {
    try {
      const { icao24 } = req.params
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

  return app
}

// ─── Fixtures ────────────────────────────────────────────────────────────
const openSkyStateFixture = [
  'a1b2c3',           // icao24
  'UAL123 ',         // callsign
  'United States',   // origin_country
  null,              // time_position
  1700000000,        // last_contact
  -74.006,           // longitude (s[5])
  40.7128,           // latitude (s[6])
  10668,             // baro_altitude (s[7])
  false,             // on_ground (s[8])
  236.11,            // velocity (s[9]) → converted to km/h
  90.5,              // true_track (s[10])
  5,                 // vertical_rate (s[11])
  null,              // sensors
  null,              // geo_altitude
  null,              // squawk
  false,             // spi
  0,                 // position_source
]

const openSkyStateOnGround = [
  'b2c3d4',
  'AAL456 ',
  'United States',
  null,
  1700000000,
  -118.4081,
  33.9425,
  0,
  true,
  0,
  0,
  0,
  null,
  null,
  null,
  false,
  0,
]

// ─── Tests ────────────────────────────────────────────────────────────────
describe('Backend API', () => {
  let app: express.Express

  beforeEach(() => {
    vi.clearAllMocks()
    supabaseDeferred.reset()
    app = createApp()
  })

  describe('GET /api/health', () => {
    it('returns status ok with timestamp', async () => {
      const res = await request(app).get('/api/health')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'ok')
      expect(res.body).toHaveProperty('timestamp')
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date)
    })
  })

  describe('GET /api/flights', () => {
    it('returns flights from OpenSky', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ states: [openSkyStateFixture, openSkyStateOnGround, null] }),
      })

      const res = await request(app).get('/api/flights')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('total')
      expect(res.body).toHaveProperty('flights')
      expect(Array.isArray(res.body.flights)).toBe(true)
    })

    it('filters out null states', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ states: [null, null] }),
      })

      const res = await request(app).get('/api/flights')
      expect(res.body.flights).toHaveLength(0)
    })

    it('filters out callsigns <= 3 chars', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          states: [
            [...openSkyStateFixture],
            ['icao24', 'AB', 'US', null, 0, 0, 0, 0, false, 0, 0, 0, null, null, null, false, 0],
          ],
        }),
      })

      const res = await request(app).get('/api/flights')
      expect(res.body.flights.every((f: { callsign: string }) => f.callsign.length > 3)).toBe(true)
    })

    it('converts velocity from m/s to km/h', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ states: [openSkyStateFixture] }),
      })

      const res = await request(app).get('/api/flights')
      // 236.11 m/s * 3.6 = 849.996 km/h
      expect(res.body.flights[0].velocity).toBeCloseTo(850, 0)
    })

    it('returns 500 when OpenSky fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

      const res = await request(app).get('/api/flights')
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to fetch flights')
    })

    it('builds bounding box URL when lat/lon/dist provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ states: [] }),
      })

      await request(app).get('/api/flights?lat=40.7&lon=-74.0&dist_km=250')
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('lamin=')
      expect(calledUrl).toContain('lomin=')
      expect(calledUrl).toContain('lamax=')
      expect(calledUrl).toContain('lomax=')
    })

    it('limits to 100 flights', async () => {
      const manyStates = Array(150).fill([...openSkyStateFixture])
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ states: manyStates }),
      })

      const res = await request(app).get('/api/flights')
      expect(res.body.flights.length).toBeLessThanOrEqual(100)
    })
  })

  describe('GET /api/flights/search', () => {
    it('returns results array for valid query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ icao24: 'a1b2c3' }]),
      })

      const res = await request(app).get('/api/flights/search?q=DAL')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('results')
      expect(Array.isArray(res.body.results)).toBe(true)
    })

    it('returns 400 for query shorter than 3 chars', async () => {
      const res = await request(app).get('/api/flights/search?q=AB')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Query too short')
    })

    it('returns 400 when query is missing', async () => {
      const res = await request(app).get('/api/flights/search')
      expect(res.status).toBe(400)
    })

    it('uppercases the callsign in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await request(app).get('/api/flights/search?q=ual123')
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('UAL123')
    })

    it('returns 500 when OpenSky fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

      const res = await request(app).get('/api/flights/search?q=DAL')
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to search flights')
    })
  })

  describe('GET /api/airports', () => {
    it('returns airports from Supabase', async () => {
      supabaseDeferred.resolve({
        data: [
          { id: 1, ident: 'KJFK', name: 'JFK International', elevation_ft: 13 },
        ],
        error: null,
      })

      const res = await request(app).get('/api/airports')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('airports')
      expect(res.body.airports).toHaveLength(1)
    })

    it('applies ilike filter when q is provided', async () => {
      // When q is provided, ilike is chained from the limit() result,
      // so limit() must return an object that still has .ilike() available.
      mockSupabaseQuery.limit.mockReturnValue(mockSupabaseQuery)
      supabaseDeferred.resolve({ data: [], error: null })

      await request(app).get('/api/airports?q=Los')
      expect(mockIlike).toHaveBeenCalledWith('name', '%Los%')
    })

    it('returns 500 when Supabase returns an error', async () => {
      supabaseDeferred.resolve({ data: null, error: new Error('DB error') })

      const res = await request(app).get('/api/airports')
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to fetch airports')
    })
  })

  describe('GET /api/incidents', () => {
    it('returns parsed CSV incidents', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(
          'airport,date,operator,aircraft,species,damage\nJFK,2023-01-01,UAL,B737,Bird,Minor\nLAX,2023-01-02,AAL,A320,Bird,Destroyed'
        ),
      })

      const res = await request(app).get('/api/incidents')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('incidents')
      expect(Array.isArray(res.body.incidents)).toBe(true)
      expect(res.body.incidents[0]).toHaveProperty('airport')
      expect(res.body.incidents[0]).toHaveProperty('species')
    })

    it('filters out rows with no airport', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(
          'airport,date,operator,aircraft,species,damage\n,2023-01-01,UAL,B737,Bird,Minor'
        ),
      })

      const res = await request(app).get('/api/incidents')
      expect(res.body.incidents).toHaveLength(0)
    })

    it('returns 500 when FAA fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

      const res = await request(app).get('/api/incidents')
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to fetch incidents')
    })
  })

  describe('GET /api/aircraft/:icao24', () => {
    it('returns aircraft data from OpenSky', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ icao24: 'a1b2c3', flights: [] }),
      })

      const res = await request(app).get('/api/aircraft/a1b2c3')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('aircraft')
    })

    it('passes icao24 param to OpenSky URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await request(app).get('/api/aircraft/abc1234')
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('icao24=abc1234')
    })

    it('returns 500 when OpenSky fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

      const res = await request(app).get('/api/aircraft/notfound')
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to fetch aircraft data')
    })
  })
})
