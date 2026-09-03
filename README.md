# Hermes

A job-application tracker: FastAPI backend, React frontend, both deployed and actually running rather than just sitting in this repo.

**[Live app](https://s-borlenghi.github.io/hermes/)** · **[API docs](https://hermes-api-ypyk.onrender.com/docs)**

Backend is FastAPI + SQLAlchemy + SQLite on Render. Frontend is React, TypeScript and MUI on GitHub Pages, talking to the same API.

The API is on Render's free tier, which spins down after 15 minutes of inactivity. The first request after that can take anywhere from a few seconds to a couple of minutes to come back — the frontend shows a "waking up" screen instead of a blank spinner while it waits, but if you're hitting the API directly (curl, Swagger) just know the first call might be slow.

## What it does

You register, add companies you're applying to, log applications against them with a status (wishlist, applied, phone screen, interview, offer, rejected...), and attach interview stages as things happen. There's a dashboard with response/interview/offer rate and an applications-over-time chart. Everything is scoped per account — ownership gets checked on every read and write, not just when a record is created.

There's also a `/demo` page that doesn't require an account: it reads from a set of public, read-only endpoints backed by one fixed seeded user, so anyone can look at the dashboard and data without registering or touching anything real.

A few other things worth knowing about:

- Auth is JWT over the OAuth2 password flow, bcrypt for hashing, rate-limited login and registration.
- Applications support filtering by status and free-text search, with pagination.
- The database schema is managed through Alembic migrations, not recreated from the models on startup.
- The backend test suite uses FastAPI's `TestClient` against a real (throwaway) SQLite file per test — nothing mocked.
- Two separate CI/CD pipelines: one runs the backend tests on every backend change, the other builds and deploys the frontend to Pages on every frontend change. They don't trigger each other.

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
      demo.py                   public read-only analytics, backs the frontend's /demo page
    seed.py              seeds the fixed demo account with sample data
  alembic/             migrations
  tests/               pytest suite
  Dockerfile
frontend/              React + TypeScript SPA (Vite + MUI), deployed to GitHub Pages
  src/
    api/                 typed fetch client + response types
    auth/                 auth context (JWT in localStorage) + route guard
    components/            nav shell, stat tiles, charts, wake-up gate
    pages/                  landing, demo, login, register, dashboard, applications, companies
.github/workflows/
  ci.yml                 backend tests, only runs on backend/** changes
  deploy-frontend.yml     frontend build + Pages deploy, only runs on frontend/** changes
render.yaml            Render blueprint (rootDir: backend) — has to live at the repo root to be picked up
```

## Running it locally

Needs Python 3.12+ and Node 20+.

**Backend:**

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # .venv\Scripts\activate on Windows cmd, source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt

cp .env.example .env
alembic upgrade head
python -m app.seed             # optional, seeds the demo account so /demo/* has something to show
uvicorn app.main:app --reload
```

That puts the API on `http://127.0.0.1:8000`, docs at `/docs`. Make sure `CORS_ORIGINS` in your `.env` includes `http://localhost:5173` so the local frontend isn't blocked.

Tests and lint:

```bash
pytest -q
ruff check app tests
```

**Frontend**, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173/hermes/`, reading `.env.development` for the API URL — nothing to edit for local dev. `npx tsc -b --noEmit` and `npm run lint` for checks, `npm run build` for a production build.

## Deploying your own copy

**Backend on Render**: push this repo to your own GitHub account, then in Render create a Blueprint from it. `render.yaml` already provisions the service and generates a `SECRET_KEY`/`DEMO_USER_PASSWORD` for you — you just need to set `CORS_ORIGINS` to your actual GitHub Pages origin.

One thing to know: the free Render plan doesn't give you a persistent disk, so the SQLite file lives in the container's own filesystem. It survives the app going to sleep and waking back up, but gets wiped on every new deploy. The demo account gets reseeded on every boot regardless, so `/demo` always works — but any real account someone registers will disappear the next time you push. That's fine for a demo; if you want it to actually persist, either upgrade to a plan with a disk or point `DATABASE_URL` at a real Postgres instance.

**Frontend on GitHub Pages**: in the repo's Settings → Pages, set the source to GitHub Actions, not a branch. Update `frontend/.env.production`'s API URL to your Render service, and `vite.config.ts`'s `base` to match your repo name.

Push to `main` and both pipelines run on their own — `ci.yml` for the backend, `deploy-frontend.yml` for the frontend — plus Render redeploys on its own since `autoDeploy` is on in `render.yaml`.

## A few decisions worth explaining

The `/demo` endpoints exist so the public dashboard doesn't need to touch real accounts at all. Rather than exposing the actual CRUD API without auth, there's a separate read-only layer tied to one fixed seeded user — someone browsing as a guest literally cannot see or write anyone's real data, because the code path doesn't let them.

Schema changes go through Alembic instead of `Base.metadata.create_all`. That's slower to set up initially but it's how you'd actually manage a database once more than one person is touching it, and retrofitting migrations onto a project that started without them is more annoying than just starting with them.

Login, registration, and the demo endpoints are the only parts of the API that don't require a token, so they're the ones rate-limited with `slowapi` — mostly to make casual credential stuffing and scraping a little more expensive.

The frontend uses `HashRouter` instead of `BrowserRouter`. GitHub Pages doesn't do server-side rewrites, so a deep link like `/hermes/app/applications/3` under a normal router would 404 on refresh. With hash routing everything after the `#` is handled entirely client-side, so there's nothing for the server to get wrong.
