-- Migration: 001_create_flights_table.sql
-- Desc: Ingest OpenSky Network flight states into Supabase
-- Run: supabase db push or apply via Supabase dashboard

BEGIN;

CREATE TABLE IF NOT EXISTS flights (
  id          BIGSERIAL PRIMARY KEY,
  icao24      TEXT        NOT NULL,
  callsign    TEXT,
  origin_country TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  baro_altitude INTEGER,
  on_ground   BOOLEAN   DEFAULT false,
  velocity_kmh INTEGER,
  true_track  INTEGER,
  vertical_rate INTEGER,
  last_contact BIGINT,     -- Unix epoch seconds from OpenSky
  fetched_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  -- Unique constraint: upsert on icao24 + last_contact window
  -- (OpenSky last_contact is per-flight-window, not globally unique;
  --  use a composite of icao24 + fetched_at truncated to the minute)
  unique_flight_id TEXT GENERATED ALWAYS AS (
    icao24 || '-' || (last_contact / 60)::bigint::text
  ) STORED
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_flights_unique
  ON flights ((icao24 || '-' || (last_contact / 60)::bigint::text));

CREATE INDEX IF NOT EXISTS idx_flights_icao24   ON flights (icao24);
CREATE INDEX IF NOT EXISTS idx_flights_callsign ON flights (callsign);
CREATE INDEX IF NOT EXISTS idx_flights_fetched  ON flights (fetched_at);
CREATE INDEX IF NOT EXISTS idx_flights_ground   ON flights (on_ground) WHERE on_ground = false;

-- Prune data older than 24h (call from cron or Supabase cron)
-- supabase/schedule: cron.schedule('prune-old-flights', '*/15 * * * *', $$
--   DELETE FROM flights WHERE fetched_at < now() - interval '24 hours';
-- $$);

COMMIT;
