# Choose Dish Design

**Status:** Approved design

**Date:** 2026-09-13

## Goal

Build a Vietnamese, responsive website that lets an authenticated user manage private dishes, browse admin-managed shared dishes, randomly choose one dish for breakfast, lunch, or dinner, and review a configurable amount of selection history.

## MVP scope

- Email and password registration and login.
- Access-token authentication with rotating refresh-token sessions.
- The first account created in an empty database receives the `ADMIN` role exactly once.
- Private dishes and admin-managed shared dishes.
- One required Cloudinary image, a name, and a short description per dish.
- Copying a shared dish creates an independent private dish.
- Personal exclusion of shared dishes from the random pool.
- One final selection per user, local date, and meal period.
- Uniform random selection across eligible dishes, with a seven-day no-repeat rule.
- A read-only history view, retained for a user-selected period of 7, 30, 90, or 365 days, defaulting to 30 days.
- Vietnamese mobile-first UI with responsive desktop layout.
- Admin UI for shared dishes and manual password resets.
- Vercel deployment for both applications, Neon for PostgreSQL, Cloudinary for images.

## Explicit non-goals

- Email verification and self-service password reset are not part of the MVP.
- No social login.
- No full recipe editor, ingredients, cooking steps, meal planning for future dates, favorites, weighted randomization, notifications, or realtime features.
- No admin access to a user's private dishes or private selection history.
- No long-running worker or local filesystem dependency.

## Architecture

The repository is a Bun workspace monorepo with two independently deployable applications:

```text
choose-dish/
├── apps/
│   ├── web/                 # React + Rsbuild
│   └── api/                 # NestJS + Prisma
├── docs/
│   ├── adr/
│   └── superpowers/specs/
├── CONTEXT.md
├── package.json
└── package.json (Bun workspaces)
```

`apps/web` owns rendering, navigation, forms, client-side session state, and API calls. `apps/api` is the only application boundary for authentication, authorization, business rules, Neon access, and Cloudinary signing. The API exposes REST JSON endpoints under `/api/v1`.

Vercel runs `apps/web` as one project and `apps/api` as another project from the same repository. The NestJS application runs as a Vercel Function and therefore must remain stateless between requests. Sessions, selections, and settings live in Neon; images live in Cloudinary. A protected Vercel Cron endpoint runs the retention cleanup once per day.

The MVP does not introduce a shared domain package. The API owns DTOs and validation; the web client uses a small typed API layer. A shared package can be introduced only when a real cross-application contract needs it.

## Domain model

The canonical terms are defined in `CONTEXT.md`:

- A `User` owns private dishes, selections, sessions, and personal settings.
- A `Dish` has a name, short description, and one required image.
- A `Shared dish` is published and managed by an administrator.
- A `Meal period` is `BREAKFAST`, `LUNCH`, or `DINNER`.
- A `Selection` is the final chosen dish for one user, local date, and meal period. Selecting again replaces the current selection for that key.
- A `Personal exclusion` hides a shared dish only for one user.
- `History retention` controls when old selections are permanently removed.

## Database design

Prisma owns the schema and migrations. Runtime queries use the pooled Neon connection; migration and administrative tooling use the direct connection.

### `User`

- `id`: UUID primary key.
- `email`: normalized, unique login identifier.
- `passwordHash`: Argon2id password hash.
- `role`: `USER` or `ADMIN`.
- `timezone`: IANA timezone identifier, default `Asia/Ho_Chi_Minh`.
- `historyRetentionDays`: one of `7`, `30`, `90`, or `365`; default `30`.
- `createdAt`, `updatedAt`.

### `Session`

- `id`: UUID primary key.
- `userId`: owner reference.
- `refreshTokenHash`: never store the raw refresh token.
- `userAgent` and `ipAddress`: optional session metadata.
- `lastUsedAt`, `expiresAt`, `revokedAt`, `createdAt`.

Each device has its own session. Logout revokes the current session; logout-all revokes every session for the user.

### `Dish`

- `id`: UUID primary key.
- `ownerId`: required for private dishes and null for shared dishes; shared dishes are managed by the admin role rather than owned by one admin account.
- `scope`: `PRIVATE` or `SHARED`.
- `name` and `shortDescription`.
- `imageUrl` and `cloudinaryPublicId`.
- `isActive`.
- `deletedAt`, `createdAt`, `updatedAt`.

Private dishes are visible only to their owner. Shared dishes are visible to all authenticated users while active. Soft deletion preserves references needed by old selections.

### `PersonalExclusion`

- `userId` and `dishId` composite primary key.
- `createdAt`.

Only shared dishes can be excluded. Exclusion is scoped to the user and never changes the shared catalog.

### `Selection`

- `id`: UUID primary key.
- `userId` and `dishId` references.
- `localDate`: calendar date in the user's timezone.
- `mealPeriod`: `BREAKFAST`, `LUNCH`, or `DINNER`.
- `dishNameSnapshot`: name at the time of the latest selection.
- `selectedAt`: UTC timestamp.
- `createdAt`, `updatedAt`.
- Unique constraint on `(userId, localDate, mealPeriod)`.

The history page uses `dishNameSnapshot` and the stored selection timestamp. It may show the current image if the dish still exists; images are not snapshotted.

Account deletion removes the user's sessions, private dishes, exclusions, and selections. Shared dishes remain because they are managed by the admin role. The last remaining admin cannot delete their account until another user has been promoted to `ADMIN`.

## Selection algorithm

`POST /api/v1/selections/random` receives a meal period and uses the authenticated user's timezone.

1. Convert the current instant to the user's timezone and derive `localDate`.
2. Load active private dishes owned by the user and active shared dishes that are not personally excluded.
3. Find dishes selected during the current local date and the previous six local dates. This is the seven-day window and applies across all meal periods.
4. Remove those dish IDs from the candidate set.
5. If candidates remain, select uniformly at random.
6. If no candidate remains but the accessible dish pool is non-empty, relax the exclusion window from the oldest selection forward until candidates exist, then select uniformly.
7. If the accessible pool is empty, return a typed `NO_AVAILABLE_DISH` error.
8. Upsert the unique selection row, replacing the dish ID, name snapshot, and `selectedAt` when the user chooses again.

The write is safe under concurrent requests because the database unique constraint is the final guard for one selection per user/date/meal period.

## Authentication and authorization

Registration runs in a transaction. It grants `ADMIN` only when the user table is empty and uses a database-safe check so concurrent first registrations cannot both receive admin access. Later registrations receive `USER`.

Login returns a short-lived access token and sets a rotating refresh token in a secure, HttpOnly cookie. The access token is held in web memory and is not written to localStorage. Refresh rotates the stored token hash; a token-reuse detection failure revokes the affected session. Production cookies are `Secure` and scoped to the API path/domain.

The MVP intentionally has no email verification or self-service password reset. An admin can reset a user's password from the admin area. This limitation must be documented before a public launch.

Authorization rules are enforced in the API, never only in the web UI:

- Users read and mutate only their private dishes, selections, sessions, and settings.
- Any authenticated user may read active shared dishes and select them.
- Only admins create, update, deactivate, or delete shared dishes.
- Only admins perform manual password resets.

## API surface

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
GET    /api/v1/auth/me

GET    /api/v1/dishes
POST   /api/v1/dishes
PATCH  /api/v1/dishes/:id
DELETE /api/v1/dishes/:id
POST   /api/v1/dishes/:id/copy
POST   /api/v1/dishes/upload-signature
POST   /api/v1/dishes/:id/exclusion
DELETE /api/v1/dishes/:id/exclusion

POST   /api/v1/selections/random
GET    /api/v1/selections/today
GET    /api/v1/history

PATCH  /api/v1/users/me/settings
GET    /api/v1/users/me/sessions
DELETE /api/v1/users/me/sessions/:id
DELETE /api/v1/users/me

GET    /api/v1/admin/shared-dishes
POST   /api/v1/admin/shared-dishes
PATCH  /api/v1/admin/shared-dishes/:id
DELETE /api/v1/admin/shared-dishes/:id
POST   /api/v1/admin/users/:id/reset-password

GET    /api/v1/internal/retention
```

All request bodies use DTO validation. Errors use a stable JSON shape with a machine-readable code, human-readable message, and optional field errors. The web client retries a request after one refresh attempt only; it never blindly retries mutations.

## Image upload

The web app requests signed Cloudinary upload parameters from the API, uploads exactly one JPG, PNG, or WebP image up to 5 MB, and submits the resulting URL and `cloudinaryPublicId` with the dish. The API validates the configured Cloudinary origin and requires the image fields when creating or updating a dish.

If database persistence fails after an upload, the API attempts to delete the newly uploaded asset. Replacing an image deletes the previous asset only when it is not shared by another dish.

## Frontend experience

The dashboard presents three `MealPeriodCard` components for breakfast, lunch, and dinner. Each card shows the current dish, selection time in the user's timezone, and a random/select-again action. The first selection is persisted immediately; there is no separate confirmation step.

The web app uses Tailwind CSS for styling and local shadcn/ui components built on Radix primitives. Forms use React Hook Form with Zod schemas so validation and accessible field states stay consistent across authentication, dish management, and settings screens.

Routes are:

- `/login` and `/register`.
- `/` for the dashboard.
- `/dishes` for private dish CRUD.
- `/history` for read-only history grouped by local date.
- `/settings` for timezone, retention, and sessions.
- `/admin` for shared dish management and manual password resets.

The interface is Vietnamese and mobile-first. The history screen defaults to the configured retention period but highlights the 30-day default behavior for a new account.

## Retention cleanup

The retention job runs once daily against production and authenticates with `CRON_SECRET`. For each user, it permanently deletes selections older than that user's configured retention period. The job is idempotent and safe to rerun. It does not delete dishes, users, or sessions.

## Deployment and environment

Vercel uses two projects connected to the same repository:

- Frontend project root: `apps/web`.
- API project root: `apps/api`.

The API requires `DATABASE_URL`, `DIRECT_URL`, access/refresh signing secrets, `FRONTEND_ORIGIN`, Cloudinary credentials, and `CRON_SECRET`. The web app requires the public API base URL. No secret is exposed to the browser.

The initial workflow is local development with Neon as the database, followed by Vercel deployment. Production and preview environments use separate Neon branches or databases; migrations never run against production from a request handler.

## Testing strategy

### Unit tests

- Candidate filtering and uniform selection.
- Seven-day cross-meal no-repeat behavior and fallback.
- User timezone date boundaries.
- Retention calculation.
- Refresh rotation and token-reuse handling.
- Dish ownership, shared-dish permissions, and personal exclusions.

### API integration tests

Use a dedicated non-production Neon branch and Prisma migrations. Cover registration/admin bootstrap, login/refresh/logout, CRUD ownership, shared-dish copying, selection upsert, history retention, account deletion, and admin-only routes.

### Frontend tests

Test form validation, upload states, token-refresh recovery, meal cards, history grouping, and admin route protection.

### End-to-end acceptance flow

Register a first user, verify admin bootstrap, add a private dish with an image, create a shared dish, copy it, exclude a shared dish, randomize all three meal periods, select again, view history, change retention, log out, and verify protected routes require authentication.

## Acceptance criteria

The MVP is acceptable when a user can complete the full end-to-end flow above, no user can access another user's private data, a shared dish cannot be edited by a normal user, a repeated selection obeys the seven-day rule or documented fallback, expired selections are removed by the scheduled job, and both Vercel projects build from the monorepo with Neon and Cloudinary configured only through environment variables.
