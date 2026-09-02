import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../api/client'

export function Landing() {
  return (
    <div className="landing">
      <header className="hero">
        <div className="wrap">
          <div className="eyebrow">
            <span className="dot" /> Portfolio project · live API + live frontend
          </div>
          <h1>
            Hermes — a job-application tracker,
            <br />
            built like it has to run in production.
          </h1>
          <p className="lede">
            FastAPI + SQLAlchemy + SQLite on the backend, a React + TypeScript SPA on the frontend. JWT auth,
            per-user data isolation, Alembic migrations, a pytest suite, CI on every push — and you're looking
            at the real, deployed thing, not a mockup.
          </p>
          <div className="cta-row">
            <Link className="btn primary" to="/demo">
              View live demo →
            </Link>
            <Link className="btn ghost" to="/register">
              Create an account
            </Link>
            <a className="btn ghost" href={`${API_BASE_URL}/docs`} target="_blank" rel="noopener noreferrer">
              API docs
            </a>
            <a
              className="btn ghost"
              href="https://github.com/s-borlenghi/hermes"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source
            </a>
          </div>
          <div className="badges">
            <span className="badge">Python 3.12</span>
            <span className="badge">FastAPI</span>
            <span className="badge">SQLAlchemy 2.0</span>
            <span className="badge">Alembic</span>
            <span className="badge">JWT auth</span>
            <span className="badge">pytest</span>
            <span className="badge">React 19</span>
            <span className="badge">TypeScript</span>
            <span className="badge">Vite</span>
            <span className="badge">GitHub Actions CI/CD</span>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <h2>Try the real API</h2>
          <p className="section-sub">
            The demo above is read-only. Register an account and the API behaves like any other multi-tenant
            job-tracker backend would — or call it directly:
          </p>
          <pre className="code-block">
            <span className="c1"># register</span>
            {'\n'}curl -X POST {API_BASE_URL}/auth/register \{'\n'} -H "Content-Type: application/json" \{'\n'} -d
            '{'{'}"email": "you@example.com", "password": "a-strong-password"{'}'}'{'\n\n'}
            <span className="c1"># log in (OAuth2 password flow, form-encoded)</span>
            {'\n'}curl -X POST {API_BASE_URL}/auth/login \{'\n'} -d "username=you@example.com&password=a-strong-password"
          </pre>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2>Design notes</h2>
          <p className="section-sub">The parts of this that were actual decisions, not defaults.</p>
          <ul className="arch-list">
            <li>
              <span className="k">Multi-tenancy</span>
              <span className="v">
                Every company, application, and interview stage is scoped to <code>owner_id</code>; ownership is
                checked on every read and write, not just enforced at creation.
              </span>
            </li>
            <li>
              <span className="k">Public demo layer</span>
              <span className="v">
                <code>/demo/*</code> is read-only and serves one fixed seeded account, kept separate from the
                authenticated CRUD API — this frontend has zero write access to real data when you're browsing
                as a guest.
              </span>
            </li>
            <li>
              <span className="k">Rate limiting</span>
              <span className="v">
                Login, registration, and the public demo endpoints are throttled per-IP with <code>slowapi</code>{' '}
                to blunt credential-stuffing and scraping.
              </span>
            </li>
            <li>
              <span className="k">Migrations, not create_all</span>
              <span className="v">
                Schema changes ship as Alembic revisions; the container runs <code>alembic upgrade head</code> on
                boot instead of trusting SQLAlchemy to reconcile the schema.
              </span>
            </li>
            <li>
              <span className="k">Free-tier cold starts</span>
              <span className="v">
                The API sleeps after 15 minutes of inactivity on Render's free plan. This app pings it and shows a
                wake-up screen instead of a blank loading spinner — you're seeing that if you loaded this within
                the last minute.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}
