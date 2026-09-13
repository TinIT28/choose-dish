# Choose Dish

Ứng dụng chọn món ăn hằng ngày bằng tiếng Việt. Người dùng đăng nhập, quản lý kho món riêng, xem món dùng chung, random theo bữa sáng/trưa/tối và xem lịch sử theo múi giờ cá nhân.

## Công nghệ

- Web: React + Rsbuild + TypeScript, Tailwind CSS, shadcn/ui primitives, React Hook Form + Zod, TanStack Query.
- API: NestJS + Prisma.
- Data: PostgreSQL trên Neon.
- Image: upload trực tiếp lên Cloudinary bằng signed parameters; database chỉ lưu URL và public ID.

## Chạy local

1. Cài Node.js 22 và pnpm 11.
2. Tạo `.env` từ `.env.example`, điền `DATABASE_URL` và `DIRECT_URL` của Neon.
3. Chạy `pnpm install`.
4. Chạy `pnpm db:generate` và `pnpm db:migrate`.
5. Chạy `pnpm dev`. Web chạy ở `http://localhost:3000`, API ở `http://localhost:3001`.

Các lệnh kiểm tra: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Deploy Vercel

Tạo hai Vercel project trỏ cùng repository:

- Web: Root Directory `apps/web`, Framework `Other`, `VITE_API_BASE_URL` trỏ tới URL API production.
- API: Root Directory `apps/api`, Framework `Other`, cấu hình toàn bộ biến production trong `.env.example`.

API dùng Vercel Function và cron `/api/v1/internal/retention` chạy hằng ngày. Chạy migration Neon từ CI hoặc máy local bằng `DIRECT_URL`; không chạy migration trong request handler.

Refresh token nằm trong cookie HttpOnly, access token chỉ giữ trong memory của browser. Không đưa JWT secret, Cloudinary API secret hoặc `CRON_SECRET` vào biến `VITE_*`.
