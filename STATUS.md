# Status

## Done

- Full app scaffolded: Download / History / Settings tabs, GitHub REST API client,
  polling state machine, localStorage persistence, mock mode for every UI state.
- PWA manifest + icons, GitHub Pages deploy workflow (mirrors the Health Tracker's).
- Backend (`../YouTube Downloader Mobile/`) reworked to match: self-pruning
  releases, JSON status in release notes, signed download URL resolved server-side,
  failure-reason classification.
- Deployed live: https://leunammih.github.io/yt-downloader-app/.
- `cookies1` and `pat1` done — confirmed with **real** downloads (not mocks): two
  successful real-video test runs from the phone with Immanuel's own token, plus a
  separate backend-side cookie-refresh verification.
- Human-readable filenames: delivered files are now named after the video's real
  title instead of `Video_Title_<id>.mp3` (GitHub's own release-asset storage still
  turns spaces into dots, e.g. "My.Video.mp3" — a platform quirk, not ours to fix).
- Optional transcript: a checkbox ("Also save transcript") fetches captions
  (manual preferred, else auto-generated) and cleans them into flowing plain text,
  merging YouTube auto-caption's overlapping "rolling" lines. Gracefully reports
  "no captions available" rather than failing when a video has none. Verified live
  on the backend (the no-captions path) and in the Browser pane (both new mock
  scenarios, `?mock=ready-with-transcript` / `?mock=ready-transcript-unavailable`).
  **Not yet verified against a real video that actually has captions** — worth a
  real check next.
- Diagnosed (not yet built): the "token disappears" report was very likely iOS
  Safari's separate storage between a regular tab and the installed Home Screen
  icon — re-entering the token in whichever context is actually used should fix it.
  Offered, not yet asked for: a "Copy setup link" button to transfer the token
  between contexts without retyping.

- Quality picker + progress %, the three genuinely buildable items from Immanuel's
  "add these functions" list (the rest — choosing a save folder, pausing the
  server-side fetch, opening Files afterward — are hard iOS/Actions platform walls,
  explained in chat rather than faked):
  - New backend `analyze.yml`: metadata-only (`yt-dlp -J --skip-download`, no media
    ever downloaded), returns the real distinct video resolutions available for
    that specific URL (with approx size) and English-caption availability.
  - New `form → picking → downloading` flow (`App.tsx`), replacing the old single-
    step form: `DownloadForm` now just collects the link + format and dispatches
    Analyze; `QualityPicker` shows the real resolutions plus the transcript
    checkbox (with a `has_captions` hint) once Analyze returns; confirming there
    dispatches `download.yml` with the chosen `quality`.
  - `download.yml`'s two download steps now run yt-dlp in the background with
    `--newline`, tail its own log every ~3s, and push a numeric `progress` into the
    processing release notes; `JobCard` renders a real progress bar once numbers
    start arriving (falls back to the old pulsing-dot + elapsed timer before that).
  - Hit and fixed two separate `bash -e`/`pipefail` bugs building the progress
    loop — both made *real* failures look like instant, logless crashes. Documented
    in the backend `CLAUDE.md` so they don't get reintroduced.
  - Verified for real: `analyze.yml` on the test video (correctly found only
    240p/144p, `has_captions: true`); `download.yml` with an explicit non-default
    `quality=144` — confirmed via `ffprobe` on the actual delivered file
    (192×144, i.e. it really took effect, not just accepted-and-ignored).
  - Verified in the Browser pane (mock mode): full form → picking → downloading →
    ready flow including the progress bar reaching real percentages, both themes,
    the analyze-failure card, and the new Settings "Downloads on iPhone" tips card.
  - `tsc -b` and `vite build` clean.

## Open markers

- 🟦 TASK · shortcut1 — build the 3-action Share Sheet Shortcut (steps in backend
  README). Best done after confirming which storage context (Safari tab vs. Home
  Screen icon) you're standardizing on, since the Shortcut opens links in Safari.

## Check on your phone (current)

1. **Download** tab → paste a YouTube link → **Continue** → expect a short
   "Analyzing…" card, then a list of real resolution buttons (not a fixed
   1080/720/480/360 set — whatever that specific video actually has) with approx
   sizes, plus "captions available" / "none found" next to the transcript checkbox.
2. Pick a lower resolution (e.g. the smallest) → **Download** → expect the progress
   card to show a moving **percentage and a filling bar**, not just a pulsing dot.
3. Once ready → **Save to Files** → open the saved video's info in Files (or
   AVPlayer/QuickLook) → confirm its resolution actually matches what you picked,
   not always 1080p.
4. **Settings** tab → scroll down → confirm a new "Downloads on iPhone" card
   explains the save-folder setting and Safari's own Downloads button.
5. Try **Back** from the quality-picker screen → confirm it returns to the link
   form cleanly (not stuck, not double-submitting).

## Exact next step

Do the phone checklist above. Separately: `done shortcut1` once the Share Sheet
Shortcut is built, and let me know which storage context (Safari tab / Home Screen
icon) you want to standardize the token in.
