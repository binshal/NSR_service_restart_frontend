# NSR Console (Next.js + Tailwind)

Dashboard for the NSR backup service simulator. Register servers, add NSR
services to each one, simulate a server failure (services stop), and restart
NSR services — the same action the Wings restart agent performs — with a
live event log per server.

## Local setup

```bash
npm install
cp .env.local.example .env.local
# set NEXT_PUBLIC_API_URL to your backend URL (http://localhost:5000 for local)
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Vercel → New Project → import the repo (framework preset: Next.js, auto-detected)
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` — your Render backend URL (e.g. `https://nsr-backend.onrender.com`)
4. Deploy

Make sure the backend's `CORS_ORIGIN` includes this Vercel URL once it's live.
