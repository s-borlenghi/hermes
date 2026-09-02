import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { applicationsApi, companiesApi } from '../api/client'
import { isApiError } from '../auth/AuthContext'
import type { Application, ApplicationStatus, Company } from '../api/types'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../api/types'
import { ApplicationsTable } from '../components/ApplicationsTable'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [applications, setApplications] = useState<Application[] | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  function reload() {
    applicationsApi.list({ status: statusFilter || undefined, q: search || undefined, limit: 100 }).then((res) =>
      setApplications(res.items),
    )
  }

  useEffect(() => {
    companiesApi.list().then(setCompanies)
  }, [])

  useEffect(reload, [statusFilter, search])

  function openForm() {
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    if (searchParams.get('new')) setSearchParams({})
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!form.company_id) {
      setError('Pick a company.')
      return
    }
    try {
      await applicationsApi.create({
        role_title: form.role_title,
        company_id: Number(form.company_id),
        location: form.location || null,
        source: form.source || null,
        job_url: form.job_url || null,
        status: form.status,
      })
      closeForm()
      reload()
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Something went wrong.')
    }
  }

  async function handleDelete(application: Application) {
    if (!confirm(`Delete the "${application.role_title}" application?`)) return
    await applicationsApi.remove(application.id)
    reload()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Applications</h1>
        <button type="button" className="btn primary" onClick={openForm}>
          New application
        </button>
      </div>

      <div className="filter-row">
        <input
          type="search"
          placeholder="Search role or notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}>
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form className="panel form-panel" onSubmit={handleSubmit}>
          {companies.length === 0 ? (
            <p className="empty-note">
              You need a company first. <Link to="/app/companies">Add one</Link>, then come back.
            </p>
          ) : (
            <>
              <label>
                Role title
                <input
                  required
                  value={form.role_title}
                  onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                />
              </label>
              <label>
                Company
                <select
                  required
                  value={form.company_id}
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                >
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Location
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </label>
              <label>
                Source
                <input
                  placeholder="LinkedIn, referral, company site…"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
              </label>
              <label>
                Job URL
                <input value={form.job_url} onChange={(e) => setForm({ ...form, job_url: e.target.value })} />
              </label>
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            {companies.length > 0 && (
              <button type="submit" className="btn primary">
                Create application
              </button>
            )}
            <button type="button" className="btn ghost" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {applications && <ApplicationsTable applications={applications} onDelete={handleDelete} linkToDetail />}
    </div>
  )
}
