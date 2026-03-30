-- AviationHub Incidents Table Setup
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- to create the incidents table before running fetch-ntsb-incidents.ts

CREATE TABLE IF NOT EXISTS public.incidents (
  id          TEXT        PRIMARY KEY,
  type        TEXT,
  date        DATE,
  flight      TEXT,
  airline     TEXT,
  aircraft    TEXT,
  fatalities  INTEGER     DEFAULT 0,
  route       TEXT,
  summary     TEXT,
  severity    TEXT,
  source      TEXT,
  status      TEXT        DEFAULT 'published',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anon access (RLS can be tightened later)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.incidents FOR UPDATE USING (true);

-- Upsert support
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
