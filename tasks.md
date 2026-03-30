# AviationHub Mission Control — Tasks

**Status report: 2026-03-30 12:31 EDT**
**Orchestrator: Sheldon (main agent)**

---

## 1. Skill Installation

| Skill | Status |
|-------|--------|
| agent-task-tracker | ✅ Done |
| task-status | ✅ Done |
| opensky-network | ❌ Not found on ClawHub |
| faa-data | ❌ Not found on ClawHub (FAA data sourced via backend already) |
| github-actions | ✅ Done |
| agentguard | ⚠️ Flagged suspicious by VirusTotal — skipped |

**Total installed skills:** 9 (git, supabase, react, tailwindcss, agent-team-orchestration, vitest-testing, e2e-testing, agent-task-tracker, task-status, github-actions)

---

## 2. Agent Spawn Status

| Agent | Session Key | Status |
|-------|-------------|--------|
| frontend | 6b933135-9691-462a-9ee5-4924a1499a34 | Spawned (run mode) |
| backend | 08f8d111-84ee-405a-8d5c-08b0dc499d36 | Spawned (run mode) |
| data | 529af20c-de11-42dc-969f-5a6ad044ac46 | Spawned (run mode) |
| qa | 9ed067f1-8b2b-4bf1-b858-c32f689b86c2 | Spawned (run mode) |

All use MiniMax model (free tier).

---

## 3. Workspace

- **Path:** /data/.openclaw/workspace/Aviation
- **Live site:** https://ocdeployments.github.io/Aviation/
- **Repo:** https://github.com/ocdeployments/Aviation

---

## 4. Anti-Hallucination Rules (in SOUL.md)

- Never make up file paths, API endpoints, or data schemas
- Check actual files before editing
- If unsure, say so — do not guess
- Verify API responses before using them

---

## 5. Team Norms

- FREE FIRST on every decision
- Report Pending/Done per task
- All agents use MiniMax model (free)
- Workspace shared at /data/.openclaw/workspace/Aviation

---

---

## Sprint 1 (2026-03-30 12:41 EDT)

### QA Agent Task: Full Test Suite
- **Status:** In Progress
- **Agent:** aviation-qa-sprint1 (`5cb4663e...`)
- **Scope:** shared → backend → frontend
- **Order:** 1) shared utils tests, 2) backend API tests, 3) frontend component tests
- **Tool:** Vitest (free)
- **Report:** every 30min to tasks.md

### Data Agent Task: OpenSky Cron + Supabase Ingest
- **Status:** In Progress
- **Agent:** aviation-data-sprint1 (`f2583b82...`)
- **Trigger:** every 15 minutes
- **Source:** OpenSky Network `/api/states/all` (no key)
- **Target:** Supabase free tier DB
- **Table:** incidents / flights
- **Anti-hallucination:** Verify schema before insert

### Frontend Agent Task: Global Heatmap + SEO
- **Status:** In Progress
- **Agent:** aviation-frontend-sprint1 (`1d892c08...`)
- **Feature:** Global incident heatmap — "aviation incidents worldwide 2026"
- **SEO:** Meta tags, structured data, sitemap for aviation incidents
- **Map:** Use Leaflet.js (free, no API key) — no paid maps

### Frontend Agent (Local Bonus): Texas + Frisco Overlay
- **Status:** In Progress
- **Agent:** aviation-frontend-sprint1 (same)
- **Filter:** Texas incidents only
- **Overlay:** Frisco, TX map overlay (Leaflet.js — free)
- **Priority:** After global heatmap

### Reporting
- **Interval:** Every 30 minutes
- **File:** /data/.openclaw/workspace/Aviation/tasks.md
- **Format:** Per-agent Pending/Done status

---

*Last updated: 2026-03-30 12:41 EDT*