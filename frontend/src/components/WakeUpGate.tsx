import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { checkHealth } from '../api/client'

const RETRY_INTERVAL_MS = 4000
const GIVE_UP_AFTER_MS = 90_000

type GateStatus = 'checking' | 'ready' | 'stuck'

function elapsedMessage(elapsedMs: number): string {
  if (elapsedMs < 8000) return 'Connecting to the API…'
  if (elapsedMs < 25000) {
    return "Waking up the live server — it's hosted on a free tier that sleeps when idle."
  }
  return 'Still waking up… this can take up to a minute on the very first request.'
}

export function WakeUpGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>('checking')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const startedAtRef = useRef(Date.now())

  useEffect(() => {
    if (status !== 'checking') return

    let cancelled = false
    startedAtRef.current = Date.now()

    const ticker = window.setInterval(() => {
      if (!cancelled) setElapsedMs(Date.now() - startedAtRef.current)
    }, 500)

    async function poll() {
      while (!cancelled) {
        const ok = await checkHealth()
        if (cancelled) return
        if (ok) {
          setStatus('ready')
          return
        }
        if (Date.now() - startedAtRef.current > GIVE_UP_AFTER_MS) {
          setStatus('stuck')
          return
        }
        setAttempt((a) => a + 1)
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS))
      }
    }

    poll()

    return () => {
      cancelled = true
      window.clearInterval(ticker)
    }
  }, [status])

  if (status === 'ready') return <>{children}</>

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
      }}
    >
      <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 420, textAlign: 'center' }}>
        <CircularProgress color={status === 'stuck' ? 'error' : 'primary'} size={40} />
        {status === 'checking' ? (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Starting Hermes…
            </Typography>
            <Typography color="text.secondary">{elapsedMessage(elapsedMs)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.floor(elapsedMs / 1000)}s elapsed · attempt {attempt + 1}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              The API isn't responding
            </Typography>
            <Typography color="text.secondary">
              It might be down rather than just asleep. You can try again, or check back in a bit.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setElapsedMs(0)
                setAttempt(0)
                setStatus('checking')
              }}
            >
              Retry now
            </Button>
          </>
        )}
      </Stack>
    </Box>
  )
}
