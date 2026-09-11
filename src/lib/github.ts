// Talks to the GitHub REST API directly from the browser. api.github.com sends
// Access-Control-Allow-Origin: *, so plain fetch() works for dispatch + polling.
// The actual file bytes are a different story — see the "Save to Files" button
// in JobCard, which *navigates* to a signed URL instead of fetching it.

const API = 'https://api.github.com'

export interface GitHubConfig {
  token: string
  /** "owner/repo" */
  repo: string
}

export interface AssetInfo {
  name: string
  size: number
  download_url: string
}

export type JobStatus =
  | { status: 'processing'; format?: 'video' | 'audio' }
  | {
      status: 'ready'
      title: string
      duration: number | null
      expires_at: string
      media: AssetInfo
      transcript_requested: boolean
      transcript: AssetInfo | null
    }
  | {
      status: 'failed'
      reason: 'cookies_expired' | 'unavailable' | 'unknown'
      log_tail: string
    }

export class GitHubError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
  }
}

function authHeaders(token: string, accept = 'application/vnd.github+json') {
  return {
    Authorization: `Bearer ${token}`,
    Accept: accept,
  }
}

function messageForStatus(status: number): string {
  if (status === 401) return 'Token is invalid or expired — check it in Settings.'
  if (status === 403) return "Token doesn't have Actions/Contents write access to this repo."
  if (status === 404) return 'Repo, workflow, or release not found — check the repo name in Settings.'
  return `GitHub API error (${status})`
}

export async function dispatchDownload(
  cfg: GitHubConfig,
  params: { url: string; format: 'video' | 'audio'; runKey: string; includeTranscript: boolean },
): Promise<void> {
  const res = await fetch(
    `${API}/repos/${cfg.repo}/actions/workflows/download.yml/dispatches`,
    {
      method: 'POST',
      headers: { ...authHeaders(cfg.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          url: params.url,
          format: params.format,
          run_key: params.runKey,
          // workflow_dispatch inputs are always strings over the API, even for a
          // boolean-typed input — the workflow compares against the string "true".
          include_transcript: params.includeTranscript ? 'true' : 'false',
        },
      }),
    },
  )
  if (!res.ok) throw new GitHubError(messageForStatus(res.status), res.status)
}

/** Returns null while the placeholder release doesn't exist yet (still queued). */
export async function getReleaseStatus(
  cfg: GitHubConfig,
  runKey: string,
): Promise<JobStatus | null> {
  const res = await fetch(
    `${API}/repos/${cfg.repo}/releases/tags/${encodeURIComponent(runKey)}`,
    { headers: authHeaders(cfg.token) },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new GitHubError(messageForStatus(res.status), res.status)

  const data = (await res.json()) as { body?: string | null }
  if (!data.body) return null
  try {
    return JSON.parse(data.body) as JobStatus
  } catch {
    // Release exists but notes aren't valid JSON yet (write raced us) — treat as pending.
    return null
  }
}

export async function testConnection(
  cfg: GitHubConfig,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!cfg.token) return { ok: false, message: 'Paste a token first.' }
  if (!cfg.repo.includes('/')) return { ok: false, message: 'Repo should look like owner/name.' }

  const res = await fetch(`${API}/repos/${cfg.repo}`, { headers: authHeaders(cfg.token) })
  if (!res.ok) return { ok: false, message: messageForStatus(res.status) }
  return { ok: true }
}
