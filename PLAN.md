# Project Plan: Weather Static Web App (Node 20 + Azure Functions)

## 1. Overview
Private Azure Static Web App (SWA) in org **AshikMSFTAI**. Frontend: React + Vite + TypeScript (Node 20). Backend: Azure Functions (TypeScript) under `/api`. Initial capability: Display weather (current conditions + temperature) for:
- Seattle, WA
- Washington, DC

Data Source: NOAA National Weather Service (no API key, requires custom `User-Agent`).

Goals:
1. Deliver minimal but production-ready SWA with CI/CD via GitHub Actions.
2. Clean separation for future expansion (more cities, additional APIs: air quality, alerts, etc.).
3. Good developer ergonomics (lint, tests, typed functions, clear README, extensibility backlog).

---
## 2. Architecture (Initial)
```
root/
  PLAN.md
  README.md
  package.json
  app/                # Vite React app (appLocation)
    src/
      components/
      lib/
      pages/
      main.tsx
    index.html
  dist/               # Build output (outputLocation)
  api/                # Azure Functions (apiLocation)
    getWeather/
      function.json
      index.ts
    shared/
      cities.ts       # City metadata mapping
      weatherClient.ts
  .github/
    workflows/
      azure-static-web-apps.yml
  .vscode/ (optional dev settings)
```

Key boundaries:
- Frontend never calls NOAA directly (all via `/api/getWeather`).
- Function handles caching, normalization, error smoothing.
- Response contract stable for future clients.

---
## 3. Standards / Conventions
- Node 20 enforced via `"engines"` and CI setup.
- TypeScript strict mode where practical.
- Vitest for unit tests (fast + TS native).
- ESLint + Prettier (format on save recommendation).
- Environment variables: `WEATHER_USER_AGENT` (and future keys) set in GitHub + SWA configuration, not committed.

---
## 4. Task List & Status
(Status markers: ✅ done, 🚧 in-progress, ☐ not started)

| # | Task | Status | Notes |
|---|-------|--------|-------|
| 1 | Confirm project scope | ✅ | Private repo under AshikMSFTAI |
| 2 | Choose frontend stack | ✅ | React + Vite + TypeScript |
|29 | Install Node.js 20.x | 🚧 | NVM installed; open new PowerShell, then: `nvm list available` → `nvm install 20.x.x` → `nvm use 20.x.x` |
| 3 | Install SWA CLI | ☐ | Pending Node 20 availability |
| 4 | Initialize SWA project | ☐ | Run `npx swa init --yes` | 
| 5 | Set Node version | ☐ | Add `.nvmrc` & engines + workflow node-version |
| 6 | Scaffold frontend app | ☐ | `npm create vite@latest app -- --template react-ts` |
| 7 | Configure build paths | ☐ | Ensure `appLocation=app`, `outputLocation=dist` |
| 8 | Create Azure Functions API | ☐ | `api/` with `tsconfig.json`, `host.json`, `local.settings.json` |
| 9 | Implement weather function | ☐ | NOAA fetch + caching + retries |
|10 | Map city locations | ☐ | `cities.ts` with metadata |
|11 | Add response contract | ☐ | Document + ensure function output shape |
|12 | Frontend data fetch UI | ☐ | Component + hook to call API |
|13 | Error & rate limit handling | ☐ | Backoff + stale data fallback |
|14 | Environment configuration | ☐ | `WEATHER_USER_AGENT` secret |
|15 | Add linting & formatting | ☐ | ESLint + Prettier + scripts |
|16 | Add minimal tests | ☐ | Vitest: cities + weather client mock |
|17 | Create README | ☐ | Purpose, architecture, usage |
|18 | Initialize Git repo | ☐ | `.gitignore` + initial commit |
|19 | Push to GitHub (private) | ☐ | Create repo in org, set remote |
|20 | Set up SWA GitHub Action | ☐ | Workflow with correct paths |
|21 | Configure secrets | ☐ | GitHub + SWA env settings |
|22 | Local run & verify | ☐ | `swa start` end-to-end test |
|23 | Production deployment | ☐ | First CI deploy + smoke test |
|24 | Add observability hooks | ☐ | Basic structured logs |
|25 | Plan extensibility | ☐ | Backlog section in README |
|26 | License & governance | ☐ | MIT + conduct (if public later) |
|27 | Security review | ☐ | `npm audit` + secret scan |
|28 | Performance baseline | ☐ | Measure TTFB + doc baseline |

---
## 5. Execution Order (Proposed Waves)
1. Bootstrap: (3–7) CLI install → init → set Node → scaffold frontend → paths.
2. Backend Core: (8–11,13,14) Functions, weather logic, contract, error handling, env.
3. Frontend Integration: (12) UI consumption.
4. Quality Layer: (15–16) lint + tests.
5. Repo & CI/CD: (17–23) README → git → push → workflow → secrets → deploy.
6. Hardening & Insights: (24–28) logging, extensibility backlog, license, security, performance.

---
## 6. Weather Function Contract (v1)
`GET /api/getWeather?city=<id>`
- city id: `seattle`, `dc`
- 200 response body:
```json
{
  "city": "Seattle",
  "state": "WA",
  "temperature": { "value": 13.2, "unit": "C" },
  "conditions": "Light Rain",
  "updatedAt": "2025-10-14T18:23:00Z",
  "source": "NOAA-NWS"
}
```
- Errors: 400 (unknown city), 502 (upstream failure masked), 503 (transient; consider retry). On upstream failure with cached prior data (<5 min old), return cached + `"stale": true`.

---
## 7. Caching & Resilience Strategy
- In-memory cache (simple Map) keyed by city with `{ data, fetchedAt }`.
- TTL: 5 minutes (configurable constant).
- Retry: Up to 2 retries with exponential backoff (250ms, 500ms) on 5xx / network.
- NOAA rate considerations: Gentle request frequency (manual or future schedule).

---
## 8. CI/CD Plan
- GitHub Actions workflow triggers on push to `main` + PRs.
- Jobs:
  1. Install Node 20, restore deps.
  2. Lint + Test.
  3. Build frontend (`npm run build`) + prepare Functions.
  4. Azure Static Web Apps deploy action (uses SWA token / Azure auth from portal-generated workflow or manual action).
- Artifacts: Dist + API packaged automatically by SWA action.

---
## 9. Security & Compliance
- Secrets only via GitHub + SWA configuration (never commit `local.settings.json`).
- Add dependency audit in CI (non-blocking first, can enforce later).
- Future: Add CodeQL, Dependabot.

---
## 10. Observability (Future Enhancements)
- Add Application Insights binding or logging once scale increases.
- Trace IDs per request (middleware util) for correlation.

---
## 11. Extensibility Backlog (Initial Ideas)
- Additional cities parameterization.
- Air Quality API integration.
- Severe Weather Alerts endpoint.
- Edge caching (CDN rules) for weather endpoint.
- Dark mode / theme toggle in UI.
- PWA offline fallback with last cached data.

---
## 12. Update Process
Each time a task status changes:
1. Update centralized task state (automation / manual step).
2. Reflect here by switching symbol (☐ → 🚧 → ✅) and adding any material notes.
3. Append material architectural decisions to a "Changelog" section (add when first change occurs).

---
## 13. Immediate Next Step
Complete Task 3 (Install SWA CLI) then run Task 4 (`npx swa init --yes`).

---
## 14. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| NOAA API intermittent | Retry + cache fallback |
| Function cold start latency | Keep function lightweight; consider pre-warm later |
| Path misconfiguration (app vs output) | Validate config before first deploy |
| Secrets leakage | `.gitignore` + review prior to first push |
| Future API version drift | Stable contract + tests |

---
## 15. Dependencies Summary
- Runtime: Node 20
- Core Dev: React, Vite, TypeScript
- Tooling: ESLint, Prettier, Vitest, SWA CLI
- Fetch: Native `fetch` (Node 20 built-in) or `undici` fallback (only if needed)

---
## 16. Pending Decisions
- Add CSS framework? (Tailwind vs none) – default: minimal custom CSS first.
- Introduce state management? – Not needed MVP.

---
*Document version: Initial draft (created before scaffold).*
