# 06: Timezone, retention và vòng đời tài khoản

**What to build:** A user can manage their timezone, select a history-retention preset, manage device sessions, and delete their account while the system protects the last admin account.

**Blocked by:** 02: Đăng ký, đăng nhập và session theo thiết bị; 05: Random lựa chọn theo bữa ăn

**Status:** ready-for-agent

- [ ] Timezone is stored as an IANA identifier, defaults to `Asia/Ho_Chi_Minh`, and drives local selection dates.
- [ ] Retention accepts only 7, 30, 90, or 365 days and defaults to 30 days.
- [ ] Users can view and revoke device sessions.
- [ ] Account deletion removes that user's private data and selections but refuses to delete the last admin.
