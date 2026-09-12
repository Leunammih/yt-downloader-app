import { useEffect, useMemo, useState } from 'react'
import DownloadForm from './components/DownloadForm'
import QualityPicker from './components/QualityPicker'
import JobCard from './components/JobCard'
import History from './components/History'
import Settings from './components/Settings'
import { useDownloadJob } from './lib/job'
import { useAnalyzeJob } from './lib/analyze'
import { getMockScenario } from './lib/mock'
import { getHistory, getRepo, getToken, setRepo, setToken, type HistoryEntry } from './lib/storage'
import type { GitHubConfig } from './lib/github'

type Tab = 'download' | 'history' | 'settings'
// form: paste a link. picking: analyze() ran, choosing quality/transcript.
// downloading: the real download.yml job is in flight (or finished).
type Flow = 'form' | 'picking' | 'downloading'

function readShareParams(): { url?: string; format?: 'video' | 'audio' } {
  const params = new URLSearchParams(window.location.search)
  const url = params.get('url') ?? undefined
  const formatParam = params.get('format')
  const format = formatParam === 'audio' || formatParam === 'video' ? formatParam : undefined
  return { url, format }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('download')
  const [cfg, setCfg] = useState<GitHubConfig>(() => ({ token: getToken(), repo: getRepo() }))
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())
  const [shareParams] = useState(readShareParams)
  const [flow, setFlow] = useState<Flow>('form')
  const [pendingFormat, setPendingFormat] = useState<'video' | 'audio'>('video')

  const mockScenario = useMemo(getMockScenario, [])
  const { state: analyze, start: startAnalyze, reset: resetAnalyze } = useAnalyzeJob(cfg, mockScenario)
  const { state: job, start: startDownload, reset: resetDownload } = useDownloadJob(cfg, mockScenario)

  useEffect(() => setToken(cfg.token), [cfg.token])
  useEffect(() => setRepo(cfg.repo), [cfg.repo])

  // A link shared in via ?url= should kick off analysis automatically, once —
  // otherwise re-triggering on every state change would refire it forever.
  useEffect(() => {
    if (shareParams.url) {
      const format = shareParams.format ?? 'video'
      setPendingFormat(format)
      setFlow('picking')
      startAnalyze(shareParams.url)
      setTab('download')
      const url = new URL(window.location.href)
      url.search = ''
      window.history.replaceState({}, '', url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshHistory = () => setHistory(getHistory())

  const handleAnalyzeSubmit = (url: string, format: 'video' | 'audio') => {
    setPendingFormat(format)
    setFlow('picking')
    startAnalyze(url)
  }

  const handleConfirmDownload = (quality: string | undefined, includeTranscript: boolean) => {
    if (!analyze.url) return
    setFlow('downloading')
    startDownload(analyze.url, pendingFormat, includeTranscript, quality)
  }

  const handleBackToForm = () => {
    resetAnalyze()
    setFlow('form')
  }

  const handleRetryAnalyze = () => {
    if (analyze.url) startAnalyze(analyze.url)
  }

  const handleDownloadReset = () => {
    resetDownload()
    resetAnalyze()
    setFlow('form')
    refreshHistory()
  }

  const handleRetryDownload = () => {
    if (job.url && job.format) startDownload(job.url, job.format, job.includeTranscript ?? false, job.quality)
  }

  const handleRedownload = (entry: HistoryEntry) => {
    setTab('download')
    setPendingFormat(entry.format)
    setFlow('downloading')
    startDownload(entry.url, entry.format, entry.includeTranscript ?? false, entry.quality)
  }

  const analyzeBusy = analyze.phase === 'starting' || analyze.phase === 'processing'

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-zinc-50 pb-[env(safe-area-inset-bottom)] dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/90 px-5 pb-3 pt-[max(env(safe-area-inset-top),1.25rem)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">YT Downloader</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-5">
        {tab === 'download' && (
          <div className="flex flex-col gap-5">
            {flow === 'downloading' ? (
              <JobCard
                job={job}
                repo={cfg.repo}
                onReset={handleDownloadReset}
                onRetry={handleRetryDownload}
              />
            ) : flow === 'picking' ? (
              <QualityPicker
                analyze={analyze}
                format={pendingFormat}
                repo={cfg.repo}
                onConfirm={handleConfirmDownload}
                onBack={handleBackToForm}
                onRetry={handleRetryAnalyze}
              />
            ) : (
              <DownloadForm
                onSubmit={handleAnalyzeSubmit}
                busy={analyzeBusy}
                initialUrl={shareParams.url}
                initialFormat={shareParams.format}
              />
            )}
            {!cfg.token && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                No token set yet — add one in Settings before downloading.
              </p>
            )}
          </div>
        )}

        {tab === 'history' && (
          <History
            entries={history.length ? history : getHistory()}
            onRedownload={handleRedownload}
          />
        )}

        {tab === 'settings' && <Settings cfg={cfg} onChange={setCfg} />}
      </main>

      <nav className="sticky bottom-0 grid grid-cols-3 border-t border-zinc-200 bg-zinc-50/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        {(
          [
            ['download', 'Download'],
            ['history', 'History'],
            ['settings', 'Settings'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key)
              if (key === 'history') refreshHistory()
            }}
            className={`py-3 text-sm font-medium ${
              tab === key
                ? 'text-red-600 dark:text-red-400'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
