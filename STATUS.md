# Status

## Done

- Full app scaffolded: Download / History / Settings tabs, GitHub REST API client,
  polling state machine, localStorage persistence, mock mode for every UI state.
- PWA manifest + icons, GitHub Pages deploy workflow (mirrors the Health Tracker's).
- Backend (`../YouTube Downloader Mobile/`) reworked to match: self-pruning
  releases, JSON status in release notes, signed download URL resolved server-side,
  failure-reason classification. Verified live (both the `cookies_expired` failure
  path and a full success run with fresh cookies, back in the original Shortcut-era
  testing).
- Deployed live: https://leunammih.github.io/yt-downloader-app/ — verified in the
  Browser pane at a real mobile viewport, light and dark, `tsc -b` and `vite build`
  clean. Not yet exercised end-to-end with a real token (see Open markers).

## Open markers

- 🟦 TASK · cookies1 — export fresh YouTube cookies from a secondary Google account,
  see backend README §0, then `./scripts/refresh-cookies.sh` (in
  `../YouTube Downloader Mobile/`)
- 🟦 TASK · pat1 — create the fine-grained GitHub PAT (backend README §1), paste it
  into the app's Settings tab
- 🟦 TASK · shortcut1 — build the 3-action Share Sheet Shortcut once the two above are
  done (steps in backend README)

## Check on your phone (current)

1. Open https://leunammih.github.io/yt-downloader-app/ in Safari → Share → **Add to
   Home Screen** → launch from the Home Screen icon.
2. **Settings** tab → paste your PAT → **Test connection** → expect "Connected."
   (fails until `pat1` is done).
3. **Download** tab → paste a YouTube link → Audio → **Download** → expect
   "Downloading…" then a ready card with title/size/duration and a working inline
   audio preview → **Save to Files** → file appears in Files app (fails/shows
   `cookies_expired` until `cookies1` is done).
4. Repeat with Video.
5. **History** tab → both attempts listed with the right status dot.

## Exact next step

Do the three Open marker tasks above (in order: cookies1, pat1, then a real download
test — shortcut1 last, once a plain paste-in-app download already works), then report
back with `done cookies1`, `done pat1`, `done shortcut1` as each lands.
