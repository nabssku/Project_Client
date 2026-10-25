# 🚀 Quick Start Guide - Auth Pages

## Langkah Cepat (5 Menit)

### 1️⃣ Update Database
```bash
cd project_client/villa-booking
./update-auth-pages.sh
```

### 2️⃣ Jalankan Server
```bash
npm run dev
```

### 3️⃣ Buka Browser
- Login: http://localhost:3000/auth/login
- Register: http://localhost:3000/auth/register

---

## 🎯 Test Checklist

### Login Page ✅
- [ ] Video muncul di sebelah kanan (desktop)
- [ ] Form di sebelah kiri
- [ ] Bisa toggle password
- [ ] Button Google Sign-In ada
- [ ] Link ke Register bekerja
- [ ] Form submission bekerja

### Register Page ✅
- [ ] Video muncul di sebelah kanan (desktop)
- [ ] Form di sebelah kiri
- [ ] 4 input fields lengkap
- [ ] Validasi password berfungsi
- [ ] Bisa toggle kedua password
- [ ] Button Google Sign-In ada
- [ ] Link ke Login bekerja
- [ ] Auto-login setelah register

---

## 📱 Testing di Mobile

### iPhone/Android
```
1. Buka Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Pilih device: iPhone 12 Pro
4. Refresh halaman
5. Cek: Video harus HIDDEN, form full width
```

---

## 🐛 Troubleshooting Quick Fix

### Video Tidak Muncul
```bash
# Check database
npx prisma studio
# Lihat table: site_configs
# Key: auth_video
# Pastikan ada value URL YouTube
```

### Google Login Error
```env
# Check .env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000
```

### Form Error
```bash
# Check API endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"12345678"}'
```

---

## 📊 Database Check

### Lihat Config di Database
```sql
SELECT * FROM site_configs WHERE key LIKE '%auth%' OR key LIKE '%login%';
```

### Expected Result:
```
key                | value
-------------------|---------------------------------------
auth_video         | https://www.youtube.com/embed/...
login_title        | Selamat Datang
login_subtitle     | Masuk untuk melihat riwayat...
register_title     | Bergabung Bersama Kami
register_subtitle  | Daftar sekarang untuk...
```

---

## 🎨 Customization

### Ganti Video
Edit `prisma/seed.ts`:
```typescript
{
  key: "auth_video",
  value: "https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=YOUR_VIDEO_ID&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&fs=0&disablekb=1&iv_load_policy=3&cc_load_policy=0",
  type: "string"
}
```

Lalu run:
```bash
npx prisma db seed
```

### Ganti Text
Edit di seed.ts:
```typescript
{ key: "login_title", value: "Welcome Back!", type: "string" }
{ key: "register_title", value: "Join Us Today", type: "string" }
```

### Ganti Warna
Edit `src/app/globals.css`:
```css
:root {
  --accent: #YOUR_COLOR; /* Default: #C8A44E */
}
```

---

## 📁 File Locations

```
Halaman Login:
→ src/app/(public)/auth/login/page.tsx

Halaman Register:
→ src/app/(public)/auth/register/page.tsx

API Register:
→ src/app/api/auth/register/route.ts

Database Config:
→ prisma/seed.ts

Custom Styles:
→ src/app/(public)/auth/auth-styles.css
→ src/app/globals.css
```

---

## 🔑 Environment Variables

Minimal `.env` yang dibutuhkan:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
```

---

## 🎓 Video Tutorial Steps

### Cara Dapatkan YouTube Video ID:
1. Buka video di YouTube
2. URL contoh: `https://www.youtube.com/watch?v=VIDEO_ID_HERE`
3. Copy `VIDEO_ID_HERE`
4. Paste di seed.ts

### Cara Setup Google OAuth:
1. Buka https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID & Secret ke `.env`

---

## ✨ Features Showcase

### Login Features:
```
✅ Email/Password login
✅ Google OAuth login
✅ Password visibility toggle
✅ Remember me (via NextAuth)
✅ Error messages
✅ Loading states
✅ Responsive design
✅ Video background (desktop)
```

### Register Features:
```
✅ Full name input
✅ Email validation
✅ Password strength check
✅ Confirm password matching
✅ Google OAuth signup
✅ Terms & privacy links
✅ Auto-login after signup
✅ Error messages
✅ Loading states
✅ Responsive design
✅ Video background (desktop)
```

---

## 🎯 Next Steps

### Opsional Enhancements:
1. [ ] Add password strength indicator
2. [ ] Add email verification
3. [ ] Add "Remember Me" checkbox
4. [ ] Add social login (Facebook, Apple)
5. [ ] Add forgot password flow
6. [ ] Add rate limiting
7. [ ] Add CAPTCHA
8. [ ] Add session management

### Production Checklist:
- [ ] Change video to production URL
- [ ] Set production NEXTAUTH_URL
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Setup proper CORS
- [ ] Enable HTTPS
- [ ] Add monitoring/logging
- [ ] Test on real devices
- [ ] Performance optimization

---

## 💡 Tips & Tricks

### Performance:
```
✓ Video only loads on desktop (hidden on mobile)
✓ Use lazy loading for images
✓ Minimize bundle size
✓ Use CDN for static assets
```

### Security:
```
✓ Always hash passwords (bcryptjs)
✓ Use HTTPS in production
✓ Validate all inputs
✓ Sanitize user data
✓ Rate limit API endpoints
✓ Use CSP headers
```

### UX:
```
✓ Show loading states
✓ Display clear error messages
✓ Auto-focus first input
✓ Remember form data (except password)
✓ Keyboard navigation support
```

---

## 📞 Support

### Dokumentasi:
- `AUTH_PAGES_README.md` - Dokumentasi lengkap
- `AUTH_SUMMARY.md` - Ringkasan perubahan
- `VISUAL_COMPARISON.md` - Perbandingan visual

### Jika Ada Masalah:
1. Check console browser (F12)
2. Check terminal server
3. Check database connection
4. Verify environment variables
5. Clear cache & restart server

---

## ✅ Success Indicators

Halaman berhasil jika:
- ✅ Video muncul dan autoplay (desktop)
- ✅ Form bisa disubmit
- ✅ Google login bekerja
- ✅ Validation berfungsi
- ✅ Error messages jelas
- ✅ Redirect setelah login/register
- ✅ Responsive di mobile
- ✅ No console errors

---

**Happy Coding! 🚀**

Jika ada pertanyaan, silakan lihat file `AUTH_PAGES_README.md` untuk dokumentasi lengkap.
