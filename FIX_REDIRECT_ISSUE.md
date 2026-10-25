# 🔧 FIX: Redirect ke Login Terus

## ❌ Masalah
Ketika klik link "Daftar" dari halaman login, selalu redirect kembali ke `/login`.

## ✅ Penyebab
Middleware (`src/middleware.ts`) tidak mengizinkan `/register` sebagai **public path**.

## 🔧 Solusi
Tambahkan `/register` ke array `publicPaths` di middleware.

### File yang Diubah:
📁 `src/middleware.ts`

```typescript
// SEBELUM ❌
const publicPaths = ["/", "/villas", "/promo", "/booking", "/login", "/forgot-password"];

// SESUDAH ✅
const publicPaths = ["/", "/villas", "/promo", "/booking", "/login", "/register", "/forgot-password"];
```

## 🚀 Test Sekarang

1. **Restart development server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Buka browser:**
   - Login: http://localhost:3000/login
   - Klik link **"Daftar"**
   - Sekarang harus redirect ke: http://localhost:3000/register ✅

3. **Test sebaliknya:**
   - Register: http://localhost:3000/register
   - Klik link **"Masuk"**
   - Sekarang harus redirect ke: http://localhost:3000/login ✅

---

## 📝 Penjelasan

### Middleware Next.js
Middleware berjalan **sebelum** halaman dirender. Fungsinya:
- Check apakah user sudah login
- Protect halaman yang butuh authentication
- Allow public pages tanpa login

### Public Paths
```typescript
const publicPaths = [
  "/",              // Homepage
  "/villas",        // Villa list
  "/promo",         // Promo page
  "/booking",       // Booking page
  "/login",         // Login page ✅
  "/register",      // Register page ✅ (BARU DITAMBAH!)
  "/forgot-password" // Forgot password
];
```

Jika path **tidak ada** di `publicPaths` dan user **belum login**:
→ Redirect ke `/login` ❌

---

## ✅ Selesai!

Sekarang navigasi antara login dan register sudah berfungsi dengan baik:

- ✅ `/login` → Klik "Daftar" → `/register`
- ✅ `/register` → Klik "Masuk" → `/login`
- ✅ Kedua halaman bisa diakses tanpa login
- ✅ Setelah login/register, redirect ke `/account`

**Happy Coding! 🚀**
