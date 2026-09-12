import { useState } from 'react'
import { testConnection, type GitHubConfig } from '../lib/github'

interface Props {
  cfg: GitHubConfig
  onChange: (cfg: GitHubConfig) => void
}

export default function Settings({ cfg, onChange }: Props) {
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testConnection(cfg)
    setTestResult(result.ok ? { ok: true, message: 'Connected.' } : { ok: false, message: result.message })
    setTesting(false)
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

      <p className="text-xs text-zinc-400 dark:text-zinc-500">Build {__BUILD_ID__}</p>
    </div>
  )
}
