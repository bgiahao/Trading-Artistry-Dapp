# Deploy TradeLog lên Supabase + Vercel

## 1. Supabase

1. Tạo một Supabase project.
2. Trong **Project Settings → API**, lấy `Project URL` và `anon public key`.
3. Trong **Authentication → Providers → Email**, bật Email provider.
4. Trong **Project Settings → Database → Connection string → URI**, lấy pooler URL cho `DATABASE_URL` và thêm `?sslmode=require` nếu chưa có.
5. Chạy SQL trong `drizzle-pg/0000_flowery_ultragirl.sql` bằng Supabase SQL Editor. Migration tạo các bảng `users`, `trades`, enum, foreign key và index.

## 2. Vercel Environment Variables

Thiết lập cho **Production, Preview và Development**:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
DATABASE_URL=postgresql://postgres.YOUR_PROJECT:PASSWORD@POOLER_HOST:6543/postgres?sslmode=require
```

Không đưa database password hoặc service-role key vào `VITE_*`. Ứng dụng chỉ cần anon key vì backend xác minh access token qua `/auth/v1/user` và truy vấn database bằng `DATABASE_URL`.

## 3. Vercel

Import repository vào Vercel. `vercel.json` đã cấu hình:

- Build command: `pnpm build:vercel`
- Output: `dist/public`
- `/api/health` → Vercel Function
- `/api/trpc/*` → Vercel Function
- Các route frontend → SPA `index.html`

Vercel tự nhận các function trong `api/`. Không cần chạy Express server lâu dài trên Vercel.

## 4. Authentication flow

## 4A. Guest Mode production

Deployment Vercel hiện bật Guest Mode theo yêu cầu sản phẩm. Guest Mode không gọi Manus OAuth hoặc Supabase Auth. Trình duyệt tạo một `tradelog-guest-id` riêng trong `localStorage`, gửi qua header `x-guest-id`, và backend tạo một user guest tương ứng để giữ dữ liệu riêng theo trình duyệt. Đây là anonymous access, không phải bảo vệ danh tính; người dùng cần Supabase Auth nếu cần đồng bộ dữ liệu an toàn giữa nhiều thiết bị.

- Khi có `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`, màn hình đăng nhập dùng Supabase Email/Password và có cả đăng ký.
- Access token Supabase được gửi trong `Authorization: Bearer ...` tới tRPC.
- Backend xác minh token với Supabase Auth, upsert user vào bảng `users`, rồi scope mọi trade theo user đó.
- Nếu tắt Guest Mode, khi hai biến `VITE_SUPABASE_*` chưa có, Preview vẫn dùng Manus OAuth fallback.
- Không dùng Guest Mode cho dữ liệu nhạy cảm hoặc môi trường cần định danh người dùng.
