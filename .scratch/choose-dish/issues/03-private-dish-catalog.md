# 03: Quản lý món riêng với ảnh bắt buộc

**What to build:** An authenticated user can upload one required image to Cloudinary and create, view, edit, and soft-delete their own private dishes containing a name and short description.

**Blocked by:** 02: Đăng ký, đăng nhập và session theo thiết bị

**Status:** ready-for-agent

- [ ] The API signs an allowed Cloudinary upload and persists the resulting URL and public ID with a dish.
- [ ] Users can CRUD only their own private dishes; creating or updating without an image is rejected.
- [ ] The frontend provides a Vietnamese dish form with upload progress, validation, error, and retry states.
- [ ] Deleted private dishes do not appear in the active catalog or random pool.
