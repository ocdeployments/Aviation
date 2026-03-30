// Supabase Edge Function — AviationHub OpenSky Data Proxy
// Fetches live flight data from OpenSky Network (no API key required)
// Deploy via: supabase functions deploy opensky-incidents

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const lamax = url.searchParams.get('lamax')
    const lamin = url.searchParams.get('lamin')
    const lomin = url.searchParams.get('lomin')
    const lomax = url.searchParams.get('lomax')

    let openskyUrl = 'https://opensky-network.org/api/states/all'
    const params: Record<string, string> = {}
    if (lamax) params.lamax = lamax
    if (lamin) params.lamin = lamin
    if (lomin) params.lomin = lomin
    if (lomax) params.lomax = lomax
    const qs = new URLSearchParams(params).toString()
    if (qs) openskyUrl += '?' + qs

    const response = await fetch(openskyUrl, {
      headers: { 'User-Agent': 'AviationHub-Edge/1.0' },
    })

    if (!response.ok) {
      throw new Error(`OpenSky error: ${response.status}`)
    }

    const data = await response.json() as {
      states: Array<[string, string, string, number | null, number | null, number | null, number | null, number | null, boolean, number | null, number | null, number | null, unknown, number | null, string | null, boolean, number] | null>
    }

    const flights = (data.states || [])
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
