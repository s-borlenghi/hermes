import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { applicationsApi } from '../api/client'
import { isApiError } from '../auth/AuthContext'
import type { Application, ApplicationStatus } from '../api/types'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../api/types'
import { useNotify } from '../components/Notifications'
import { StatusPill } from '../components/StatusPill'
import { formatCalendarDate } from '../utils/dates'

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
  const notify = useNotify()

  const [application, setApplication] = useState<Application | null>(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('wishlist')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [stageForm, setStageForm] = useState<StageFormState>(EMPTY_STAGE)
  const [stageError, setStageError] = useState<string | null>(null)
  const [isAddingStage, setIsAddingStage] = useState(false)

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
    setIsSaving(true)
    try {
      await applicationsApi.update(applicationId, { notes: notes || null, status })
      reload()
      notify('Changes saved.')
    } catch (err) {
      setSaveError(isApiError(err) ? err.message : 'Could not save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!application) return
    if (!confirm(`Delete the "${application.role_title}" application?`)) return
    try {
      await applicationsApi.remove(applicationId)
      navigate('/app/applications')
      notify('Application deleted.')
    } catch (err) {
      notify(isApiError(err) ? err.message : 'Could not delete this application.', 'error')
    }
  }

  async function handleAddStage(event: FormEvent) {
    event.preventDefault()
    setStageError(null)
    if (!stageForm.stage_name) {
      setStageError('Give the stage a name.')
      return
    }
    setIsAddingStage(true)
    try {
      await applicationsApi.addStage(applicationId, {
        stage_name: stageForm.stage_name,
        scheduled_at: stageForm.scheduled_at ? new Date(stageForm.scheduled_at).toISOString() : null,
        completed: stageForm.completed,
        notes: null,
      })
      setStageForm(EMPTY_STAGE)
      reload()
      notify('Stage added.')
    } catch (err) {
      setStageError(isApiError(err) ? err.message : 'Could not add stage.')
    } finally {
      setIsAddingStage(false)
    }
  }

  async function handleDeleteStage(stageId: number) {
    try {
      await applicationsApi.removeStage(applicationId, stageId)
      reload()
      notify('Stage removed.')
    } catch (err) {
      notify(isApiError(err) ? err.message : 'Could not remove this stage.', 'error')
    }
  }

  if (!application) return null

  return (
    <Stack spacing={2}>
      <Link component={RouterLink} to="/app/applications">
        ← Back to applications
      </Link>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
      >
        <Typography variant="h4">
          {application.role_title}{' '}
          <Typography component="span" color="text.secondary" variant="h5">
            @ {application.company.name}
          </Typography>
        </Typography>
        <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={handleDelete}>
          Delete application
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" component="form" onSubmit={handleSave} sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="overline" color="text.secondary">
              Details
            </Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              >
                {APPLICATION_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Notes" multiline minRows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
              {saveError && <Alert severity="error">{saveError}</Alert>}
              <Button type="submit" variant="contained" disabled={isSaving} sx={{ alignSelf: 'flex-start' }}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>

              {(application.location || application.source || application.job_url) && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontSize: '0.85rem' }}>
                  {application.location && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body2">{application.location}</Typography>
                    </>
                  )}
                  {application.source && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Source
                      </Typography>
                      <Typography variant="body2">{application.source}</Typography>
                    </>
                  )}
                  {application.job_url && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Job posting
                      </Typography>
                      <Link href={application.job_url} target="_blank" rel="noopener noreferrer" variant="body2">
                        {application.job_url}
                      </Link>
                    </>
                  )}
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="overline" color="text.secondary">
              Interview stages
            </Typography>
            <Stack spacing={1} sx={{ my: 1.5 }}>
              {application.stages.map((stage) => (
                <Stack
                  key={stage.id}
                  direction="row"
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography
                      sx={{ fontWeight: 600 }}
                      color={stage.completed ? 'text.secondary' : 'text.primary'}
                    >
                      {stage.stage_name}
                    </Typography>
                    {stage.scheduled_at && (
                      <Typography variant="body2" color="text.secondary">
                        {formatCalendarDate(stage.scheduled_at)}
                      </Typography>
                    )}
                    {stage.completed && <StatusPill status="accepted" />}
                  </Stack>
                  <IconButton size="small" color="error" onClick={() => handleDeleteStage(stage.id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              {application.stages.length === 0 && (
                <Typography color="text.secondary" variant="body2">
                  No interview stages yet.
                </Typography>
              )}
            </Stack>

            <Stack
              component="form"
              onSubmit={handleAddStage}
              direction="row"
              spacing={1}
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <TextField
                size="small"
                placeholder="Stage name (e.g. Technical interview)"
                value={stageForm.stage_name}
                onChange={(e) => setStageForm({ ...stageForm, stage_name: e.target.value })}
                sx={{ flex: 1, minWidth: 180 }}
              />
              <TextField
                size="small"
                type="date"
                value={stageForm.scheduled_at}
                onChange={(e) => setStageForm({ ...stageForm, scheduled_at: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={stageForm.completed}
                    onChange={(e) => setStageForm({ ...stageForm, completed: e.target.checked })}
                  />
                }
                label="Completed"
              />
              <Button type="submit" variant="outlined" size="small" disabled={isAddingStage}>
                {isAddingStage ? 'Adding…' : 'Add stage'}
              </Button>
            </Stack>
            {stageError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {stageError}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}
