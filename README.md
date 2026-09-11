# YT Downloader (web app)

Phone-facing front end for `Leunammih/YT-audio-vid-downloader-mobile` (the private
backend repo, sibling folder `../YouTube Downloader Mobile/`). A single-page PWA:
paste a YouTube link, pick Video or Audio, wait, tap "Save to Files".

Live at **https://leunammih.github.io/yt-downloader-app/**.

## Why a separate, public repo

GitHub Pages can't serve a private repo on the free plan, and even on a paid plan the
published site itself is still public. This app holds no secrets — your GitHub token
lives only in your own browser's `localStorage` — so it's safe to keep public. The
private repo (cookies, the actual downloading) stays private.

## Local development

```bash
npm install
npm run dev
```

Open the printed URL. Go to **Settings**, paste a GitHub fine-grained PAT scoped to
the backend repo (see its README), and you're set.

### Mock mode (no token needed)

Append `?mock=<scenario>` to the dev URL to exercise every UI state without a real
backend — e.g. `?mock=ready-video`, `?mock=cookies_expired`, `?mock=slow`. See
`src/lib/mock.ts` for the full list. Dev-only: stripped from production builds.

## Deploy

Push to `main` — `.github/workflows/deploy.yml` builds and deploys to GitHub Pages
automatically (Pages source must be set to "GitHub Actions" once, in repo Settings →
Pages).

## Two ways links get in

1. **Paste button** in the Download tab.
2. **Share Sheet Shortcut** (built on the phone, not here — see backend repo README):
   shares a YouTube link straight to `?url=<encoded>`, which auto-starts the download.

## Architecture note

The backend resolves and hands back a **signed download URL** rather than the app
fetching the file itself — `release-assets.githubusercontent.com` sends no CORS
header, so `fetch()` on that URL always fails cross-origin. The "Save to Files"
button is a plain `<a href>` navigation instead, which isn't subject to CORS. See
`CLAUDE.md` for the full reasoning and the release-notes JSON contract this app polls.
