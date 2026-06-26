# BodyWise AI - Personal Body & Skin Intelligence Platform

Production-ready startup MVP with React + Express + Supabase.

## Tech Stack
- Frontend: React (Vite), Tailwind CSS, Axios, React Router
- Backend: Node.js, Express REST API
- Database/Auth: Supabase PostgreSQL + Supabase Auth
- Deployment: Frontend on Vercel, Backend on Render

## Project Structure
```
/backend
  /routes
  /controllers
  /services
  /config
  server.js

/frontend
  /src
    /pages
    /components
    /services
    /hooks
```

## Local Setup

### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### Backend `.env`
```env
PORT=5000
FRONTEND_URL=*
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## API Endpoints
- `POST /api/analyze-body`
- `POST /api/analyze-skin`
- `POST /api/predict`
- `GET /api/habits?userId=<uuid>`
- `POST /api/habits`
- `POST /api/food`
- `POST /api/lifestyle`

## Sample API Responses

### `POST /api/analyze-body`
```json
{
  "success": true,
  "data": {
    "bmi": 23.4,
    "status": "Normal",
    "insight": "Your routine looks mostly stable...",
    "recommendations": [
      "Keep hydration at 2.5-3L/day.",
      "Maintain at least 7 hours of sleep.",
      "Include protein in every meal."
    ]
  }
}
```

### `POST /api/analyze-skin`
```json
{
  "success": true,
  "data": {
    "detected": ["acne", "dryness", "dark circles"],
    "concernLevel": "medium",
    "suggestions": ["Use gentle cleanser...", "Apply SPF 30+ every morning."]
  }
}
```

### `POST /api/predict`
```json
{
  "success": true,
  "data": {
    "weightTrend": "-1.2 kg/month",
    "skinConditionRisk": "Low-Moderate"
  }
}
```

### `POST /api/food`
```json
{
  "success": true,
  "data": {
    "food": "grilled chicken salad",
    "estimatedCalories": 220,
    "macros": { "protein": "18g", "carbs": "42g", "fats": "9g" }
  }
}
```

### `POST /api/lifestyle`
```json
{
  "success": true,
  "data": {
    "lifestyleScore": 82,
    "explanations": [
      "Consistent sleep supports hormone balance and skin repair.",
      "Smoking can reduce collagen and increase inflammation."
    ]
  }
}
```

## Supabase Setup + Seed Data
1. Create a new Supabase project.
2. Run SQL in `supabase/seed.sql`.
3. Create email/password users in Supabase Auth.
4. Use anon key in frontend env and service role key in backend env.

## Deploy Backend to Render
1. Push repo to GitHub.
2. Create a **Web Service** on Render.
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Set environment variables from `backend/.env.example`.
7. Confirm health check: `https://your-render-url/health`

## Deploy Frontend to Vercel
1. Create a new Vercel project from the same repo.
2. Root directory: `frontend`
3. Framework preset: Vite
4. Add env variables:
   - `VITE_API_URL=https://your-render-url`
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
5. Deploy and test login + dashboard calls.

## Notes
- AI integration uses OpenAI if `OPENAI_API_KEY` is provided, otherwise safe mock responses.
- Skin analyzer intentionally simulates detection (no complex ML), ideal for MVP demos.

## Progressive Web App (PWA) Support

BodyWise AI is equipped with production-grade PWA capabilities, turning it into an installable native-like application on desktop and mobile platforms.

### Features
- **Standalone installation**: Access the app from your home screen (on Android, iOS, Chrome, Edge) without browser controls.
- **Offline fallback page**: Custom page loaded dynamically if connection fails during navigation. Bypasses API/auth endpoints to maintain security.
- **Pre-cached static assets**: Service worker caches stylesheets, scripts, HTML structure, local images, and fonts for near-instant offline load times.
- **Idle-safe update process**: Auto-polls for newer platform builds and alerts users via a toast prompt. If the user is busy typing, chatting, uploading, or analyzing, the update prompt is delayed automatically until they are idle.
- **App shortcuts**: Context shortcuts for Dashboard, Analyze Signals, AI Coach, History Logs, Calorie Tracker, and Settings directly from the system icon.

### Local PWA Testing
1. Ensure node packages are installed:
   ```bash
   cd frontend
   npm install
   ```
2. Build the client assets and compile the service worker:
   ```bash
   npm run build
   ```
3. Test locally in preview mode:
   ```bash
   npm run preview
   ```
4. Open the localhost URL in Google Chrome or Microsoft Edge. You will see the install icon in the URL search bar.

### Service Worker Caching Architecture
- **HTML**: Network First (falls back to cached `offline.html` if network fails).
- **CSS / JS / Fonts**: Cache First (pre-cached during build).
- **Images**: Stale While Revalidate (immediate load from cache, background fetch for updates).
- **Auth / Supabase / Realtime / AI Endpoints**: Bypassed entirely (never cached) to guarantee JWT token security and real-time consistency.

### Browser Support Matrix
- **Android Chrome / Edge / Firefox**: Full support (install banner promotes app immediately).
- **iOS Safari / Chrome**: Support via "Add to Home Screen" sharing control.
- **Desktop Chrome / Edge / Opera**: Full support (install icon in URL bar).
- **Desktop Firefox / Safari**: Standard PWA limitations (caching and service worker active, standalone window relies on extension/native shortcuts).

### Troubleshooting
- **SW not active**: Verify you are running on `localhost` or a secure `https://` origin. Service workers require HTTPS for security.
- **Out of date cache**: Click "Update Now" on the version prompt, or clear the storage in Chrome Developer Tools (Application -> Clear Site Data).

