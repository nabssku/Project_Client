# 📊 Struktur File & Routes

## File Structure

```
project_client/villa-booking/
│
├── src/app/
│   ├── (auth)/                    ← Customer Auth Group
│   │   ├── login/
│   │   │   └── page.tsx          ← ✅ LOGIN PAGE (Updated!)
│   │   └── register/
│   │       └── page.tsx          ← ✅ REGISTER PAGE (New!)
│   │
│   ├── api/auth/
│   │   ├── [...nextauth]/
│   │   │   └── route.ts          ← NextAuth config
│   │   └── register/
│   │       └── route.ts          ← ✅ REGISTER API (New!)
│   │
│   └── globals.css               ← Styles (grain, etc)
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    ← ✅ UPDATED! (Added video configs)
│
└── Documentation/
    ├── AUTH_PAGES_README.md       ← Dokumentasi lengkap
    ├── AUTH_SUMMARY.md            ← Ringkasan
    ├── VISUAL_COMPARISON.md       ← Perbandingan visual
    ├── QUICK_START.md             ← Panduan cepat
    └── FINAL_SUMMARY.md           ← Summary akhir
```

---

## Routes Map

```
🌐 Frontend Routes
│
├── /                              → Homepage
├── /login                         → ✅ Customer Login (UPDATED)
├── /register                      → ✅ Customer Register (NEW)
├── /account                       → Customer Dashboard
├── /forgot-password               → Forgot Password (TODO)
│
└── /dashboard                     → Admin Dashboard (existing)
    ├── /dashboard/villas
    ├── /dashboard/bookings
    └── ...

🔌 API Routes
│
├── /api/auth/
│   ├── [...nextauth]              → NextAuth handlers
│   └── register                   → ✅ Register endpoint (NEW)
│
└── /api/...                       → Other APIs
```

---

## Component Breakdown

### Login Page (`/login`)

```
┌─────────────────────────────────────────────────────────┐
│                  LOGIN PAGE LAYOUT                       │
├─────────────────────────┬───────────────────────────────┤
│                         │                               │
│    LEFT SIDE            │    RIGHT SIDE                 │
│    (Form)               │    (Video)                    │
│    50% width            │    50% width                  │
│                         │                               │
│  ┌──────────────────┐  │  ┌─────────────────────────┐  │
│  │ Logo (mobile)    │  │  │ 🎥 YouTube Video        │  │
│  │                  │  │  │    (autoplay, loop)     │  │
│  │ "Masuk"          │  │  │                         │  │
│  │                  │  │  │ Dark Overlay (80%)      │  │
│  │ Link: Daftar     │  │  │                         │  │
│  │                  │  │  ├─────────────────────────┤  │
│  │ ┌──────────────┐ │  │  │ Logo                    │  │
│  │ │ Google Btn   │ │  │  │ "Selamat Datang"        │  │
│  │ └──────────────┘ │  │  │ "Kembali"               │  │
│  │                  │  │  │ (italic)                │  │
│  │ ---- atau ----   │  │  │                         │  │
│  │                  │  │  │ "Masuk untuk melihat    │  │
│  │ Email Input      │  │  │  riwayat booking..."    │  │
│  │ Password Input   │  │  └─────────────────────────┘  │
│  │   [👁️ Toggle]    │  │                               │
│  │                  │  │  (Hidden on Mobile)           │
│  │ Lupa password?   │  │                               │
│  │                  │  │                               │
│  │ [Masuk Button]   │  │                               │
│  │                  │  │                               │
│  │ Kembali beranda  │  │                               │
│  └──────────────────┘  │                               │
│                         │                               │
└─────────────────────────┴───────────────────────────────┘
```

### Register Page (`/register`)

```
┌─────────────────────────────────────────────────────────┐
│                 REGISTER PAGE LAYOUT                     │
├─────────────────────────┬───────────────────────────────┤
│                         │                               │
│    LEFT SIDE            │    RIGHT SIDE                 │
│    (Form)               │    (Video)                    │
│    50% width            │    50% width                  │
│                         │                               │
│  ┌──────────────────┐  │  ┌─────────────────────────┐  │
│  │ Logo (mobile)    │  │  │ 🎥 YouTube Video        │  │
│  │                  │  │  │    (autoplay, loop)     │  │
│  │ "Daftar Akun"    │  │  │                         │  │
│  │                  │  │  │ Dark Overlay (80%)      │  │
│  │ Link: Masuk      │  │  │                         │  │
│  │                  │  │  ├─────────────────────────┤  │
│  │ ┌──────────────┐ │  │  │ Logo                    │  │
│  │ │ Google Btn   │ │  │  │ "Bergabung Bersama"     │  │
│  │ └──────────────┘ │  │  │ "Kami"                  │  │
│  │                  │  │  │ (italic)                │  │
│  │ ---- atau ----   │  │  │                         │  │
│  │                  │  │  │ "Daftar sekarang untuk  │  │
│  │ Nama Input       │  │  │  mulai menikmati..."    │  │
│  │ Email Input      │  │  └─────────────────────────┘  │
│  │ Password Input   │  │                               │
│  │   [👁️ Toggle]    │  │  (Hidden on Mobile)           │
│  │ Confirm Pass     │  │                               │
│  │   [👁️ Toggle]    │  │                               │
│  │                  │  │                               │
│  │ [Daftar Button]  │  │                               │
│  │                  │  │                               │
│  │ Terms & Privacy  │  │                               │
│  │ Kembali beranda  │  │                               │
│  └──────────────────┘  │                               │
│                         │                               │
└─────────────────────────┴───────────────────────────────┘
```

---

## Data Flow

### Login Flow

```
User
  ↓
[Login Form] (/login)
  ↓
Submit Email + Password
  ↓
┌─────────────────────────┐
│ NextAuth Credentials    │
│ Provider                │
└─────────────────────────┘
  ↓
Check Database (Prisma)
  ↓
  ├─ Valid? → Create Session → Redirect /account ✅
  └─ Invalid? → Show Error ❌
```

### Register Flow

```
User
  ↓
[Register Form] (/register)
  ↓
Submit Name + Email + Password
  ↓
┌─────────────────────────┐
│ POST /api/auth/register │
└─────────────────────────┘
  ↓
  ├─ Email exists? → Error "Email sudah terdaftar" ❌
  ├─ Password < 8? → Error "Minimal 8 karakter" ❌
  └─ Valid? ↓
         Create User (hash password)
         ↓
         Auto Login via NextAuth
         ↓
         Redirect /account ✅
```

### Google OAuth Flow

```
User clicks "Login dengan Google"
  ↓
NextAuth Google Provider
  ↓
Redirect to Google OAuth
  ↓
User authorizes
  ↓
Callback to /api/auth/callback/google
  ↓
  ├─ User exists? → Login ✅
  └─ New user? → Create + Login ✅
  ↓
Redirect /account
```

---

## Database Schema (Relevant Parts)

```sql
-- site_configs table
CREATE TABLE site_configs (
  id          TEXT PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  value       TEXT NOT NULL,
  type        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Example records:
INSERT INTO site_configs (key, value, type) VALUES
  ('auth_video', 'https://youtube.com/embed/...', 'string'),
  ('login_title', 'Selamat Datang', 'string'),
  ('login_subtitle', 'Masuk untuk...', 'string'),
  ('register_title', 'Bergabung Bersama Kami', 'string'),
  ('register_subtitle', 'Daftar sekarang...', 'string');

-- users table
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  passwordHash  TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          ENUM('ADMIN', 'MANAJER', 'MARKETING', 'MAINTENANCE'),
  avatar        TEXT,
  isActive      BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-min-32-chars"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
```

---

## CSS Classes Used

```css
/* Layout */
.min-h-screen              → Full viewport height
.flex                      → Flexbox
.flex-1                    → Flex grow 1 (50% each side)

/* Colors */
.bg-white                  → White background (form)
.bg-primary-dark           → Dark background (video side)
.bg-cream                  → Cream background (inputs)
.text-accent               → Gold color
.text-primary              → Dark text

/* Effects */
.grain                     → Grain texture overlay
.grain::before             → Pseudo-element for grain

/* Video */
.w-[177.77777778vh]        → 16:9 aspect ratio width
.h-[56.25vw]               → 16:9 aspect ratio height
.bg-primary-dark/80        → 80% opacity overlay

/* Responsive */
.hidden.lg:flex            → Hidden on mobile, flex on desktop
.lg:w-1/2                  → 50% width on desktop

/* Animations */
.transition-colors         → Smooth color transitions
.hover:bg-accent-light     → Hover effect
```

---

## Testing Scenarios

### ✅ Happy Path

1. **User visits /login**
   - ✓ Page loads
   - ✓ Video plays (desktop)
   - ✓ Form shows

2. **User enters credentials**
   - ✓ Email: test@example.com
   - ✓ Password: 12345678
   - ✓ Click "Masuk"

3. **Success**
   - ✓ Redirects to /account
   - ✓ Session created

### ❌ Error Cases

1. **Wrong credentials**
   - Input: wrong email/password
   - Expected: "Email atau password salah"

2. **Weak password (register)**
   - Input: password < 8 chars
   - Expected: "Password minimal 8 karakter"

3. **Password mismatch (register)**
   - Input: password ≠ confirm
   - Expected: "Password tidak cocok"

4. **Email exists (register)**
   - Input: existing email
   - Expected: "Email sudah terdaftar"

---

## Performance Considerations

```
✓ Video only loads on desktop (lg breakpoint)
✓ Hidden on mobile (no bandwidth waste)
✓ Lazy loading for images
✓ Minimal JavaScript
✓ CSS transitions (GPU accelerated)
✓ No external dependencies for UI
```

---

## Security Features

```
✓ Password hashing (bcryptjs, 12 rounds)
✓ CSRF protection (NextAuth)
✓ HTTP-only cookies
✓ Input validation
✓ SQL injection prevention (Prisma)
✓ XSS prevention (React escaping)
```

---

## Browser Support

```
✓ Chrome 90+
✓ Firefox 88+
✓ Safari 14+
✓ Edge 90+
✓ Mobile browsers (iOS Safari, Chrome Android)
```

---

## Accessibility (a11y)

```
✓ Semantic HTML (<form>, <label>, <button>)
✓ Label associations (for + id)
✓ Focus visible states
✓ Keyboard navigation
✓ Error announcements
✓ Color contrast WCAG AA
```

---

**Happy Coding! 🚀**
