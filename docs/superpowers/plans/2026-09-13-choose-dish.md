# Choose Dish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Choose Dish MVP as a Vietnamese React/Rsbuild and NestJS application with account sessions, private/shared dishes, random meal selections, retention-controlled history, and Vercel deployment configuration.

**Architecture:** Use a pnpm workspace with `apps/web` and `apps/api`. The web app owns UI and client state; the NestJS API owns authorization, selection rules, Prisma persistence, and Cloudinary signing. Runtime data is stored in Neon PostgreSQL, refresh sessions are database-backed, and retention cleanup runs through a protected Vercel Cron endpoint.

**Tech Stack:** Node.js 22, pnpm 11, React, Rsbuild, TypeScript, React Router, TanStack Query, React Hook Form, Zod, NestJS, Prisma, PostgreSQL/Neon, Cloudinary, Vitest, Testing Library, and Playwright.

**Spec:** `docs/superpowers/specs/2026-09-13-choose-dish-design.md`

## Global Constraints

- `Dish` has a name, short description, and one required image; it is not a full recipe editor.
- `MealPeriod` is exactly `BREAKFAST`, `LUNCH`, or `DINNER`.
- `Selection` is unique by `(userId, localDate, mealPeriod)` and selecting again replaces the current row.
- The no-repeat window is the current local date plus the previous six local dates across all meal periods.
- History retention accepts only 7, 30, 90, or 365 days and defaults to 30 days; cleanup permanently deletes expired selections.
- The first user in an empty database is the only automatically bootstrapped `ADMIN`; the last admin cannot delete their account.
- Access tokens are short-lived and kept in web memory; refresh tokens are rotated, hashed in `Session`, and sent via secure HttpOnly cookies.
- The two applications deploy as separate Vercel projects from the same repository; the API is stateless and must not depend on a local filesystem or process memory.
- Cloudinary is the only image store; Neon is the only application database.
- Use the domain terms in `CONTEXT.md`, Vietnamese UI copy, and REST endpoints under `/api/v1`.

---

### Task 1: Bootable workspace and engineering baseline

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.env.example`
- Create: `apps/web/package.json`, `apps/web/rsbuild.config.ts`, `apps/web/tsconfig.json`, `apps/web/index.html`, `apps/web/src/main.tsx`, `apps/web/src/app/App.tsx`, `apps/web/src/app/app.css`
- Create: `apps/api/package.json`, `apps/api/nest-cli.json`, `apps/api/tsconfig.json`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.controller.spec.ts`, `apps/web/src/app/App.test.tsx`

**Interfaces:**
- Produces `GET /api/v1/health` returning `{ "status": "ok", "database": "up" }` when Prisma can connect.
- Produces root scripts `dev`, `build`, `test`, `typecheck`, `lint`, `db:generate`, and `db:migrate`.

- [ ] **Step 1: Write the failing API health test.** Assert that a request to `/api/v1/health` returns HTTP 200 and the stable JSON keys through the Nest testing module.
- [ ] **Step 2: Run the focused test to verify it fails.** Run `pnpm --filter api test -- health.controller.spec.ts`; expect failure because the workspace and controller do not exist.
- [ ] **Step 3: Scaffold the workspace and minimal applications.** Configure pnpm workspace scripts, Rsbuild, NestJS, TypeScript, Vitest, environment loading, and a Prisma client placeholder without embedding secrets.
- [ ] **Step 4: Implement the health seam.** Add a health service that performs a lightweight Prisma query and maps connection failure to a non-200 health response while keeping the endpoint under `/api/v1`.
- [ ] **Step 5: Run focused tests and typechecks.** Run `pnpm --filter api test -- health.controller.spec.ts`, `pnpm --filter web test -- App.test.tsx`, and `pnpm typecheck`; expect all to pass.
- [ ] **Step 6: Commit the foundation.** Run `git add package.json pnpm-workspace.yaml .gitignore .env.example apps docs/agents AGENTS.md .scratch/choose-dish` and commit `feat: bootstrap choose dish workspace`.

### Task 2: Registration, login, and device sessions

**Files:**
- Create: `apps/api/prisma/schema.prisma`, `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`, `apps/api/src/auth/auth.guard.ts`, `apps/api/src/auth/auth.types.ts`
- Create: `apps/api/src/users/users.module.ts`, `apps/api/src/users/users.service.ts`
- Create: `apps/api/src/auth/auth.service.spec.ts`, `apps/api/src/auth/auth.integration.spec.ts`
- Create: `apps/web/src/features/auth/api.ts`, `apps/web/src/features/auth/AuthProvider.tsx`, `apps/web/src/routes/LoginPage.tsx`, `apps/web/src/routes/RegisterPage.tsx`

**Interfaces:**
- `POST /api/v1/auth/register` and `POST /api/v1/auth/login` return `{ user, accessToken }` and set the refresh cookie.
- `POST /api/v1/auth/refresh` rotates the cookie and returns a new access token.
- `POST /api/v1/auth/logout`, `POST /api/v1/auth/logout-all`, and `GET /api/v1/auth/me` provide session lifecycle seams.
- `AuthProvider` exposes `{ user, accessToken, login, register, logout, refresh }` to protected routes.

- [ ] **Step 1: Write failing auth tests.** Cover first-user admin bootstrap, later-user role assignment, invalid credentials, refresh rotation, current-session logout, and logout-all through the auth service/controller seams.
- [ ] **Step 2: Run the focused tests to verify they fail.** Run `pnpm --filter api test -- auth.service.spec.ts`; expect missing schema and service failures.
- [ ] **Step 3: Add the Prisma user/session schema and migration.** Define `User`, `Session`, `Role`, `historyRetentionDays`, and timezone fields; configure Argon2id password hashing and hashed refresh tokens.
- [ ] **Step 4: Implement auth endpoints and guards.** Make the first-registration role check atomic, rotate refresh tokens, reject reuse by revoking the session, and enforce bearer-token authentication in protected routes.
- [ ] **Step 5: Add the web auth flow.** Keep access tokens in memory, send refresh requests with credentials, retry one failed request after refresh, and render Vietnamese login/register/protected-route states.
- [ ] **Step 6: Run focused tests, migrations, and typechecks.** Run the auth test files, `pnpm --filter api exec prisma validate`, and `pnpm typecheck`; expect all to pass with a configured non-production database.
- [ ] **Step 7: Commit authentication.** Run `git add apps/api apps/web` and commit `feat: add account authentication and sessions`.

### Task 3: Private dish catalog and Cloudinary upload

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/dishes/dishes.module.ts`, `apps/api/src/dishes/dishes.controller.ts`, `apps/api/src/dishes/dishes.service.ts`, `apps/api/src/dishes/dishes.types.ts`, `apps/api/src/storage/cloudinary.service.ts`
- Create: `apps/api/src/dishes/dishes.service.spec.ts`, `apps/api/src/dishes/dishes.integration.spec.ts`
- Create: `apps/web/src/features/dishes/api.ts`, `apps/web/src/features/dishes/DishForm.tsx`, `apps/web/src/features/dishes/DishCard.tsx`, `apps/web/src/routes/DishesPage.tsx`
- Create: `apps/web/src/features/dishes/DishForm.test.tsx`

**Interfaces:**
- `Dish` uses `scope`, `ownerId`, `name`, `shortDescription`, `imageUrl`, `cloudinaryPublicId`, `isActive`, and `deletedAt`.
- `POST /api/v1/dishes/upload-signature` returns signed Cloudinary parameters.
- `GET/POST/PATCH/DELETE /api/v1/dishes` manage only the authenticated user's private dishes.

- [ ] **Step 1: Write the failing private-dish API tests.** Assert ownership filtering, required image validation, create/update, soft-delete, and rejection of another user's dish ID.
- [ ] **Step 2: Run the focused tests to verify they fail.** Run `pnpm --filter api test -- dishes.service.spec.ts`; expect missing Dish model and endpoints.
- [ ] **Step 3: Add the Dish schema and Cloudinary adapter seam.** Store URL plus public ID, validate JPG/PNG/WebP and 5 MB constraints, and expose a mockable image-storage interface.
- [ ] **Step 4: Implement private dish CRUD and signed uploads.** Use authenticated ownership checks, preserve historical references on soft-delete, and remove newly uploaded assets if persistence fails.
- [ ] **Step 5: Add the Vietnamese dish-management UI.** Support required image upload, progress/error/retry states, create/edit forms, active list, and soft-delete confirmation.
- [ ] **Step 6: Run focused tests and typechecks.** Run API service/integration tests, `pnpm --filter web test -- DishForm.test.tsx`, and `pnpm typecheck`.
- [ ] **Step 7: Commit the private catalog.** Run `git add apps/api apps/web` and commit `feat: add private dish catalog`.

### Task 4: Shared dishes, copy, exclusions, and admin operations

**Files:**
- Modify: `apps/api/prisma/schema.prisma`, `apps/api/src/auth/auth.types.ts`
- Create: `apps/api/src/admin/admin.module.ts`, `apps/api/src/admin/admin.controller.ts`, `apps/api/src/admin/admin.service.ts`
- Modify: `apps/api/src/dishes/dishes.controller.ts`, `apps/api/src/dishes/dishes.service.ts`
- Create: `apps/api/src/admin/admin.service.spec.ts`, `apps/api/src/dishes/shared-dishes.integration.spec.ts`
- Create: `apps/web/src/routes/AdminPage.tsx`, `apps/web/src/features/dishes/SharedDishList.tsx`, `apps/web/src/features/dishes/PersonalExclusionToggle.tsx`

**Interfaces:**
- `PersonalExclusion` is unique by `(userId, dishId)`.
- Admin routes manage shared dishes and `POST /api/v1/admin/users/:id/reset-password`.
- `POST /api/v1/dishes/:id/copy` creates a new independent private Dish.
- `POST/DELETE /api/v1/dishes/:id/exclusion` manages a user's personal exclusion.

- [ ] **Step 1: Write failing authorization and copy tests.** Cover admin-only shared CRUD, normal-user denial, copy independence, personal exclusion isolation, and manual password reset.
- [ ] **Step 2: Run the focused tests to verify they fail.** Run `pnpm --filter api test -- admin.service.spec.ts shared-dishes.integration.spec.ts`; expect missing role and exclusion behavior.
- [ ] **Step 3: Add shared-dish and exclusion persistence.** Make shared `ownerId` nullable, retain shared dishes when an admin account is deleted, and enforce role guards in the API.
- [ ] **Step 4: Implement admin, copy, and exclusion behavior.** Copy dish fields into a new private row, make exclusions user-scoped, and ensure admin password reset never returns private data.
- [ ] **Step 5: Add the admin/shared-dish UI.** Render admin-only controls, shared catalog, copy action, personal hide/unhide action, and reset-password form.
- [ ] **Step 6: Run focused tests and typechecks.** Run the API tests, UI tests, and `pnpm typecheck`.
- [ ] **Step 7: Commit shared catalog operations.** Run `git add apps/api apps/web` and commit `feat: add shared dishes and exclusions`.

### Task 5: Daily selection and dashboard

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/selections/selections.module.ts`, `apps/api/src/selections/selections.controller.ts`, `apps/api/src/selections/selections.service.ts`, `apps/api/src/selections/selection.types.ts`, `apps/api/src/selections/selection-rules.ts`
- Create: `apps/api/src/selections/selection-rules.spec.ts`, `apps/api/src/selections/selections.integration.spec.ts`
- Create: `apps/web/src/features/selections/api.ts`, `apps/web/src/features/selections/MealPeriodCard.tsx`, `apps/web/src/routes/DashboardPage.tsx`
- Create: `apps/web/src/features/selections/MealPeriodCard.test.tsx`

**Interfaces:**
- `POST /api/v1/selections/random` accepts `{ mealPeriod }` and returns the current selection view.
- `Selection` is unique by `(userId, localDate, mealPeriod)` and stores `dishNameSnapshot` and `selectedAt`.
- `SelectionRules.getCandidates(userId, mealPeriod, now)` returns accessible, active, non-excluded Dish IDs after the seven-day filter.

- [ ] **Step 1: Write failing rule tests.** Use fixed instants/timezones to verify current-day cross-meal exclusions, previous-six-date exclusions, uniform candidate selection, oldest-dish fallback, and empty-catalog error.
- [ ] **Step 2: Run the rule tests to verify they fail.** Run `pnpm --filter api test -- selection-rules.spec.ts`; expect missing rule module and Selection model.
- [ ] **Step 3: Add Selection schema and pure selection rules.** Use explicit `MealPeriod`, calculate `localDate` from the user's IANA timezone, and keep candidate selection independent from HTTP.
- [ ] **Step 4: Implement transactional random selection.** Combine private/shared pools, apply exclusions and fallback, then upsert the unique row with name snapshot and UTC timestamp.
- [ ] **Step 5: Add the three-card dashboard.** Load today's selections, invoke random immediately, show selection time in the user's timezone, and render empty/error/loading states in Vietnamese.
- [ ] **Step 6: Run focused tests and typechecks.** Run rule/integration tests, `pnpm --filter web test -- MealPeriodCard.test.tsx`, and `pnpm typecheck`.
- [ ] **Step 7: Commit daily selection.** Run `git add apps/api apps/web` and commit `feat: add daily meal selection`.

### Task 6: Settings, sessions, and account lifecycle

**Files:**
- Modify: `apps/api/src/users/users.service.ts`, `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/users/users.controller.ts`, `apps/api/src/users/users.service.spec.ts`
- Create: `apps/web/src/routes/SettingsPage.tsx`, `apps/web/src/features/settings/RetentionSetting.tsx`, `apps/web/src/features/settings/TimezoneSetting.tsx`, `apps/web/src/features/settings/SessionList.tsx`
- Create: `apps/web/src/features/settings/SettingsPage.test.tsx`

**Interfaces:**
- `PATCH /api/v1/users/me/settings` accepts `{ timezone, historyRetentionDays }` with strict enum validation.
- `GET /api/v1/users/me/sessions` and `DELETE /api/v1/users/me/sessions/:id` manage device sessions.
- `DELETE /api/v1/users/me` deletes private user data and refuses to remove the last admin.

- [ ] **Step 1: Write failing settings/lifecycle tests.** Cover invalid timezone, retention presets, session revocation, cascading private-data deletion, and last-admin protection.
- [ ] **Step 2: Run focused tests to verify they fail.** Run `pnpm --filter api test -- users.service.spec.ts`; expect missing settings and lifecycle behavior.
- [ ] **Step 3: Implement validated settings and session endpoints.** Validate IANA timezone identifiers, enforce retention presets, and revoke sessions before deletion.
- [ ] **Step 4: Implement account deletion safeguards.** Delete private dishes, exclusions, selections, and sessions; preserve shared dishes; refuse deletion when no other admin exists.
- [ ] **Step 5: Add the settings UI.** Provide timezone, retention, session revoke, logout-all, and account-deletion flows with explicit confirmation.
- [ ] **Step 6: Run focused tests and typechecks.** Run service/UI tests and `pnpm typecheck`.
- [ ] **Step 7: Commit settings and lifecycle.** Run `git add apps/api apps/web` and commit `feat: add user settings and account lifecycle`.

### Task 7: History view and retention cleanup

**Files:**
- Create: `apps/api/src/history/history.module.ts`, `apps/api/src/history/history.controller.ts`, `apps/api/src/history/history.service.ts`, `apps/api/src/history/history.service.spec.ts`
- Create: `apps/api/src/internal/retention.controller.ts`, `apps/api/src/internal/retention.service.ts`, `apps/api/src/internal/retention.service.spec.ts`
- Create: `apps/web/src/features/history/api.ts`, `apps/web/src/features/history/HistoryTimeline.tsx`, `apps/web/src/routes/HistoryPage.tsx`
- Create: `apps/web/src/features/history/HistoryTimeline.test.tsx`
- Create: `apps/api/vercel.json`

**Interfaces:**
- `GET /api/v1/history` returns grouped read-only selections for the user's configured range.
- `GET /api/v1/internal/retention` accepts only `Authorization: Bearer $CRON_SECRET` and deletes expired selections idempotently.

- [ ] **Step 1: Write failing history/retention tests.** Cover local-date grouping, snapshot names after dish edits, default/preset retention, deletion boundaries, and unauthorized cron calls.
- [ ] **Step 2: Run focused tests to verify they fail.** Run `pnpm --filter api test -- history.service.spec.ts retention.service.spec.ts`; expect missing services.
- [ ] **Step 3: Implement read-only history and retention service.** Query by user and local date, use snapshots, and delete only expired Selection rows per user.
- [ ] **Step 4: Add the protected cron endpoint.** Configure the API project to route the daily Vercel Cron request and compare the Bearer secret before cleanup.
- [ ] **Step 5: Add the history timeline UI.** Group by local date, show breakfast/lunch/dinner and exact selection time, and expose the configured range.
- [ ] **Step 6: Run focused tests and typechecks.** Run API/UI tests and `pnpm typecheck`.
- [ ] **Step 7: Commit history and cleanup.** Run `git add apps/api apps/web` and commit `feat: add selection history and retention cleanup`.

### Task 8: Vercel, Neon, Cloudinary, and release verification

**Files:**
- Create: `apps/web/vercel.json`, `vercel.json`, `.vercelignore`
- Modify: `package.json`, `.env.example`, `README.md`
- Create: `apps/api/src/config/env.ts`, `apps/api/src/config/env.spec.ts`, `playwright.config.ts`, `tests/e2e/choose-dish.spec.ts`
- Modify: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`

**Interfaces:**
- The web project builds from `apps/web`; the API project builds from `apps/api`.
- Required API environment variables are `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_ORIGIN`, Cloudinary credentials, and `CRON_SECRET`.
- The web project receives the public API base URL as a public environment variable.

- [ ] **Step 1: Write failing environment and smoke tests.** Assert missing secrets fail fast and the Playwright flow can register, create a dish, randomize a meal period, view history, and logout.
- [ ] **Step 2: Run the focused tests to verify they fail.** Run `pnpm test:e2e -- tests/e2e/choose-dish.spec.ts`; expect missing deployment configuration and applications.
- [ ] **Step 3: Add environment validation and Vercel project configuration.** Set project roots/build commands, exclude secrets, configure API Node runtime, and add the production Cron schedule.
- [ ] **Step 4: Configure Neon/Prisma deployment behavior.** Use pooled `DATABASE_URL` for runtime and direct `DIRECT_URL` for migrations; document preview versus production variables and migration commands.
- [ ] **Step 5: Configure secure browser/API integration.** Set exact-origin CORS, credentialed requests, secure refresh cookies, Cloudinary production values, and Cron secret validation.
- [ ] **Step 6: Run the full verification suite.** Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`; record exit codes and test counts.
- [ ] **Step 7: Commit release configuration.** Run `git add .` after reviewing the staged file list and commit `chore: configure Vercel release`.
