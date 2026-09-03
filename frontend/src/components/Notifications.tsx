import { createContext, use, useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

type Severity = 'success' | 'error'

interface NotifyState {
  key: number
  message: string
  severity: Severity
}

interface NotificationsContextValue {
  notify: (message: string, severity?: Severity) => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NotifyState | null>(null)

  const notify = useCallback((message: string, severity: Severity = 'success') => {
    setState({ key: Date.now(), message, severity })
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationsContext value={value}>
      {children}
      <Snackbar
        key={state?.key}
        open={state !== null}
        autoHideDuration={4000}
        onClose={() => setState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {state ? (
          <Alert severity={state.severity} variant="filled" onClose={() => setState(null)} sx={{ width: '100%' }}>
            {state.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationsContext>
  )
}

export function useNotify(): (message: string, severity?: Severity) => void {
  const ctx = use(NotificationsContext)
  if (!ctx) throw new Error('useNotify must be used within a NotificationsProvider')
  return ctx.notify
}
