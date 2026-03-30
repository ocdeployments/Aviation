// Test NTSB SharePoint form POST to get CSV
const NTSB_BASE = 'https://data.ntsb.gov'

async function getNtsbPage() {
  const res = await fetch(`${NTSB_BASE}/aviationquery`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    }
  })
  const html = await res.text()
  // Extract __VIEWSTATE, __EVENTVALIDATION
  const vs = html.match(/id="__VIEWSTATE"[^>]*value="([^"]+)"/)?.[1] ?? ''
  const ev = html.match(/id="__EVENTVALIDATION"[^>]*value="([^"]+)"/)?.[1] ?? ''
  console.log('VIEWSTATE length:', vs.length)
  console.log('EVENTVALIDATION length:', ev.length)
  return { vs, ev }
}

async function tryNtsbPost(vs, ev) {
  const params = new URLSearchParams({
    '__VIEWSTATE': vs,
    '__EVENTVALIDATION': ev,
    'type': 'Incident',
    'downloadMethod': 'csv',
    'eventDate': '01/01/2023\t01/01/2025',
  })
  
  const res = await fetch(`${NTSB_BASE}/aviationQueryDownload`, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/csv,*/*',
      'Referer': `${NTSB_BASE}/aviationquery`,
    },
    body: params.toString()
  })
  const text = await res.text()
  console.log('Status:', res.status)
  console.log('Content-Type:', res.headers.get('content-type'))
  console.log('First 200 chars:', text.slice(0, 200))
}

const { vs, ev } = await getNtsbPage()
if (vs && ev) {
  await tryNtsbPost(vs, ev)
}
