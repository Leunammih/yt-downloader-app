import { useEffect, useState } from 'react'
import type { JobState } from '../lib/job'
import { formatBytes, formatDuration, formatElapsed, formatExpiresIn, isExpired } from '../lib/format'

interface Props {
  job: JobState
  repo: string
  onReset: () => void
  onRetry: () => void
}

const PHASE_LABEL: Record<string, string> = {
  starting: 'Starting…',
  processing: 'Downloading…',
  timeout: 'Timed out',
}

export default function JobCard({ job, repo, onReset, onRetry }: Props) {
  const [, setTick] = useState(0)
  // Re-render once a second while a ready result's link might be counting down
  // toward expiry, so "expires in Xm" stays current without a full poll.
  useEffect(() => {
    if (job.phase !== 'ready') return
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000)
    return () => window.clearInterval(id)
  }, [job.phase])

  const actionsUrl = `https://github.com/${repo}/actions`

  if (job.phase === 'starting' || job.phase === 'processing') {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {PHASE_LABEL[job.phase]}
          </span>
          <span className="ml-auto text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
            {formatElapsed(job.elapsedMs)}
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Usually done in under two minutes. You can leave this tab and come back.
        </p>
      </div>
    )
  }

  if (job.phase === 'ready' && job.result?.status === 'ready') {
    const r = job.result
    const { media, transcript } = r
    const expired = isExpired(r.expires_at)
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{r.title}</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatBytes(media.size)} · {formatDuration(r.duration)} ·{' '}
            {expired ? 'link expired' : formatExpiresIn(r.expires_at)}
          </p>
        </div>

        {!expired && media.name.endsWith('.mp3') && (
          <audio controls preload="none" src={media.download_url} className="w-full" />
        )}
        {!expired && (media.name.endsWith('.mp4') || media.name.endsWith('.mkv') || media.name.endsWith('.webm')) && (
          <video controls preload="none" src={media.download_url} className="w-full rounded-lg" />
        )}

        {expired ? (
          <button
            onClick={onRetry}
            className="rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white active:bg-red-700"
          >
            Link expired — download again
          </button>
        ) : (
          <a
            href={media.download_url}
            // A plain navigation, not fetch(): the signed URL has no CORS header,
            // so this is the only way to actually get the bytes onto the phone.
            className="block rounded-xl bg-emerald-600 px-4 py-3 text-center text-base font-semibold text-white active:bg-emerald-700"
          >
            Save to Files
          </a>
        )}

        {r.transcript_requested &&
          (transcript ? (
            !expired && (
              <a
                href={transcript.download_url}
                className="block rounded-xl border border-emerald-600 px-4 py-3 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300"
              >
                Save transcript ({formatBytes(transcript.size)})
              </a>
            )
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No captions available for this video — transcript wasn't saved.
            </p>
          ))}

        <button
          onClick={onReset}
          className="text-sm font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Download another
        </button>
      </div>
    )
  }

  if (job.phase === 'failed' && job.failure?.status === 'failed') {
    const { reason, log_tail } = job.failure
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
      </div>
    )
  }

  if (job.phase === 'timeout') {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950">
        <p className="font-medium text-amber-900 dark:text-amber-200">Timed out waiting</p>
        <p className="text-sm text-amber-800 dark:text-amber-300">
          The workflow is taking longer than expected — check the Actions log, or try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white active:bg-amber-700"
          >
            Try again
          </button>
          <a
            href={actionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-amber-300 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-800 dark:text-amber-300"
          >
            Open Actions log
          </a>
        </div>
      </div>
    )
  }

  if (job.phase === 'error') {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950">
        <p className="font-medium text-amber-900 dark:text-amber-200">Couldn't start the download</p>
        <p className="text-sm text-amber-800 dark:text-amber-300">{job.errorMessage}</p>
        <button
          onClick={onRetry}
          className="self-start rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white active:bg-amber-700"
        >
          Try again
        </button>
      </div>
    )
  }

  return null
}
