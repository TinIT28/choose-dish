# 07: Lịch sử lựa chọn và cleanup định kỳ

**What to build:** A user can view read-only selection history grouped by local date and meal period, while a protected daily job permanently removes selections older than each user's configured retention period.

**Blocked by:** 05: Random lựa chọn theo bữa ăn; 06: Timezone, retention và vòng đời tài khoản

**Status:** ready-for-agent

- [ ] History returns the configured range, defaults to 30 days, and shows dish-name snapshots and selection times.
- [ ] Editing or soft-deleting a dish does not rewrite old selection names.
- [ ] The retention endpoint is idempotent and requires the Vercel Cron secret.
- [ ] Cleanup removes only expired selections, never users, dishes, or sessions.
