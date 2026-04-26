# BodyWise AI

Personal Body & Skin Intelligence Platform — React (Vite) frontend + Express backend + Supabase (optional).

## Replit Setup

This project runs as two workflows in development and as a single Express process in production (Express serves the built frontend).

### Ports
- **Frontend (Vite dev server)**: `5000` on `0.0.0.0` — the only port exposed to the Replit preview iframe.
- **Backend (Express API)**: `3001` on `localhost` — proxied from the frontend.

### Workflows
- `Frontend`: `cd frontend && npm run dev` (Vite, webview)
- `Backend`: `cd backend && PORT=3001 node --watch server.js` (Express, console)

### Frontend Configuration (`frontend/vite.config.js`)
- `host: "0.0.0.0"`, `port: 5000`, `strictPort: true`
- `allowedHosts: true` so Replit's proxied iframe host is trusted
- `hmr.clientPort: 443` so HMR works through Replit's HTTPS proxy
- Dev proxy forwards `/api` and `/health` to `http://localhost:3001`

### API Client (`frontend/src/services/api.js`)
- `baseURL` defaults to `""` so requests go through the Vite dev proxy in development and hit Express directly in production.
- Override with `VITE_API_URL` if you need to point at a remote backend.

### Supabase (optional)
- Frontend uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Backend uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- If unset, the frontend Supabase client falls back to a stub (so the UI still renders) and the backend habit endpoints return mock data.

### OpenAI (optional)
- Backend uses `OPENAI_API_KEY` for richer insights. If unset, mock insights are returned.

## Production Deployment

Configured as **Autoscale**:
- Build: `cd frontend && npm install && npm run build && cd ../backend && npm install`
- Run: `cd backend && PORT=5000 node server.js`
- Express serves `frontend/dist` for any non-`/api`, non-`/health` path.

## Project Structure

```
backend/
  server.js            # Express entrypoint, also serves frontend/dist in prod
  config/              # env + supabase admin client
  routes/apiRoutes.js  # /api endpoints
  controllers/         # analyze + habit handlers
  services/            # health calc + AI service (OpenAI optional)
frontend/
  vite.config.js       # Replit-aware Vite config (host, proxy, HMR)
  src/
    App.jsx                       # Router + auth gate (multi-page)
    styles/design-system.css      # Design tokens, sidebar, glass cards
    components/
      Layout.jsx                  # Sidebar shell + <Outlet/>
      Sidebar.jsx                 # Nav links to all pages
      ProtectedRoute.jsx          # Auth guard
      ui/index.jsx                # Reusable primitives
                                  # (Spinner, Field, Toggle, ScoreRing, etc.)
    context/BodyWiseContext.jsx   # Shared inputs/results + API calls
    pages/
      AuthPage.jsx                # Sign in / sign up
      DashboardPage.jsx           # Overview: scores + summary
      AnalyzePage.jsx             # Body / skin / lifestyle inputs
      ResultsPage.jsx             # Read-only consolidated report
      DietPage.jsx                # Food intelligence + habit coach
      ProfilePage.jsx             # Account + metric snapshot
    hooks/useAuth.js              # Supabase session hook
    services/                     # api.js, supabaseClient.js (stub when unset)
supabase/seed.sql                 # schema/seed for habits etc.
```

## Frontend Routing

| Path        | Page              | Notes                                     |
| ----------- | ----------------- | ----------------------------------------- |
| `/auth`     | AuthPage          | Public sign in / sign up                  |
| `/`         | DashboardPage     | Wrapped in `Layout` (sidebar)             |
| `/analyze`  | AnalyzePage       | Body, skin & lifestyle input forms        |
| `/results`  | ResultsPage       | Aggregated read-only report               |
| `/diet`     | DietPage          | Food analyzer + habit toggles             |
| `/profile`  | ProfilePage       | Account info + sign out                   |
| `*`         | redirects to `/`  |                                           |

All authenticated pages share state through `BodyWiseProvider`, so analysis data persists when navigating between pages within a session.

## API Endpoints
- `GET  /health`
- `POST /api/analyze-body`
- `POST /api/analyze-skin`
- `POST /api/predict`
- `GET  /api/habits?userId=<uuid>`
- `POST /api/habits`
- `POST /api/food`
- `POST /api/lifestyle`

## Recent Changes
- 2026-04-26: Initial Replit import. Configured Vite for Replit proxy (host 0.0.0.0, allowed hosts, HMR client port, `/api` proxy to backend on 3001). Made Supabase client tolerant of missing env vars so the UI renders without keys. Added Express static-serve of `frontend/dist` for production. Configured Autoscale deployment.
