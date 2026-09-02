import { Link } from 'react-router-dom'
import type { Application } from '../api/types'
import { StatusPill } from './StatusPill'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function ApplicationsTable({
  applications,
  onDelete,
  linkToDetail = false,
}: {
  applications: Application[]
  onDelete?: (application: Application) => void
  linkToDetail?: boolean
}) {
  if (applications.length === 0) {
    return <p className="empty-note">No applications yet.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Company</th>
            <th>Status</th>
            <th>Source</th>
            <th>Applied</th>
            {onDelete && <th></th>}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>
                {linkToDetail ? <Link to={`/app/applications/${app.id}`}>{app.role_title}</Link> : app.role_title}
              </td>
              <td>{app.company.name}</td>
              <td>
                <StatusPill status={app.status} />
              </td>
              <td>{app.source ?? '—'}</td>
              <td>{formatDate(app.applied_date)}</td>
              {onDelete && (
                <td>
                  <button type="button" className="link-btn danger" onClick={() => onDelete(app)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
