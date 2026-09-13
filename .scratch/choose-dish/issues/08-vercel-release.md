# 08: Deploy production lên Vercel

**What to build:** The complete application builds and runs in production as two Vercel projects from the monorepo, connected to Neon and Cloudinary with secure environment configuration and an end-to-end smoke flow.

**Blocked by:** 07: Lịch sử lựa chọn và cleanup định kỳ

**Status:** ready-for-agent

- [ ] `apps/web` and `apps/api` each build from their Vercel Root Directory.
- [ ] Production and preview environments use the correct Neon connection variables, Cloudinary credentials, JWT secrets, CORS origin, and Cron secret.
- [ ] Refresh cookies work across the deployed frontend/API origins without wildcard CORS.
- [ ] The production smoke flow covers registration, dish creation, random selection, history, logout, and admin operations.
