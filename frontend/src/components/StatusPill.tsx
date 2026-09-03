import Chip from '@mui/material/Chip'
import type { ApplicationStatus } from '../api/types'
import { STATUS_LABELS } from '../api/types'
import { STATUS_COLORS } from '../theme'

export function StatusPill({ status }: { status: ApplicationStatus }) {
  const color = STATUS_COLORS[status]
  return (
    <Chip
      size="small"
      label={STATUS_LABELS[status]}
      sx={{
        color,
        borderColor: color,
        backgroundColor: `${color}22`,
      }}
      variant="outlined"
    />
  )
}
