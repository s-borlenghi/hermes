# Hermes

A job-application tracking API, built the way a small production service would be — not a tutorial CRUD app.

**[Live demo dashboard](https://YOUR_GITHUB_USERNAME.github.io/hermes/)** · **[Live API docs (Swagger)](https://YOUR-RENDER-SERVICE.onrender.com/docs)** · Backend: FastAPI + SQLAlchemy 2.0 + SQLite, deployed on Render. Frontend: a static dashboard on GitHub Pages that reads the live API.

> The Render free tier spins down when idle — the first request after a while can take up to ~50s to wake it back up. The dashboard shows this while it waits.

## What it does

Hermes tracks companies, job applications, and interview stages per user, then turns that into analytics: response rate, interview rate, offer rate, and an applications-over-time view.

- **Auth**: JWT (OAuth2 password flow), bcrypt password hashing, rate-limited login/register.
- **Multi-tenant CRUD**: companies, applications, and nested interview stages, all scoped to the authenticated user — ownership is checked on every read and write, not just at creation.
- **Filtering & pagination** on the applications list (by status, free-text search, skip/limit).
- **Analytics**: `/stats/summary` (counts by status, response/interview/offer rate) and `/stats/timeline` (applications per month).
- **Public read-only demo layer** (`/demo/*`): the same analytics and listing endpoints, but served from one fixed seeded account with no auth required — this is what powers the live dashboard on GitHub Pages, and it has no write access to real user data.
- **Migrations**: schema changes are Alembic revisions, not `Base.metadata.create_all` — the container runs `alembic upgrade head` on boot.
- **Tests**: pytest + FastAPI's `TestClient`, each test gets its own throwaway SQLite file, no mocked ORM layer.
- **CI**: GitHub Actions runs `ruff` and the full test suite on every push.

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
      demo.py                   public read-only analytics (backs the GitHub Pages dashboard)
    seed.py              seeds the fixed demo account with sample data
  alembic/             migrations
  tests/               pytest suite
  Dockerfile
docs/                  GitHub Pages site — landing page + live dashboard (docs/app.js talks to the deployed API)
.github/workflows/ci.yml
render.yaml            Render blueprint (rootDir: backend) — must live at the repo root to be auto-detected
```

## Running it locally

Requires Python 3.12+.

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

API is now at `http://127.0.0.1:8000`, interactive docs at `/docs`.

Run the tests and linter:

```bash
pytest -q
ruff check app tests
```

To preview the GitHub Pages site locally, point `docs/app.js`'s `API_BASE_URL` at `http://127.0.0.1:8000` and serve the `docs/` folder with any static file server (e.g. `python -m http.server 8011` from inside `docs/`), then remember to change it back before committing.

## Deploying your own copy

1. **Backend → Render**: push this repo to your own GitHub account, then in Render create a new Blueprint from it (`render.yaml` is already set up — it provisions the web service and generates `SECRET_KEY`/`DEMO_USER_PASSWORD` for you). Update the `CORS_ORIGINS` env var to your actual `https://<you>.github.io` origin once you know it.

   Render's free tier has no persistent disk, so the SQLite file lives in the container's ephemeral filesystem: it survives idle spin-down/wake-up, but resets on every new deploy (each push to `main`). The Dockerfile reseeds the demo account on every boot regardless, so `/demo/*` always has data; any real accounts a visitor registers will be wiped on your next push. That's an intentional tradeoff for a free, zero-maintenance demo — if you want real persistence, upgrade the instance type and add a Render Disk (or point `DATABASE_URL` at a managed Postgres instance instead).
2. **Frontend → GitHub Pages**: in the repo's Settings → Pages, set the source to the `main` branch, `/docs` folder. Before that, edit `docs/app.js`'s `API_BASE_URL` to your Render service's URL, and update the GitHub links in `docs/index.html`.
3. Push. GitHub Actions runs the test suite on every push to `main`; Render redeploys the API on push (if `autoDeploy` is left on in `render.yaml`).

## Design notes

- **Why a separate `/demo` layer instead of exposing real data?** The dashboard needed to be public and zero-risk. Rather than opening up the real CRUD API without auth, `/demo/*` is read-only and only ever serves one fixed seeded account — an attacker or an enthusiastic recruiter clicking around can't see or touch anyone's real applications.
- **Why Alembic instead of `create_all`?** `create_all` doesn't handle schema changes after the first deploy. Alembic revisions are the same mechanism you'd reach for on a real team, so the migration is here from commit one instead of being retrofitted later.
- **Why rate limit auth and the demo endpoints?** They're the only unauthenticated surface. `slowapi` throttles both per-IP to blunt credential stuffing on `/auth/login` and scraping on `/demo/*`.
