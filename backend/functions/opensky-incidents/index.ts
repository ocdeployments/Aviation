// Supabase Edge Function — AviationHub OpenSky Data Proxy
// Fetches live flight data from OpenSky Network (no API key required)
// and returns filtered flight states as JSON.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!

interface FlightState {
  icao24: string
  callsign: string
  origin_country: string
  latitude: number | null
  longitude: number | null
  baro_altitude: number | null
  on_ground: boolean
  velocity_kmh: number | null
  true_track: number | null
  vertical_rate: number | null
  last_contact: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const lamax = url.searchParams.get('lamax')
    const lamin = url.searchParams.get('lamin')
    const lomin = url.searchParams.get('lomin')
    const lomax = url.searchParams.get('lomax')

    // Build OpenSky API URL
    let openskyUrl = 'https://opensky-network.org/api/states/all'
    const params = new URLSearchParams()
    if (lamax) params.set('lamax', lamax)
    if (lamin) params.set('lamin', lamin)
    if (lomin) params.set('lomin', lomin)
    if (lomax) params.set('lomax', lomax)
    if (params.size > 0) openskyUrl += '?' + params.toString()

    // Fetch from OpenSky (no API key needed)
    const response = await fetch(openskyUrl, {
      headers: { 'User-Agent': 'AviationHub-Edge/1.0' },
    })

    if (!response.ok) {
      throw new Error(`OpenSky error: ${response.status}`)
    }

    const data = await response.json() as {
      states: Array<[string, string, string, number | null, number | null, number | null, number | null, number | null, boolean, number | null, number | null, number | null, unknown, number | null, string | null, boolean, number] | null>
    }

    const flights: FlightState[] = (data.states || [])
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => {
        const [icao24, callsign, origin_country, , , lon, lat, baro_altitude, on_ground, velocity, true_track, vertical_rate, , , , ,] = s
        return {
          icao24,
          callsign: callsign.trim(),
          origin_country,
          latitude: lat ?? null,
          longitude: lon ?? null,
          baro_altitude: baro_altitude !== null ? Math.round(baro_altitude) : null,
          on_ground,
          velocity_kmh: velocity !== null ? Math.round(velocity * 3.6) : null,
          true_track: true_track !== null ? Math.round(true_track) : null,
          vertical_rate: vertical_rate !== null ? Math.round(vertical_rate) : null,
          last_contact: s[4] ?? 0,
        }
      })
      .filter((f) => f.callsign.length > 3)

    // Optionally upsert to Supabase flights table (if credentials provided)
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY && flights.length > 0) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        const rows = flights.slice(0, 100).map((f) => ({
          icao24: f.icao24,
          callsign: f.callsign,
          origin_country: f.origin_country,
          latitude: f.latitude,
          longitude: f.longitude,
          baro_altitude: f.baro_altitude,
          on_ground: f.on_ground,
          velocity_kmh: f.velocity_kmh,
          true_track: f.true_track,
          vertical_rate: f.vertical_rate,
          last_contact: f.last_contact,
          fetched_at: new Date().toISOString(),
        }))

        await supabase.from('flights').upsert(rows, {
          onConflict: 'icao24',
          ignoreDuplicates: true,
        })
      } catch (_err) {
        // Non-fatal — don't fail the request if DB write fails
      }
    }

    return new Response(
      JSON.stringify({ total: flights.length, flights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
