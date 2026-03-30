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
