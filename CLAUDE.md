# YT Downloader App (PWA)

Public, phone-first PWA. The frontend for `../YouTube Downloader Mobile/` (private
backend repo — see its `CLAUDE.md` for the workflow/cookies side).

## Stack

- Vite + React + TypeScript + Tailwind, `vite-plugin-pwa` (`registerType: 'autoUpdate'`)
- No backend of its own — talks directly to the GitHub REST API with a user-supplied
  fine-grained PAT, stored in `localStorage` only
- Live at https://leunammih.github.io/yt-downloader-app/ — pushing to `main` auto-deploys

## Commands

- `npm run dev` — local dev
- `npm run build` — production build to `dist/` (runs `tsc -b` first)
- `?mock=<scenario>` query param in dev — exercise every UI state without a token
  (see `src/lib/mock.ts`)

## The two things that shaped this app's design

1. **CORS.** `api.github.com` allows browser `fetch()` (dispatch workflow, poll release
   status). The actual file, once uploaded, is served via a redirect to
   `release-assets.githubusercontent.com`, which sends **no CORS header** — confirmed
   with curl 2026-09-11. So the backend resolves that signed URL server-side and puts
   it in the release notes; this app only ever **navigates** to it (`<a href>`), never
   `fetch()`s it.
2. **The release-notes JSON contract.** The backend writes a JSON blob into each
   release's `body` field: `{"status": "processing"}` while running, then either
   `{"status": "ready", "title", "duration", "expires_at", "media": {"name", "size",
   "download_url"}, "transcript_requested": bool, "transcript": {"name", "size",
   "download_url"} | null}` or `{"status": "failed", "reason": "cookies_expired" |
   "unavailable" | "unknown", "log_tail"}`. `src/lib/github.ts` parses this;
   `src/lib/job.ts` is the polling state machine built on top of it. **If the backend's
   `download.yml` changes this shape, update the `JobStatus`/`AssetInfo` types here
   too** — there's no shared schema file, just this note on both sides.

## Conventions

- Everything stays client-side; no server of its own. The GitHub token and download
  history never leave the device except to the GitHub API itself.
- iOS gotcha: a link opened via the Share Sheet Shortcut lands in **Safari**, not the
  installed Home Screen app — they have separate `localStorage`. The token has to be
  set in both. The app shows a plain "no token set" banner rather than failing
  silently when it's missing.
- Commit after each working feature; update `STATUS.md` at session end.

## Session workflow (standing instruction — follow every iteration)

One iteration = one feature. Repeat this loop without being asked:

1. **Build it** — verify in-browser yourself (Browser pane, both themes, `?mock=`
   scenarios for every state). Never hand over something unverified.
2. **`npx tsc -b --noEmit && npm run build`**, then **commit and push to `main`** —
   don't ask permission to push. The deploy *is* how Immanuel tests, so unpushed work
   is untestable work.
3. **Write the phone checklist** into `STATUS.md` under **"Check on your phone
   (current)"** — replace the previous iteration's list, don't accumulate them. Then
   repeat that same list in chat: numbered, concrete taps, each with the exact
   expected result, plus what a failure would look like.
4. **Stop and wait.** Do not start the next feature until he reports back.
5. **On his reply** — fix anything he reports, then move to the next item under
   "Exact next step" and start again at 1.
