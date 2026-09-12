import { useState } from 'react'
import type { AnalyzeState } from '../lib/analyze'
import { formatBytes, formatDuration } from '../lib/format'

interface Props {
  analyze: AnalyzeState
  format: 'video' | 'audio'
  repo: string
  onConfirm: (quality: string | undefined, includeTranscript: boolean) => void
  onBack: () => void
  onRetry: () => void
}

export default function QualityPicker({ analyze, format, repo, onConfirm, onBack, onRetry }: Props) {
  const [quality, setQuality] = useState<string>()
  const [includeTranscript, setIncludeTranscript] = useState(false)
  const actionsUrl = `https://github.com/${repo}/actions`

  if (analyze.phase === 'starting' || analyze.phase === 'processing') {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Analyzing…</span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Checking what qualities and captions this video actually has.
        </p>
      </div>
    )
  }

  if (analyze.phase === 'failed' && analyze.failure?.status === 'failed') {
    const { reason, log_tail } = analyze.failure
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
        <p className="font-medium text-red-900 dark:text-red-200">
          {reason === 'cookies_expired' && 'Login cookies expired'}
          {reason === 'unavailable' && 'Video unavailable'}
          {reason === 'unknown' && 'Something went wrong'}
        </p>
        <p className="text-sm text-red-800 dark:text-red-300">
          {reason === 'cookies_expired' &&
            'Run scripts/refresh-cookies.sh on the Mac to re-authenticate, then try again.'}
          {reason === 'unavailable' &&
            'This video is private, deleted, or region-locked — nothing to do on this end.'}
          {reason === 'unknown' && 'Check the Actions run log for details.'}
        </p>
        <details className="text-xs text-red-700 dark:text-red-400">
          <summary className="cursor-pointer select-none">Show log</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-red-100 p-3 dark:bg-red-900">
            {log_tail}
          </pre>
        </details>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white active:bg-red-700"
          >
            Try again
          </button>
          <a
            href={actionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-red-300 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800 dark:text-red-300"
          >
            Open Actions log
          </a>
        </div>
        <button onClick={onBack} className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Back
        </button>
      </div>
    )
  }

  if (analyze.phase === 'timeout' || analyze.phase === 'error') {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950">
        <p className="font-medium text-amber-900 dark:text-amber-200">
          {analyze.phase === 'timeout' ? 'Timed out waiting' : "Couldn't analyze this link"}
        </p>
        <p className="text-sm text-amber-800 dark:text-amber-300">
          {analyze.phase === 'timeout'
            ? 'Analysis is taking longer than expected — check the Actions log, or try again.'
            : analyze.errorMessage}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white active:bg-amber-700"
          >
            Try again
          </button>
          <button onClick={onBack} className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Back
          </button>
        </div>
      </div>
    )
  }

  if (analyze.phase !== 'ready' || analyze.result?.status !== 'ready') return null
  const { title, duration, has_captions, video_qualities } = analyze.result

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{formatDuration(duration)}</p>
      </div>

      {format === 'video' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Quality</span>
          {video_qualities.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Couldn't detect specific resolutions — it'll use up to 1080p.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {video_qualities.map((q) => (
              <button
                key={q.height}
                type="button"
                onClick={() => setQuality(String(q.height))}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  quality === String(q.height)
                    ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950 dark:text-red-300'
                    : 'border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                {q.label}
                {q.approx_size ? (
                  <span className="block text-xs opacity-70">~{formatBytes(q.approx_size)}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={includeTranscript}
          onChange={(e) => setIncludeTranscript(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-400 accent-red-600"
        />
        Also save transcript
        <span className="ml-auto text-xs opacity-70">
          {has_captions ? 'captions available' : 'none found'}
        </span>
      </label>

      <button
        onClick={() => onConfirm(quality, includeTranscript)}
        className="rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white active:bg-red-700"
      >
        Download
      </button>

      <button onClick={onBack} className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Back
      </button>
    </div>
  )
}
