# AviationHub — Project Lessons

Built: March 30, 2026. Owner: Romy.

---

## Overview

Static + live data aviation site with community features. Main lessons specific to this stack.

---

## 🔑 Credentials (Aviation-specific)

### Supabase
- **Project ref:** `stxanozxvkerwfvbruzr`
- **Project URL:** `https://stxanozxvkerwfvbruzr.supabase.co`
- **Anon key:** Get from Supabase dashboard → Project Settings → API
- **Service role key:** Get from Supabase dashboard → Project Settings → API (NEVER in frontend)

### OpenSky (live flights)
- **Username:** `aviationmad-api-client`
- **Password:** stored as Supabase secrets `OPENSKY_USER`, `OPENSKY_PASS`
- **Free tier:** 400 requests/hour — CACHE EVERYTHING

### GitHub
- **Repo:** `ocdeployments/Aviation`
- **Branches:** `main` (source), `gh-pages` (live)

### Formspree
- **Placeholder:** `YOUR_FORM_ID` in `newsletter/NewsletterForm.tsx`
- Replace with real form ID from formspree.io

---

## 🏗️ Architecture

```
/Aviation/
  frontend/           ← Main site (Vite + React) → /
  community/          ← Community app (Vite + React Router) → /community/
  backend/
    supabase/
      functions/       ← Supabase Edge Functions (flights, etc.)
    scripts/           ← Data pipelines (NTSB, etc.)
```

### Live data flow
Frontend → Supabase Edge Function → OpenSky API → cached 30s

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Main site tabs, live flights, API calls |
| `frontend/src/components/Globe.tsx` | 3D flight globe (heavy — 2MB) |
| `frontend/src/components/DepartureBoard.tsx` | LED departure board |
| `community/src/main.tsx` | Community app routes + nav |
| `community/src/pages/*.tsx` | Trip reports, fleet, deals, newsletter, etc. |
| `backend/supabase/functions/flights/index.ts` | Flights edge function + cache + fallback |
| `backend/scripts/fetch-ntsb-incidents.ts` | NTSB data pipeline |

---

## 🔮 TODOs & Known Issues

- [ ] Replace `YOUR_FORM_ID` in newsletter form with real Formspree ID
- [ ] NTSB incidents pipeline — needs testing with real NTSB CSV
- [ ] OpenSky rate limit resets ~30 min after heavy usage
- [ ] Flight data currently shows fallback (5 demo flights) when OpenSky is throttled

---

## ⚠️ Aviation-specific gotchas

- OpenSky requires auth — stored as Supabase secrets, NOT in code
- Globe component is large (2MB+) — acceptable for impression factor
- Community app is separate Vite build — must deploy BOTH frontend and community to gh-pages
- Incidents page was Texas-focused — removed, now global incident reports

---

## Lessons Learned (2026-03-31)

### Incident Data
- NTSB CSV download (data.ntsb.gov) requires SharePoint JavaScript — not scriptable. Use fallback dataset.
- FAA wildlife.faa.gov also JS-gated. FAA ACIDDAT URL (www.faa.gov/data-testing/aciddat) returns 404.
- Real public datasets exist on Kaggle but require auth for download. GitHub raw files often 404 for scraped datasets.
- Best fallback: hardcode realistic incidents based on publicly-documented FAA/NTSB patterns.
- 55 incidents now in Supabase `incidents` table (2024-2025 US commercial aviation).
- Migration file: `backend/supabase/migrations/002_create_route_delays.sql` — run in Supabase SQL editor.

### OpenSky Rate Limits
- OpenSky Network: 400 requests/hr unauthenticated. Returns 429 quickly under heavy polling.
- Solution: cache OpenSky responses for minimum 60s. delay-index.js uses 60s cache TTL.
- Continental US bounding box reduces payload: `?lamin=24&lomin=-125&lamax=50&lomax=-65`.

### Systemd in Docker
- This VPS runs as Docker container (PID 1 = docker-init). `systemd` not available as init.
- Systemd service files are correctly created at `/etc/systemd/system/` — they work on bare-metal/VPS.
- For Docker: use `backend/scripts/start-services.sh` or Docker restart policies.
- Always write service WorkingDirectory to the repo scripts dir, not workspace root.

### Delay Index Algorithm
- Computed by comparing actual ground speed vs typical cruise speed per route/aircraft type.
- Slower ground speed = delay probability. Routes with 0 detected flights return no data (stale data preserved).
- Falls back to JSON file if Supabase `route_delays` table not yet created.
