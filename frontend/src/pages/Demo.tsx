import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { demoApi } from '../api/client'
import type { Application, StatsSummary, StatsTimeline } from '../api/types'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { StatTiles, StatusBars, TimelineChart } from '../components/StatsOverview'

export function Demo() {
  const [applications, setApplications] = useState<Application[] | null>(null)
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [timeline, setTimeline] = useState<StatsTimeline | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([demoApi.applications(), demoApi.summary(), demoApi.timeline(6)])
      .then(([apps, sum, tl]) => {
        if (cancelled) return
        setApplications(apps.items)
        setSummary(sum)
        setTimeline(tl)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load demo data. The API might still be waking up — try reloading.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="landing">
      <header className="hero hero-compact">
        <div className="wrap">
          <div className="eyebrow">
            <span className="dot" /> Public read-only demo
          </div>
          <h1>Live demo dashboard</h1>
          <p className="lede">
            Seeded sample data served from the deployed API's public <code>/demo/*</code> endpoints — no login,
            no write access. <Link to="/register">Create an account</Link> to use the real, authenticated app.
          </p>
        </div>
      </header>

      <section>
        <div className="wrap">
          {error && <p className="form-error">{error}</p>}
          {summary && <StatTiles summary={summary} />}

          <div className="grid-2">
            <div className="panel">
              <h3>Applications by status</h3>
              {summary && <StatusBars summary={summary} />}
            </div>
            <div className="panel">
              <h3>Applications over time</h3>
              {timeline && <TimelineChart timeline={timeline} />}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h3>Applications</h3>
            {applications && <ApplicationsTable applications={applications} />}
          </div>
        </div>
      </section>
    </div>
  )
}
