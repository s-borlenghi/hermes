# Hermes

A job-application tracking API and web app, built the way a small production service would be — not a tutorial CRUD app.

**[Live app](https://s-borlenghi.github.io/hermes/)** · **[Live API docs (Swagger)](https://hermes-api-ypyk.onrender.com/docs)** · Backend: FastAPI + SQLAlchemy 2.0 + SQLite, deployed on Render. Frontend: a React + TypeScript SPA on GitHub Pages that talks to the live API.

> The Render free tier spins down when idle — the first request after a while can take up to ~50s to wake it back up. The app shows a wake-up screen instead of a blank spinner while that happens.

## What it does

Hermes tracks companies, job applications, and interview stages per user, then turns that into analytics: response rate, interview rate, offer rate, and an applications-over-time view. Visitors can either click through a read-only public demo or register a real account and use the full CRUD app.

- **Auth**: JWT (OAuth2 password flow), bcrypt password hashing, rate-limited login/register.
- **Multi-tenant CRUD**: companies, applications, and nested interview stages, all scoped to the authenticated user — ownership is checked on every read and write, not just at creation.
- **Filtering & pagination** on the applications list (by status, free-text search, skip/limit).
- **Analytics**: `/stats/summary` (counts by status, response/interview/offer rate) and `/stats/timeline` (applications per month), rendered as charts in the frontend.
- **Public read-only demo layer** (`/demo/*`): the same analytics and listing endpoints, but served from one fixed seeded account with no auth required — this powers the frontend's `/demo` page, and it has no write access to real user data.
- **Migrations**: schema changes are Alembic revisions, not `Base.metadata.create_all` — the container runs `alembic upgrade head` on boot.
- **Tests**: pytest + FastAPI's `TestClient` on the backend, each test getting its own throwaway SQLite file, no mocked ORM layer.
- **CI/CD**: GitHub Actions runs `ruff` + the pytest suite on backend changes, and builds + deploys the frontend to GitHub Pages on frontend changes — two independent pipelines, each scoped by path.

## Project layout

```
backend/
  app/
    main.py            FastAPI app, CORS, rate-limit wiring
    models.py           SQLAlchemy models (User, Company, Application, InterviewStage)
    schemas.py           Pydantic request/response models
    security.py           password hashing + JWT
    routers/
      auth.py               register / login / me
      companies.py           company CRUD
      applications.py         application CRUD + interview stages
      stats.py                 authenticated analytics
      demo.py                   public read-only analytics (backs the frontend's /demo page)
    seed.py              seeds the fixed demo account with sample data
  alembic/             migrations
  tests/               pytest suite
  Dockerfile
frontend/              React + TypeScript SPA (Vite), deployed to GitHub Pages
  src/
    api/                 typed fetch client + response types
    auth/                 AuthContext (JWT in localStorage) + RequireAuth route guard
    components/            shared UI: nav shell, stat tiles, charts, wake-up gate
    pages/                  Landing, Demo, Login, Register, Dashboard, Applications, ApplicationDetail, Companies
.github/workflows/
  ci.yml                 backend: ruff + pytest, path-scoped to backend/**
  deploy-frontend.yml     frontend: build + deploy to Pages, path-scoped to frontend/**
render.yaml            Render blueprint (rootDir: backend) — must live at the repo root to be auto-detected
```

## Running it locally

Requires Python 3.12+ and Node 20+.

**Backend:**

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # .venv\Scripts\activate on Windows cmd, or source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt

cp .env.example .env          # edit SECRET_KEY etc. if you like
alembic upgrade head
python -m app.seed            # optional: seeds the demo account so /demo/* has data
uvicorn app.main:app --reload
```

API is now at `http://127.0.0.1:8000`, interactive docs at `/docs`. Make sure `CORS_ORIGINS` in your `.env` includes `http://localhost:5173` so the local frontend can call it.

Run the tests and linter:

```bash
pytest -q
ruff check app tests
```

**Frontend** (in a second terminal):

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173/hermes/` and reads `.env.development` (`VITE_API_BASE_URL=http://127.0.0.1:8000`) — no edits needed for local dev. Type-check and lint with `npx tsc -b --noEmit` and `npm run lint`; production-build with `npm run build`.

## Deploying your own copy

1. **Backend → Render**: push this repo to your own GitHub account, then in Render create a new Blueprint from it (`render.yaml` is already set up — it provisions the web service and generates `SECRET_KEY`/`DEMO_USER_PASSWORD` for you). Set `CORS_ORIGINS` to your actual `https://<you>.github.io` origin.

   Render's free tier has no persistent disk, so the SQLite file lives in the container's ephemeral filesystem: it survives idle spin-down/wake-up, but resets on every new deploy (each push to `main`). The Dockerfile reseeds the demo account on every boot regardless, so `/demo/*` always has data; any real accounts a visitor registers will be wiped on your next push. That's an intentional tradeoff for a free, zero-maintenance demo — if you want real persistence, upgrade the instance type and add a Render Disk (or point `DATABASE_URL` at a managed Postgres instance instead).
2. **Frontend → GitHub Pages**: in the repo's Settings → Pages, set **Source** to **GitHub Actions** (not a branch). Set `frontend/.env.production`'s `VITE_API_BASE_URL` to your Render service's URL, and `vite.config.ts`'s `base` to `/<your-repo-name>/`.
3. Push to `main`. Two workflows run independently, each only when its own directory changes: `ci.yml` (backend tests) and `deploy-frontend.yml` (frontend build + Pages deploy). Render redeploys the API on push too (`autoDeploy: true` in `render.yaml`).

## Design notes

- **Why a separate `/demo` layer instead of exposing real data?** The public dashboard needed to be zero-risk. Rather than opening up the real CRUD API without auth, `/demo/*` is read-only and only ever serves one fixed seeded account — a recruiter clicking around as a guest can't see or touch anyone's real applications.
- **Why Alembic instead of `create_all`?** `create_all` doesn't handle schema changes after the first deploy. Alembic revisions are the same mechanism you'd reach for on a real team, so the migration is here from commit one instead of being retrofitted later.
- **Why rate limit auth and the demo endpoints?** They're the only unauthenticated surface. `slowapi` throttles both per-IP to blunt credential stuffing on `/auth/login` and scraping on `/demo/*`.
- **Why `HashRouter` in the frontend?** GitHub Pages is static hosting with no server-side rewrites, so a deep link under a `BrowserRouter` path (e.g. `/hermes/app/applications/3`) 404s on a hard refresh. `HashRouter` keeps all routing client-side (`/hermes/#/app/applications/3`), which needs no server configuration at all.
- **Why a wake-up gate instead of just a loading spinner?** Free-tier Render sleeps the API after 15 minutes idle; a cold start can take up to a minute. A generic spinner reads as broken. The gate polls `/health` and tells the visitor what's actually happening.
