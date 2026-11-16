# Platform Gap Analysis & Remediation Checklist

> Scope: admin CMS ↔ public homepage ↔ article templates
> Baseline: `feat/dedicated-backend` (Hono + Postgres backend, Astro/Netlify frontend)
> Rule: every item must be verified before it is checked off, and each item gets its own commit.

---

## Implementation Checklist

### Backend

- [x] **B1 — Partial updates null out dates.** `toDate(undefined)` returns `null`, so any PATCH that omits `scheduledAt`/`publishedAt` wipes them. Fixed by guarding both writes in `storyRowFromInput`; explicit `null` still clears.
- [x] **B2 — Public guest submission endpoint.** Added `POST /api/submissions` (public, rate-limited) that forces `Pending Review` / `pending_review`; `/submit` can now work without an admin token.
- [x] **B3 — Category records for story categories.** Added `ensureCategory()` on story create/update and a `db:backfill-categories` script; existing story categories now have rows/slugs.
- [x] **B4 — Story locking.** Added `locked_at` plus `POST /api/admin/stories/:id/lock` and `/unlock` (15-minute stale takeover, 409 on conflict, superadmin force-unlock); the editor acquires on open and releases on unmount.
- [x] **B5 — Category description + color contract.** `categories.description` (nullable text, max 500) added via migration `0001`; public/admin category endpoints return it; admin modal has a description field. `color` stays a hex string.

### Frontend

- [x] **F1 — Date pipeline.** Added a "Publication Date" input; all four layouts now prefer `publishedAt`, then `date`; removed the hardcoded `"Nov 29, 2025"` fallback.
- [x] **F2 — Scheduling action.** Added a "Schedule" button for editors; writes `status: 'Scheduled'`, `workflow_status: 'scheduled'`, and keeps `scheduledAt`; amber status styling added.
- [x] **F3 — Guest portal.** Point `/submit` at the public submission endpoint (and remove admin-only upload/save calls).
- [x] **F4 — Category links.** Homepage/nav links now use real category slugs (with a local `slugify()` fallback); topic page renders the stored hex color with luminance-based text contrast and the live description; unknown slugs 404 again.
- [x] **F5 — Layout block coverage.** Briefing, Photo and Scrolly now render every editor block type (Scrolly was also dropping standalone `map`/`chart`, not just `inline-related`); Standard gained a visible fallback for unknown types; every layout ends in a dashed "Unsupported block" notice instead of `return null`.
- [x] **F6 — SEO/article props on every layout.** Scrolly/Briefing/Photo now pass `image`, `canonical`, `keywords` (SEO keywords, else tags) and `article`; `MainLayout` gained the missing `<link rel="canonical">`; all six JSON-LD blocks converted to `is:inline` + `set:html` so they emit real JSON instead of the literal `{JSON.stringify(...)}` text.
- [x] **F7 — Author pipeline.** `ensureAuthor()` keeps the authors table in step with story bylines (plus `db:backfill-authors`); `author/[slug]` reads `/api/authors` with a slug-derived soft-404 fallback; the editor has an author picker; all four layouts link bylines to author pages.
- [x] **F8 — Series pipeline.** `series/[slug]` and the `StandardTemplate` series badge/navigator are derived from published stories sharing `seriesSlug`, ordered by `seriesPart`; no mock lookup remains and unknown series 404.
- [x] **F9 — Workflow consistency.** Approve now writes `Draft`/`draft`, reject writes `Rejected`/`rejected`, archive writes `Archived`/`archived`; the guest queue drops terminal items and the dead "Approved" tab is gone.
- [x] **F10 — Orphaned admin pages.** `/admin/media` and `/admin/calendar` are linked from the sidebar; `media.astro` now uses the shared `AdminSidebar` instead of its own copy; `ContentAuditDashboard` is rendered on the dashboard as "Content Health".
- [x] **F10b — Editor widgets.** `SEOScorecard` sits above the SEO overrides (with parsed content, since the hook rejects the stored JSON string), `RevisionDiff` renders above the snapshot list via a shape adapter, and `SocialCardPreview` opens in a full-screen modal (it is a full-bleed component and would be crushed in the sidebar). `html-to-image` added as the missing dependency.
- [x] **F11 — Tags and media fields.** Tag chips link to `/search?q=` on all four layouts; the editor exposes split-video left/right and ambient audio, which `ScrollyTemplate` now forwards to `HeroLoop`; all three are included in revision snapshots.
- [x] **F12 — Related stories editor.** The editor has a related-story picker (thumbnails, remove, excludes self and duplicates) storing `{ slug, title, image }`; Briefing, Photo and Scrolly now render the same related grid that Standard already had.
- [x] **F13 — Settings that do nothing.** `site_name` now drives `og:site_name` and the `<title>` brand; `breaking_news_active` renders a public banner with a new `breaking_news_text` setting (fallback message, hidden under `/admin`). Settings cache TTL dropped to 5s and the save path no longer sends a stale camelCase alias.
- [x] **F14 — Read time.** All four layouts prefer a stored `readTime` (normalising bare numbers to "N min read") and fall back to the computed value; Scrolly and Photo now display a read time where they previously showed none.

---

## Detailed Findings

### 1. Scheduling is inert (critical)

- Editor stores `scheduledAt` (`src/components/admin/StoryEditor.jsx:773-780`).
- Every save maps status to `Draft`, `Pending Review`, or `Published` (`StoryEditor.jsx:431`). No path writes `status: 'Scheduled'`.
- Cron publishes only `status === 'Scheduled'` (`backend/src/lib/scheduled-publishing.ts:5-8`).
- Verified: `Draft` + past `scheduledAt` → cron publishes 0; `Scheduled` + past `scheduledAt` → published.
- `EditorialCalendar` displays `scheduledAt`, so scheduled items look real but never publish.

### 2. Partial updates wipe `scheduledAt`/`publishedAt` (critical)

- `storyRowFromInput` calls `set('scheduledAt', toDate(...))` and `set('publishedAt', toDate(...))` (`backend/src/routes/stories.ts:110-111`).
- `set` only skips `undefined` (`stories.ts:95-97`), but `toDate(undefined)` returns `null` (`backend/src/lib/http.ts:15-23`).
- Verified in Postgres: PATCH `{ status: "Scheduled" }` set `scheduled_at` to `NULL`.
- Impact: any partial PATCH can silently unpublish a story because the public query requires `publishedAt <= now` (`stories.ts:230-233`).

### 3. Guest submissions return 401 (critical)

- `/submit` calls `storyService.uploadImage` and `storyService.saveStory` (`src/components/admin/GuestSubmissionPortal.jsx:26,49`).
- Those hit `/api/admin/media` and `/api/admin/stories`.
- Verified: unauthenticated POST to both returns `401`.
- No public submission route exists in `backend/src/routes/`.

### 4. Category links 404 (critical)

- Homepage builds `/topic/${catName.toLowerCase()}` (`src/pages/index.astro:224`), but the backend resolves categories by slug.
- Story categories: `Technology, News, Super Feature, Environment, Cities`; categories table: only `Cities`.
- Verified: `/topic/news`, `/topic/environment`, `/topic/super%20feature` → `302 → /404`.
- Topic page expects `colorClass`/`accentClass` and `description` (`src/pages/topic/[slug].astro:57-60`); admin stores a hex `color` and no description (`CategoriesPage.jsx:146`).

### 5. Layout coverage (high)

| Block | Standard | Scrolly | Briefing | Photo |
|---|---|---|---|---|
| p / heading | yes | yes | yes | p only |
| quote | yes | yes | dropped | dropped |
| callout | yes | yes | yes | dropped |
| image | yes | yes | yes | yes |
| video | yes | yes | dropped | dropped |
| map / chart | yes | dropped unless in scrolly-group | dropped | dropped |
| bottleneck / timeline | yes | yes | dropped | dropped |
| beforeAfter | yes | yes | dropped | dropped |
| inline-related | yes | dropped | dropped | dropped |
| scrolly-group | yes | yes | dropped | dropped |

Evidence: `BriefingTemplate.astro:94-130`, `PhotoGalleryTemplate.astro:75-104`, `ScrollyTemplate.astro:117-230`.

### 6. Dates and SEO (high)

- Editor has no `date` input; StandardTemplate falls back to the literal `"Nov 29, 2025"` (`StandardTemplate.astro:167`); Briefing shows `"Just Now"`.
- No template displays `publishedAt`.
- Scrolly passes only `story.headline` to `MainLayout` (`ScrollyTemplate.astro:71`); SEO overrides, canonical, keywords, JSON-LD, and breadcrumbs are missing on Scrolly.
- Briefing and Photo do not pass `article` to `MainLayout`, so JSON-LD/breadcrumbs are Standard-only.

### 7. Author and series pipelines (high)

- Editor sets `author` to the current user and has no author picker.
- `author/[slug].astro:13` reads mock `AUTHORS`; verified `/author/newsroom-admin` and `/author/test-editor` → `302 → /404`.
- No article links to `/author/...`.
- `series/[slug].astro` reads `VOX_HOME_DATA.series`; no series table exists. `seriesSlug` is only used by StandardTemplate for a mock lookup (`StandardTemplate.astro:64-68`).

### 8. Workflow desync (medium)

- `SubmissionsPage` approve sends only `workflow_status` (`SubmissionsPage.jsx:39`), leaving `status: "Pending Review"`.
- `StoriesPage` bulk archive sends only `status: "Archived"` (`StoriesPage.jsx:143`), leaving `workflow_status: "published"`.
- Combined with the `toDate` bug, partial updates can also clear dates.

### 9. Dead admin features (medium)

- `ContentAuditDashboard`, `SEOScorecard`, `RevisionDiff`, `SocialCardPreview` are not imported by any page.
- `/admin/media` and `/admin/calendar` exist but are not linked from `AdminSidebar` or the dashboard.
- `breaking_news_active` is only read by `SettingsPage`; nothing public consumes it.
- `site_name` is not used publicly; `MainLayout.astro:103` hardcodes `"Explainer"`.
- `locked_by` is checked by the editor but never written.
- `src/components/admin/editors/BlockWrapper.jsx` is an unused duplicate.

### 10. Unused story fields (low)

- `tags` are editable but never rendered.
- `ambientAudioUrl`, `leftVideoUrl`, `rightVideoUrl` are supported by `HeroLoop` but not exposed by the editor; Scrolly passes only `videoUrl`.
- `related` is rendered by StandardTemplate but has no editor.
- `readTime` is stored but templates always compute it.

---

## Verification Log

| Date | Item | Evidence |
|---|---|---|
| 2026-11-16 | Baseline | `/topic/super%20feature`, `/topic/news`, `/topic/environment` → 302 `/404`; `/author/newsroom-admin` → 302 `/404`; unauthenticated admin POSTs → 401; cron ignored Draft + past `scheduledAt`; PATCH without `scheduledAt` nulled it in Postgres. |
| 2026-11-16 | B1 | Created story with both dates, PATCH `{status,workflow_status}` preserved `scheduledAt` and `publishedAt`; explicit `{"scheduledAt":null}` cleared only that column. `bun run typecheck` + `bun run build` pass. |
| 2026-11-16 | F1 | `date` round-trips through the API; all four article layouts render `Nov 16, 2026` from `publishedAt`; Standard no longer contains the `Nov 29, 2025` fallback. `bun astro check` still reports 23 pre-existing errors (none in the new date code). |
| 2026-11-16 | B2 | Unauthenticated POST `/api/submissions` → 201; admin list shows `Pending Review` / `pending_review` / `Guest Submission` / `standard`; public `/api/stories` excludes it; invalid payload → 400; rate limit → 429; test row deleted. `typecheck` + `build` pass. |
| 2026-11-16 | F2 | Schedule button writes `Scheduled`/`scheduled`; cron published a due test story and preserved `scheduledAt`; `/admin/edit/new-story` → 200; `astro check` unchanged at 23 pre-existing errors, 0 in StoryEditor. |
| 2026-11-16 | B3 | Backfill created `super-feature`, `technology`, `news`, `environment`; `/api/categories` now returns all five story categories with slugs. `typecheck` + `build` pass. |
| 2026-11-16 | F3 | `/submit` → 200; unauthenticated POST `/api/submissions` with `x-forwarded-for: 10.9.9.20` → 201; invalid payload → 400 with a parsed zod message; test row deleted; `astro check` unchanged, 0 errors in `GuestSubmissionPortal.jsx`. |
| 2026-11-16 | B5 | `db:migrate` applied `0001_lush_cammi`; `information_schema` shows `categories.description text` nullable. POST `{name,description,color}` → 201 with all three; `GET /api/categories/:slug` returns `description`; PATCH `{description:""}` → `null`; DELETE → `{"success":true}`; 501-char description → 400. `typecheck` passes. |
| 2026-11-16 | F4 | `/topic/{super-feature,news,environment,technology,cities}` → 200; `/topic/foobar` → 302 `/404`; homepage topic hrefs are the five slugs (no `politics`/`culture`/`science`); `/topic/cities` h1 `text-black` on `#FFD400`, `/topic/super-feature` h1 `text-white` on `#000000`; `astro check` 23 pre-existing errors, 0 in touched files; `build` passes. |
| 2026-11-16 | B4 | `0002_cuddly_jack_murdock` adds `stories.locked_at`. Lock lifecycle: 200 → 200 (idempotent) → 409 `{message,lockedBy}` when another user holds a fresh lock → 200 takeover after aging `locked_at` 20 min → unlock 200 with `locked_by`/`locked_at` null. Lock/unlock by slug → 200; unknown id → 404; no stale locks left in the DB. `typecheck` + `astro check` (23 baseline) pass. |
| 2026-11-16 | F5 | Temporary story with one of each of the 12 block types rendered on all four layouts: every marker present, including the `Unsupported block: mystery-block` fallback on standard/briefing/photo/scrolly; four published articles still 200; probes deleted, DB back to 7 stories. `astro check` 23 baseline, `build` passes. |
| 2026-11-16 | F6 | Every page's JSON-LD parses as JSON (`BreadcrumbList` + `WebSite`/`Organization`/`CollectionPage`/`NewsArticle`/`Person`), zero literal `JSON.stringify` in output; all four article layouts emit `NewsArticle` and a `<link rel="canonical">`; `astro check` 23 baseline, `build` passes. |
| 2026-11-16 | F9 | Probe submission: `Pending Review`/`pending_review` → approve `Draft`/`draft` → reject `Rejected`/`rejected` → archive `Archived`/`archived`; absent from public `/api/stories`; deleted, total back to 7. Guest-queue predicate unit-checked: pending and legacy rows shown, approved/rejected/published hidden. `astro check` 21 (baseline improved by F7), `build` passes. |
| 2026-11-16 | F7 | Backfill `{"distinct":6,"created":5,"existing":1}`; `/author/{chioma-okafor,chioma-okereke,newsroom-admin,vox-staff,sarah-jenkins}` → 200 and `/author/not-a-real-author` → 302 `/404`; each of the four layouts emits a byline `href="/author/<slug>"` pointing at a 200 page; author page lists that author's stories. `astro check` 21, `build` passes. |
| 2026-11-16 | F13 | `site_name` "Probe Desk" → homepage title `Probe Desk - Visual Journalism…` and article title `The Big Story \| Probe Desk`, `og:site_name` follows; restored. Banner: text renders once on `/`, zero on `/admin`; empty text falls back to the default message; `breaking_news_active=false` removes all banner markup. Settings left as found. `astro check` 21, `typecheck` + `build` pass. |
| 2026-11-16 | F8 | `/series/africa-tech-boom` → 200 with derived title; `/series/does-not-exist` → 302 `/404`. Two-part probe created out of order: series page lists parts 1 then 2, part 1 shows "Up Next in Series" naming part 2 and a `/series/lead-probe-series` badge link, part 2 shows no Up Next, standalone article shows no badge. Probes deleted, back to 7 stories. `astro check` 20, `build` passes. |
| 2026-11-16 | F10b | All three widget modules compile (200, `SocialCardPreview` was 500 before `html-to-image`); editor page 200; `astro check` 20 with 0 errors in `StoryEditor.jsx`; `build` passes. `package.json`/`bun.lock` changed only by the new dependency. |
| 2026-11-16 | F14 | Computed read time renders on all four layouts (`1 min read` briefing/scrolly/photo, `12 min read` standard); probe stories with `readTime: "42"` render exactly `42 min read` on standard, scrolly, briefing and photo, then deleted (back to 7). `astro check` 20, `build` passes. |
| 2026-11-16 | F11 | Probe stories with `tags: ["Telecom","Lagos"]` on all four layouts each emit one `/search?q=Telecom` chip and the visible tag text; the untagged article emits none; `/search?q=Telecom` → 200; the scrolly probe renders all three `l.mp4`/`r.mp4`/`a.mp3` URLs through `HeroLoop`. Probes deleted (back to 7). `astro check` 20, `build` passes. |
| 2026-11-16 | F12 | Probe stories on all four layouts with a `related` entry each render the related card and `/article/the-big-story` link, ordered before the tag row; the article with no `related` renders none; `GET` returns `related` as a list of objects. Probes deleted (back to 7). `astro check` 20, `typecheck` + `build` pass. |
