// Manual PWA-update control for the Settings "Check for updates" button.
// registerType: 'prompt' in vite.config.ts means a new build installs but sits
// "waiting" until we explicitly tell it to take over (applyUpdate) — nothing
// swaps mid-session on its own.
import { registerSW } from 'virtual:pwa-register'

type UpdateSW = (reloadPage?: boolean) => Promise<void>

let updateSWFn: UpdateSW | null = null
let updateReady = false
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((cb) => cb())
}

/** Call once, at app startup (main.tsx). No-op if service workers aren't supported. */
export function initPWAUpdate() {
  if (!('serviceWorker' in navigator)) return
  updateSWFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true
      notify()
    },
  })
}

export function isUpdateReady(): boolean {
  return updateReady
}

/** Re-render when a new version is found (e.g. from a background check). */
export function subscribeToUpdateReady(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export type CheckResult = 'unsupported' | 'checked'

/**
 * Forces the browser to re-fetch sw.js right now (bypassing normal HTTP
 * caching, per the Service Worker spec's own `update()` semantics) instead of
 * waiting for whatever the browser's own background check interval is. If a
 * new version is found, onNeedRefresh above fires asynchronously a moment
 * later — there's no synchronous "yes/no" answer from this call itself.
 */
export async function checkForUpdate(): Promise<CheckResult> {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return 'unsupported' // e.g. local dev, where the SW isn't registered at all
  try {
    await reg.update()
  } catch {
    // Offline, or the request failed — nothing more to do; the caller's own
    // timeout-based "up to date" fallback covers this the same as a real no-op check.
  }
  return 'checked'
}

/** Activates the waiting service worker and reloads once it takes over. */
export async function applyUpdate() {
  if (updateSWFn) {
    await updateSWFn(true)
  } else {
    window.location.reload()
  }
}
