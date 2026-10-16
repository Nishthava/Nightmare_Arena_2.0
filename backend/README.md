# Nightmare Arena API

This Node.js 22+ backend uses `@supabase/server` to verify Supabase user JWTs.
The `GET /api/me` endpoint returns the verified caller's identity and requires
an `Authorization: Bearer <access-token>` header. `GET /health` is an
unauthenticated health check.

## Local setup

```sh
npm install
cp .env.example .env
# Replace SUPABASE_SECRET_KEY in .env with a newly generated secret key.
npm run dev
```

The server listens on port 3000 by default. Set `FRONTEND_ORIGIN` to the exact
origin serving the frontend when running outside local development. Keep `.env`
private; never add secret keys to frontend `VITE_*` variables or commit them.
