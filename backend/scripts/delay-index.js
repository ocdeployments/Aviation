/**
 * delay-index.js
 * Computes a "Delay Index" for major US routes using OpenSky live data.
 * Approach: For each route, we sample OpenSky flights and compare actual
 * ground speed vs typical cruise speed for that route. Slower-than-expected
 * flights suggest delays.
 *
 * Results are stored in Supabase route_delays table (fallback: JSON file).
 * Run: node delay-index.js [once|server]
 *   once   = one-shot compute + store (use in cron)
 *   server = run HTTP API on port 3002 + recompute every 5 min
 */

const { createClient } = require('/data/.openclaw/workspace/Aviation/node_modules/@supabase/supabase-js');

const SUPABASE_URL = 'https://stxanozxvkerwfvbruzr.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4NDMzMywiZXhwIjoyMDkwNDYwMzMzfQ.a3STl9xBvp8kNMn5nN4p5l2gfTdK3Qg8y0Qj5JHFvxc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Cache to avoid hammering OpenSky
const cache = new Map();
const CACHE_TTL = 60_000; // 60 seconds

// Typical cruise speeds (m/s) by broad aircraft category per route
// Keyed by ICAO type prefix (B73 = 737, A32 = A320 family, etc.)
const TYPICAL_SPEEDS = {
  'B73': 230,  // Boeing 737 family ~ 230 m/s (Mach 0.78)
  'B77': 250,  // Boeing 777 ~ 250 m/s (Mach 0.84)
  'B78': 245,  // Boeing 787 ~ 245 m/s
  'A32': 230,  // Airbus A320 family ~ 230 m/s
  'A35': 240,  // Airbus A350 ~ 240 m/s
  'A38': 235,  // Airbus A380 ~ 235 m/s
  'E75': 220,  // Embraer E-Jet E2 ~ 220 m/s
  'CRJ': 210,  // Bombardier CRJ ~ 210 m/s
};

function getTypicalSpeed(icao24) {
  if (!icao24) return 230;
  const prefix = (icao24.slice(0, 3)).toUpperCase();
  return TYPICAL_SPEEDS[prefix] || 230;
}

// Major US hub-to-hub routes to track
const ROUTES = [
  { id: 'JFK-LAX', dep: 'JFK', arr: 'LAX', depLat: 40.6413, depLon: -73.7781, arrLat: 33.9425, arrLon: -118.4081 },
  { id: 'LAX-JFK', dep: 'LAX', arr: 'JFK', depLat: 33.9425, depLon: -118.4081, arrLat: 40.6413, arrLon: -73.7781 },
  { id: 'ATL-ORD', dep: 'ATL', arr: 'ORD', depLat: 33.6407, depLon: -84.4277, arrLat: 41.9742, arrLon: -87.9073 },
  { id: 'ORD-ATL', dep: 'ORD', arr: 'ATL', depLat: 41.9742, depLon: -87.9073, arrLat: 33.6407, arrLon: -84.4277 },
  { id: 'DFW-SEA', dep: 'DFW', arr: 'SEA', depLat: 32.8998, depLon: -97.0403, arrLat: 47.4502, arrLon: -122.3088 },
  { id: 'SEA-DFW', dep: 'SEA', arr: 'DFW', depLat: 47.4502, depLon: -122.3088, arrLat: 32.8998, arrLon: -97.0403 },
  { id: 'DEN-LAX', dep: 'DEN', arr: 'LAX', depLat: 39.8561, depLon: -104.6737, arrLat: 33.9425, arrLon: -118.4081 },
  { id: 'LAX-DEN', dep: 'LAX', arr: 'DEN', depLat: 33.9425, depLon: -118.4081, arrLat: 39.8561, arrLon: -104.6737 },
  { id: 'SFO-ORD', dep: 'SFO', arr: 'ORD', depLat: 37.6213, depLon: -122.3790, arrLat: 41.9742, arrLon: -87.9073 },
  { id: 'ORD-SFO', dep: 'ORD', arr: 'SFO', depLat: 41.9742, depLon: -87.9073, arrLat: 37.6213, arrLon: -122.3790 },
  { id: 'MIA-JFK', dep: 'MIA', arr: 'JFK', depLat: 25.7959, depLon: -80.2870, arrLat: 40.6413, arrLon: -73.7781 },
  { id: 'JFK-MIA', dep: 'JFK', arr: 'MIA', depLat: 40.6413, depLon: -73.7781, arrLat: 25.7959, arrLon: -80.2870 },
  { id: 'BOS-SFO', dep: 'BOS', arr: 'SFO', depLat: 42.3656, depLon: -71.0096, arrLat: 37.6213, arrLon: -122.3790 },
  { id: 'SFO-BOS', dep: 'SFO', arr: 'BOS', depLat: 37.6213, depLon: -122.3790, arrLat: 42.3656, arrLon: -71.0096 },
  { id: 'LAS-SEA', dep: 'LAS', arr: 'SEA', depLat: 36.0840, depLon: -115.1537, arrLat: 47.4502, arrLon: -122.3088 },
  { id: 'SEA-LAS', dep: 'SEA', arr: 'LAS', depLat: 47.4502, depLon: -122.3088, arrLat: 36.0840, arrLon: -115.1537 },
  { id: 'PHX-ORD', dep: 'PHX', arr: 'ORD', depLat: 33.4373, depLon: -112.0078, arrLat: 41.9742, arrLon: -87.9073 },
  { id: 'ORD-PHX', dep: 'ORD', arr: 'PHX', depLat: 41.9742, depLon: -87.9073, arrLat: 33.4373, arrLon: -112.0078 },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isOnRoute(lat, lon, depLat, depLon, arrLat, arrLon, toleranceKm = 300) {
  // Great circle distance from the direct path
  const routeKm = haversineKm(depLat, depLon, arrLat, arrLon);
  if (routeKm < 1) return false;
  const d1 = haversineKm(lat, lon, depLat, depLon);
  const d2 = haversineKm(lat, lon, arrLat, arrLon);
  // Rough check: if distance to dep + distance to arr ≈ route length ± tolerance
  return Math.abs(d1 + d2 - routeKm) < toleranceKm;
}

function estimateDelayFraction(states, route) {
  // For flights on this route, compare ground speed vs typical speed
  const { arrLat, arrLon, depLat, depLon } = route;
  const onRoute = states.filter(s => {
    const lat = s[6], lon = s[5], gs = s[9];
    return lat != null && lon != null && isOnRoute(lat, lon, depLat, depLon, arrLat, arrLon, 250);
  });

  if (onRoute.length === 0) return null;

  let delayed = 0;
  for (const s of onRoute) {
    const gs = s[9]; // ground speed m/s
    if (gs != null && gs < 180) delayed++; // below 180 m/s (~350 mph) is likely delayed
    else if (gs != null && gs < 200) delayed += 0.5; // borderline
  }

  return delayed / onRoute.length;
}

async function fetchOpenSkyStates() {
  const cached = cache.get('all_states');
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.states;

  // Continental US bounding box
  const url = 'https://opensky-network.org/api/states/all?lamin=24&lomin=-125&lamax=50&lomax=-65';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AviationHub-DelayIndex/1.0' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`OpenSky ${res.status}`);
  const data = await res.json();
  cache.set('all_states', { states: data.states || [], ts: Date.now() });
  return data.states || [];
}

// JSON file fallback path (used when Supabase table not yet created)
const FALLBACK_FILE = '/data/.openclaw/workspace/route-delays.json';

async function ensureTable() {
  const { error } = await supabase.from('route_delays').select('route').limit(1);
  if (!error) {
    console.log('route_delays table: OK');
    return 'supabase';
  }
  console.warn(`route_delays table not found: ${error.message}`);
  console.warn('  → Run this SQL in Supabase SQL Editor (see backend/supabase/migrations/002_create_route_delays.sql)');
  console.warn('  → Falling back to JSON file storage at', FALLBACK_FILE);
  return 'json';
}

let storageMode = 'supabase';
const delayData = {}; // in-memory fallback store

async function upsertDelay(routeId, delayIndex, flightsCount) {
  const record = {
    route: routeId,
    delay_index: Math.round(delayIndex * 100) / 100,
    flights_count: flightsCount,
    updated_at: new Date().toISOString(),
  };

  if (storageMode === 'supabase') {
    const { error } = await supabase.from('route_delays').upsert(record, { onConflict: 'route' });
    if (error) {
      console.warn(`  [${routeId}] Supabase upsert failed: ${error.message}`);
      // Switch to JSON fallback
      delayData[routeId] = record;
      try {
        const fs = require('fs');
        fs.writeFileSync(FALLBACK_FILE, JSON.stringify(delayData, null, 2));
        storageMode = 'json';
        console.warn(`  Switched to JSON file fallback.`);
      } catch (e) {
        console.warn(`  JSON fallback also failed: ${e.message}`);
      }
    }
  } else {
    // JSON fallback
    delayData[routeId] = record;
    try {
      const fs = require('fs');
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(delayData, null, 2));
    } catch (e) {
      console.warn(`  JSON fallback write failed: ${e.message}`);
    }
  }
}

async function computeDelayIndex() {
  console.log('Fetching OpenSky states...');
  let states;
  try {
    states = await fetchOpenSkyStates();
  } catch (e) {
    console.error('OpenSky fetch failed:', e.message);
    // Fall back to cached or empty
    const cached = cache.get('all_states');
    states = cached ? cached.states : [];
    if (!states.length) {
      console.error('No cached data available, skipping this run.');
      return;
    }
  }

  console.log(`  ${states.length} aircraft in range`);

  for (const route of ROUTES) {
    const frac = estimateDelayFraction(states, route);
    if (frac === null) {
      console.log(`  ${route.id}: no flights detected`);
      // Store null to indicate no data (don't stale-out old readings — let old data persist)
      continue;
    }
    console.log(`  ${route.id}: delay_index=${frac.toFixed(2)}`);
    await upsertDelay(route.id, frac, 0);
  }

  console.log(`\nDelay index update complete at ${new Date().toISOString()}`);
}

// Also expose a lightweight HTTP endpoint for the frontend
const http = require('http');
const url = require('url');

function startHttp() {
  const srv = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);

    if (parsed.pathname === '/api/delays') {
      const { data, error } = await supabase
        .from('route_delays')
        .select('route, delay_index, flights_count, updated_at')
        .order('delay_index', { ascending: false })
        .limit(20);

      if (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ routes: data || [], fetched_at: new Date().toISOString() }));
      return;
    }

    if (parsed.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  srv.listen(3002, '0.0.0.0', () => {
    console.log('Delay index HTTP server on :3002');
  });
}

// Main: run once or continuously
const MODE = process.argv[2] || 'once'; // 'once' or 'server'

async function getStoredData() {
  if (storageMode === 'supabase') {
    const { data } = await supabase
      .from('route_delays')
      .select('route, delay_index, flights_count, updated_at')
      .order('delay_index', { ascending: false });
    return { routes: data || [], source: 'supabase' };
  } else {
    try {
      const fs = require('fs');
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
      return { routes: Object.values(JSON.parse(raw)), source: 'json' };
    } catch {
      return { routes: [], source: 'none' };
    }
  }
}

async function main() {
  storageMode = await ensureTable();

  if (MODE === 'server') {
    console.log('Starting delay index service (server mode)...');
    // Override HTTP handler to use storageMode
    const http = require('http');
    const url = require('url');
    const srv = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url, true);
      if (parsed.pathname === '/api/delays') {
        const result = await getStoredData();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ...result, fetched_at: new Date().toISOString() }));
        return;
      }
      if (parsed.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
      }
      res.writeHead(404);
      res.end('Not Found');
    });
    srv.listen(3002, '0.0.0.0', () => {
      console.log('Delay index HTTP server on :3002');
    });
    // Recompute every 5 minutes
    setInterval(async () => {
      try { await computeDelayIndex(); } catch (e) { console.error(e); }
    }, 5 * 60 * 1000);
    await computeDelayIndex();
  } else {
    await computeDelayIndex();
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
