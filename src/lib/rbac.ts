import { Role } from "@prisma/client";

export type Permission =
  // 1. Unit Villa & Properti
  | "villa:read"
  | "villa:create"
  | "villa:update"
  | "villa:status"
  | "villa:pricing"
  | "villa:addon"
  | "villa:delete"
  // 2. Reservasi & Transaksi Tamu
  | "booking:read"
  | "booking:create"
  | "booking:update"
  | "booking:assign"
  | "booking:export"
  | "booking:delete"
  // 3. Konten & Promosi (CMS)
  | "cms:read"
  | "cms:update"
  | "cms:hero"
  | "cms:about"
  | "cms:articles"
  | "cms:popups"
  | "cms:testimonials"
  | "cms:promos"
  // 4. Housekeeping & Maintenance
  | "maintenance:read"
  | "maintenance:create"
  | "maintenance:update"
  // 5. Laporan & Analitik Keuangan
  | "reports:view"
  | "reports:export"
  // 6. Manajemen Pengguna & Tim
  | "user:read"
  | "user:create"
  | "user:update"
  | "user:status"
  | "user:delete"
  // 7. Pengaturan Sistem & Rekening
  | "settings:read"
  | "settings:update"
  | "settings:payment"
  // 8. Log Audit & Keamanan
  | "activity:view";

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  iconName: string;
  badgeColor: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "villas",
    name: "Unit Villa & Fasilitas",
    description: "Pengelolaan katalog villa, spesifikasi, galeri foto, dynamic pricing, dan add-on",
    iconName: "Building2",
    badgeColor: "emerald",
    permissions: [
      { key: "villa:read", label: "Lihat Katalog Villa", description: "Melihat daftar unit villa, spesifikasi, dan status kesiapan" },
      { key: "villa:create", label: "Tambah Unit Villa", description: "Mendaftarkan unit properti villa baru ke dalam sistem" },
      { key: "villa:update", label: "Edit Spesifikasi & Galeri", description: "Mengubah spesifikasi, foto galeri, watermark R2, house rules, dan embed Maps" },
      { key: "villa:status", label: "Ubah Status Kesiapan", description: "Cepat mengganti status unit (Ready, Cleaning, Maintenance, Unavailable)" },
      { key: "villa:pricing", label: "Atur Tarif Dinamis", description: "Mengatur tarif akhir pekan (weekend) dan rentang tanggal harga khusus liburan" },
      { key: "villa:addon", label: "Kelola Fasilitas Ekstra", description: "Mengatur add-on berbayar (Extra Bed, BBQ Grill, Flooties Flamingo, Floating Breakfast)" },
      { key: "villa:delete", label: "Hapus Unit Villa", description: "Menghapus data unit villa yang belum memiliki catatan transaksi" },
    ],
  },
  {
    id: "bookings",
    name: "Reservasi & Transaksi Tamu",
    description: "Pengelolaan alur pesanan tamu, verifikasi pembayaran, penetapan staf, dan invoice PDF",
    iconName: "CalendarDays",
    badgeColor: "blue",
    permissions: [
      { key: "booking:read", label: "Lihat Reservasi", description: "Melihat riwayat booking, kalender kedatangan, dan detail pesanan tamu" },
      { key: "booking:create", label: "Buat Reservasi (Walk-in)", description: "Membuat reservasi langsung secara manual atas nama tamu" },
      { key: "booking:update", label: "Verifikasi Bayar & Status", description: "Konfirmasi bukti transfer (Approve/Reject dengan alasan) dan perbarui status pesanan" },
      { key: "booking:assign", label: "Tetapkan Staf Pendamping", description: "Menugaskan staf penanggung jawab operasional untuk menyambut tamu" },
      { key: "booking:export", label: "Unduh Invoice & Kirim Email", description: "Mengunduh berkas resmi PDF Voucher & Invoice serta kirim ulang email notifikasi tamu" },
      { key: "booking:delete", label: "Batalkan Booking", description: "Membatalkan atau menghapus riwayat reservasi tamu" },
    ],
  },
  {
    id: "cms",
    name: "Konten & Promosi (CMS)",
    description: "Pengelolaan materi branding, blog artikel SEO, voucher promo, pengumuman, dan ulasan tamu",
    iconName: "Palette",
    badgeColor: "indigo",
    permissions: [
      { key: "cms:hero", label: "Hero, Logo & Desain Web", description: "Mengatur headline hero, background video looping, logo brand, tipografi, dan palet warna" },
      { key: "cms:about", label: "Halaman Tentang Kami", description: "Mengelola cerita brand, visi & misi, nilai layanan, dan galeri fasilitas resort" },
      { key: "cms:articles", label: "Artikel Blog & SEO", description: "Menulis artikel editorial, mengatur kategori/tag, pratinjau Google SERP, dan publikasi blog" },
      { key: "cms:popups", label: "Pop-up Promo & Pengumuman", description: "Membuat banner pop-up beranda dengan waktu tayang otomatis dan tombol CTA" },
      { key: "cms:testimonials", label: "Kurasi Testimoni Tamu", description: "Mengelola ulasan rating 1-5 bintang dan memilih testimoni unggulan di beranda" },
      { key: "cms:promos", label: "Kode Promo & Voucher", description: "Membuat kode voucher diskon (% potongan harga), kuota penggunaan, dan masa berlaku" },
      { key: "cms:read", label: "Akses Baca Seluruh CMS", description: "Izin umum untuk melihat seluruh modul materi konten dan promosi" },
      { key: "cms:update", label: "Akses Penuh Kelola CMS", description: "Izin umum untuk mengedit seluruh modul konten, banner, artikel, dan promo" },
    ],
  },
  {
    id: "maintenance",
    name: "Housekeeping & Maintenance",
    description: "Tugas pembersihan unit, perbaikan fasilitas kamar, sanitasi kolam renang, dan checklist kerja",
    iconName: "Wrench",
    badgeColor: "amber",
    permissions: [
      { key: "maintenance:read", label: "Lihat Tugas Maintenance", description: "Melihat antrean tugas kebersihan, linen, kolam renang, dan perbaikan unit" },
      { key: "maintenance:create", label: "Buat Tiket Tugas", description: "Menerbitkan instruksi tugas pembersihan atau perbaikan untuk tim lapangan" },
      { key: "maintenance:update", label: "Checklist & Selesaikan Tugas", description: "Memperbarui progres checklist dan menandai tugas selesai dikerjakan" },
    ],
  },
  {
    id: "reports",
    name: "Laporan & Analitik Keuangan",
    description: "Analisis performa bisnis, kalkulasi omzet, ringkasan transaksi, dan ekspor dokumen resmi",
    iconName: "FileText",
    badgeColor: "cyan",
    permissions: [
      { key: "reports:view", label: "Lihat Laporan Keuangan", description: "Menganalisis metrik omzet, total booking, estimasi pendapatan bersih, dan grafik performa" },
      { key: "reports:export", label: "Ekspor Laporan PDF & CSV", description: "Mengunduh laporan keuangan resmi berlogo dalam format A4 landscape PDF dan file CSV" },
    ],
  },
  {
    id: "users",
    name: "Pengguna & Tim (RBAC)",
    description: "Pengelolaan staf, tamu, aktivasi akun, dan granular izin matriks sistem",
    iconName: "Users",
    badgeColor: "violet",
    permissions: [
      { key: "user:read", label: "Lihat Pengguna & Tim", description: "Melihat direktori seluruh staf, admin, manajer, dan tamu publik" },
      { key: "user:create", label: "Tambah Pengguna Baru", description: "Mendaftarkan akun staf atau akun pengguna baru ke sistem" },
      { key: "user:update", label: "Kelola Profil & RBAC", description: "Mengatur izin akses (RBAC), peran utama, dan data profil pengguna" },
      { key: "user:status", label: "Aktivasi & Deaktivasi Akun", description: "Mengaktifkan atau memutus sesi login akun pengguna yang bermasalah" },
      { key: "user:delete", label: "Hapus Akun Pengguna", description: "Menghapus akun pengguna dari database (dengan proteksi admin)" },
    ],
  },
  {
    id: "settings",
    name: "Pengaturan Sistem & Rekening",
    description: "Konfigurasi identitas brand, nomor rekening transfer bank tujuan, dan pembersihan cache",
    iconName: "Settings",
    badgeColor: "slate",
    permissions: [
      { key: "settings:read", label: "Lihat Pengaturan Situs", description: "Melihat konfigurasi umum situs dan informasi kontak bisnis" },
      { key: "settings:update", label: "Ubah Konfigurasi Situs", description: "Mengatur identitas brand, kontak hotline, alamat, watermark, dan membersihkan cache Vercel" },
      { key: "settings:payment", label: "Kelola Rekening Bank Transfer", description: "Menambah, mengubah, dan mengaktifkan nomor rekening bank transfer tujuan (BCA, Mandiri, dll)" },
    ],
  },
  {
    id: "activity",
    name: "Log Audit & Keamanan",
    description: "Rekam jejak audit mutasi aktivitas staf untuk kepatuhan dan pengawasan operasional",
    iconName: "Activity",
    badgeColor: "rose",
    permissions: [
      { key: "activity:view", label: "Lihat Log Audit Mutasi", description: "Memantau jejak audit aktivitas staf (perubahan konfigurasi, approval transfer, dsb)" },
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((p) => p.key)
);

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  MANAJER: [
    // Villa
    "villa:read",
    "villa:status",
    "villa:pricing",
    "villa:addon",
    // Booking
    "booking:read",
    "booking:create",
    "booking:update",
    "booking:assign",
    "booking:export",
    // Maintenance
    "maintenance:read",
    "maintenance:create",
    "maintenance:update",
    // CMS
    "cms:read",
    "cms:promos",
    "cms:testimonials",
    // Reports
    "reports:view",
    "reports:export",
    // Users
    "user:read",
    // Settings & Payment
    "settings:read",
    "settings:payment",
  ],
  MARKETING: [
    // Villa
    "villa:read",
    "villa:pricing",
    // Booking
    "booking:read",
    // CMS
    "cms:read",
    "cms:update",
    "cms:hero",
    "cms:about",
    "cms:articles",
    "cms:popups",
    "cms:testimonials",
    "cms:promos",
    // Reports
    "reports:view",
  ],
  MAINTENANCE: [
    // Villa
    "villa:read",
    "villa:status",
    // Booking
    "booking:read",
    // Maintenance
    "maintenance:read",
    "maintenance:create",
    "maintenance:update",
  ],
  GUEST: [],
};

/**
 * Mendapatkan daftar hak akses efektif dari seorang pengguna.
 * Jika pengguna memiliki konfigurasi permissions kustom di database (array tidak kosong),
 * maka konfigurasi tersebut yang digunakan. Jika kosong, fallback ke default izin role-nya.
 */
export function getUserPermissions(user: {
  role: Role;
  permissions?: string[] | null;
}): Permission[] {
  if (user.role === "ADMIN") {
    return ALL_PERMISSIONS;
  }
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions as Permission[];
  }
  return rolePermissions[user.role] ?? [];
}

/**
 * Mengecek apakah pengguna memiliki izin spesifik dengan dukungan inheritance hirarkis
 */
export function hasUserPermission(
  user: { role: Role; permissions?: string[] | null },
  permission: Permission
): boolean {
  if (user.role === "ADMIN") return true;
  const permissions = getUserPermissions(user);
  if (permissions.includes(permission)) return true;

  // Inheritance / Hierarchy mappings:
  if (permission.startsWith("cms:") && permissions.includes("cms:read")) return true;
  if (permission === "cms:read" && permissions.some((p) => p.startsWith("cms:"))) return true;
  if (permission.startsWith("cms:") && permissions.includes("cms:update")) return true;
  if (permission === "settings:payment" && permissions.includes("settings:update")) return true;
  if (
    permission === "settings:read" &&
    (permissions.includes("settings:update") || permissions.includes("settings:payment"))
  )
    return true;
  if (permission === "reports:export" && permissions.includes("reports:view")) return true;
  if (permission === "booking:export" && permissions.includes("booking:update")) return true;
  if (permission === "user:status" && permissions.includes("user:update")) return true;
  if (
    (permission === "villa:pricing" || permission === "villa:addon") &&
    permissions.includes("villa:update")
  )
    return true;

  return false;
}

/**
 * Mendapatkan izin default untuk sebuah role
 */
export function getRoleDefaultPermissions(role: Role): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Legacy role check (kompatibilitas backward)
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] ?? [];
}
