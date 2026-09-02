import type { ApplicationStatus } from '../api/types'
import { STATUS_LABELS } from '../api/types'

export function StatusPill({ status }: { status: ApplicationStatus }) {
  return <span className={`pill ${status}`}>{STATUS_LABELS[status]}</span>
}
