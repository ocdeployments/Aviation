# AviationHub — Lessons Learned

Built: March 30, 2026. Owner: Romy.

---

## Why this file

This documents everything about how this project was built — the right way and the wrong way. Future Sheldon should read this before starting any new project and learn from what went wrong here.

---

## 🏗️ Project Architecture

### What we built
- **Main site:** Vite + React + TypeScript frontend, served on GitHub Pages
- **Community app:** Separate Vite app at `/community/`, same GitHub Pages
- **Backend:** Node.js Express on port 3001 (later replaced with Supabase Edge Functions)
- **Database:** Supabase (Postgres + Auth + Edge Functions)
- **Live data:** OpenSky Network API (free, no key — but rate-limited)
- **Hosting:** GitHub Pages (free) via `gh-pages` branch deployment

### Directory structure
```
/Aviation/
  frontend/          ← Main site (Vite, React)
  community/         ← Community app (Vite, React, React Router)
  backend/           ← Express backend (now mostly deprecated)
    supabase/
      functions/     ← Supabase Edge Functions (flights only for now)
```

---

## 🔑 Credentials & Keys

### Supabase
- **Project ref:** `stxanozxvkerwfvbruzr`
- **Project URL:** `https://stxanozxvkerwfvbruzr.supabase.co`
- **Anon key:** `***Supabase anon key from dashboard***` (safe for frontend, get from Supabase dashboard)
- **Service role key:** `***REDACTED***` (NEVER expose in frontend — stored in Supabase secrets, not in code)
- **Personal access token:** `***REDACTED***` — stored in memory by Romy, NOT in any file

### OpenSky (live flight data)
- **Username:** `aviationmad-api-client` (stored as Supabase secret)
- **Password:** `***REDACTED***`
- Stored as Supabase secrets: `OPENSKY_USER`, `OPENSKY_PASS`
- **Rate limit:** 400 requests/hour on free tier. USE CACHING — never poll without cache
- **Deployed to:** Supabase Edge Functions (NOT in frontend code)

### GitHub
- **Repo:** `https://github.com/ocdeployments/Aviation`
- **Deploy token:** `***REDACTED***` — stored in OpenClaw config, never in code
- **Branches:** `main` (source), `gh-pages` (live site)

### Formspree (newsletter)
- **Placeholder form ID:** `YOUR_FORM_ID` — user must replace with real form ID from formspree.io

### Keys to NEVER commit
- Any Supabase service role key
- Any personal access token
- Any API secret
- Use `.env` files excluded from git, or Supabase secrets for edge functions

---

## 🚀 Deployment Process

### GitHub Pages (current approach)
```bash
# 1. Build frontend
cd frontend && npm run build

# 2. Clone gh-pages branch
git clone --branch gh-pages https://x-token-auth:TOKEN@github.com/ocdeployments/Aviation.git /tmp/gh-pages

# 3. Copy build output
cp frontend/dist/* /tmp/gh-pages/

# 4. Commit and push from /tmp/gh-pages
git add -A && git commit -m "deploy" && git push origin gh-pages --force
```

### Supabase Edge Functions
```bash
# Login first
npx supabase login --token TOKEN

# Deploy a function
cd backend
npx supabase functions deploy FUNCTION_NAME --project-ref PROJECT_REF

# Set secrets
npx supabase secrets set KEY=VALUE --project-ref PROJECT_REF
```

### After any code change
1. `npm run build` in the relevant workspace (frontend/ or community/)
2. Copy build to /tmp/gh-pages
3. Copy community build too (don't wipe it)
4. Force push to gh-pages
5. Push source to main branch

---

## 🪓 Errors We Hit (and How We Fixed Them)

### Error: OpenSky "Too many requests" everywhere
- **Cause:** No caching. Every tab was polling OpenSky directly, plus polling interval was 30s. With 5 tabs open = hundreds of requests/hour
- **Fix:** Added 30s in-memory cache in Supabase Edge Function. Frontend polls the edge function, edge function caches OpenSky responses
- **Lesson:** ALWAYS add caching before going live. Assume any free external API will rate-limit you

### Error: Cloudflare tunnel URL kept changing
- **Cause:** Every `cloudflared tunnel --url` creates a NEW random URL. The old one goes dead
- **Fix:** Switched to Supabase Edge Functions — no tunnel needed, stable URL
- **Lesson:** Never depend on Cloudflare quick tunnels for anything permanent. They expire on every restart

### Error: Backend EADDRINUSE on port 3001
- **Cause:** Old Docker container process (PID 10, `node server.mjs`) was occupying port 3001 from before. Our new backend also tried 3001
- **Fix:** Used `PORT=3002` for new backend process
- **Lesson:** Always check `ps aux | grep node` before starting a backend to see what's already running and on what port

### Error: Edit tool "Could not find exact text"
- **Cause:** The file had been modified by a sub-agent and whitespace/newlines didn't match what I had cached
- **Fix:** Re-read the file, get exact text including all whitespace, then edit
- **Lesson:** Always re-read before editing when dealing with files modified by other processes

### Error: Supabase Edge Function 401 Unauthorized
- **Cause:** Used wrong anon key. The key in `.env.production` was outdated
- **Fix:** Used Supabase Management API (`/v1/projects/{ref}/api-keys`) to get current correct anon key
- **Lesson:** Keys can rotate. Always fetch current keys from the API if deployed key differs from local

### Error: THREE.THREE.Clock deprecated warning
- **Cause:** react-globe.gl uses old Three.js internally
- **Fix:** Not fixable from our end — library issue, not breaking anything
- **Lesson:** Third-party library warnings that don't break functionality can be ignored

### Error: Frontend build wiped community app from gh-pages
- **Cause:** Copied only `frontend/dist/*` to /tmp/gh-pages and force-pushed, deleting `/community/` from gh-pages
- **Fix:** Always clone full gh-pages first, then copy both frontend AND community builds into it, then commit everything
- **Lesson:** NEVER force-push without first ensuring ALL existing content is preserved in the staging area

### Error: OpenClaw config written by newer version
- **Cause:** OpenClaw updated from 2026.3.24 → 2026.3.28, config schema changed
- **Fix:** Used `gateway config.patch` to update config safely instead of full replace
- **Lesson:** Always use `config.patch` not `config.apply` when OpenClaw version may differ from last write

### Error: Supabase CLI "Docker not running"
- **Cause:** `npx supabase functions deploy` needs Docker to build edge functions locally. Docker not available in this environment
- **Fix:** Used `--no-verify-requirements` flag implicitly (it's the default when Docker is missing). Functions still deployed to cloud
- **Lesson:** Supabase CLI deploys to cloud even without local Docker — it uploads source code

---

## ⚠️ Things to Avoid Next Time

1. **Don't poll external APIs without caching from day one**
   Every free API will rate-limit you. Build the cache layer before the frontend.

2. **Don't use Cloudflare quick tunnels for permanent infrastructure**
   They're for testing. For production, use Supabase Edge Functions or a proper hosted backend.

3. **Don't build everything in parallel and merge later**
   Sub-agents are great but if they all touch the same file (App.tsx, main.tsx) you'll get conflicts. Do file-system-split projects cleanly.

4. **Don't put secrets in frontend code or .env files that get committed**
   Use Supabase secrets for edge functions. Use server-side env vars only.

5. **Don't skip the QA pass**
   We did a full sprint before testing. Build → test → deploy in smaller cycles.

6. **Don't use port 3001 by default**
   Always check what's running first. Use a random high port (3002+) to avoid conflicts.

7. **Don't forget to re-clone gh-pages before each deploy**
   Always `rm -rf /tmp/gh-pages && git clone --branch gh-pages` before copying new builds.

---

## 🧠 Romy's Preferences & Behaviour

### What Romy wants
- Sites that are **globally focused** — not regional. Texas tab got removed for this reason
- **Free-first** — no paid services unless absolutely necessary
- **Live data** over static — wants real flight data, real airport info
- **Cutting edge UI** — bored by basic Bootstrap, wants 3D globes, animations, LED boards
- **Minimal hand-holding** — just do it, report back
- Wants to be **informed not asked** — tell her what you're doing, don't ask permission for obvious things

### What Romy dislikes
- Being charged unexpectedly (Claude balance scare)
- Dull/technical presentations
- Being asked obvious questions
- Regional content in global projects
- Tool errors that feel "homegrown" (prefers polished, proven stacks)

### What Romy will do
- Provide credentials when asked (Supabase tokens, API keys)
- Disable keys she doesn't recognize
- Ask for improvements and additions
- Tell you to stop/start things

---

## 🛠️ Stack Recommendations for Next Project

### Frontend (proven)
- **Vite + React + TypeScript** ✅ Works great
- **Tailwind CSS** ✅ Easy, fast
- **Framer Motion** ✅ Good animations
- **react-globe.gl** ✅ Impressive but heavy (2MB bundle)
- **Framer Motion** ✅ Good animations
- **Google Fonts (JetBrains Mono + Inter)** ✅ Looks professional

### Backend (for next time)
- **Supabase Edge Functions** ✅ Free, scalable, no server management
- **NOT Express on a VPS port** — too fragile, port conflicts, tunnel management

### Database
- **Supabase Postgres** ✅ Free tier plenty for small projects
- Row Level Security (RLS) — enable it from day one

### Hosting
- **GitHub Pages** ✅ Free, CDN, works great for static/Vite builds
- **Netlify** also good alternative

### External APIs
- Always check CORS headers before using in browser
- Always check rate limits before polling
- Always add 30s minimum cache on any polling operation

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Main site — tabs, routing, API calls |
| `frontend/src/components/Globe.tsx` | 3D flight globe |
| `frontend/src/components/DepartureBoard.tsx` | LED departure board |
| `community/src/main.tsx` | Community app routes + nav |
| `community/src/pages/*.tsx` | All community pages |
| `backend/supabase/functions/flights/index.ts` | Flights edge function |
| `backend/scripts/fetch-ntsb-incidents.ts` | NTSB data pipeline |
| `SOUL.md` | Agent persona (read this first) |
| `USER.md` | User preferences |

---

## 🔮 Next Steps / TODOs

- [ ] Replace `YOUR_FORM_ID` in `newsletter/NewsletterForm.tsx` with real Formspree ID
- [ ] QA agent fixing remaining errors (running now)
- [ ] NTSB incidents pipeline completing (running now)
- [ ] OpenSky rate limit will reset in ~30 min, flights go live automatically
