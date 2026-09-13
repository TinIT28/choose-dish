# 01: Bootable Choose Dish workspace

**What to build:** A developer can install dependencies and run a working React/Rsbuild frontend and NestJS API from the monorepo. The API exposes a health check that verifies the application can boot and reach the configured Prisma database.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The repository has a pnpm workspace with independently runnable `apps/web` and `apps/api` applications.
- [ ] The web app renders a Vietnamese responsive shell and the API exposes `GET /api/v1/health`.
- [ ] Prisma schema generation, database migration commands, typechecking, linting, and focused tests are wired into package scripts.
- [ ] Configuration is documented through `.env.example`; secrets are not committed.
