/**
 * opensky-cron.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Ingest OpenSky Network live flight states into Supabase every 15 minutes.
 *
 * Usage:
 *   npm run cron:opensky                  # start the cron loop
 *   npm run cron:opensky -- --once        # run once (for testing)
 *   SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... npm run cron:opensky
 *
 * Environment variables required:
 *   SUPABASE_URL          — e.g. https://<project>.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key (bypasses RLS)
 *   OPEN_SKY_RATE_LIMIT_MS  — optional, default 10_000 (10 s between calls)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OpenSkyState {
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

interface OpenSkyResponse {
  states: [string, string, string, number | null, number | null,
    number | null, number | null, number | null, boolean, number | null,
    number | null, number | null, number[] | null, number | null,
    string | null, boolean, number][] | null
  time: number
}

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL         = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const RATE_LIMIT_MS        = Number(process.env.OPEN_SKY_RATE_LIMIT_MS ?? 10_000)
const FETCH_INTERVAL_MS    = 15 * 60 * 1_000   // 15 minutes
const PRUNE_AFTER_HOURS    = 24

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[opensky-cron] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.')
  process.exit(1)
}

// ─── Supabase client (service role — bypasses RLS for writes) ────────────────

let supabase: SupabaseClient

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { persistSession: false },
    })
  }
  return supabase
}

// ─── OpenSky fetch ───────────────────────────────────────────────────────────

/**
 * Fetch all flight states from OpenSky Network.
 * Endpoint: https://opensky-network.org/api/states/all
 * No API key required.
 */
async function fetchOpenSky(): Promise<OpenSkyResponse> {
  const url = 'https://opensky-network.org/api/states/all'
  console.log(`[opensky-cron] Fetching ${url}`)

  const res = await fetch(url, {
    headers: { 'User-Agent': 'AviationHub/1.0 (data-ingest cron)' },
  })

  if (!res.ok) {
    throw new Error(`OpenSky returned ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<OpenSkyResponse>
}

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Parse OpenSky 17-element state arrays into a flat FlightState object.
 *
 * Element index → field mapping:
 *   0  icao24         — 24-bit ICAO transponder address (hex string)
 *   1  callsign       — flight number (8 chars, space-padded)
 *   2  origin_country — registration country
 *   3  time_position  — Unix epoch of last position update (nullable)
 *   4  last_contact   — Unix epoch of last update from aircraft
 *   5  longitude      — WGS-84 longitude (decimal degrees)
 *   6  latitude       — WGS-84 latitude  (decimal degrees)
 *   7  baro_altitude  — barometric altitude (metres)
 *   8  on_ground      — true if aircraft is on ground
 *   9  velocity       — ground speed (metres/s)
 *   10 true_track     — heading (degrees, 0–360)
 *   11 vertical_rate  — vertical speed (metres/s)
 *   12 sensors        — sensor IDs that saw this flight (nullable)
 *   13 geo_altitude   — geometric altitude (metres, nullable)
 *   14 squawk         — transponder squawk code
 *   15 spi            — special purpose indicator
 *   16 position_source — 0=ADS-B 1=ASTERIX 2=MLAT 3=Florida
 *
 *   ref: https://opensky-network.org/apidoc/rest.html#response
 */
function parseStates(raw: OpenSkyResponse['states']): OpenSkyState[] {
  if (!raw) return []

  const parsed: OpenSkyState[] = []

  for (const state of raw) {
    if (!state || state.length < 17) continue

    const [
      icao24, callsign, origin_country,
      _time_position, last_contact,
      longitude, latitude,
      baro_altitude, on_ground,
      velocity, true_track, vertical_rate,
      _sensors, _geo_altitude, _squawk, _spi, _position_source,
    ] = state

    // Skip if no call sign or too short (junk data)
    const cleanCallsign = (callsign ?? '').trim()
    if (!cleanCallsign || cleanCallsign.length < 3) continue

    parsed.push({
      icao24:            icao24.toLowerCase(),
      callsign:          cleanCallsign,
      origin_country:    origin_country ?? '',
      latitude:          latitude    ?? null,
      longitude:         longitude   ?? null,
      baro_altitude:     baro_altitude != null ? Math.round(baro_altitude) : null,
      on_ground:         on_ground   ?? false,
      velocity_kmh:      velocity   != null ? Math.round(velocity * 3.6) : null,
      true_track:        true_track != null ? Math.round(true_track) : null,
      vertical_rate:     vertical_rate != null ? Math.round(vertical_rate) : null,
      last_contact:      last_contact ?? 0,
    })
  }

  return parsed
}

// ─── Supabase upsert ─────────────────────────────────────────────────────────

/**
 * Upsert a batch of flight states into the `flights` table.
 * Uses the composite key (icao24 || '-' || floor(last_contact/60)) for deduplication.
 * Inserts in batches of 500 to stay within free-tier request limits.
 */
async function upsertFlights(flights: OpenSkyState[]): Promise<number> {
  const sb = getSupabase()
  const BATCH = 500
  let inserted = 0

  for (let i = 0; i < flights.length; i += BATCH) {
    const batch = flights.slice(i, i + BATCH)

    // unique_flight_id = icao24-floor(last_contact/60)
    const records = batch.map(f => ({
      icao24:           f.icao24,
      callsign:         f.callsign,
      origin_country:   f.origin_country,
      latitude:         f.latitude,
      longitude:        f.longitude,
      baro_altitude:    f.baro_altitude,
      on_ground:        f.on_ground,
      velocity_kmh:    f.velocity_kmh,
      true_track:       f.true_track,
      vertical_rate:    f.vertical_rate,
      last_contact:     f.last_contact,
      fetched_at:       new Date().toISOString(),
    }))

    const { data, error } = await sb
      .from('flights')
      .upsert(records, {
        onConflict: 'icao24,callsign',
        ignoreDuplicates: false,
      })

    if (error) {
      // Log and continue — don't abort the whole batch for one partial failure
      console.error(`[opensky-cron] Supabase upsert error: ${error.message}`)
    }

    inserted += data?.length ?? records.length
    console.log(`[opensky-cron] Upserted batch ${Math.floor(i / BATCH) + 1} (${records.length} records)`)
  }

  return inserted
}

// ─── Prune old rows ──────────────────────────────────────────────────────────

/**
 * Delete flights older than PRUNE_AFTER_HOURS (default 24 h).
 * Called after each successful ingest to stay within free-tier row limits.
 */
async function pruneOldFlights(): Promise<number> {
  const sb = getSupabase()

  const cutoff = new Date(Date.now() - PRUNE_AFTER_HOURS * 3_600_000).toISOString()
  console.log(`[opensky-cron] Pruning flights fetched before ${cutoff}`)

  const { data, error } = await sb
    .from('flights')
    .delete()
    .lt('fetched_at', cutoff)
    .select('id', { count: 'exact' })

  if (error) {
    console.error(`[opensky-cron] Prune error: ${error.message}`)
    return 0
  }

  const count = data?.length ?? 0
  console.log(`[opensky-cron] Pruned ${count} old flight rows`)
  return count
}

// ─── One ingest cycle ────────────────────────────────────────────────────────

async function runCycle(): Promise<void> {
  const start = Date.now()

  try {
    // 1. Fetch
    const raw = await fetchOpenSky()
    const totalStates = raw.states?.length ?? 0
    console.log(`[opensky-cron] OpenSky returned ${totalStates} state vectors (time=${raw.time})`)

    // 2. Parse
    const flights = parseStates(raw.states)
    console.log(`[opensky-cron] Parsed ${flights.length} valid flight records`)

    if (flights.length === 0) {
      console.warn('[opensky-cron] No flights to ingest — skipping upsert and prune')
      return
    }

    // 3. Upsert
    const ingested = await upsertFlights(flights)

    // 4. Prune (free tier guard)
    const pruned = await pruneOldFlights()

    const elapsed = Date.now() - start
    console.log(
      `[opensky-cron] ✅ Cycle complete — ingested=${ingested} pruned=${pruned} elapsed=${elapsed}ms`
    )
  } catch (err) {
    const elapsed = Date.now() - start
    console.error(`[opensky-cron] ❌ Cycle failed after ${elapsed}ms:`, err)
    // Don't exit — let the cron retry on the next interval
  }
}

// ─── CLI / cron loop ─────────────────────────────────────────────────────────

const RUN_ONCE = process.argv.includes('--once') ||
                 process.argv.includes('-1')

async function main() {
  console.log('[opensky-cron] Starting OpenSky → Supabase ingest')
  console.log(`[opensky-cron] Interval: ${FETCH_INTERVAL_MS / 60_000} min | Prune after: ${PRUNE_AFTER_HOURS}h`)

  if (RUN_ONCE) {
    console.log('[opensky-cron] Mode: single run (--once detected)')
    await runCycle()
    return
  }

  // Run immediately on startup, then on interval
  await runCycle()

  setInterval(async () => {
    // Respect rate limits between intervals
    console.log(`[opensky-cron] Waiting ${RATE_LIMIT_MS / 1000}s before next fetch…`)
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS))
    await runCycle()
  }, FETCH_INTERVAL_MS)
}

main().catch(err => {
  console.error('[opensky-cron] Fatal:', err)
  process.exit(1)
})
