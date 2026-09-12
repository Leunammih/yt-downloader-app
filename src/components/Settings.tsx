import { useEffect, useRef, useState } from 'react'
import { testConnection, type GitHubConfig } from '../lib/github'
import { applyUpdate, checkForUpdate, isUpdateReady, subscribeToUpdateReady } from '../lib/pwaUpdate'

interface Props {
  cfg: GitHubConfig
  onChange: (cfg: GitHubConfig) => void
}

type UpdateState = 'idle' | 'checking' | 'ready' | 'up-to-date' | 'unsupported'

// A new build takes 5-10s to fetch/compare/install once found — give it a real
// window before concluding there's nothing new, rather than a hair-trigger timeout.
const CHECK_TIMEOUT_MS = 10_000

export default function Settings({ cfg, onChange }: Props) {
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [updateState, setUpdateState] = useState<UpdateState>(isUpdateReady() ? 'ready' : 'idle')
  const timeoutRef = useRef<number | null>(null)

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testConnection(cfg)
    setTestResult(result.ok ? { ok: true, message: 'Connected.' } : { ok: false, message: result.message })
    setTesting(false)
  }

  // Fires if a check we kicked off finds an update, including one that lands
  // after our own timeout already gave up and said "up to date".
  useEffect(() => {
    return subscribeToUpdateReady(() => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      setUpdateState('ready')
    })
  }, [])

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
  }, [])

  const runUpdateCheck = async () => {
    setUpdateState('checking')
    const result = await checkForUpdate()
    if (result === 'unsupported') {
      setUpdateState('unsupported')
      return
    }
    timeoutRef.current = window.setTimeout(() => {
      setUpdateState((s) => (s === 'ready' ? s : 'up-to-date'))
    }, CHECK_TIMEOUT_MS)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="token" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          GitHub token
        </label>
        <input
          id="token"
          type="password"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="github_pat_…"
          value={cfg.token}
          onChange={(e) => onChange({ ...cfg, token: e.target.value })}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm text-zinc-900 outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Fine-grained PAT scoped to the repo below, with Actions and Contents set to
          Read and write. Stored only in this browser's localStorage.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="repo" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Repo
        </label>
        <input
          id="repo"
          type="text"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="owner/repo"
          value={cfg.repo}
          onChange={(e) => onChange({ ...cfg, repo: e.target.value })}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm text-zinc-900 outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={runTest}
          disabled={testing}
          className="self-start rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 active:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:active:bg-zinc-800"
        >
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        {testResult && (
          <p
            className={`text-sm ${testResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {testResult.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <p className="font-medium text-zinc-700 dark:text-zinc-200">Downloads on iPhone</p>
        <p>
          A website can't choose where a download is saved, or open Files
          afterward — those are iOS/Safari settings, not something this app
          controls:
        </p>
        <ul className="list-disc pl-5">
          <li>
            Save location / ask each time: <strong>Settings app → Safari → Downloads</strong>.
          </li>
          <li>
            Pause, resume, retry, or "Show in Files" for any transfer in
            progress: tap the <strong>⬇ Downloads button</strong> in Safari's own
            toolbar.
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={runUpdateCheck}
          disabled={updateState === 'checking'}
          className="self-start rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 active:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:active:bg-zinc-800"
        >
          {updateState === 'checking' ? 'Checking…' : 'Check for updates'}
        </button>

        {updateState === 'ready' && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-300">A new version is ready.</p>
            <button
              onClick={() => applyUpdate()}
              className="ml-auto rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white active:bg-red-700"
            >
              Update now
            </button>
          </div>
        )}
        {updateState === 'up-to-date' && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">You're on the latest version.</p>
        )}
        {updateState === 'unsupported' && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No app update to check — you're viewing this in a plain browser tab, not
            the installed version.
          </p>
        )}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">Build {__BUILD_ID__}</p>
    </div>
  )
}
