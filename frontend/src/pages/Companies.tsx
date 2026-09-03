import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
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
  const [dialogOpen, setDialogOpen] = useState(false)
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
    setError(null)
    setDialogOpen(true)
  }

  function startEdit(company: Company) {
    setEditingId(company.id)
    setForm({ name: company.name, website: company.website ?? '', notes: company.notes ?? '' })
    setError(null)
    setDialogOpen(true)
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
      setDialogOpen(false)
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
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Companies</Typography>
        <Button variant="contained" onClick={startCreate}>
          Add company
        </Button>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {companies?.map((company) => (
              <TableRow key={company.id} hover>
                <TableCell>{company.name}</TableCell>
                <TableCell>
                  {company.website ? (
                    <Link href={company.website} target="_blank" rel="noopener noreferrer">
                      {company.website}
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>{company.notes ?? '—'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => startEdit(company)} aria-label="Edit company">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(company)}
                    aria-label="Delete company"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {companies?.length === 0 && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>
            No companies yet.
          </Typography>
        )}
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Edit company' : 'Add company'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Name"
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                label="Website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
              <TextField
                label="Notes"
                multiline
                minRows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Save changes' : 'Create company'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  )
}
