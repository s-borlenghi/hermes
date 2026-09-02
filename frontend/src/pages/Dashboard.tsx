import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi, statsApi } from '../api/client'
import type { Application, StatsSummary, StatsTimeline } from '../api/types'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { StatTiles, StatusBars, TimelineChart } from '../components/StatsOverview'

export function Dashboard() {
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [timeline, setTimeline] = useState<StatsTimeline | null>(null)
  const [recent, setRecent] = useState<Application[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([statsApi.summary(), statsApi.timeline(6), applicationsApi.list({ limit: 5 })]).then(
      ([sum, tl, list]) => {
        if (cancelled) return
        setSummary(sum)
        setTimeline(tl)
        setRecent(list.items)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link className="btn primary" to="/app/applications?new=1">
          New application
        </Link>
      </div>

      {summary && summary.total_applications === 0 ? (
        <p className="empty-note">
          No applications yet. <Link to="/app/applications?new=1">Add your first one</Link> to see stats here.
        </p>
      ) : (
        <>
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
            <h3>Recent applications</h3>
            {recent && <ApplicationsTable applications={recent} linkToDetail />}
          </div>
        </>
      )}
    </div>
  )
}
