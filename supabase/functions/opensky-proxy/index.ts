// Supabase Edge Function — CORS proxy for OpenSky Network
// Adds CORS headers so browser can call OpenSky directly from frontend
// Deploy: supabase functions deploy opensky-proxy

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  const url = new URL(req.url)
  // Strip internal params, forward everything else to OpenSky
  const openskyUrl = 'https://opensky-network.org/api/states/all?' + url.search.slice(1)

  try {
    const res = await fetch(openskyUrl, {
      headers: { 'User-Agent': 'AviationHub/1.0' },
      signal: AbortSignal.timeout(8000),
    })

    const body = await res.text()

    return new Response(body, {
      status: res.status,
      headers: {
        ...CORS,
        'Content-Type': 'application/json',
        'X-Total-Count': res.headers.get('X-Total-Count') || '',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'OpenSky unreachable', detail: String(err) }),
      { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
