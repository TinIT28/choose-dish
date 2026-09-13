# Monorepo with Separate Vercel Projects

The application uses a pnpm monorepo with `apps/web` and `apps/api`, deployed as two Vercel projects from the same repository. The React/Rsbuild app is deployed as the frontend and the NestJS app runs as a Vercel Function; Neon provides PostgreSQL and Cloudinary provides image storage, keeping the deployable units independent while avoiding a long-running server requirement.

**Consequences**:

- Runtime state, refresh-token sessions, and scheduled retention work must not depend on process memory or a local filesystem.
- The frontend and API need explicit environment variables, secure cookie/CORS configuration, and separate Vercel project settings.
