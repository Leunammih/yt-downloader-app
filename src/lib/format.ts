export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—'
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** mm:ss elapsed timer for the progress card. */
export function formatElapsed(ms: number): string {
  return formatDuration(Math.floor(ms / 1000))
}

/** Countdown to a signed URL's expiry, e.g. "expires in 42m". */
export function formatExpiresIn(expiresAt: string, now = Date.now()): string {
  const diffMs = new Date(expiresAt).getTime() - now
  if (diffMs <= 0) return 'link expired'
  const minutes = Math.ceil(diffMs / 60_000)
  if (minutes < 60) return `expires in ${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `expires in ${hours}h ${minutes % 60}m`
}

export function isExpired(expiresAt: string, now = Date.now()): boolean {
  return new Date(expiresAt).getTime() <= now
}
