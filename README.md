# Weather Static Web App

Azure Static Web App showcasing current weather snapshots for Seattle, WA and Washington, DC using NOAA (National Weather Service) data. Built with React (Vite + TypeScript) frontend and Azure Functions (Node 20) backend.

## Stack
- Frontend: React 18 + Vite + TypeScript (app/)
- Backend: Azure Functions (HTTP trigger) in TypeScript (api/)
- Hosting: Azure Static Web Apps (SWA)
- Tooling: Vitest (tests), ESLint + Prettier (quality), SWA CLI for local integration

## API Contract
`GET /api/getWeather?city=<seattle|dc>[&debug=1]`

Response shape (example):
```json
{
  "city": "Seattle",
  "state": "WA",
  "temperature": { "value": 11.5, "unit": "C" },
  "conditions": "Cloudy",
  "updatedAt": "2025-10-14T16:30:00Z",
  "source": "NOAA-NWS",
  "stale": false,
  "error": null,
  "upstreamStatus": 200
}
```
`debug=1` forces a 200 status even when upstream errors occur (to inspect diagnostics fields like `upstreamStatus`, `upstreamUrl`, `upstreamStep`).

## Local Development
Prerequisites: Node 20.x (Functions runtime compatibility) & SWA CLI.

```bash
# From repo root
npm --prefix api install
npm --prefix app install
npm --prefix api run build   # compile functions
npm --prefix app run dev     # or build for production: npm --prefix app run build

# Integrated (if SWA CLI installed globally)
swa start --app-location app --output-location dist --api-location api
```

If `swa` not on PATH, use: `npx @azure/static-web-apps-cli start ...`

## Environment
`api/local.settings.json` (ignored from git) holds `WEATHER_USER_AGENT`:
```
WEATHER_USER_AGENT=WeatherSWA/0.1 (contact: you@example.com; https://your.site)
```
For production, set this in SWA Configuration & GitHub repo secret (e.g. `WEATHER_USER_AGENT`).

## Quality
```bash
npm --prefix api test           # backend tests (Vitest)
npm --prefix api run lint       # lint API
npm --prefix app run lint       # lint frontend
npm --prefix app run format     # prettier write
```

## Deployment (Planned)
CI workflow will:
1. Use Node 20 via `actions/setup-node` & `.nvmrc`
2. Install + test API
3. Build frontend
4. (Future) Deploy via SWA GitHub Action / `swa deploy`

## Future Enhancements
- Fahrenheit display toggle
- Additional cities & caching improvement (shared or edge)
- App Insights integration
- Air quality / alert feeds

## License
(To be added – MIT planned)
