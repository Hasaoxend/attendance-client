# Attendance Client — Frontend

Frontend React cho Hệ thống Quản lý Điểm danh Sinh viên chống gian lận.

## Công nghệ
- **Framework**: React 19 + TypeScript
- **Build**: Vite 8
- **UI**: Ant Design 6
- **Maps**: Leaflet + React-Leaflet
- **QR**: html5-qrcode (scanner) + qrcode.react (generator)
- **Auth**: JWT token qua Axios interceptor

## Cài đặt

### 1. Clone repo
```bash
git clone https://github.com/YOUR_USERNAME/attendance-client.git
cd attendance-client
```

### 2. Cài dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Copy file mẫu:
```bash
cp .env.example .env
```

Chỉnh `.env`:
```env
# Development — dùng Vite proxy (để trống hoặc bỏ dòng này)
# VITE_API_URL=

# Production — trỏ tới Render.com backend
VITE_API_URL=https://your-render-app.onrender.com/api
```

### 4. Chạy development
```bash
npm run dev
```
Truy cập `http://localhost:5173`

### 5. Build production
```bash
npm run build
```
Output ở thư mục `dist/`.

## Deploy lên Firebase Hosting

### Lần đầu:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Chọn project, public dir = dist, SPA = Yes
```

### Mỗi lần deploy:
```bash
npm run build
firebase deploy
```

### Hoặc dùng file `firebase.json` đã có sẵn:
```bash
firebase deploy --only hosting
```

## Cấu trúc thư mục
```
src/
├── api/          # Axios instance + interceptor
├── assets/       # Hình ảnh, SVG
├── components/   # Components tái sử dụng
│   ├── DashboardLayout.tsx
│   ├── MapPicker.tsx
│   ├── QRGenerator.tsx
│   └── QRScanner.tsx
├── contexts/     # React Context (AuthContext)
├── pages/        # Các trang chính
│   ├── AdminDashboard.tsx
│   ├── StudentDashboard.tsx
│   ├── Login.tsx
│   ├── CheckinHandler.tsx
│   └── ...
├── App.tsx       # Router chính
├── App.css
├── index.css
└── main.tsx      # Entry point
```

## Lưu ý
- **Dev mode**: Vite proxy tự chuyển `/api/*` → `http://localhost:5000` (cần chạy backend riêng)
- **Production**: `VITE_API_URL` phải trỏ tới backend URL trên Render.com
- **Firebase Hosting** cung cấp HTTPS miễn phí → GPS + FingerprintJS hoạt động trên mobile
