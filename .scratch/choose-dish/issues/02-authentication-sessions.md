# 02: Đăng ký, đăng nhập và session theo thiết bị

**What to build:** A user can register, log in, remain signed in after the access token expires, log out the current device, and log out every device. The first account in an empty database receives admin access exactly once.

**Blocked by:** 01: Bootable Choose Dish workspace

**Status:** ready-for-agent

- [ ] Email/password registration and login return an access token and set a rotating HttpOnly refresh cookie.
- [ ] Refresh sessions are stored as hashes per device, and logout revokes the appropriate session(s).
- [ ] The first registration is atomically assigned `ADMIN`; later registrations receive `USER`.
- [ ] Protected API routes and frontend auth guards reject unauthenticated access.
