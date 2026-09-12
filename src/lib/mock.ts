// Dev-only fixtures for exercising every UI state without a real GitHub token or
// workflow run. Enabled via ?mock=<scenario>. Gated on import.meta.env.DEV so
// Vite's dead-code elimination drops it entirely from production builds.
import type { AnalyzeStatus, JobStatus } from './github'

export type MockScenario =
  | 'ready-audio'
  | 'ready-video'
  | 'ready-with-transcript'
  | 'ready-transcript-unavailable'
  | 'cookies_expired'
  | 'unavailable'
  | 'unknown'
  | 'slow'

export const MOCK_SCENARIOS: MockScenario[] = [
  'ready-audio',
  'ready-video',
  'ready-with-transcript',
  'ready-transcript-unavailable',
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

// Tiny silent audio stub, just so the inline preview player has something to load.
const STUB_MEDIA_URL =
  'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA'

const READY_AUDIO: JobStatus = {
  status: 'ready',
  title: 'Me at the zoo',
  duration: 19,
  expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
  media: { name: 'Me at the zoo.mp3', size: 331053, download_url: STUB_MEDIA_URL },
  transcript_requested: false,
  transcript: null,
}

const READY_VIDEO: JobStatus = {
  ...READY_AUDIO,
  media: { name: 'Me at the zoo.mp4', size: 533916, download_url: STUB_MEDIA_URL },
}

const READY_WITH_TRANSCRIPT: JobStatus = {
  ...READY_AUDIO,
  transcript_requested: true,
  transcript: {
    name: 'Me at the zoo (transcript).txt',
    size: 842,
    download_url: 'data:text/plain,Sample%20transcript%20text%20for%20preview%20only.',
  },
}

const READY_TRANSCRIPT_UNAVAILABLE: JobStatus = {
  ...READY_AUDIO,
  transcript_requested: true,
  transcript: null,
}

export function mockPoll(scenario: MockScenario, elapsedMs: number): JobStatus | null {
  const processingUntil = scenario === 'slow' ? 30_000 : 3_000
  if (elapsedMs < processingUntil) {
    const progress = Math.min(99, Math.round((elapsedMs / processingUntil) * 100))
    return { status: 'processing', format: scenario === 'ready-video' ? 'video' : 'audio', progress }
  }
  switch (scenario) {
    case 'ready-audio':
    case 'slow':
      return READY_AUDIO
    case 'ready-video':
      return READY_VIDEO
    case 'ready-with-transcript':
      return READY_WITH_TRANSCRIPT
    case 'ready-transcript-unavailable':
      return READY_TRANSCRIPT_UNAVAILABLE
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

export function mockAnalyzePoll(scenario: MockScenario, elapsedMs: number): AnalyzeStatus | null {
  const processingUntil = scenario === 'slow' ? 5_000 : 1_500
  if (elapsedMs < processingUntil) {
    return { status: 'processing' }
  }
  switch (scenario) {
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
    default:
      return {
        status: 'ready',
        title: 'Me at the zoo',
        duration: 19,
        has_captions: true,
        video_qualities: [
          { height: 1080, label: '1080p', approx_size: 42_000_000 },
          { height: 720, label: '720p', approx_size: 21_000_000 },
          { height: 480, label: '480p', approx_size: 9_500_000 },
          { height: 360, label: '360p', approx_size: 5_200_000 },
        ],
      }
  }
}
