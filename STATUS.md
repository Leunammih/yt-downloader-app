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

## Open markers

- 🟦 TASK · shortcut1 — build the 3-action Share Sheet Shortcut (steps in backend
  README). Best done after confirming which storage context (Safari tab vs. Home
  Screen icon) you're standardizing on, since the Shortcut opens links in Safari.

## Check on your phone (current)

1. **Download** tab → paste a YouTube link that has captions → check **Also save
   transcript** → Audio → **Download** → expect a ready card with a **Save
   transcript (…)** button below **Save to Files** → tap it → a `.txt` file with
   readable (non-repeating) text appears in Files, named after the video title
   (e.g. "Video Title (transcript).txt").
2. Try a link you're confident has *no* captions, same checkbox on → expect the
   ready card to show "No captions available for this video — transcript wasn't
   saved" instead of a broken button.
3. Check the saved media file's name in Files app — should read like the real
   video title (with dots instead of spaces), not the old underscore+ID style.

## Exact next step

Do the phone checklist above (transcript feature, real video). Separately: `done
shortcut1` once the Share Sheet Shortcut is built, and let me know which storage
context (Safari tab / Home Screen icon) you want to standardize the token in.
