# Karmazin Tattoo — karmazin.space

Static one-page site for a tattoo artist (Анатолій Кармазін, Вільногірськ, Ukraine), fully editable by the
non-technical owner through a CMS admin panel. No backend database — content lives in a JSON file edited
via Decap CMS, and the site is pre-rendered at build time so it works even without JavaScript.

**Owner priorities (stated repeatedly, keep these in mind for every change):**
- "Just needs to keep working" — the owner is not a developer, relies on the admin panel for all edits.
  Never break `/admin` or the public page. Test thoroughly before considering a change done.
- Site should survive ~1.5 years with minimal/no maintenance — this is why dependency versions are pinned
  (not `"latest"`), and why fixes favor low-maintenance, boring solutions over clever ones.
- No code comments in `index.html` / JS (owner found them distracting/"AI-looking"). Keep it that way.

## Architecture

- **`index.html`** — the entire public site: all CSS in one `<style>` block, all markup, and one big inline
  `<script>` at the bottom of `<body>` that hydrates content client-side.
- **`content/site.json`** — the actual content, edited via `/admin` (Decap CMS, git-gateway backend +
  Netlify Identity for auth). This is the single source of truth for text/prices/photos/theme colors/contact
  links.
- **`content.default.js`** — `DEFAULT_CONTENT` fallback object + `deepMerge(base, override)`. Isomorphic:
  runs both in the browser and in Node (`module.exports` guard at the bottom). `site.json` is deep-merged
  on top of these defaults, so any field missing from `site.json` still has a sane fallback.
- **`templates.js`** — shared render functions (`renderStyleCard`, `renderProcessItem`, `renderGalleryCell`,
  `renderPriceCard`, `escapeHtml`). Isomorphic like content.default.js. Used by both `build.js` and the
  client script so there's exactly one implementation of each card's HTML.
- **`build.js`** (Node, zero-dependency logic of its own beyond the packages below) — runs at Netlify build
  time (`node build.js`, see `netlify.toml`). It:
  1. Loads `content/site.json`, deep-merges over `DEFAULT_CONTENT`.
  2. Converts any `.heic`/`.heif` gallery or master photo to `.jpg` (phones upload HEIC; browsers can't
     render it). Uses `heic-convert`.
  3. Resizes/recompresses every gallery image + the master photo to max 1600px wide, quality 82 JPEG (or
     PNG if the source is PNG) via `sharp`. This is why a phone photo that's originally 3–8MB ends up
     under ~400KB. Strips EXIF (including GPS) as a side effect — treated as a privacy positive.
  4. Regex-replaces placeholders in `index.html` (`setInner`/`setAttr`/`setRootVar`/`setOptionalLink`
     helpers) with real content: meta tags, schema.org JSON-LD, hero/master/contact text, gallery/styles/
     process/pricing HTML (via `templates.js`), and the **theme's CSS custom properties baked directly
     into the `:root` block** (not just left to client JS — this was a real bug: without this, every page
     load flashed the default pink/crimson colors before JS repainted the real theme).
  5. Embeds the fully-merged content object as JSON in `<script type="application/json"
     id="site-content-data">` inside the page — this is what the client script reads first.
  6. Copies static assets into `dist/` (see `assetsToCopy` array in build.js — **any new top-level static
     file you add must be added to this list or it won't be deployed**).
- **Client script** (bottom of `index.html`): `loadSiteContent()` reads the embedded JSON first; only falls
  back to `fetch('content/site.json')` if that's missing/corrupt (returns `{ data, fromEmbedded }`).
  **Important**: gallery/styles/process/pricing are only re-rendered via `innerHTML` when
  `fromEmbedded === false`. On the normal path (embedded JSON present, ~100% of real traffic) the
  pre-rendered DOM from build.js is left untouched — re-rendering it was previously unconditional and
  caused a real PageSpeed regression (recreating `<img>` elements resets their effective paint timing,
  which showed up as a bad LCP). Don't remove this guard without re-checking that diagnosis.

## Content schema quick reference (`content/site.json`)

- `instagramUrl` — used site-wide: header nav, hero CTA, lightbox. Separate from `contactButtons.instagramUrl`.
- `contactButtons.{instagram,viber,telegram}{Label,Url}` — the three buttons in the "Готові обговорити
  ескіз?" section only. Viber/Telegram buttons are hidden entirely (`display:none`, both in the static
  HTML and via client JS) when their URL is empty — don't show dead buttons. `telegramUrl` is normalized
  (accepts `@username`, bare `username`, or a full `https://t.me/...` URL) both in build.js and client JS.
- `master.photo` — CMS image upload field. Doubles as the **default og:image/twitter:image/schema.org
  image** (see `seo.ogImage`/`seo.twitterImage` — leave those blank in the CMS to let this auto-apply;
  they're only an override).
- `theme.{void,ink,crimson,crimsonBright,bone}` — hex colors, baked into `:root` by build.js (see above).
  Must be valid 6-digit hex — an invalid value (e.g. a 5-digit typo) silently breaks every CSS rule that
  uses that variable in a shorthand property (this happened once: a border disappeared site-wide because
  `crimson` was `#00333` instead of `#003333`).
- `gallery[]` — `{ src, caption, description }`. `src` is a normal CMS image widget (`media_folder:
  "images"`), any format including phone HEIC — build.js handles conversion/compression automatically.
- `seo.*` — meta tags. `ogImage`/`twitterImage` should normally stay empty (see `master.photo` above).

## Admin (`admin/`)

- `config.yml` — Decap CMS field schema. Field **order in the YAML controls the order in the CMS UI**,
  independent of where a field's data actually lives in the JSON — this was used deliberately to group the
  contact buttons together in the form even though `instagramUrl` (top-level) is separate from
  `contactButtons.instagramUrl`.
- `index.html` — loads Decap CMS pinned to an **exact version** (`decap-cms@3.14.1`, not `^3.0.0`) —
  deliberate per the "must run 1.5 years unattended" goal. Also loads `preview.js`/`preview.css`.
- `preview.js` / `preview.css` — custom live-preview panel that mirrors the real site's look (dark theme,
  same fonts, same section layout) instead of Decap's default plain field-dump preview. Renders via
  `h()`/`createClass()` globals exposed by the decap-cms UMD bundle (no build step, no JSX). **Keep this in
  sync with the content schema** — it went stale once already when `contactButtons` replaced
  `contact.ctaPrimary`, and the preview silently kept referencing the deleted field.
- CSP note: `/admin/*` is deliberately **excluded** from the Content-Security-Policy in `netlify.toml`
  (see below) — Decap CMS's bundle (loaded from unpkg) needs latitude (`unsafe-eval`, various origins) that
  hasn't been precisely audited, and getting it wrong would break content editing, which is the one thing
  that must never break.

## Netlify Functions (`netlify/functions/`)

- **`send-telegram.js`** — booking form handler. Verifies Cloudflare Turnstile token server-side
  (`siteverify`), rate-limits 5 requests/hour/IP via `@netlify/blobs` (fails open — a Blobs outage doesn't
  block real bookings), then relays to Telegram Bot API. Returns generic `{ok:true}`/`{ok:false,error}` —
  never echoes Telegram's raw response (it leaks the recipient chat_id/username otherwise). Secrets
  (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TURNSTILE_SECRET_KEY`) are Netlify env vars only, never in
  the repo or CMS content — the repo is public.
- **`health-check.js`** — scheduled function (`schedule('0 */4 * * *', ...)`), pings the live site every 4h,
  only sends a Telegram alert on a real problem (non-200/unreachable) — not on every successful heartbeat.

## Security posture

- No secrets in the repo, ever (verified via `git log`/`git grep` sweeps — keep it that way).
- `netlify.toml` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
  site-wide, and a `Content-Security-Policy` scoped to `/` only (see admin CSP note above).
- Booking form: required consent checkbox + `/privacy.html` (plain-language privacy policy: what's
  collected, why, which third parties — Telegram, Cloudflare Turnstile — process it). Required for Ukraine's
  "Про захист персональних даних" for commercial data collection.
- **Not verifiable from code, flagged to the owner, not resolved**: whether the underlying tattoo business
  is legally registered (ФОП/sanitary permits) and whether every gallery photo is actually the owner's own
  work — both outside what a code review can confirm.

## Domain / deploy

- Primary domain `karmazin.space` (Netlify DNS), 301 redirect from the old `karmazin.netlify.app` (see
  `netlify.toml` `[[redirects]]`) — keep both the redirect and the fact that `*.netlify.app` still resolves
  in mind if anything seems to be testing against a stale/duplicate origin.
- Google Search Console: verified via `googlec5a8428c6a8d807b.html` (must stay in `assetsToCopy` — it has to
  be served publicly, it's not a secret). Site is indexed and was ranking #3 for "тату Вільногірськ" as of
  the last check; a Google Business Profile (not yet set up, requires the owner's own Google account) would
  likely move that needle more than further on-page changes.

## Testing approach (no Node in some sandboxes)

Several past sessions had no local Node.js. If that's still the case: download a portable Node binary
(`nodejs.org/dist/...`) into the scratchpad, `npm install` there, and run `node build.js` for real rather
than hand-simulating the regex logic. Always run a **real build** (not just a read-through) before
committing anything touching `build.js`, `index.html`'s inline script, or `templates.js` — this project has
a working `jsdom`-based smoke test pattern used throughout: load `dist/index.html` with `runScripts:
'dangerously'`, stub `IntersectionObserver`, and assert on `document.querySelectorAll(...)` counts / absence
of thrown errors. Reuse that pattern for any future change to the rendering pipeline.

## Git workflow

The assistant has no push credentials in this environment (`https://github.com/...` remote, no stored
auth) — **commit locally, tell the user to `git push` themselves**. Don't attempt to push and don't ask for
credentials.
