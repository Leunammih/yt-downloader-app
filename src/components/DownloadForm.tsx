import { useEffect, useState } from 'react'

interface Props {
  onSubmit: (url: string, format: 'video' | 'audio') => void
  busy: boolean
  initialUrl?: string
  initialFormat?: 'video' | 'audio'
}

export default function DownloadForm({ onSubmit, busy, initialUrl, initialFormat }: Props) {
  const [url, setUrl] = useState(initialUrl ?? '')
  const [format, setFormat] = useState<'video' | 'audio'>(initialFormat ?? 'video')
  const [pasteError, setPasteError] = useState(false)

  // A link arriving later via ?url= (e.g. a second Share Sheet hit while this tab
  // is already open) should still land in the field.
  useEffect(() => {
    if (initialUrl) setUrl(initialUrl)
    if (initialFormat) setFormat(initialFormat)
  }, [initialUrl, initialFormat])

  const handlePaste = async () => {
    setPasteError(false)
    try {
      const text = await navigator.clipboard.readText()
      if (text) setUrl(text.trim())
    } catch {
      setPasteError(true)
    }
  }

  const canSubmit = url.trim().length > 0 && !busy

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit(url.trim(), format)
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="url" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          YouTube link
        </label>
        <div className="flex gap-2">
          <input
            id="url"
            type="url"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="https://youtube.com/watch?v=…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
            className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-red-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={handlePaste}
            disabled={busy}
            className="shrink-0 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 active:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:active:bg-zinc-800"
          >
            Paste
          </button>
        </div>
        {pasteError && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Couldn't read the clipboard automatically — paste into the field manually.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Format</span>
        <div className="grid grid-cols-2 gap-2">
          {(['video', 'audio'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              disabled={busy}
              className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-colors disabled:opacity-50 ${
                format === f
                  ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950 dark:text-red-300'
                  : 'border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white active:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? 'Working…' : 'Download'}
      </button>
    </form>
  )
}
