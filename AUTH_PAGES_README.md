# Halaman Login dan Register - Dokumentasi

## Perubahan yang Dibuat

### 1. Update Database Seeder (`prisma/seed.ts`)
Menambahkan konfigurasi video dan teks untuk halaman autentikasi:

```typescript
{ key: "hero_video", value: "https://www.youtube.com/embed/...", type: "string" }
{ key: "auth_video", value: "https://www.youtube.com/embed/...", type: "string" }
{ key: "login_title", value: "Selamat Datang", type: "string" }
{ key: "login_subtitle", value: "Masuk untuk melihat riwayat...", type: "string" }
{ key: "register_title", value: "Bergabung Bersama Kami", type: "string" }
{ key: "register_subtitle", value: "Daftar sekarang untuk...", type: "string" }
```

**Menjalankan Seeder:**
```bash
npm run prisma:seed
# atau
npx prisma db seed
```

### 2. Halaman Login (`src/app/(public)/auth/login/page.tsx`)

#### Fitur:
- ✅ Layout terbalik: Form di kiri, video di kanan
- ✅ Video background YouTube dengan autoplay mute loop
- ✅ Google Sign-In button
- ✅ Toggle show/hide password
- ✅ Error handling
- ✅ Responsive (mobile: form only, desktop: split layout)
- ✅ Loading state

#### Struktur:
```
┌──────────────┬──────────────┐
│              │              │
│   Form       │   Video +    │
│   Login      │   Welcome    │
│   (Kiri)     │   (Kanan)    │
│              │              │
└──────────────┴──────────────┘
```

### 3. Halaman Register (`src/app/(public)/auth/register/page.tsx`)

#### Fitur:
- ✅ Layout terbalik: Form di kiri, video di kanan
- ✅ Video background YouTube dengan autoplay mute loop
- ✅ Google Sign-In button
- ✅ 4 input fields: Nama, Email, Password, Confirm Password
- ✅ Password validation (min 8 karakter, matching)
- ✅ Toggle show/hide password (untuk kedua field)
- ✅ Terms & Privacy link
- ✅ Auto-login setelah register sukses

#### Validasi:
- Password minimal 8 karakter
- Password dan konfirmasi harus sama
- Email harus valid format
- Nama lengkap wajib diisi

### 4. Styling

#### Kelas CSS yang Digunakan:
- `.grain` - Efek grain texture overlay
- `.reveal`, `.reveal-delay-*` - Animasi fade-in
- `.link-underline` - Animasi underline hover
- `.card-hover` - Efek hover card

#### Warna:
- `primary-dark` (#12121f) - Background gelap
- `accent` (#C8A44E) - Warna emas/accent
- `cream` (#f5f5f0) - Input background
- `white` - Background form

### 5. Video Configuration

Video menggunakan YouTube iframe dengan parameter:
- `autoplay=1` - Otomatis play
- `mute=1` - Suara mati
- `loop=1` - Looping
- `playlist=VIDEO_ID` - Untuk loop bekerja
- `controls=0` - Sembunyikan controls
- `showinfo=0` - Sembunyikan info
- `rel=0` - Tidak tampilkan video related
- `modestbranding=1` - Minimal branding
- `playsinline=1` - Play inline (mobile)
- `fs=0` - Disable fullscreen
- `disablekb=1` - Disable keyboard
- `iv_load_policy=3` - Tidak tampilkan annotations
- `cc_load_policy=0` - Tidak tampilkan captions

#### Styling Video:
```css
.w-[177.77777778vh] /* Width responsive */
.h-[56.25vw] /* Height responsive */
.min-h-full .min-w-full /* Full coverage */
```

Overlay gelap ditambahkan dengan:
```css
.bg-primary-dark/80 /* 80% opacity dark overlay */
```

## API Routes yang Dibutuhkan

### Login Endpoint
**File yang sudah ada:** `src/app/api/auth/[...nextauth]/route.ts`

### Register Endpoint (Perlu dibuat jika belum ada)
**File:** `src/app/api/auth/register/route.ts`

```typescript
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Check if user exists
    const exists = await prisma.users.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const user = await prisma.users.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER", // atau role default lain
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
```

## Testing

### Test Login Page:
1. Buka `http://localhost:3000/auth/login`
2. Cek responsiveness (mobile & desktop)
3. Test Google Sign-In
4. Test email/password login
5. Test toggle show/hide password
6. Test error messages

### Test Register Page:
1. Buka `http://localhost:3000/auth/register`
2. Cek responsiveness (mobile & desktop)
3. Test Google Sign-In
4. Test form validation:
   - Password < 8 karakter
   - Password tidak cocok
   - Email tidak valid
5. Test successful registration
6. Test auto-login setelah register

## Responsive Breakpoints

- **Mobile (< 1024px):**
  - Form only, full width
  - Logo di atas form
  - Video tersembunyi

- **Desktop (≥ 1024px):**
  - Split screen: Form 50% | Video 50%
  - Logo di video section

## Troubleshooting

### Video tidak muncul
- Pastikan URL YouTube valid
- Cek browser console untuk errors
- Test dengan video ID yang berbeda

### Styling tidak sesuai
- Pastikan `globals.css` sudah diimport di `layout.tsx`
- Check Tailwind config untuk custom colors
- Verify CSS classes di browser DevTools

### Google Sign-In tidak bekerja
- Pastikan Google OAuth sudah dikonfigurasi di NextAuth
- Check environment variables
- Verify callback URL di Google Console

## Environment Variables

Pastikan file `.env` memiliki:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Routes

- Login: `/auth/login`
- Register: `/auth/register`
- Forgot Password: `/forgot-password` (perlu dibuat)
- Account Dashboard: `/account` (redirect setelah login)

## Next Steps

1. ✅ Update seeder dengan video URL
2. ✅ Buat halaman login baru
3. ✅ Buat halaman register baru
4. ⏳ Buat API endpoint `/api/auth/register`
5. ⏳ Test di browser
6. ⏳ Deploy ke production
