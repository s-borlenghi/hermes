import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { companiesApi } from '../api/client'
import { isApiError } from '../auth/AuthContext'
import type { Company } from '../api/types'

interface FormState {
  name: string
  website: string
  notes: string
}

const EMPTY_FORM: FormState = { name: '', website: '', notes: '' }

export function Companies() {
  const [companies, setCompanies] = useState<Company[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  function reload() {
    companiesApi.list().then(setCompanies)
  }

  useEffect(reload, [])

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError(null)
  }

  function startEdit(company: Company) {
    setEditingId(company.id)
    setForm({ name: company.name, website: company.website ?? '', notes: company.notes ?? '' })
    setShowForm(true)
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const payload = { name: form.name, website: form.website || null, notes: form.notes || null }
    try {
      if (editingId) {
        await companiesApi.update(editingId, payload)
      } else {
        await companiesApi.create(payload)
      }
      setShowForm(false)
      reload()
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Something went wrong.')
    }
  }

  async function handleDelete(company: Company) {
    if (!confirm(`Delete "${company.name}"? This also deletes its applications.`)) return
    await companiesApi.remove(company.id)
    reload()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Companies</h1>
        <button type="button" className="btn primary" onClick={startCreate}>
          Add company
        </button>
      </div>

      {showForm && (
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <label>
            Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            Website
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </label>
          <label>
            Notes
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn primary">
              {editingId ? 'Save changes' : 'Create company'}
            </button>
            <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Website</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies?.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      {company.website}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{company.notes ?? '—'}</td>
                <td>
                  <button type="button" className="link-btn" onClick={() => startEdit(company)}>
                    Edit
                  </button>{' '}
                  <button type="button" className="link-btn danger" onClick={() => handleDelete(company)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies?.length === 0 && <p className="empty-note">No companies yet.</p>}
      </div>
    </div>
  )
}
