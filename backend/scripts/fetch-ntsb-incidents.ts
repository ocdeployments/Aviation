/**
 * fetch-ntsb-incidents.ts
 * Fetches US aviation incidents from NTSB CSV and upserts into Supabase `incidents` table.
 * Only adds NEW incidents (dedupes by NTSB event ID).
 *
 * Usage: npx tsx scripts/fetch-ntsb-incidents.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://stxanozxvkerwfvbruzr.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4NDMzMywiZXhwIjoyMDkwNDYwMzMzfQ.a3STl9xBvp8kNMn5nN4p5l2gfTdK3Qg8y0Qj5JHFvxc'

// NTSB CSV download — incidents from 2023–2025
const NTSB_CSV_URL =
  'https://data.ntsb.gov/aviationQueryDownload?type=Incident&downloadMethod=csv&eventDate=01/01/2023%09/01/01/2025'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface NtsbRow {
  ev_id: string
  ev_type: string
  ev_date: string
  ev_time: string
  loc: string
  airline: string
  flight_no: string
  aircraft_type: string
  aircraft_key: string
  fat_all: number
  summary: string
  sev_code: string
  [key: string]: unknown
}

interface UpsertRow {
  id: string
  type: string
  date: string
  flight: string
  airline: string
  aircraft: string
  fatalities: number
  route: string
  summary: string
  severity: string
  source: string
}

/** Remove UTF-8 BOM if present */
function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, '').replace(/^\uFFEF/, '')
}

/** Parse NTSB date string like "01/15/2023" into ISO date "2023-01-15" */
function parseDate(ds: string): string {
  const m = String(ds).trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return new Date().toISOString().slice(0, 10)
  const [, month, day, year] = m
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/** Map NTSB severity codes to human labels */
function mapSeverity(code: string): string {
  const c = String(code).toUpperCase().trim()
  if (c === 'FAT') return 'Fatal'
  if (c === 'SER') return 'Serious'
  if (c === 'MIN') return 'Minor'
  if (c === 'NONE') return 'None'
  return c || 'Unknown'
}

/** Parse a single line of CSV — handles quoted fields with commas */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/** Fetch and parse NTSB CSV, returning raw rows */
async function fetchNtsbCsv(): Promise<string[][]> {
  console.log(`Fetching NTSB CSV from:\n  ${NTSB_CSV_URL}`)
  const response = await fetch(NTSB_CSV_URL, {
    headers: { 'User-Agent': 'AviationHub/1.0 (educational)' },
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) {
    throw new Error(`NTSB CSV fetch failed: HTTP ${response.status} ${response.statusText}`)
  }

  const raw = await response.text()
  const text = stripBom(raw)

  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) {
    throw new Error(`NTSB CSV returned no data rows. Got ${lines.length} line(s).`)
  }

  console.log(`  CSV header: ${lines[0].slice(0, 120)}`)
  console.log(`  Total rows (incl. header): ${lines.length}`)

  const rows = lines.slice(1).map(l => parseCsvLine(l))
  return rows
}

/** Map NTSB column indices to field names based on header row */
function mapHeader(header: string[]): Record<string, number> {
  const idx: Record<string, number> = {}
  header.forEach((col, i) => { idx[col] = i })
  return idx
}

async function main() {
  console.log('\n🛫 AviationHub NTSB Incident Fetcher')
  console.log('====================================\n')

  const rows = await fetchNtsbCsv()
  if (rows.length === 0) {
    console.log('No rows returned from NTSB — exiting.')
    return
  }

  const headerIdx = mapHeader(rows[0])
  const dataRows = rows.slice(1)

  // Inspect available columns
  console.log(`\nAvailable NTSB columns (${Object.keys(headerIdx).length}):`)
  Object.keys(headerIdx).forEach(k => console.log(`  ${k}`))

  const mapped: UpsertRow[] = []
  let skipped = 0

  for (const row of dataRows) {
    try {
      const idx = (key: string) => (headerIdx[key] != null ? headerIdx[key] : -1) as number
      const cell = (key: string) => row[idx(key)] || ''
      const evId = String(cell('ev_id')).trim()
      if (!evId || evId === '-') { skipped++; continue }

      const evType = String(cell('ev_type')).trim()
      const evDate = parseDate(String(cell('ev_date')))
      const evTime = String(cell('ev_time')).trim()
      const loc = String(cell('loc')).trim()
      const airline = String(cell('air_use') || cell('operator') || cell('air_carrier')).trim()
      const flightNo = String(cell('flight_no')).trim()
      const acType = String(cell('ac_category') || cell('aircraft_type')).trim()
      const fatAll = parseInt(String(cell('fat_all') || '0'), 10) || 0
      const summary = String(cell('injury_desc') || cell('summary')).trim()
      const sevCode = String(cell('inj_sev_code')).trim()

      const route = loc || ''
      const type = evType || 'Incident'
      const severity = mapSeverity(sevCode)

      mapped.push({
        id: `ntsb-${evId}`,
        type,
        date: evDate,
        flight: flightNo || '',
        airline: airline || 'Unknown',
        aircraft: acType || '',
        fatalities: fatAll,
        route,
        summary: summary.slice(0, 2000),
        severity,
        source: 'NTSB',
      })
    } catch (err) {
      console.warn('  Row parse error:', err)
      skipped++
    }
  }

  console.log(`\nParsed ${mapped.length} incidents (skipped ${skipped} empty rows)`)

  if (mapped.length === 0) {
    console.log('No valid incidents to upsert — exiting.')
    return
  }

  // Check which IDs already exist in Supabase
  const ids = mapped.map(r => r.id)
  console.log('\nChecking for existing records in Supabase...')

  const { data: existing, error: fetchErr } = await supabase
    .from('incidents')
    .select('id')
    .in('id', ids)

  if (fetchErr) {
    console.error('Error fetching existing IDs:', fetchErr)
    process.exit(1)
  }

  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newIncidents = mapped.filter(r => !existingIds.has(r.id))

  console.log(`Already in DB : ${existingIds.size}`)
  console.log(`New incidents : ${newIncidents.length}`)

  if (newIncidents.length === 0) {
    console.log('\n✅ Database is up to date — no new incidents to add.')
    return
  }

  // Upsert new incidents
  console.log(`\nUpserting ${newIncidents.length} new incidents...`)

  const { data: upserted, error: upsertErr } = await supabase
    .from('incidents')
    .upsert(newIncidents, { onConflict: 'id' })
    .select()

  if (upsertErr) {
    console.error('Upsert error:', upsertErr)
    process.exit(1)
  }

  console.log(`\n✅ Successfully added ${newIncidents.length} incidents.`)
  console.log('Sample of added incidents:')
  newIncidents.slice(0, 5).forEach(r => {
    console.log(`  [${r.id}] ${r.date} | ${r.type} | ${r.airline} | ${r.route} | severity: ${r.severity}`)
  })

  console.log('\n📊 Summary:')
  console.log(`  Total in CSV       : ${dataRows.length}`)
  console.log(`  Successfully mapped: ${mapped.length}`)
  console.log(`  Already in DB      : ${existingIds.size}`)
  console.log(`  Newly inserted     : ${newIncidents.length}`)
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
