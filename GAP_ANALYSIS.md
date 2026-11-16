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
- [ ] **B4 — Story locking.** Add lock/unlock endpoints and persist `lockedBy` so the editor's existing lock check is real.
- [x] **B5 — Category description + color contract.** `categories.description` (nullable text, max 500) added via migration `0001`; public/admin category endpoints return it; admin modal has a description field. `color` stays a hex string.

### Frontend

- [x] **F1 — Date pipeline.** Added a "Publication Date" input; all four layouts now prefer `publishedAt`, then `date`; removed the hardcoded `"Nov 29, 2025"` fallback.
- [x] **F2 — Scheduling action.** Added a "Schedule" button for editors; writes `status: 'Scheduled'`, `workflow_status: 'scheduled'`, and keeps `scheduledAt`; amber status styling added.
- [x] **F3 — Guest portal.** Point `/submit` at the public submission endpoint (and remove admin-only upload/save calls).
- [x] **F4 — Category links.** Homepage/nav links now use real category slugs (with a local `slugify()` fallback); topic page renders the stored hex color with luminance-based text contrast and the live description; unknown slugs 404 again.
- [ ] **F5 — Layout block coverage.** Briefing/Photo/Scrolly must not silently drop editor blocks. Add renderers or a visible unsupported-block fallback.
- [ ] **F6 — SEO/article props on every layout.** Pass `seo` overrides, canonical, keywords, and `article` (JSON-LD/breadcrumbs) to `MainLayout` in Scrolly, Briefing, and Photo. Also fix JSON-LD emission: `<script type="application/ld+json">{JSON.stringify(...)}</script>` is not interpolated, so every page emits the literal text instead of JSON (needs `is:inline` + `set:html`).
- [ ] **F7 — Author pipeline.** Add an author picker to the editor; make `author/[slug]` read `/api/authors`; link bylines to author pages.
- [ ] **F8 — Series pipeline.** Make `series/[slug]` data-driven from published stories instead of `VOX_HOME_DATA`; link series parts from articles.
- [ ] **F9 — Workflow consistency.** `SubmissionsPage` approve and `StoriesPage` archive must set both `status` and `workflow_status`.
- [ ] **F10 — Orphaned admin pages.** Link `/admin/media` and `/admin/calendar` from the sidebar/dashboard; wire or remove `ContentAuditDashboard`, `SEOScorecard`, `RevisionDiff`, `SocialCardPreview`.
- [ ] **F11 — Tags and media fields.** Render tags on articles; expose `ambientAudioUrl`, `leftVideoUrl`, `rightVideoUrl` in the editor and pass them to `HeroLoop`.
- [ ] **F12 — Related stories editor.** Let editors pick `related` stories; render them consistently.
- [ ] **F13 — Settings that do nothing.** Use `site_name` in `MainLayout`; render a public breaking-news banner when `breaking_news_active` is true.
- [ ] **F14 — Read time.** Use the stored `readTime` when present, otherwise compute it (or remove the field).

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
