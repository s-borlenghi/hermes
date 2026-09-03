import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { StatsSummary, StatsTimeline } from '../api/types'
import { STATUS_LABELS } from '../api/types'
import { STATUS_COLORS } from '../theme'

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  )
}

export function StatTiles({ summary }: { summary: StatsSummary }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatTile label="Applications tracked" value={summary.total_applications} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatTile label="Response rate" value={pct(summary.response_rate)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatTile label="Interview rate" value={pct(summary.interview_rate)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatTile label="Offer rate" value={pct(summary.offer_rate)} />
      </Grid>
    </Grid>
  )
}

export function StatusBars({ summary }: { summary: StatsSummary }) {
  const max = Math.max(1, ...summary.by_status.map((s) => s.count))
  return (
    <Stack spacing={1.5}>
      {summary.by_status.map(({ status, count }) => (
        <Box key={status} sx={{ display: 'grid', gridTemplateColumns: '100px 1fr 28px', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2">{STATUS_LABELS[status]}</Typography>
          <LinearProgress
            variant="determinate"
            value={(count / max) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': { backgroundColor: STATUS_COLORS[status], borderRadius: 4 },
            }}
          />
          <Typography variant="body2" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>
            {count}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

export function TimelineChart({ timeline }: { timeline: StatsTimeline }) {
  const theme = useTheme()
  const data = timeline.points.map((p) => ({ period: p.period.slice(5), count: p.count }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="period"
          stroke={theme.palette.text.secondary}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis allowDecimals={false} stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: theme.palette.text.secondary }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ r: 3, fill: theme.palette.primary.main }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
