import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { applicationsApi, companiesApi } from '../api/client'
import { isApiError } from '../auth/AuthContext'
import type { Application, ApplicationStatus, Company } from '../api/types'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../api/types'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { useNotify } from '../components/Notifications'

interface FormState {
  role_title: string
  company_id: string
  location: string
  source: string
  job_url: string
  status: ApplicationStatus
}

const EMPTY_FORM: FormState = {
  role_title: '',
  company_id: '',
  location: '',
  source: '',
  job_url: '',
  status: 'wishlist',
}

export function Applications() {
  const notify = useNotify()
  const [searchParams, setSearchParams] = useSearchParams()
  const [applications, setApplications] = useState<Application[] | null>(null)
  const [companies, setCompanies] = useState<Company[] | null>(null)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('new') === '1')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function reload() {
    applicationsApi
      .list({ status: statusFilter || undefined, q: search || undefined, limit: 100 })
      .then((res) => setApplications(res.items))
  }

  useEffect(() => {
    companiesApi.list().then(setCompanies)
  }, [])

  useEffect(reload, [statusFilter, search])

  function openDialog() {
    setForm(EMPTY_FORM)
    setError(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    if (searchParams.get('new')) setSearchParams({})
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!form.company_id) {
      setError('Pick a company.')
      return
    }
    setIsSubmitting(true)
    try {
      await applicationsApi.create({
        role_title: form.role_title,
        company_id: Number(form.company_id),
        location: form.location || null,
        source: form.source || null,
        job_url: form.job_url || null,
        status: form.status,
      })
      closeDialog()
      reload()
      notify('Application created.')
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(application: Application) {
    if (!confirm(`Delete the "${application.role_title}" application?`)) return
    try {
      await applicationsApi.remove(application.id)
      reload()
      notify('Application deleted.')
    } catch (err) {
      notify(isApiError(err) ? err.message : 'Could not delete this application.', 'error')
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Applications</Typography>
        <Button variant="contained" onClick={openDialog}>
          New application
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search role or notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220, flex: 1 }}
        />
        <TextField
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {APPLICATION_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {applications && <ApplicationsTable applications={applications} onDelete={handleDelete} linkToDetail />}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit}>
          <DialogTitle>New application</DialogTitle>
          <DialogContent>
            {companies !== null && companies.length === 0 ? (
              <Typography color="text.secondary">
                You need a company first.{' '}
                <Link component={RouterLink} to="/app/companies">
                  Add one
                </Link>
                , then come back.
              </Typography>
            ) : (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Role title"
                  required
                  autoFocus
                  value={form.role_title}
                  onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                />
                <TextField
                  select
                  label="Company"
                  required
                  value={form.company_id}
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                >
                  {companies?.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
                <TextField
                  label="Source"
                  placeholder="LinkedIn, referral, company site…"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
                <TextField
                  label="Job URL"
                  value={form.job_url}
                  onChange={(e) => setForm({ ...form, job_url: e.target.value })}
                />
                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            {companies && companies.length > 0 && (
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create application'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  )
}
