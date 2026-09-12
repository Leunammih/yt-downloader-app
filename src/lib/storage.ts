// All persisted state lives in localStorage — no server on this side of the fence.
// Every read/write is wrapped, since Safari can throw in private-browsing contexts
// and this app should degrade to "just doesn't remember anything" rather than crash.

const KEYS = {
  token: 'ytdl.token',
  repo: 'ytdl.repo',
  history: 'ytdl.history',
} as const

export const DEFAULT_REPO = 'Leunammih/YT-audio-vid-downloader-mobile'

export interface HistoryEntry {
  runKey: string
  url: string
  format: 'video' | 'audio'
  includeTranscript?: boolean
  /** Preferred video height, e.g. "1080" — only meaningful when format is 'video'. */
  quality?: string
  title?: string
  status: 'processing' | 'ready' | 'failed'
  createdAt: number
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore — private browsing, storage full, etc.
  }
}

export function getToken(): string {
  return safeGet(KEYS.token) ?? ''
}

export function setToken(token: string) {
  safeSet(KEYS.token, token.trim())
}

export function getRepo(): string {
  return safeGet(KEYS.repo) ?? DEFAULT_REPO
}

export function setRepo(repo: string) {
  safeSet(KEYS.repo, repo.trim())
}

export function getHistory(): HistoryEntry[] {
  const raw = safeGet(KEYS.history)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addHistoryEntry(entry: HistoryEntry) {
  const list = [entry, ...getHistory().filter((e) => e.runKey !== entry.runKey)].slice(0, 20)
  safeSet(KEYS.history, JSON.stringify(list))
}

export function updateHistoryEntry(runKey: string, patch: Partial<HistoryEntry>) {
  const list = getHistory().map((e) => (e.runKey === runKey ? { ...e, ...patch } : e))
  safeSet(KEYS.history, JSON.stringify(list))
}

export function clearHistory() {
  safeSet(KEYS.history, '[]')
}
