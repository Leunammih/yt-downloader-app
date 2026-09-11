// Dev-only fixtures for exercising every UI state without a real GitHub token or
// workflow run. Enabled via ?mock=<scenario>. Gated on import.meta.env.DEV so
// Vite's dead-code elimination drops it entirely from production builds.
import type { JobStatus } from './github'

export type MockScenario =
  | 'ready-audio'
  | 'ready-video'
  | 'cookies_expired'
  | 'unavailable'
  | 'unknown'
  | 'slow'

export const MOCK_SCENARIOS: MockScenario[] = [
  'ready-audio',
  'ready-video',
  'cookies_expired',
  'unavailable',
  'unknown',
  'slow',
]

function isScenario(value: string | null): value is MockScenario {
  return !!value && (MOCK_SCENARIOS as string[]).includes(value)
}

/** Reads ?mock=<scenario> from the URL. Only meaningful in dev builds. */
export function getMockScenario(): MockScenario | undefined {
  if (!import.meta.env.DEV) return undefined
  const value = new URLSearchParams(window.location.search).get('mock')
  return isScenario(value) ? value : undefined
}

const READY_AUDIO: JobStatus = {
  status: 'ready',
  title: 'Me at the zoo',
  name: 'Me_at_the_zoo_jNQXAC9IVRw.mp3',
  size: 331053,
  duration: 19,
  download_url:
    'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA', // tiny silent stub, just for the preview player
  expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
}

const READY_VIDEO: JobStatus = {
  ...READY_AUDIO,
  name: 'Me_at_the_zoo_jNQXAC9IVRw.mp4',
  size: 533916,
}

export function mockPoll(scenario: MockScenario, elapsedMs: number): JobStatus | null {
  const processingUntil = scenario === 'slow' ? 30_000 : 3_000
  if (elapsedMs < processingUntil) {
    return { status: 'processing', format: scenario === 'ready-video' ? 'video' : 'audio' }
  }
  switch (scenario) {
    case 'ready-audio':
    case 'slow':
      return READY_AUDIO
    case 'ready-video':
      return READY_VIDEO
    case 'cookies_expired':
      return {
        status: 'failed',
        reason: 'cookies_expired',
        log_tail:
          "ERROR: [youtube] Sign in to confirm you're not a bot. Use --cookies-from-browser or --cookies for the authentication.",
      }
    case 'unavailable':
      return {
        status: 'failed',
        reason: 'unavailable',
        log_tail: 'ERROR: [youtube] Video unavailable. This video is private.',
      }
    case 'unknown':
      return {
        status: 'failed',
        reason: 'unknown',
        log_tail: 'ERROR: [youtube] Unexpected error occurred.',
      }
  }
}
