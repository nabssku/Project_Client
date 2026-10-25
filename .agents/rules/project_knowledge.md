# Villa Booking System — Project Knowledge & Architectural Rules

Dokumen ini berisi rangkuman arsitektur, aturan khusus Next.js 16, detail implementasi Navbar, riwayat perbaikan bug prerender, dan status fitur untuk referensi otomatis sesi coding selanjutnya.

---

## 1. Aturan Khusus Next.js 16 (Cache Components & Prerendering)

Proyek ini menggunakan **Next.js 16.4.2** dengan konfigurasi `cacheComponents: true` dan `partialPrefetching: true` di `next.config.ts`.
Beberapa aturan kritis yang **wajib diikuti**:

1. **Akses Database Prisma di Server Components**:
   - Setiap query Prisma yang berjalan di Server Component saat prerendering wajib di-cache menggunakan direktif `'use cache'` dan `cacheLife(...)` (misal: `'minutes'` atau `'hours'`), ATAU dibungkus di dalam `<Suspense fallback={...}>`.
   - Contoh: Fungsi `getFooterConfigs()` di `src/components/public/footer.tsx` dan `getVillas()` di `src/app/(public)/villas/page.tsx`.

2. **Halaman Dynamic & Request-Time APIs (Auth, Session, Cookies)**:
   - Jika suatu Server Component membaca `auth()` (NextAuth v5 beta), cookies, atau header request, komponen tersebut **tidak boleh di-prerender statis**.
   - Solusi wajib:
     - Tambahkan `export const instant = false;` di file `page.tsx`.
     - Panggil `await connection();` dari `next/server` di baris pertama fungsi komponen sebelum memanggil `auth()`.
     - Contoh implementasi: `src/app/(public)/villas/[slug]/page.tsx`.

3. **Client Components & Unstable Values (`new Date()`, `Math.random()`)**:
   - Jangan memanggil `new Date()` langsung di return JSX Client Component saat prerendering karena Next.js akan mendeteksinya sebagai *unstable value*.
   - Pindahkan pembacaan nilai waktu ke dalam `useEffect` (lihat: `src/components/current-year.tsx`).

4. **generateMetadata()**:
   - Jika fungsi `generateMetadata()` membaca database atau dynamic params, sertakan direktif `'use cache'` di awal fungsi untuk mencegah blocking route prerender.

---

## 2. Logika Khusus Navbar (`src/components/public/navbar.tsx`)

Navbar menggunakan `usePathname()` untuk mendeteksi rute dan mengatur styling secara kondisional:

- **Halaman Beranda (`pathname === "/"`)**:
  - **Sebelum discroll (`!scrolled`)**: Background **transparan** (`bg-transparent py-4`) tanpa border/shadow dengan teks, logo & tombol **putih** (`text-white`) di atas Hero video.
  - **Setelah discroll (`scrolled`)**: Berubah halus menjadi **gelap** (`bg-primary-dark shadow-lg py-2`) dengan teks & logo tetap putih (`text-white`).
- **Halaman Detail Villa (`pathname.startsWith("/villas/") && pathname !== "/villas"`)**:
  - **Permanen putih solid** (`bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-3`), baik sebelum maupun setelah discroll. Teks & tombol selalu bertema gelap (`text-primary-dark`).
- **Halaman Umum Lainnya (`/villas`, `/promo`, `/about`)**:
  - Sebelum discroll: background transparan dengan teks gelap.
  - Setelah discroll: background gelap (`bg-primary-dark`) dengan teks putih.

---

## 3. Riwayat Perbaikan Bug Prerendering (Resolved)

1. **Error: Route "/villas" blocking prerender**:
   - `src/components/public/footer.tsx`: Query `prisma.site_configs.findMany` dipisahkan ke fungsi `getFooterConfigs()` dengan `'use cache'` dan `cacheLife('hours')`.
   - `src/app/(public)/layout.tsx`: Komponen `<Footer />` dibungkus `<Suspense fallback={null}>`.
   - `src/components/current-year.tsx`: `new Date().getFullYear()` dipindahkan ke `useEffect`.
   - `src/app/layout.tsx`: Menambahkan `'use cache'` dan `cacheLife('hours')` di `generateMetadata()`.
2. **Error: Route "/villas/[slug]" blocking prerender & crypto error**:
   - `src/app/(public)/villas/[slug]/page.tsx`: Ditambahkan `export const instant = false;`, `'use cache'` di `generateMetadata()`, dan `await connection()` dari `next/server` sebelum `auth()`.
3. **Pembersihan next.config.ts**:
   - Menghapus opsi deprecated `dynamicIO: true` yang digantikan oleh `cacheComponents: true`.
4. **Perbaikan Cache Stale Vercel (Cache Components & Edge Invalidation)**:
   - Sebelumnya, data `site_configs` di-cache dengan profil `cacheLife('hours')` (1 jam - 1 hari) tanpa tag cache eksplisit, sehingga Vercel Edge CDN terus menyajikan cache lama meski database telah diperbarui.
   - Diperbaiki dengan mengaitkan `cacheTag('site_configs')` dan profil revalidasi cepat `cacheLife('seconds')` / `cacheLife('minutes')`.
   - Menambahkan pemanggilan `revalidateTag('site_configs', { expire: 0 })` pada endpoint pembaruan (`/api/config/site`, `/api/cms/hero`, `/api/config/payment`).
   - Membuat endpoint on-demand `/api/config/revalidate` dan tombol 1-klik "Bersihkan Cache Vercel" di `/dashboard/settings` dan `/dashboard/cms/hero`.
   - Menambahkan client-side background sync di `FontLoader` (`fetch('/api/config/site')` dengan `no-store`) agar perubahan warna & font langsung aktif seketika tanpa perlu deploy ulang.

---

## 4. Keputusan Arsitektur Produk (PRD)

- **Spesifikasi Lengkap**: Tersimpan di file artefak `PRD-villa-booking.md`.
- **Alur Pembayaran**: Menggunakan **Manual Bank Transfer** (tamu mendapat info rekening & kode bayar unik `BK-XXXXXX`, staf memverifikasi bukti bayar manual lalu mengubah status dari `PENDING` $\rightarrow$ `CONFIRMED`).
- **Notifikasi Tamu**: Menggunakan **Resend** dengan arsitektur *Adapter Pattern* (`IEmailService`), disiapkan agar dapat bermigrasi ke **Nodemailer** (SMTP) tanpa refactor kode logika bisnis.
- **RBAC**: 4 role (`ADMIN`, `MANAJER`, `MARKETING`, `MAINTENANCE`) didefinisikan di `src/lib/rbac.ts`.

---

## 5. Template Dashboard Berdasarkan Peran (Role-Based Dashboard)

Halaman `/dashboard` (`src/app/dashboard/page.tsx`) secara otomatis mendeteksi peran (`session.user.role`) dan memuat template yang disesuaikan:

1. **Admin (`ADMIN`)** — [`src/components/dashboard/roles/admin-dashboard.tsx`](file:///Users/fithrichaerunisa/project_client/villa-booking/src/components/dashboard/roles/admin-dashboard.tsx):
   - Overview bisnis menyeluruh: Total Villa, Total Booking, Estimasi Revenue, Staf & Pengguna Aktif.
   - Tabel reservasi terbaru dan log audit mutasi sistem.
2. **Manajer (`MANAJER`)** — [`src/components/dashboard/roles/manajer-dashboard.tsx`](file:///Users/fithrichaerunisa/project_client/villa-booking/src/components/dashboard/roles/manajer-dashboard.tsx):
   - Fokus operasional: Antrean verifikasi bukti transfer manual (`PENDING`), jadwal kedatangan tamu terkonfirmasi, dan status kesiapan unit villa.
3. **Maintenance (`MAINTENANCE`)** — [`src/components/dashboard/roles/maintenance-dashboard.tsx`](file:///Users/fithrichaerunisa/project_client/villa-booking/src/components/dashboard/roles/maintenance-dashboard.tsx):
   - Fokus housekeeping: Tiket tugas perbaikan & pembersihan aktif, unit berstatus `CLEANING` & `MAINTENANCE`, serta checklist penyelesaian tugas.
4. **Marketing (`MARKETING`)** — [`src/components/dashboard/roles/marketing-dashboard.tsx`](file:///Users/fithrichaerunisa/project_client/villa-booking/src/components/dashboard/roles/marketing-dashboard.tsx):
   - Fokus CMS & promosi: Manajemen kode promo/diskon aktif, kurasi testimoni bintang lima, dan villa unggulan (`isFeatured`).

### Akun Uji Coba (Seeded):
- **Admin**: `admin@villabooking.com` / `admin123`
- **Manajer**: `manajer@villabooking.com` / `manajer123`
- **Marketing**: `marketing@villabooking.com` / `marketing123`
- **Maintenance**: `maintenance@villabooking.com` / `maintenance123`

---

## 6. Modul Manajemen Unit Villa (`/dashboard/villas`) & R2 Watermark

- **RBAC Policy**: Hak akses CRUD (`villa:create`, `villa:update`, `villa:delete`) dibatasi eksklusif untuk **Role ADMIN**. Role MANAJER hanya memiliki izin `villa:read` dan `villa:status` (quick status change).
- **Watermark Engine**: Terintegrasi di `src/lib/watermark.ts` menggunakan library `sharp`. Menempelkan watermark logo monogram dan teks Singgahsana semi-transparan tepat di titik tengah gambar (`gravity: 'center'`) dan mengoptimalkan format ke WebP.
- **Cloudflare R2**: Buffer gambar hasil olahan diunggah langsung via `@aws-sdk/client-s3` (`PutObjectCommand`) ke bucket `villas` di `src/lib/r2.ts`.
- **Proteksi Relasi**: Villa yang memiliki riwayat booking di database dicegah dari penghapusan permanen (*hard delete*) dan diarahkan untuk dinonaktifkan (`status: UNAVAILABLE`).

---

## 7. Fitur Galeri & Fasilitas Villa
- **Komponen Galeri (`src/components/public/villa-gallery.tsx`)**:
  - Modal lightbox fullscreen minimalis tanpa border kaku.
  - Floating pill controls: counter `01 / 03`, tombol close dengan shortcut `Esc`, backdrop dismiss, navigasi keyboard panah kiri/kanan.
  - Floating capsule thumbnail strip di bagian bawah.
  - Otomatis memunculkan badge overlay dan tombol "Lihat semua foto ({total} foto)" jika total foto > 7.
- **Komponen Fasilitas (`src/components/public/amenity-icon.tsx`)**:
  - Deteksi otomatis cerdas berbasis keyword dwibahasa (ID/EN) untuk fasilitas villa (contoh: Pool/Kolam Renang, WiFi, AC, BBQ, Kitchen/Dapur, Garden/Taman, Meeting Room, Billiard, Playstation, TV, Bathtub/Hot Tub, Water Heater, Balkon, dll.) menggunakan icon SVG `lucide-react`.
  - Menggantikan class lama `ti-*` (Tabler) yang sebelumnya tidak memiliki font icon sehingga sempat kosong.
  - Digunakan di halaman publik (`/villas/[slug]`) dan di form dashboard admin (`VillaForm`).

---

## 8. Modul Aturan Menginap (House Rules)
- **Skema Database (`prisma/schema.prisma`)**:
  - Menambahkan kolom `checkInTime` (default: `"14:00"`), `checkOutTime` (default: `"12:00"`), dan `rules String[]` (default: `[]`) pada model `villas`.
- **Dashboard Admin (`src/components/dashboard/villas/villa-form.tsx`)**:
  - Bagian "Aturan Menginap (House Rules)":
    - Input waktu Check-in dan Check-out kustom.
    - Pilihan preset aturan populer satu-klik (Dilarang merokok, No Pets, Quiet Hours, No Drugs/Miras, Deposit, KTP).
    - Tambah aturan kustom tak terbatas serta hapus aturan aktif dengan tombol `X`.
- **Halaman Publik (`src/app/(public)/villas/[slug]/page.tsx`)**:
  - Kartu ringkasan waktu Check-in, Check-out, Kapasitas, dan Parkir yang dinamis sesuai data villa.
  - Daftar "Tata Tertib & Ketentuan Menginap" yang otomatis merender seluruh aturan spesifik yang ditetapkan admin.

---

## 9. Modul Lokasi & Embed Google Maps
- **Skema Database (`prisma/schema.prisma`)**:
  - Kolom `mapEmbed String? @db.Text` pada model `villas` untuk menyimpan kode embed HTML `<iframe>` atau link Google Maps.
- **Normalizer (`src/lib/maps.ts` - `extractMapEmbedSrc`)**:
  - Otomatis mengekstrak atribut `src` jika admin menyalin seluruh tag HTML `<iframe>...</iframe>`.
  - Mendukung direct embed URL atau fallback otomatis ke keyless Google Maps query embed (`https://maps.google.com/maps?q=...&output=embed`) tanpa memerlukan Google Maps API Key berbayar.
- **Dashboard Admin (`src/components/dashboard/villas/villa-form.tsx`)**:
  - Kolom input khusus "Embed Google Maps" dengan panduan salin HTML dan preview peta langsung (*live preview*).
- **Halaman Publik (`src/app/(public)/villas/[slug]/page.tsx`)**:
  - Peta tersemat responsif di bagian Lokasi dengan tombol eksternal "Petunjuk Arah Google Maps" untuk navigasi GPS tamu.

---

## 10. Modul Reservasi & Booking End-to-End, Dynamic Pricing, dan Collision Guard

### A. Skema Database (`prisma/schema.prisma`)
- **`Role`**: Ditambahkan enum `GUEST` untuk tamu publik.
- **Model `villas`**: Kolom `priceWeekend Int?` untuk tarif akhir pekan kustom.
- **Model `villa_custom_prices`**: Tabel rentang harga musiman / libur nasional (`startDate`, `endDate`, `price`, `reason`).
- **Model `bookings`**: Kolom data tamu lengkap (`guestPhone`, `guestEmail`, `guestCity`, `companionType`, `promoCode`, `discountAmount`, `paymentProofUrl`, `paymentProofUploadedAt`).

### B. Dynamic Pricing Engine (`src/lib/pricing.ts`)
- **`getDailyPrice`**: Menentukan harga per malam berdasarkan prioritas:
  1. *Highest*: Custom Price Range dari tabel `villa_custom_prices` (libur panjang, tahun baru, peak season).
  2. *Medium*: Harga Weekend (`priceWeekend`) jika hari menginap jatuh pada Jumat atau Sabtu malam (`dayOfWeek === 5 || dayOfWeek === 6`).
  3. *Base*: Harga normal standar (`pricePerNight`).
- **`calculateStayBreakdown`**: Menghitung rincian per malam secara rinci (*night-by-night breakdown*), subtotal, diskon promo, dan total akhir.
- **`formatCompactPrice`**: Menghasilkan label harga ringkas untuk kalender (misal: `1,5 jt`, `2 jt`, `3,5 jt`).
- **Modal Dynamic Pricing Manajer (`src/components/dashboard/villas/villa-pricing-manager.tsx`)**:
  - Manajer dapat mengatur tarif akhir pekan dan menambahkan rentang tanggal harga khusus liburan langsung dari daftar villa.

### C. Alur Booking Publik & Kalender Ketersediaan
- **Widget Detail Villa (`src/components/public/villa-booking-widget.tsx`)**:
  - Pemilih Check-in & Check-out dengan kalender interaktif.
  - Dropdown pemilih jumlah tamu dengan kontrol plus/minus.
  - Rincian harga per malam dinamis dan total transparan.
  - Tombol pintas "Booking Sekarang" dan direct link "Hubungi via WhatsApp".
- **Kalender Ketersediaan (`src/components/public/villa-availability-calendar.tsx`)**:
  - Menampilkan kalender bulanan dengan badge harga kompak per tanggal.
  - Tanggal yang sudah dipesan otomatis diblokir (*disabled*) dengan label **Penuh**.
- **Checkout Form (`src/app/(public)/booking/page.tsx` & `src/components/public/booking-flow-client.tsx`)**:
  - Pengisian data tamu: Nama, WhatsApp, Email, Kota Asal, Kategori Rombongan (Keluarga, Teman, Pasangan, Kantor, Komunitas).
  - Validasi kode promo diskon.
  - Opsi pembuatan akun tamu otomatis (`createUserAccount`).
  - Respons API terstandarisasi `{ success: true, booking, code }` dengan redirection instan ke `/booking/[code]`.
- **Halaman Pembayaran & Bukti Transfer (`/booking/[code]` & `src/components/public/booking-payment-client.tsx`)**:
  - Menampilkan nomor rekening transfer bank dinamis dari `site_configs` atau QRIS.
  - Fitur salin kode booking, jumlah nominal tagihan, dan nomor rekening satu-klik.
  - Unggah bukti transfer langsung ke Cloudflare R2 (`/api/upload/payment-proof`).
  - Null-safety handling foto villa (`villa?.images?.[0] || "/placeholder-villa.jpg"`).
- **Tracker Reservasi Mandiri (`/booking/status`)**:
  - Tamu dapat mengecek status reservasi kapan saja hanya dengan memasukkan Kode Booking dan Email.

### D. Proteksi Tabrakan Tanggal (Anti Double-Booking / Collision Guard)
1. **Frontend**: Tanggal `PENDING`, `CONFIRMED`, `CHECKED_IN` dinonaktifkan di kalender.
2. **Formula Matematika**:
   $$\text{Overlap} \iff (\text{ExistingCheckIn} < \text{RequestedCheckOut}) \land (\text{ExistingCheckOut} > \text{RequestedCheckIn})$$
3. **Database Transaction Atomik**:
   - Pengecekan overlap dan pembuatan booking dijalankan di dalam satu `prisma.$transaction`.
   - Jika terjadi pemesanan simultan di milidetik yang sama, transaksi kedua digagalkan dengan HTTP 409 Conflict.
4. **Pemisahan Cache & Dynamic Query**:
   - Query reservasi aktif di `VillaDetailPage` dijalankan secara *live* tanpa `'use cache'`.
   - `VillaBookingProvider` menjalankan real-time polling 15s dan window refocus listener.

---

## 11. Modernisasi UI Manajemen Reservasi Manajer (`/dashboard/bookings`)

Diimplementasikan pada `src/components/dashboard/bookings/manager-bookings-client.tsx`:
1. **Fitur Unduh Bukti Pembayaran**:
   - Tombol icon unduh (`Download`) langsung pada kolom *Bukti Bayar* tabel.
   - Tombol *Unduh Bukti* di header dan footer modal preview bukti transfer.
   - Menggunakan fetch blob object URL (`${code}-bukti-transfer.${ext}`) dengan fallback `window.open` untuk cross-origin CDN/R2.
2. **Perubahan Status Interaktif & Catatan Manajer**:
   - Badge status di tabel dapat diklik untuk membuka modal khusus **"Ubah Status Reservasi"**.
   - Pilihan 5 status operasional:
     - 🟡 `PENDING` (Menunggu Verifikasi)
     - 🟢 `CONFIRMED` (Terkonfirmasi / Pembayaran Sah)
     - 🔵 `CHECKED_IN` (Check-In di Villa)
     - 🟣 `COMPLETED` (Selesai / Check-Out)
     - 🔴 `CANCELLED` (Dibatalkan / No-Show)
   - Kolom textarea internal *Catatan Manajer* yang otomatis tersimpan dan dicatat di `activity_logs`.
3. **Penataan Tombol Aksi Rapi**:
   - Tombol cepat kontekstual (`Verifikasi` / `Check-In` / `Selesai` / `Ubah`).
   - Menu aksi 3-titik (*MoreVertical*):
     - *Ubah Status & Catatan*
     - *Lihat Bukti Transfer* & *Unduh Bukti Transfer*
     - *Chat WhatsApp Tamu* (template pesan pembuka otomatis)
     - *Salin Rincian Pesanan* (ke format teks rapi di clipboard)
     - *Batalkan Pesanan*

---

## 12. Kustomisasi Nomor Rekening Transfer Bank Dinamis (`site_configs`)

- **Kunci Database**: `payment_transfer_banks` (type: `json`) pada model `site_configs`.
- **Format Data**:
  ```ts
  interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    instructions?: string;
    isActive: boolean;
  }
  ```
- **Helper**: `src/lib/payment-config.ts` (`getPaymentTransferBanks()`, `DEFAULT_BANK_ACCOUNTS`).
- **Akses Cepat Manajer**:
  - Tombol **"Atur Rekening Bank"** di header `/dashboard/bookings` membuka modal `BankAccountsManagerModal` (`src/components/dashboard/settings/bank-accounts-manager-modal.tsx`).
  - Mendukung preset cepat bank ternama (BCA, Mandiri, BRI, BNI, BSI, Jago, CIMB, Permata).
  - Mendukung toggle aktif/nonaktif per rekening tanpa perlu menghapus akun.
- **Tampilan Tamu**: `/booking/[code]` otomatis merender rekening aktif dengan tombol salin angka bersih tanpa spasi.

---

## 13. Pengaturan Lengkap Database `site_configs` (Khusus Role ADMIN)

Halaman pengaturan sistem diimplementasikan di `src/app/dashboard/settings/page.tsx` & `src/components/dashboard/settings/settings-client.tsx`:

1. **Seluruh 30+ Parameter `site_configs` Dikelola dalam 6 Sub-Kategori Minimalis**:
   - 🏢 **Identitas & Brand**: `site_name`, `company_name`, `site_tagline`, `site_description`, `watermark_text`.
   - ✨ **Hero Beranda**: `hero_title`, `hero_title_italic`, `hero_tagline`, `hero_subtitle`, `hero_video`, `hero_image`, `hero_gradient_accent`.
   - 📞 **Kontak & Alamat**: `contact_phone_1` (Hotline WA), `contact_phone_2`, `contact_email`, `contact_address`.
   - 🌐 **Media Sosial**: `social_instagram`, `social_facebook`, `social_tiktok`, `social_youtube`.
   - 🔒 **Login & Register**: `auth_video`, `login_title`, `login_subtitle`, `register_title`, `register_subtitle`.
   - 🎨 **Statistik, CTA & Desain**: `stats_properties`, `stats_guests`, `stats_rating`, `cta_title`, `cta_subtitle`, `font_display`, `font_body`, `primary_color`, `secondary_color`.
2. **Pencarian Cepat (*Live Search Filter*)**:
   - Admin/Manajer dapat mencari nama kunci atau label konfigurasi secara instan melalui input pencarian di atas bar kategori.
3. **Kebijakan Hak Akses (RBAC Policy)**:
   - **Frontend**: Jika `userRole !== "ADMIN"`, kolom konfigurasi berstatus *read-only* (mode pratinjau) dan tombol simpan dinonaktifkan.
   - **Backend API (`PUT /api/config/site`)**: Menolak request non-admin dengan HTTP 403 Forbidden.
   - **Atomic Bulk Update**: Disimpan via `prisma.$transaction`.
   - **Cache Revalidation**: Otomatis memicu `revalidatePath("/", "layout")`.
   - **Audit Trail**: Tercatat di tabel `activity_logs`.

---

## 14. Modul Manajemen Pengguna, Granular RBAC, Sidebar Dinamis & Proteksi Akun Dinonaktifkan

- **Skema Database (`prisma/schema.prisma`)**:
  - Kolom `permissions String[] @default([])` pada model `users`.
  - Jika `permissions` berstatus array eksplisit (termasuk `[]` untuk 0 izin kustom), sistem menghormati izin tersebut secara presisi. Jika `undefined`/belum terkonfigurasi, fallback ke default role (`getUserPermissions`).
  - Update user memicu `revalidatePath("/dashboard", "layout")` dan `router.refresh()` agar sidebar dan izin langsung sinkron tanpa perlu restart server.
- **Granular RBAC Engine (`src/lib/rbac.ts`)**:
  - Menyediakan 6 grup izin terstruktur (`PERMISSION_GROUPS`): Villa, Booking, Pengguna & RBAC, Maintenance, CMS, dan Sistem.
  - Helper: `getUserPermissions(user)`, `hasUserPermission(user, permission)`, `getRoleDefaultPermissions(role)`.
- **Server-Side Route Guard (`src/lib/auth-guard.ts` - `requirePagePermission`)**:
  - Melindungi setiap halaman dashboard (`/dashboard/users`, `/dashboard/villas`, `/dashboard/bookings`, `/dashboard/settings`) dari pengetikan URL langsung (*Direct URL Access*).
  - Jika akun dinonaktifkan $\rightarrow$ langsung redirect ke `/login?error=deactivated`.
  - Jika akun tidak memiliki izin $\rightarrow$ langsung redirect ke `/dashboard?denied={permission}` disertai banner peringatan akses terbatas.
- **Sidebar Dinamis (`src/components/dashboard/sidebar.tsx` & `dashboard-layout.tsx`)**:
  - Membaca live permissions pengguna dari database di layout server.
  - Menu hanya ditampilkan jika user memiliki izin yang diaktifkan oleh admin.
  - Header kategori (seperti CMS atau Sistem) otomatis disembunyikan jika tidak ada menu aktif di dalamnya.
- **Proteksi Akun Dinonaktifkan (`isActive: false`)**:
  - **Login**: `src/lib/auth.ts` melempar error `ACCOUNT_DEACTIVATED` dan `/login` menampilkan peringatan akun dinonaktifkan.
  - **Sesi Aktif**: `src/app/dashboard/layout.tsx` memeriksa live `dbUser.isActive`. Begitu dinonaktifkan, klik/refresh berikutnya langsung memutus sesi dan me-redirect ke login.
  - **Reservasi Booking**: `src/app/api/bookings/route.ts` memblokir pemesanan jika user yang login dinonaktifkan atau jika tamu publik memasukkan email yang terdaftar sebagai akun nonaktif.
  - **Proteksi Diri Admin**: Admin tidak dapat menonaktifkan akun sendiri, menghapus akun sendiri, atau mencabut role admin dari dirinya sendiri.
- **Frontend Dashboard Pengguna (`/dashboard/users`)**:
  - UI minimalis serasi dashboard: `#f8f7f4`, `#1a1a2e`, border `#e8e6df`, aksen `#C8A44E`.
  - 4 Kartu metrik: Total Pengguna, Staf Aktif, Tamu, Akun Nonaktif.
  - Modal Form RBAC: Tabbed form (Informasi Akun + Matriks RBAC Checkbox per grup dengan tombol Pilih Semua / Preset Role Default).
  - Toggle status aktif/nonaktif instan langsung di baris tabel.

---

## 15. Modul CMS & Branding Terpadu (Role MARKETING & Granular RBAC)

Sistem CMS lengkap dirancang khusus untuk tim **Marketing** (dan pengguna dengan izin `cms:read` / `cms:update`):

1. **Sub-Modul 1: Hero, Branding & Desain Web (`/dashboard/cms/hero`)**:
   - **Backend API**: `GET /api/cms/hero` & `PUT /api/cms/hero` (didukung proteksi `cms:update` tanpa membuka kunci rekening bank sensitif).
   - **Fitur Desain**:
     - Media Hero: Video YouTube looping background & Cover Image fallback.
     - Headline Copy: Tagline, Judul Baris 1, Kata Beraksen Miring Emas (*Italic Accent Line 2*), Subjudul.
     - Tipografi Google Dinamis: Font Display (`Playfair Display`, `Cormorant Garamond`, `Libre Baskerville`, `Lora`, `Merriweather`, `Crimson Text`) dan Font Body (`DM Sans`, `Inter`, `Poppins`, `Open Sans`, `Nunito`, `Work Sans`) yang di-inject via `src/components/DynamicFont.tsx`.
     - Palet Warna & Preset 1-Klik: Primary (`primary_color`), Secondary Aksen Emas (`secondary_color`), dan Overlay Accent.
     - Counter Statistik & CTA: Counter Properti, Tamu, Rating, dan teks ajakan bertindak banner CTA.
   - **Live Preview Card**: Pratinjau interaktif real-time di sisi kanan layar sebelum perubahan disimpan.

2. **Sub-Modul 2: Artikel & Blog SEO-Ready (`/dashboard/cms/articles`)**:
   - **Database Model**: `model articles` di `prisma/schema.prisma` (`title`, `slug`, `excerpt`, `content`, `coverImage`, `category`, `tags`, `metaTitle`, `metaDescription`, `isPublished`, `publishedAt`, `authorId`).
   - **Backend API**: CRUD di `/api/cms/articles`, `/api/cms/articles/[id]`, dan toggle publikasi instan di `/api/cms/articles/[id]/publish`.
   - **Fitur SEO Google**: Pratinjau hasil pencarian Google (*SERP Snippet*), indikator panjang karakter Meta Title (50-60 kar) & Meta Description (120-160 kar), serta Tag kata kunci.
   - **Halaman Publik**:
     - `/artikel`: Katalog publik bergaya majalah editorial elegan dengan filter kategori dan pencarian.
     - `/artikel/[slug]`: Halaman artikel lengkap dengan `generateMetadata` dinamis, schema JSON-LD `BlogPosting`, estimasi waktu baca, dan rekomendasi artikel terkait.

3. **Sub-Modul 3: Pop-up Promo & Pengumuman Publik (`/dashboard/cms/popups`)**:
   - **Database Model**: `model popups` di `prisma/schema.prisma` (`title`, `subtitle`, `imageUrl`, `badge`, `actionLabel`, `actionUrl`, `isActive`, `startDate`, `endDate`).
   - **Backend API**: CRUD di `/api/cms/popups`, `/api/cms/popups/[id]`, toggle `/api/cms/popups/[id]/status`, dan public endpoint `/api/public/popups`.
   - **Komponen Publik (`src/components/public/public-announcement-popup.tsx`)**:
     - Disematkan di `src/app/(public)/layout.tsx`.
     - Menampilkan banner gambar, promo badge, CTA button, dan backdrop blur halus setelah jeda non-intrusif ~2.5 detik.
     - Dilengkapi memory penutupan di `sessionStorage` (`dismissed_popup_{id}`) agar tidak mengganggu pengunjung berulang kali dalam sesi yang sama.

4. **Sub-Modul 4: Kurasi Testimoni Tamu (`/dashboard/cms/testimonials`)**:
   - **Backend API**: CRUD di `/api/cms/testimonials`, `/api/cms/testimonials/[id]`, dan toggle instan `/api/cms/testimonials/[id]/featured`.
   - **Fitur**: Rating 1-5 bintang interaktif, relasi unit villa terkait, avatar foto tamu, dan 1-klik switch **"Tampilkan di Beranda (Featured)"** yang langsung tersinkron ke beranda utama.

5. **Sub-Modul 5: Manajemen Kode Promo (`/dashboard/cms/promos`)**:
   - **Backend API**: CRUD di `/api/cms/promos`, `/api/cms/promos/[id]`, dan toggle `/api/cms/promos/[id]/status`.
   - **Fitur**: Pembuatan voucher unik (% diskon, periode masa berlaku, status aktif), tombol salin kode satu-klik ("Tersalin!"), dan validasi langsung di alur checkout reservasi.




