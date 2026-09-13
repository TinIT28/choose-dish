# 05: Random lựa chọn theo bữa ăn

**What to build:** From a dashboard, a user can choose breakfast, lunch, or dinner and immediately receive a uniformly random eligible dish. The final selection is stored with its local date, meal period, exact time, and dish-name snapshot.

**Blocked by:** 03: Quản lý món riêng với ảnh bắt buộc; 04: Món dùng chung và personal exclusion

**Status:** ready-for-agent

- [ ] The dashboard shows three meal-period cards with the current selection and select-again action.
- [ ] The selection pool combines active private dishes and visible shared dishes, excluding personal exclusions.
- [ ] A dish selected during the current day or previous six local dates is excluded across all meal periods.
- [ ] When the pool is exhausted, the fallback chooses from the oldest excluded dishes; an empty catalog returns a typed error.
- [ ] Re-selecting the same user/date/meal period replaces the existing selection rather than creating a duplicate.
