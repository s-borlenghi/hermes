import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { applicationsApi } from '../api/client'
import { isApiError } from '../auth/AuthContext'
import type { Application, ApplicationStatus } from '../api/types'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../api/types'

interface StageFormState {
  stage_name: string
  scheduled_at: string
  completed: boolean
}

const EMPTY_STAGE: StageFormState = { stage_name: '', scheduled_at: '', completed: false }

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const applicationId = Number(id)
  const navigate = useNavigate()

  const [application, setApplication] = useState<Application | null>(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('wishlist')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [stageForm, setStageForm] = useState<StageFormState>(EMPTY_STAGE)
  const [stageError, setStageError] = useState<string | null>(null)

  function reload() {
    applicationsApi.get(applicationId).then((app) => {
      setApplication(app)
      setNotes(app.notes ?? '')
      setStatus(app.status)
    })
  }

  useEffect(reload, [applicationId])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaveError(null)
    try {
      await applicationsApi.update(applicationId, { notes: notes || null, status })
      reload()
    } catch (err) {
      setSaveError(isApiError(err) ? err.message : 'Could not save changes.')
    }
  }

  async function handleDelete() {
    if (!application) return
    if (!confirm(`Delete the "${application.role_title}" application?`)) return
    await applicationsApi.remove(applicationId)
    navigate('/app/applications')
  }

  async function handleAddStage(event: FormEvent) {
    event.preventDefault()
    setStageError(null)
    if (!stageForm.stage_name) {
      setStageError('Give the stage a name.')
      return
    }
    try {
      await applicationsApi.addStage(applicationId, {
        stage_name: stageForm.stage_name,
        scheduled_at: stageForm.scheduled_at ? new Date(stageForm.scheduled_at).toISOString() : null,
        completed: stageForm.completed,
        notes: null,
      })
      setStageForm(EMPTY_STAGE)
      reload()
    } catch (err) {
      setStageError(isApiError(err) ? err.message : 'Could not add stage.')
    }
  }

  async function handleDeleteStage(stageId: number) {
    await applicationsApi.removeStage(applicationId, stageId)
    reload()
  }

  if (!application) return null

  return (
    <div>
      <p>
        <Link to="/app/applications">← Back to applications</Link>
      </p>
      <div className="page-header">
        <h1>
          {application.role_title} <span className="text-dim">@ {application.company.name}</span>
        </h1>
        <button type="button" className="link-btn danger" onClick={handleDelete}>
          Delete application
        </button>
      </div>

      <div className="grid-2">
        <form className="panel form-panel" onSubmit={handleSave}>
          <h3>Details</h3>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {saveError && <p className="form-error">{saveError}</p>}
          <div className="form-actions">
            <button type="submit" className="btn primary">
              Save changes
            </button>
          </div>
          <dl className="detail-meta">
            {application.location && (
              <>
                <dt>Location</dt>
                <dd>{application.location}</dd>
              </>
            )}
            {application.source && (
              <>
                <dt>Source</dt>
                <dd>{application.source}</dd>
              </>
            )}
            {application.job_url && (
              <>
                <dt>Job posting</dt>
                <dd>
                  <a href={application.job_url} target="_blank" rel="noopener noreferrer">
                    {application.job_url}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </form>

        <div className="panel">
          <h3>Interview stages</h3>
          <ul className="stage-list">
            {application.stages.map((stage) => (
              <li key={stage.id} className={stage.completed ? 'completed' : ''}>
                <div>
                  <strong>{stage.stage_name}</strong>
                  {stage.scheduled_at && (
                    <span className="text-dim"> · {new Date(stage.scheduled_at).toLocaleDateString()}</span>
                  )}
                  {stage.completed && <span className="pill accepted">Done</span>}
                </div>
                <button type="button" className="link-btn danger" onClick={() => handleDeleteStage(stage.id)}>
                  Remove
                </button>
              </li>
            ))}
            {application.stages.length === 0 && <p className="empty-note">No interview stages yet.</p>}
          </ul>

          <form className="stage-form" onSubmit={handleAddStage}>
            <input
              placeholder="Stage name (e.g. Technical interview)"
              value={stageForm.stage_name}
              onChange={(e) => setStageForm({ ...stageForm, stage_name: e.target.value })}
            />
            <input
              type="date"
              value={stageForm.scheduled_at}
              onChange={(e) => setStageForm({ ...stageForm, scheduled_at: e.target.value })}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={stageForm.completed}
                onChange={(e) => setStageForm({ ...stageForm, completed: e.target.checked })}
              />
              Completed
            </label>
            <button type="submit" className="btn ghost small">
              Add stage
            </button>
          </form>
          {stageError && <p className="form-error">{stageError}</p>}
        </div>
      </div>
    </div>
  )
}
