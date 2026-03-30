// Supabase Edge Function: flights
// Fetches live flights from OpenSky Network with 30s in-memory cache
// OpenSky free tier: 400 requests/hour with API account

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// ─── Credentials ────────────────────────────────────────────────────────────
const OPENSKY_USER = Deno.env.get('OPENSKY_USER') ?? 'aviationmad-api-client'
const OPENSKY_PASS = Deno.env.get('OPENSKY_PASS') ?? 'SnCfBHNa932SRKwkNSFuefcxqzoeCmms'

// ─── Cache (30s TTL) ───────────────────────────────────────────────────────
interface CacheEntry { data: unknown; expires: number }
const cache = new Map<string, CacheEntry>()

function getCached(key: string): unknown | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { cache.delete(key); return null }
  return entry.data
}

function setCache(key: string, data: unknown, ttlMs = 30_000) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

// ─── CORS Headers ───────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenSky state array indices:
// s[0]=icao24 s[1]=callsign s[2]=origin_country s[3]=time_position
// s[4]=last_contact s[5]=longitude s[6]=latitude s[7]=baro_altitude
// s[8]=on_ground s[9]=velocity s[10]=true_track s[11]=vertical_rate

interface Flight {
  icao24: string
  callsign: string
  origin_country: string
  longitude: number | null
  latitude: number | null
  baro_altitude: number | null
  on_ground: boolean
  velocity: number | null
  true_track: number | null
  vertical_rate: number | null
  last_contact: number
}

// Fallback data when OpenSky is unavailable (served with X-Data-Source: fallback header)
const FALLBACK_FLIGHTS: Flight[] = [
  { icao24: 'a808d5', callsign: 'UAL972 ', origin_country: 'United States', longitude: -96.987, latitude: 32.891, baro_altitude: 11278, on_ground: false, velocity: 823, true_track: 245, vertical_rate: 0, last_contact: 0 },
  { icao24: 'c075a9', callsign: 'DAL854 ', origin_country: 'United States', longitude: -87.912, latitude: 41.974, baro_altitude: 10668, on_ground: false, velocity: 789, true_track: 92, vertical_rate: 0, last_contact: 0 },
  { icao24: 'e49113', callsign: 'AAL106 ', origin_country: 'United States', longitude: -75.241, latitude: 39.872, baro_altitude: 11887, on_ground: false, velocity: 845, true_track: 270, vertical_rate: 0, last_contact: 0 },
  { icao24: '400ccf', callsign: 'BAW117 ', origin_country: 'United Kingdom', longitude: -0.461, latitude: 51.478, baro_altitude: 9450, on_ground: false, velocity: 712, true_track: 183, vertical_rate: 0, last_contact: 0 },
  { icao24: '7c7855', callsign: 'QFA11  ', origin_country: 'Australia', longitude: 103.990, latitude: 1.364, baro_altitude: 12500, on_ground: false, velocity: 901, true_track: 340, vertical_rate: 0, last_contact: 0 },
]

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const lat = url.searchParams.get('lat')
    const lon = url.searchParams.get('lon')
    const distKm = url.searchParams.get('dist_km')

    const cacheKey = lat && lon && distKm
      ? `flights:${lat}:${lon}:${distKm}`
      : 'flights:all'

    const cached = getCached(cacheKey)
    if (cached) {
      return Response.json(cached, { headers: { ...corsHeaders, 'X-Cache': 'HIT' } })
    }

    let openskyUrl = 'https://opensky-network.org/api/states/all'
    if (lat && lon && distKm) {
      const km = Number(distKm)
      const latOffset = km / 111
      const lonOffset = km / (111 * Math.cos(Number(lat) * Math.PI / 180))
      openskyUrl = `${openskyUrl}?lamin=${Number(lat) - latOffset}&lomin=${Number(lon) - lonOffset}&lamax=${Number(lat) + latOffset}&lomax=${Number(lon) + lonOffset}`
    }

    const response = await fetch(openskyUrl, {
      headers: {
        'User-Agent': 'AviationHub/1.0 (educational)',
        'Authorization': 'Basic ' + btoa(`${OPENSKY_USER}:${OPENSKY_PASS}`),
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      // OpenSky unavailable — serve fallback data so the site stays live
      if (response.status === 429 || response.status >= 500) {
        console.warn(`OpenSky ${response.status} — serving fallback`)
        const fallback = { total: FALLBACK_FLIGHTS.length, flights: FALLBACK_FLIGHTS, source: 'fallback' }
        setCache(cacheKey, fallback, 60_000)
        return Response.json(fallback, { headers: { ...corsHeaders, 'X-Data-Source': 'fallback', 'X-Cache': 'MISS' } })
      }
      throw new Error(`OpenSky error: ${response.status}`)
    }

    const data = await response.json()
    const rawStates: (string | number | boolean | null)[][] = data.states || []

    const flights: Flight[] = rawStates
      .filter((s) => s !== null)
      .map((s) => ({
        icao24: String(s[0]),
        callsign: s[1] ? String(s[1]).trim() : null,
        origin_country: String(s[2]),
        longitude: s[5] !== null ? Number(s[5]) : null,
        latitude: s[6] !== null ? Number(s[6]) : null,
        baro_altitude: s[7] !== null ? Math.round(Number(s[7])) : null,
        on_ground: Boolean(s[8]),
        velocity: s[9] !== null ? Math.round(Number(s[9]) * 3.6) : null,
        true_track: s[10] !== null ? Math.round(Number(s[10])) : null,
        vertical_rate: s[11] !== null ? Math.round(Number(s[11])) : null,
        last_contact: Number(s[4]) || 0,
      }))
      .filter((f) => f.callsign && f.callsign.length > 3 && !f.on_ground)
      .slice(0, 100) as Flight[]

    const result = { total: flights.length, flights, source: 'live' }
    setCache(cacheKey, result, 30_000)

    return Response.json(result, { headers: { ...corsHeaders, 'X-Data-Source': 'live', 'X-Cache': 'MISS' } })
  } catch (err) {
    console.error('Flights error:', err)
    // Network error — serve fallback so site stays functional
    const fallback = { total: FALLBACK_FLIGHTS.length, flights: FALLBACK_FLIGHTS, source: 'fallback' }
    return Response.json(fallback, { headers: { ...corsHeaders, 'X-Data-Source': 'fallback-error' } })
  }
})
