// The polling state machine that drives the progress card: dispatch the workflow,
// then poll the release notes every few seconds until they say ready/failed, a
// 10-minute ceiling is hit, or the dispatch/poll call itself errors.
import { useCallback, useEffect, useRef, useState } from 'react'
import { dispatchDownload, getReleaseStatus, GitHubError, type GitHubConfig, type JobStatus } from './github'
import { mockPoll, type MockScenario } from './mock'
import { addHistoryEntry, updateHistoryEntry } from './storage'

export type JobPhase = 'idle' | 'starting' | 'processing' | 'ready' | 'failed' | 'timeout' | 'error'

export interface JobState {
  phase: JobPhase
  runKey?: string
  url?: string
  format?: 'video' | 'audio'
  includeTranscript?: boolean
  quality?: string
  startedAt?: number
  elapsedMs: number
  progress?: number
  result?: Extract<JobStatus, { status: 'ready' }>
  failure?: Extract<JobStatus, { status: 'failed' }>
  errorMessage?: string
}

const POLL_INTERVAL_MS = 4000
const FIRST_POLL_DELAY_MS = 1500 // give the workflow a moment to create the placeholder release
const TIMEOUT_MS = 10 * 60 * 1000

function makeRunKey(): string {
  const rand = Math.random().toString(36).slice(2, 6)
  return `dl-${Date.now()}-${rand}`
}

export function useDownloadJob(cfg: GitHubConfig, mockScenario?: MockScenario) {
  const [state, setState] = useState<JobState>({ phase: 'idle', elapsedMs: 0 })
  const stateRef = useRef(state)
  stateRef.current = state

  const tickTimerRef = useRef<number | null>(null)
  const pollTimeoutRef = useRef<number | null>(null)
  // The poll function itself, so the visibility handler below can re-invoke it
  // immediately instead of waiting out a full interval after the tab was hidden.
  const pollFnRef = useRef<(() => void) | null>(null)

  const stop = useCallback(() => {
    if (tickTimerRef.current) window.clearInterval(tickTimerRef.current)
    if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current)
    tickTimerRef.current = null
    pollTimeoutRef.current = null
    pollFnRef.current = null
  }, [])

  const start = useCallback(
    async (url: string, format: 'video' | 'audio', includeTranscript: boolean, quality?: string) => {
      stop()
      const runKey = makeRunKey()
      const startedAt = Date.now()
      setState({ phase: 'starting', runKey, url, format, includeTranscript, quality, startedAt, elapsedMs: 0 })
      addHistoryEntry({ runKey, url, format, includeTranscript, quality, status: 'processing', createdAt: startedAt })

      try {
        if (!mockScenario) {
          await dispatchDownload(cfg, { url, format, runKey, includeTranscript, quality })
        }
      } catch (e) {
        const message = e instanceof GitHubError ? e.message : 'Could not reach GitHub. Check your connection.'
        setState({ phase: 'error', runKey, url, format, includeTranscript, quality, startedAt, elapsedMs: 0, errorMessage: message })
        updateHistoryEntry(runKey, { status: 'failed' })
        return
      }

      setState((s) => (s.runKey === runKey ? { ...s, phase: 'processing' } : s))

      tickTimerRef.current = window.setInterval(() => {
        setState((s) => (s.startedAt && s.runKey === runKey ? { ...s, elapsedMs: Date.now() - s.startedAt } : s))
      }, 1000)

      const poll = async () => {
        if (stateRef.current.runKey !== runKey) return // superseded by a newer job
        if (Date.now() - startedAt > TIMEOUT_MS) {
          stop()
          setState((s) => (s.runKey === runKey ? { ...s, phase: 'timeout' } : s))
          updateHistoryEntry(runKey, { status: 'failed' })
          return
        }

        try {
          const result = mockScenario
            ? mockPoll(mockScenario, Date.now() - startedAt)
            : await getReleaseStatus(cfg, runKey)

          if (stateRef.current.runKey !== runKey) return

          if (result?.status === 'ready') {
            stop()
            setState((s) => ({ ...s, phase: 'ready', result }))
            updateHistoryEntry(runKey, { status: 'ready', title: result.title })
            return
          }
          if (result?.status === 'failed') {
            stop()
            setState((s) => ({ ...s, phase: 'failed', failure: result }))
            updateHistoryEntry(runKey, { status: 'failed' })
            return
          }
          if (result?.status === 'processing' && result.progress !== undefined) {
            setState((s) => (s.runKey === runKey ? { ...s, progress: result.progress } : s))
          }
          // Still processing, or the placeholder release hasn't landed yet.
          pollTimeoutRef.current = window.setTimeout(poll, POLL_INTERVAL_MS)
        } catch (e) {
          stop()
          const message = e instanceof GitHubError ? e.message : 'Could not reach GitHub. Check your connection.'
          setState((s) => (s.runKey === runKey ? { ...s, phase: 'error', errorMessage: message } : s))
          updateHistoryEntry(runKey, { status: 'failed' })
        }
      }

      pollFnRef.current = poll
      pollTimeoutRef.current = window.setTimeout(poll, FIRST_POLL_DELAY_MS)
    },
    [cfg, mockScenario, stop],
  )

  const reset = useCallback(() => {
    stop()
    setState({ phase: 'idle', elapsedMs: 0 })
  }, [stop])

  // Pause polling while the tab is hidden; poll immediately (not after a full
  // interval) the moment it becomes visible again.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      if (stateRef.current.phase !== 'processing') return
      if (!pollFnRef.current) return
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current)
      pollFnRef.current()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => stop, [stop])

  return { state, start, reset }
}
