import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { applicationsApi, statsApi } from '../api/client'
import type { Application, StatsSummary, StatsTimeline } from '../api/types'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { StatTiles, StatusBars, TimelineChart } from '../components/StatsOverview'

export function Dashboard() {
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [timeline, setTimeline] = useState<StatsTimeline | null>(null)
  const [recent, setRecent] = useState<Application[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([statsApi.summary(), statsApi.timeline(6), applicationsApi.list({ limit: 5 })]).then(
      ([sum, tl, list]) => {
        if (cancelled) return
        setSummary(sum)
        setTimeline(tl)
        setRecent(list.items)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="contained" component={RouterLink} to="/app/applications?new=1">
          New application
        </Button>
      </Stack>

      {summary && summary.total_applications === 0 ? (
        <Typography color="text.secondary">
          No applications yet.{' '}
          <Link component={RouterLink} to="/app/applications?new=1">
            Add your first one
          </Link>{' '}
          to see stats here.
        </Typography>
      ) : (
        <>
          {summary && <StatTiles summary={summary} />}
          <Grid container spacing={2}>
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
              Recent applications
            </Typography>
            {recent && <ApplicationsTable applications={recent} linkToDetail />}
          </Paper>
        </>
      )}
    </Stack>
  )
}
