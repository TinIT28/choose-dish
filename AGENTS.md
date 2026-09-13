# Choose Dish

Read `CONTEXT.md` and the relevant ADRs before changing domain behaviour. Keep frontend and backend boundaries explicit, and run the focused tests before the full verification suite.

## Tooling

Use Bun 1.3+ as the package manager. Prefer `bun install`, `bun run <script>`, and `bun --filter <workspace> run <script>` for workspace commands.

## Agent skills

### Issue tracker

Issues and specs are stored as local Markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository with a root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
