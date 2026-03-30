// Supabase Edge Function: airports
// Fetches airport data from the mwgg/Airports GitHub dataset
// Source: https://github.com/mwgg/Airports (public dataset)
// Deploy via: supabase functions deploy airports

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface CacheEntry { data: unknown; expires: number }
const cache = new Map<string, CacheEntry>()

function getCached(key: string): unknown | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { cache.delete(key); return null }
  return entry.data
}

function setCache(key: string, data: unknown, ttlMs = 3600_000) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') || ''
    const limit = Number(url.searchParams.get('limit') || '30')

    const cacheKey = `airports:${q}:${limit}`
    const cached = getCached(cacheKey)
    if (cached) {
      return Response.json(cached, { headers: { ...corsHeaders, 'X-Cache': 'HIT' } })
    }

    const response = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json', {
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      throw new Error(`Airport data fetch failed: ${response.status}`)
    }

    const allAirports: Record<string, {
      icao: string; iata: string; name: string; city: string;
      state: string; country: string; elevation: number; lat: number; lon: number
    }> = await response.json()

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
      const qLower = q.toLowerCase()
      results = results.filter(a =>
        a.name.toLowerCase().includes(qLower) ||
        a.ident.toLowerCase().includes(qLower) ||
        a.municipality.toLowerCase().includes(qLower) ||
        a.country.toLowerCase().includes(qLower)
      )
    }

    const result = { airports: results.slice(0, limit) }
    setCache(cacheKey, result)
    return Response.json(result, { headers: { ...corsHeaders, 'X-Cache': 'MISS' } })
  } catch (err) {
    console.error('Airports error:', err)
    return Response.json(
      { error: 'Failed to fetch airports', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
