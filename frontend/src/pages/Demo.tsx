import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { demoApi } from '../api/client'
import type { Application, StatsSummary, StatsTimeline } from '../api/types'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { StatTiles, StatusBars, TimelineChart } from '../components/StatsOverview'

export function Demo() {
  const [applications, setApplications] = useState<Application[] | null>(null)
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [timeline, setTimeline] = useState<StatsTimeline | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([demoApi.applications(), demoApi.summary(), demoApi.timeline(6)])
      .then(([apps, sum, tl]) => {
        if (cancelled) return
        setApplications(apps.items)
        setSummary(sum)
        setTimeline(tl)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load demo data. The API might still be waking up — try reloading.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Chip label="Public read-only demo" size="small" color="primary" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
        <Typography variant="h3">Live demo dashboard</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
          Seeded sample data served from the deployed API's public <code>/demo/*</code> endpoints — no login, no
          write access. <Link component={RouterLink} to="/register">Create an account</Link> to use the real,
          authenticated app.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {summary && <StatTiles summary={summary} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="overline" color="text.secondary">
              Applications by status
            </Typography>
            {summary && <StatusBars summary={summary} />}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="overline" color="text.secondary">
              Applications over time
            </Typography>
            {timeline && <TimelineChart timeline={timeline} />}
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary">
          Applications
        </Typography>
        {applications && <ApplicationsTable applications={applications} />}
      </Paper>
    </Container>
  )
}
