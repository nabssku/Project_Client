import { Role } from "@prisma/client";

export type Permission =
  | "villa:read"
  | "villa:create"
  | "villa:update"
  | "villa:delete"
  | "villa:status"
  | "booking:read"
  | "booking:create"
  | "booking:update"
  | "booking:delete"
  | "booking:assign"
  | "user:read"
  | "user:create"
  | "user:update"
  | "user:delete"
  | "settings:read"
  | "settings:update"
  | "cms:read"
  | "cms:update"
  | "reports:view"
  | "activity:view"
  | "maintenance:read"
  | "maintenance:create"
  | "maintenance:update";

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "villas",
    name: "Unit Villa & Properti",
    description: "Pengelolaan katalog villa, tarif, galeri, dan ketersediaan",
    permissions: [
      { key: "villa:read", label: "Lihat Villa", description: "Melihat daftar dan rincian unit villa di dashboard" },
      { key: "villa:create", label: "Tambah Villa", description: "Membuat unit villa baru ke dalam sistem" },
      { key: "villa:update", label: "Edit Villa", description: "Mengubah spesifikasi, harga, foto, dan aturan villa" },
      { key: "villa:status", label: "Ubah Ketersediaan", description: "Mengganti status villa (Ready, Cleaning, Maintenance)" },
      { key: "villa:delete", label: "Hapus Villa", description: "Menghapus unit villa yang tidak memiliki riwayat booking" },
    ],
  },
  {
    id: "bookings",
    name: "Reservasi & Booking",
    description: "Pengelolaan alur pesanan tamu, verifikasi pembayaran, dan penetapan staf",
    permissions: [
      { key: "booking:read", label: "Lihat Reservasi", description: "Melihat riwayat booking dan kalender kedatangan" },
      { key: "booking:create", label: "Buat Reservasi", description: "Membuat booking langsung atas nama tamu" },
      { key: "booking:update", label: "Verifikasi & Status", description: "Konfirmasi bukti transfer dan perbarui status pesanan" },
      { key: "booking:assign", label: "Tetapkan Staf", description: "Menugaskan staf pendamping untuk menyambut tamu" },
      { key: "booking:delete", label: "Batalkan Booking", description: "Membatalkan atau menghapus data reservasi" },
    ],
  },
  {
    id: "users",
    name: "Pengguna & Hak Akses (RBAC)",
    description: "Pengelolaan staf, tamu, aktivasi akun, dan granular izin sistem",
    permissions: [
      { key: "user:read", label: "Lihat Pengguna", description: "Melihat daftar seluruh pengguna, staf, dan tamu" },
      { key: "user:create", label: "Tambah Pengguna", description: "Mendaftarkan staf baru atau akun pengguna" },
      { key: "user:update", label: "Edit Profil & RBAC", description: "Mengatur izin akses (RBAC) dan data pengguna" },
      { key: "user:delete", label: "Hapus & Nonaktifkan", description: "Menonaktifkan atau menghapus akun pengguna" },
    ],
  },
  {
    id: "maintenance",
    name: "Maintenance & Housekeeping",
    description: "Tugas pembersihan dan pemeliharaan fasilitas villa",
    permissions: [
      { key: "maintenance:read", label: "Lihat Maintenance", description: "Melihat daftar tugas kebersihan dan perbaikan" },
      { key: "maintenance:create", label: "Buat Tugas", description: "Membuat tugas maintenance baru untuk staf lapangan" },
      { key: "maintenance:update", label: "Update Status Tugas", description: "Menyelesaikan atau memperbarui progres checklist tugas" },
    ],
  },
  {
    id: "cms",
    name: "Konten & Promosi (CMS)",
    description: "Pengelolaan materi hero, testimoni ulasan tamu, dan kupon promo",
    permissions: [
      { key: "cms:read", label: "Lihat Konten CMS", description: "Melihat konten hero, daftar testimoni, dan kode promo" },
      { key: "cms:update", label: "Kelola CMS & Promo", description: "Mengubah banner, membuat kupon diskon, kurasi ulasan" },
    ],
  },
  {
    id: "system",
    name: "Sistem, Pengaturan & Audit",
    description: "Konfigurasi umum situs, rekening pembayaran, laporan, dan riwayat audit",
    permissions: [
      { key: "settings:read", label: "Lihat Pengaturan", description: "Melihat konfigurasi umum situs dan rekening transfer bank" },
      { key: "settings:update", label: "Ubah Pengaturan", description: "Mengubah identitas brand, kontak, dan rekening bank" },
      { key: "reports:view", label: "Lihat Laporan", description: "Melihat laporan analitik performa dan omzet bisnis" },
      { key: "activity:view", label: "Log Audit Sistem", description: "Melihat jejak audit mutasi aktivitas staf" },
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((p) => p.key)
);

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "villa:read",
    "villa:create",
    "villa:update",
    "villa:delete",
    "villa:status",
    "booking:read",
    "booking:create",
    "booking:update",
    "booking:delete",
    "booking:assign",
    "user:read",
    "user:create",
    "user:update",
    "user:delete",
    "settings:read",
    "settings:update",
    "cms:read",
    "cms:update",
    "reports:view",
    "activity:view",
    "maintenance:read",
    "maintenance:create",
    "maintenance:update",
  ],
  MANAJER: [
    "villa:read",
    "villa:status",
    "booking:read",
    "booking:create",
    "booking:update",
    "booking:assign",
    "user:read",
    "settings:read",
    "settings:update",
    "cms:read",
    "reports:view",
    "maintenance:read",
    "maintenance:create",
    "maintenance:update",
  ],
  MARKETING: [
    "villa:read",
    "booking:read",
    "cms:read",
    "cms:update",
    "reports:view",
  ],
  MAINTENANCE: [
    "villa:read",
    "villa:status",
    "booking:read",
    "maintenance:read",
    "maintenance:update",
  ],
  GUEST: [
    "villa:read",
    "booking:read",
    "booking:create",
  ],
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
 * Mengecek apakah pengguna memiliki izin spesifik
 */
export function hasUserPermission(
  user: { role: Role; permissions?: string[] | null },
  permission: Permission
): boolean {
  const permissions = getUserPermissions(user);
  return permissions.includes(permission);
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
