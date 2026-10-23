# 📖 YourLife - Nhật Ký Cuộc Sống (PWA)

Ứng dụng nhật ký cá nhân dạng PWA (Progressive Web App), có thể cài ra màn hình chính điện thoại như một app thật.

## 🏗️ Công Nghệ

| Phần | Stack |
|------|-------|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| Backend | Node.js + Express + TypeScript |
| Database | TiDB Serverless (MySQL-compatible) |
| Storage | Cloudflare R2 (ảnh) |
| PWA | vite-plugin-pwa + Workbox |
| ORM | Drizzle ORM |
| State | Zustand + Dexie (IndexedDB offline) |
| Deploy | Railway |

## 🚀 Bắt Đầu

### 1. Cài đặt dependencies
```bash
npm run install:all
```

### 2. Cấu hình biến môi trường

Chỉnh sửa `server/.env`:
```env
DATABASE_URL="mysql://user:pass@host:4000/yourlife?ssl={\"rejectUnauthorized\":true}"
PORT=3000
JWT_SECRET="your-super-secret-key"

# Cloudflare R2
R2_ACCOUNT_ID="xxx"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="yourlife-storage"
R2_PUBLIC_DOMAIN="https://pub-xxx.r2.dev"

# Web Push (tạo bằng lệnh bên dưới)
VAPID_PUBLIC_KEY="xxx"
VAPID_PRIVATE_KEY="xxx"
VAPID_EMAIL="mailto:your@email.com"
```

### 3. Tạo VAPID keys cho Push Notifications
```bash
npm run generate-vapid
```

### 4. Đẩy schema lên TiDB
```bash
npm run db:push
```

### 5. Chạy development

**Terminal 1 (Backend):**
```bash
npm run dev:server
```

**Terminal 2 (Frontend):**
```bash
npm run dev:client
```

App chạy tại: http://localhost:5173

## 📦 Deploy lên Railway

### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### Bước 2: Tạo project trên Railway
1. Vào [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Chọn repo của bạn

### Bước 3: Thêm biến môi trường trên Railway
Vào **Variables** tab, thêm tất cả các biến trong `server/.env`

### Bước 4: Deploy!
Railway sẽ tự động build và deploy.

## 📱 Cài App Ra Màn Hình Chính

**iPhone (Safari):**
1. Mở app trong Safari
2. Bấm biểu tượng **Chia sẻ** ⎋
3. Chọn **Thêm vào Màn hình Chính** (+)

**Android (Chrome):**
1. Mở app trong Chrome
2. Bấm menu **⋮**
3. Chọn **Thêm vào màn hình chính**

## 📁 Cấu Trúc Dự Án

```
yourlife/
├── client/                 # React Frontend
│   ├── public/icons/       # PWA icons
│   └── src/
│       ├── components/     # UI components
│       │   ├── editor/     # Editor màn hình viết
│       │   ├── timeline/   # Dòng thời gian
│       │   ├── calendar/   # Lịch
│       │   ├── stats/      # Thống kê
│       │   └── settings/   # Cài đặt
│       ├── lib/            # Utilities, API, DB
│       ├── pages/          # Pages
│       ├── store/          # Zustand state
│       └── App.tsx
├── server/                 # Express Backend
│   └── src/
│       ├── db/             # Drizzle schema + connection
│       ├── middleware/     # Auth middleware
│       ├── routes/         # API routes
│       └── cron.ts         # Push notification scheduler
├── railway.toml            # Railway deploy config
└── package.json            # Root scripts
```

## ✨ Tính Năng

- 📖 **Nhật ký hàng ngày** với mood tracker (5 cảm xúc)
- 🗓️ **Dòng thời gian** & **Lịch tháng** với emoji mood
- 🖼️ **Upload ảnh** (nén tự động → upload thẳng lên R2)
- 🏷️ **Tags** để phân loại bài viết
- 📊 **Thống kê**: streak, heatmap hoạt động, phân bổ mood
- ✍️ **Auto-save nháp** vào IndexedDB (offline-first)
- 🔔 **Push notification** nhắc viết nhật ký lúc 20:30
- 📱 **PWA**: cài ra màn hình chính, hoạt động offline
- 🔒 **Bảo mật**: JWT + bcrypt
