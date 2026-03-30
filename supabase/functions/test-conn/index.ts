// Test edge function — basic connectivity check
Deno.serve(async (_req: Request) => {
  try {
    const res = await fetch('https://httpbin.org/get', { signal: AbortSignal.timeout(5000) })
    const text = await res.text()
    return new Response(JSON.stringify({ ok: true, status: res.status, length: text.length }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
