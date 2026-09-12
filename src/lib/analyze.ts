// Polling state machine for the "Analyze" phase — same dispatch/poll shape as
// src/lib/job.ts, but metadata-only (no media ever downloads), so it resolves in
// a few seconds and gets a much shorter timeout.
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  dispatchAnalyze,
  getAnalyzeStatus,
  GitHubError,
  type AnalyzeStatus,
  type GitHubConfig,
} from './github'
import { mockAnalyzePoll, type MockScenario } from './mock'

export type AnalyzePhase = 'idle' | 'starting' | 'processing' | 'ready' | 'failed' | 'timeout' | 'error'

export interface AnalyzeState {
  phase: AnalyzePhase
  runKey?: string
  url?: string
  result?: Extract<AnalyzeStatus, { status: 'ready' }>
  failure?: Extract<AnalyzeStatus, { status: 'failed' }>
  errorMessage?: string
}

const POLL_INTERVAL_MS = 2500
const FIRST_POLL_DELAY_MS = 1200
const TIMEOUT_MS = 60_000

function makeRunKey(): string {
  const rand = Math.random().toString(36).slice(2, 6)
  return `an-${Date.now()}-${rand}`
}

export function useAnalyzeJob(cfg: GitHubConfig, mockScenario?: MockScenario) {
  const [state, setState] = useState<AnalyzeState>({ phase: 'idle' })
  const stateRef = useRef(state)
  stateRef.current = state

  const pollTimeoutRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current)
    pollTimeoutRef.current = null
  }, [])

  const start = useCallback(
    async (url: string) => {
      stop()
      const runKey = makeRunKey()
      const startedAt = Date.now()
      setState({ phase: 'starting', runKey, url })

      try {
        if (!mockScenario) {
          await dispatchAnalyze(cfg, { url, runKey })
        }
      } catch (e) {
        const message = e instanceof GitHubError ? e.message : 'Could not reach GitHub. Check your connection.'
        setState({ phase: 'error', runKey, url, errorMessage: message })
        return
      }

      setState((s) => (s.runKey === runKey ? { ...s, phase: 'processing' } : s))

      const poll = async () => {
        if (stateRef.current.runKey !== runKey) return
        if (Date.now() - startedAt > TIMEOUT_MS) {
          stop()
          setState((s) => (s.runKey === runKey ? { ...s, phase: 'timeout' } : s))
          return
        }

        try {
          const result = mockScenario
            ? mockAnalyzePoll(mockScenario, Date.now() - startedAt)
            : await getAnalyzeStatus(cfg, runKey)

          if (stateRef.current.runKey !== runKey) return

          if (result?.status === 'ready') {
            stop()
            setState((s) => ({ ...s, phase: 'ready', result }))
            return
          }
          if (result?.status === 'failed') {
            stop()
            setState((s) => ({ ...s, phase: 'failed', failure: result }))
            return
          }
          pollTimeoutRef.current = window.setTimeout(poll, POLL_INTERVAL_MS)
        } catch (e) {
          stop()
          const message = e instanceof GitHubError ? e.message : 'Could not reach GitHub. Check your connection.'
          setState((s) => (s.runKey === runKey ? { ...s, phase: 'error', errorMessage: message } : s))
        }
      }

      pollTimeoutRef.current = window.setTimeout(poll, FIRST_POLL_DELAY_MS)
    },
    [cfg, mockScenario, stop],
  )

  const reset = useCallback(() => {
    stop()
    setState({ phase: 'idle' })
  }, [stop])

  useEffect(() => stop, [stop])

  return { state, start, reset }
}
