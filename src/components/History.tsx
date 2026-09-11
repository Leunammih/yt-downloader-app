import type { HistoryEntry } from '../lib/storage'

interface Props {
  entries: HistoryEntry[]
  onRedownload: (entry: HistoryEntry) => void
}

const STATUS_DOT: Record<HistoryEntry['status'], string> = {
  processing: 'bg-amber-400',
  ready: 'bg-emerald-500',
  failed: 'bg-red-500',
}

export default function History({ entries, onRedownload }: Props) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Nothing downloaded yet.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.runKey}>
          <button
            onClick={() => onRedownload(entry)}
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[entry.status]}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-zinc-900 dark:text-zinc-100">
                {entry.title ?? entry.url}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {entry.format} · {new Date(entry.createdAt).toLocaleString()}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
