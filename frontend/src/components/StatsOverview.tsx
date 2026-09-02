import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { StatsSummary, StatsTimeline } from '../api/types'
import { STATUS_LABELS } from '../api/types'

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function StatTiles({ summary }: { summary: StatsSummary }) {
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-value">{summary.total_applications}</div>
        <div className="stat-label">Applications tracked</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{pct(summary.response_rate)}</div>
        <div className="stat-label">Response rate</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{pct(summary.interview_rate)}</div>
        <div className="stat-label">Interview rate</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{pct(summary.offer_rate)}</div>
        <div className="stat-label">Offer rate</div>
      </div>
    </div>
  )
}

export function StatusBars({ summary }: { summary: StatsSummary }) {
  const max = Math.max(1, ...summary.by_status.map((s) => s.count))
  return (
    <div className="status-bars">
      {summary.by_status.map(({ status, count }) => (
        <div className="status-bar-row" key={status}>
          <span>{STATUS_LABELS[status]}</span>
          <span className="status-bar-track">
            <span className={`status-bar-fill ${status}`} style={{ width: `${(count / max) * 100}%` }} />
          </span>
          <span className="mono">{count}</span>
        </div>
      ))}
    </div>
  )
}

export function TimelineChart({ timeline }: { timeline: StatsTimeline }) {
  const data = timeline.points.map((p) => ({ period: p.period.slice(5), count: p.count }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="period" stroke="#9aa1b2" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} stroke="#9aa1b2" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#191d27', border: '1px solid #262b38', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#9aa1b2' }}
        />
        <Line type="monotone" dataKey="count" stroke="#6ee7b7" strokeWidth={2} dot={{ r: 3, fill: '#6ee7b7' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
