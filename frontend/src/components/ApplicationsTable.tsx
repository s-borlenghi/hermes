import Link from '@mui/material/Link'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
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
    return (
      <Typography color="text.secondary" variant="body2">
        No applications yet.
      </Typography>
    )
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Role</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Applied</TableCell>
            {onDelete && <TableCell align="right" />}
          </TableRow>
        </TableHead>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id} hover>
              <TableCell>
                {linkToDetail ? (
                  <Link component={RouterLink} to={`/app/applications/${app.id}`}>
                    {app.role_title}
                  </Link>
                ) : (
                  app.role_title
                )}
              </TableCell>
              <TableCell>{app.company.name}</TableCell>
              <TableCell>
                <StatusPill status={app.status} />
              </TableCell>
              <TableCell>{app.source ?? '—'}</TableCell>
              <TableCell>{formatDate(app.applied_date)}</TableCell>
              {onDelete && (
                <TableCell align="right">
                  <Link component="button" underline="hover" color="error" onClick={() => onDelete(app)}>
                    Delete
                  </Link>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
