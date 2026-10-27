# Explainer API

Dedicated backend for the Explainer visual-journalism platform. It replaces
Appwrite with a self-hosted HTTP API, PostgreSQL, and S3-compatible storage, and
can run on Render, Heroku, Fly.io, or any Docker host.

## Stack

| Concern | Choice |
| :-- | :-- |
| Runtime | Node.js 22 + TypeScript |
| HTTP | Hono |
| Database | PostgreSQL 17 + Drizzle ORM |
| Auth | Better Auth (email/password, bearer tokens, admin plugin) |
| Validation | Zod |
| Media | Local disk (dev) or S3-compatible storage (R2, S3, B2) |
| Email | Resend (optional; logs to stdout without a key) |
| Migrations | Drizzle Kit SQL migrations, applied on boot |

Migrations and idempotent bootstrap work (`pg_trgm`, the story search index, the
settings singleton row) run automatically when the server starts. A deploy
therefore never needs a manual schema step, although `preDeployCommand` /
Heroku's `release` phase run them earlier so a broken migration fails the deploy
instead of the boot.

## Quick start

```bash
cd backend

cp .env.example .env
# Set BETTER_AUTH_SECRET to at least 32 random characters.

docker compose up -d          # PostgreSQL on localhost:5432
bun install
bun run dev                   # http://localhost:8787
```

Create the first superadmin with the seed command:

```bash
SEED_ADMIN_EMAIL=you@example.com \
SEED_ADMIN_PASSWORD='a-strong-password' \
bun run db:seed
```

Then sign in at `/admin/login` in the frontend. Remove the `SEED_ADMIN_*`
variables afterwards. If you run the seed without them, it is a no-op and only
ensures the settings row exists.

Useful scripts:

| Command | Action |
| :-- | :-- |
| `bun run dev` | Watch-mode API server |
| `bun run build` | Compile TypeScript to `dist/` |
| `bun run start` | Run the compiled server |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run db:generate` | Generate migrations from `src/db/schema.ts` |
| `bun run db:migrate` | Apply migrations (also happens on boot) |
| `bun run db:push` | Push the schema without a migration (dev only) |
| `bun run db:studio` | Drizzle Studio |
| `bun run db:seed` | Create/repair the first superadmin |
| `bun run migrate:appwrite` | One-time Appwrite data import |

## Environment variables

| Variable | Required | Notes |
| :-- | :-- | :-- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | yes | At least 32 characters; never rotate casually, it invalidates sessions |
| `BETTER_AUTH_URL` | yes | Public URL of this API, e.g. `https://api.explainer.africa` |
| `FRONTEND_URL` | yes (prod) | Public Astro URL; used in reset-password links |
| `TRUSTED_ORIGINS` | no | Comma-separated extra CORS origins |
| `PORT` | no | Defaults to `8787` |
| `LOG_LEVEL` | no | pino level, default `info` |
| `STORAGE_DRIVER` | no | `local` (default) or `s3` |
| `UPLOAD_DIR` | no | Local upload directory, default `./uploads` |
| `MEDIA_PUBLIC_BASE_URL` | no | Base URL returned for locally stored media |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | when `STORAGE_DRIVER=s3` | Bucket, credentials, and public/CDN base URL |
| `RESEND_API_KEY` | no | Without it, outbound email is logged instead of sent |
| `EMAIL_FROM` | no | Defaults to `news@explainer.africa` |
| `CRON_SECRET` | for scheduled publishing | Bearer token required by the cron endpoint |
| `INTERNAL_API_KEY` | for draft previews | Shared secret used by Astro SSR to read unpublished stories |
| `APPWRITE_*` | migration only | Source project for `migrate:appwrite` |
| `SEED_ADMIN_*` | seed only | First superadmin credentials |

Production should use `STORAGE_DRIVER=s3`; Render and Heroku container
filesystems are ephemeral, so locally stored uploads disappear on redeploy.

## Auth and roles

Better Auth owns credentials, sessions, and password resets. A `profiles` row
owns editorial fields (role, status, categories) and is created on sign-up,
invite acceptance, and seed.

- `superadmin` — everything, including team management and role changes.
- `editor` — full editorial access, cannot manage users.
- `staff_writer` — create/read/update stories, read taxonomy, upload media.

The admin UI signs in through `POST /api/auth/sign-in/email`; the returned
bearer token is stored in `localStorage` as `explainer_api_token` and sent as
`Authorization: Bearer <token>`. Every `/api/admin/*` route requires it.

New team members are added by invitation, not direct user creation. The invite
is stored in `invites`, an email is sent with a token, and
`POST /api/auth/accept-invite` creates the Better Auth user and profile.

## API surface

Public, unauthenticated:

- `GET /health`
- `GET /api/stories`, `GET /api/stories/:idOrSlug`
- `GET /api/categories`, `GET /api/authors`, `GET /api/settings`
- `POST /api/subscribers`
- `POST /api/analytics/pageview`, `POST /api/analytics/scroll`
- `GET /api/campaigns/:id/open.gif`, `GET /api/campaigns/:id/click?url=`
- `GET /media/*` (local storage driver)

Authenticated admin (`Authorization: Bearer <token>`):

- `/api/admin/stories` — CRUD, publish/schedule state, revision snapshots
- `/api/admin/categories`, `/api/admin/authors`
- `/api/admin/settings` — write requires `editor` or `superadmin`
- `/api/admin/media` — upload, metadata, tags, delete
- `/api/admin/subscribers`, `/api/admin/analytics`
- `/api/admin/campaigns` — compose and send newsletters
- `/api/admin/users`, `/api/admin/users/team`, `/api/admin/users/invites`
- `/api/admin/comments`, `/api/admin/assignments`, `/api/admin/notifications`, `/api/admin/activity`

Server-to-server:

- `GET /api/internal/stories/:idOrSlug` with `x-internal-key: <INTERNAL_API_KEY>`.
  Returns drafts and scheduled stories for Astro preview rendering.
- `GET|POST /api/cron/publish-scheduled` with
  `Authorization: Bearer <CRON_SECRET>`. Publishes due stories.

Responses are plain JSON. Rows include Appwrite-compatible `$id`, `$createdAt`,
and `$updatedAt` fields, and stories also expose the snake_case aliases the
existing UI expects (`workflow_status`, `author_id`, `scrolly_sections`, and so
on), so the frontend migration is mostly a transport swap.

## Media storage

`STORAGE_DRIVER=local` writes to `UPLOAD_DIR` and serves files from `/media/*`.
This is fine for development and for a host with a persistent volume.

For S3-compatible storage set `STORAGE_DRIVER=s3` plus the `S3_*` variables.
`S3_ENDPOINT` is required for R2 and other S3-compatible providers; leave it
unset for AWS S3. `S3_PUBLIC_URL` is the public base URL (CDN or bucket domain)
that gets stored in media records and story content. The server itself uses
presigned URLs only for uploads, so the bucket does not need public write access.

## Scheduled publishing

Call the cron endpoint every few minutes with the shared secret:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "$BETTER_AUTH_URL/api/cron/publish-scheduled"
```

It is idempotent: stories whose `scheduled_at` has passed and whose
`workflow_status` is `scheduled` transition to published.

## Frontend configuration

The Astro app reads two variables (root `.env`):

```dotenv
PUBLIC_API_URL=https://api.explainer.africa
INTERNAL_API_KEY=<same value as the backend>
```

`PUBLIC_API_URL` is used by the browser and the admin islands.
`INTERNAL_API_KEY` is server-only and lets Astro render previews of unpublished
stories. Never expose it with a `PUBLIC_` prefix.

## Deploying

### Render

`render.yaml` defines a Docker web service, a managed PostgreSQL database, and a
cron service that hits the publish endpoint every 10 minutes. To deploy:

1. Push the repository and create a Blueprint from `render.yaml`.
2. Fill the `sync: false` variables (`BETTER_AUTH_URL`, `FRONTEND_URL`,
   `TRUSTED_ORIGINS`, S3 credentials, Resend, etc.).
3. Copy the generated `INTERNAL_API_KEY` into the frontend's environment.
4. Run the seed once from a shell with `SEED_ADMIN_*` set.

The web service uses `preDeployCommand: npx drizzle-kit migrate`; the server
also migrates on boot, so both paths are safe. Set the health check to
`/health`.

### Heroku

The `Procfile` declares a `release` phase that runs migrations before the new
dyno takes traffic, and a `web` process that runs the compiled server:

```
release: npx drizzle-kit migrate
web: node dist/index.js
```

```bash
heroku create explainer-api
heroku addons:create heroku-postgresql:essential-0
heroku config:set BETTER_AUTH_URL=https://<app>.herokuapp.com \
  FRONTEND_URL=https://explainer.africa \
  BETTER_AUTH_SECRET=$(openssl rand -hex 32) \
  INTERNAL_API_KEY=$(openssl rand -hex 32) \
  CRON_SECRET=$(openssl rand -hex 32) \
  STORAGE_DRIVER=s3 ...
git push heroku main
```

Use Heroku Scheduler (or any external cron) to `curl` the publish endpoint.
Because dyno storage is ephemeral, use S3 for media.

If the Node.js buildpack does not pick up `bun.lock`, it falls back to
`npm install` from `package.json`, which still produces `dist/` via the `build`
script. For container-based deploys (`heroku container:push web`), Heroku skips
the `release` phase; migrations still run on server boot.

### Docker

```bash
docker build -t explainer-api .
docker run --rm -p 8787:8787 --env-file .env explainer-api
```

The image runs `node dist/index.js`, ships the Drizzle migrations, and has a
container health check against `/health`.

## Migrating from Appwrite

The one-time importer reads the Appwrite REST API and upserts into PostgreSQL.
It requires `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, and
the collection IDs. Legacy collection IDs have defaults in
`scripts/migrate-appwrite.ts`; override them with environment variables if your
project differs.

```bash
bun run migrate:appwrite --dry-run   # report counts, change nothing
bun run migrate:appwrite             # import everything
bun run migrate:appwrite --only=stories,media
bun run migrate:appwrite --skip-media
```

What it does:

- Migrates categories, authors, stories, settings, subscribers, campaigns,
  comments, assignments, notifications, and activity.
- Maps Appwrite document IDs to new UUIDs and rewrites relationships.
- Downloads each Appwrite file, uploads it through the configured storage
  driver, and rewrites Appwrite file URLs in story JSON to the new media URLs.
- Writes `.appwrite-media-map.json` (git-ignored) mapping legacy file IDs to new
  URLs, so a re-run does not upload files twice.
- Is idempotent: stories match on slug, taxonomies on slug/email, and most other
  collections on their stable external keys.

User accounts are **not** migrated because Better Auth owns credentials and
password hashes are not portable. After the import, re-invite editors through
the admin UI and have them set a password via the invite link. Delete
`.appwrite-media-map.json` only once you are satisfied with the import.

## Operations notes

- `GET /health` checks the database and returns `503` when it is unreachable.
- Sessions live in PostgreSQL; suspending a profile deletes the user's sessions
  and bans the Better Auth user immediately.
- Publish writes `published_at`; scheduled publishing is driven by
  `scheduled_at` + `workflow_status`.
- Back up PostgreSQL (and the S3 bucket) before running the Appwrite migration
  or a destructive schema change.
- Schema changes: edit `src/db/schema.ts`, run `bun run db:generate`, review the
  SQL in `drizzle/`, commit it, then deploy. Never edit an applied migration.
