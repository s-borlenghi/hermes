/**
 * Dates in this app (applied_date, scheduled_at) represent a calendar day, not a
 * moment in time — they're picked from a plain <input type="date">. Formatting
 * them with the browser's local timezone can shift the displayed day backward
 * for anyone west of UTC, since "2026-09-15" parses as 2026-09-15T00:00:00Z.
 * Formatting in UTC keeps the displayed date matching what was picked.
 */
export function formatCalendarDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' })
}
