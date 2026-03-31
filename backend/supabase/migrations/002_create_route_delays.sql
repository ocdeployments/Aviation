-- Migration: 002_create_route_delays.sql
-- Desc: Stores route-level delay indices computed from OpenSky live data
-- Run in Supabase SQL Editor (https://supabase.com/dashboard/project/stxanozxvkerwfvbruzr/sql)

BEGIN;

CREATE TABLE IF NOT EXISTS route_delays (
  route          TEXT PRIMARY KEY,
  delay_index    REAL,         -- 0.0 = no delays, 1.0 = all flights delayed
  flights_count  INTEGER,      -- number of flights sampled for this update
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE route_delays IS 'Delay index per route. Computed by delay-index.js every 5 min. Sources: OpenSky Network live data.';

-- Auto-update updated_at on upsert
CREATE OR REPLACE FUNCTION update_route_delay_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_route_delays_updated
  BEFORE UPDATE ON route_delays
  FOR EACH ROW EXECUTE FUNCTION update_route_delay_timestamp();

COMMIT;
