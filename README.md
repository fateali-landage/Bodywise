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
