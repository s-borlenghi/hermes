import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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

    const tick = () => {
      if (cancelled) return
      setElapsedMs(Date.now() - startedAtRef.current)
    }
    const ticker = window.setInterval(tick, 500)

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
    <div className="wake-gate">
      <div className="wake-gate-card">
        <div className={`wake-spinner ${status === 'stuck' ? 'stuck' : ''}`} aria-hidden="true" />
        {status === 'checking' ? (
          <>
            <p className="wake-title">Starting Hermes…</p>
            <p className="wake-message">{elapsedMessage(elapsedMs)}</p>
            <p className="wake-meta">
              {Math.floor(elapsedMs / 1000)}s elapsed · attempt {attempt + 1}
            </p>
          </>
        ) : (
          <>
            <p className="wake-title">The API isn't responding</p>
            <p className="wake-message">
              It might be down rather than just asleep. You can try again, or check back in a bit.
            </p>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setElapsedMs(0)
                setAttempt(0)
                setStatus('checking')
              }}
            >
              Retry now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
