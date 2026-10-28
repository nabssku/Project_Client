"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  Shield,
  ShieldCheck,
  KeyRound,
  Check,
  RotateCcw,
  AlertCircle,
  CheckSquare,
  Square,
  Lock,
  Search,
  CheckCheck,
  Sparkles,
  SlidersHorizontal,
  UserCog,
  User,
  Building2,
  CalendarDays,
  Palette,
  Wrench,
  FileText,
  Users,
  Settings,
  Activity,
  Info,
} from "lucide-react";
import {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  getRoleDefaultPermissions,
  type Permission,
} from "@/lib/rbac";
import type { Role } from "@prisma/client";

export interface UserFormData {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  isActive: boolean;
  permissions: string[];
}

interface UserFormModalProps {
  isOpen: boolean;
  user: UserFormData | null; // null = Add, non-null = Edit
  currentUserId: string;
  onClose: () => void;
  onSuccess: (savedUser: any) => void;
}

const GROUP_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    bg: string;
    text: string;
    badge: string;
    border: string;
    accentBar: string;
  }
> = {
  villas: {
    icon: Building2,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    border: "border-emerald-200",
    accentBar: "bg-emerald-600",
  },
  bookings: {
    icon: CalendarDays,
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    border: "border-blue-200",
    accentBar: "bg-blue-600",
  },
  cms: {
    icon: Palette,
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    border: "border-indigo-200",
    accentBar: "bg-indigo-600",
  },
  maintenance: {
    icon: Wrench,
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    border: "border-amber-200",
    accentBar: "bg-amber-600",
  },
  reports: {
    icon: FileText,
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
    border: "border-cyan-200",
    accentBar: "bg-cyan-600",
  },
  users: {
    icon: Users,
    bg: "bg-violet-50",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-800 border-violet-200",
    border: "border-violet-200",
    accentBar: "bg-violet-600",
  },
  settings: {
    icon: Settings,
    bg: "bg-slate-100",
    text: "text-slate-700",
    badge: "bg-slate-200 text-slate-800 border-slate-300",
    border: "border-slate-200",
    accentBar: "bg-slate-700",
  },
  activity: {
    icon: Activity,
    bg: "bg-rose-50",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    border: "border-rose-200",
    accentBar: "bg-rose-600",
  },
};

const ROLE_PRESETS: { role: Role; label: string; count: number; desc: string }[] = [
  { role: "ADMIN", label: "ADMIN", count: 35, desc: "Akses Superuser Penuh" },
  { role: "MANAJER", label: "MANAJER", count: 20, desc: "Operasional, Reservasi & Rekening" },
  { role: "MARKETING", label: "MARKETING", count: 11, desc: "CMS, Promo & Analitik" },
  { role: "MAINTENANCE", label: "MAINTENANCE", count: 5, desc: "Housekeeping & Pemeliharaan" },
  { role: "GUEST", label: "GUEST", count: 0, desc: "Tamu Publik" },
];

export function UserFormModal({
  isOpen,
  user,
  currentUserId,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const isEditing = Boolean(user?.id);
  const isSelf = isEditing && user?.id === currentUserId;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("GUEST");
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "rbac">("info");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPassword("");
      setRole(user.role || "GUEST");
      setIsActive(user.isActive !== false);
      if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
        setSelectedPermissions(user.permissions);
      } else {
        setSelectedPermissions(getRoleDefaultPermissions(user.role || "GUEST"));
      }
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("GUEST");
      setIsActive(true);
      setSelectedPermissions(getRoleDefaultPermissions("GUEST"));
    }
    setErrorMessage("");
    setActiveTab("info");
    setSearchQuery("");
  }, [user, isOpen]);

  // Determine current active preset
  const activePreset = useMemo(() => {
    for (const preset of ROLE_PRESETS) {
      const defaultPerms = getRoleDefaultPermissions(preset.role);
      if (
        selectedPermissions.length === defaultPerms.length &&
        defaultPerms.every((p) => selectedPermissions.includes(p))
      ) {
        return preset.role;
      }
    }
    return null;
  }, [selectedPermissions]);

  // Filter groups and permissions based on search query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return PERMISSION_GROUPS;

    return PERMISSION_GROUPS.map((group) => {
      const matchesGroup =
        group.name.toLowerCase().includes(q) ||
        group.description.toLowerCase().includes(q);

      const matchingPermissions = group.permissions.filter(
        (perm) =>
          matchesGroup ||
          perm.label.toLowerCase().includes(q) ||
          perm.description.toLowerCase().includes(q) ||
          perm.key.toLowerCase().includes(q)
      );

      return {
        ...group,
        permissions: matchingPermissions,
      };
    }).filter((group) => group.permissions.length > 0);
  }, [searchQuery]);

  const totalFilteredPermissions = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.permissions.length, 0);
  }, [filteredGroups]);

  if (!isOpen) return null;

  // Handle role change -> optional quick reset to role default permissions
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setSelectedPermissions(getRoleDefaultPermissions(newRole));
  };

  const handleApplyPreset = (targetRole: Role) => {
    setSelectedPermissions(getRoleDefaultPermissions(targetRole));
  };

  const handleApplyRoleDefaults = () => {
    setSelectedPermissions(getRoleDefaultPermissions(role));
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissions([...ALL_PERMISSIONS]);
  };

  const handleClearPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleTogglePermission = (key: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleToggleGroup = (groupKeys: Permission[]) => {
    const allSelected = groupKeys.every((k) => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !groupKeys.includes(p as Permission))
      );
    } else {
      const merged = new Set([...selectedPermissions, ...groupKeys]);
      setSelectedPermissions(Array.from(merged));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        isActive,
        permissions: selectedPermissions,
      };

      if (!isEditing) {
        if (!password || password.length < 6) {
          throw new Error("Password wajib diisi minimal 6 karakter untuk pengguna baru");
        }
        payload.password = password;
      } else if (password && password.trim().length > 0) {
        if (password.trim().length < 6) {
          throw new Error("Password baru minimal 6 karakter");
        }
        payload.password = password.trim();
      }

      const url = isEditing ? `/api/users/${user?.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan data pengguna");
      }

      onSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-[#e8e6df] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#e8e6df] shrink-0 bg-[#faf9f6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-accent/25">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-bold text-primary">
                  {isEditing ? `Edit Pengguna: ${user?.name}` : "Tambah Pengguna Baru"}
                </h2>
                {isEditing && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-semibold hidden sm:inline-block">
                    {user?.email}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isEditing
                  ? "Atur informasi akun, status aktivasi, dan konfigurasi izin akses Role-Based (RBAC)"
                  : "Daftarkan akun staf baru dan tetapkan peran serta matriks izin operasional"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-7 pt-3 border-b border-[#e8e6df] shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "info"
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            <span>Informasi Akun</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rbac")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "rbac"
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hak Akses & RBAC</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                selectedPermissions.length === ALL_PERMISSIONS.length
                  ? "bg-accent/20 text-accent-dark font-black"
                  : selectedPermissions.length > 0
                  ? "bg-primary/10 text-primary"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {selectedPermissions.length} / {ALL_PERMISSIONS.length}
            </span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-5 sm:mx-7 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form
          id="user-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6"
        >
          {activeTab === "info" ? (
            <div className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rina Wahyuni"
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEditing ? "Kata Sandi Baru (Opsional)" : "Kata Sandi"}{" "}
                  {!isEditing && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required={!isEditing}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isEditing
                        ? "Kosongkan jika tidak ingin mengubah kata sandi"
                        : "Minimal 6 karakter"
                    }
                    className="w-full h-10 pl-3.5 pr-10 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
                {isEditing && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Biarkan kosong jika kata sandi saat ini tetap ingin digunakan.
                  </p>
                )}
              </div>

              {/* Peran / Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran Utama (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  disabled={isSelf && role === "ADMIN"}
                  onChange={(e) => handleRoleChange(e.target.value as Role)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                >
                  <option value="ADMIN">ADMIN — Hak Kontrol Bisnis Penuh (Superuser, 35 Izin)</option>
                  <option value="MANAJER">MANAJER — Operasional, Verifikasi Tamu & Rekening (20 Izin)</option>
                  <option value="MARKETING">MARKETING — CMS Promo, Banner, Artikel & Diskon (11 Izin)</option>
                  <option value="MAINTENANCE">MAINTENANCE — Housekeeping, Linen & Pemeliharaan (5 Izin)</option>
                  <option value="GUEST">GUEST — Tamu / Pengguna Publik (3 Izin)</option>
                </select>

                {isSelf && role === "ADMIN" && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Proteksi keamanan: Anda sedang mengedit akun sendiri, peran Administrator tidak dapat diturunkan.
                  </p>
                )}

                {/* Role Description Card */}
                <div className="mt-2.5 p-3 rounded-xl bg-[#faf9f6] border border-[#e8e6df] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-slate-600">
                      Peran <strong>{role}</strong> memiliki standar default{" "}
                      <strong>{getRoleDefaultPermissions(role).length} izin akses</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("rbac")}
                    className="text-[11px] font-semibold text-accent hover:underline shrink-0"
                  >
                    Sesuaikan Izin RBAC &rarr;
                  </button>
                </div>
              </div>

              {/* Status Akun (Aktif / Nonaktif) */}
              <div className="pt-1">
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? "bg-emerald-50/50 border-emerald-200/80"
                      : "bg-rose-50/50 border-rose-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        <span className="text-xs font-bold text-primary">
                          Status Akun: {isActive ? "Aktif" : "Dinonaktifkan"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-md">
                        {isActive
                          ? "Pengguna dapat login dan mengakses dashboard/fitur sesuai izin yang diberikan."
                          : "Pengguna TIDAK BISA login ke sistem, diputus dari sesi aktif, dan tidak bisa memesan villa."}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isSelf ? "opacity-50 cursor-not-allowed" : ""
                      } ${isActive ? "bg-emerald-600" : "bg-slate-300"}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {isSelf && (
                    <p className="text-[11px] text-slate-400 mt-2 italic">
                      Proteksi keamanan: Anda tidak dapat menonaktifkan akun sendiri.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Hak Akses & RBAC */
            <div className="space-y-5">
              {/* Administrator Superuser Callout */}
              {role === "ADMIN" && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="leading-relaxed">
                    <div className="font-bold text-amber-950">
                      Akun Berperan Administrator (Akses Penuh / Superuser)
                    </div>
                    <div className="text-[11px] text-amber-800/90 mt-0.5">
                      Pengguna dengan peran ADMIN secara otomatis memiliki hak bypass ke seluruh 35 modul fitur sistem.
                      Pengaturan izin di bawah disimpan sebagai profil izin spesifik jika peran pengguna diubah di masa depan.
                    </div>
                  </div>
                </div>
              )}

              {/* 1-Click Role Presets Bar */}
              <div className="p-3.5 rounded-xl bg-[#faf9f6] border border-[#e8e6df] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
                    <span>Terapkan Preset Peran Cepat:</span>
                  </span>
                  {activePreset ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                      Sesuai Preset {activePreset}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                      Konfigurasi Kustom ({selectedPermissions.length} Izin)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PRESETS.map((preset) => {
                    const isCurrent = activePreset === preset.role;
                    return (
                      <button
                        key={preset.role}
                        type="button"
                        onClick={() => handleApplyPreset(preset.role)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isCurrent
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-white text-slate-700 border-[#e8e6df] hover:border-slate-400 hover:bg-slate-50"
                        }`}
                        title={preset.desc}
                      >
                        <span>{preset.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isCurrent
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {preset.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search & Actions Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#e8e6df] shadow-2xs">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari fitur atau kode izin (contoh: promo, pricing, voucher, rekening, audit)..."
                    className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-[#e8e6df] bg-[#faf9f6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Batch Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleApplyRoleDefaults}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white border border-[#e8e6df] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    title={`Kembalikan ke default peran ${role}`}
                  >
                    <RotateCcw className="w-3 h-3 text-accent" />
                    <span className="hidden sm:inline">Default {role}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white border border-[#e8e6df] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                    <span>Pilih Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPermissions}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white border border-[#e8e6df] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <Square className="w-3 h-3 text-slate-400" />
                    <span>Kosongkan</span>
                  </button>
                </div>
              </div>

              {/* Search result indicator */}
              {searchQuery && (
                <div className="text-[11px] text-slate-500 px-1">
                  Menampilkan <strong>{totalFilteredPermissions}</strong> izin yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                </div>
              )}

              {/* Grouped Permissions Grid */}
              {filteredGroups.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-[#e8e6df] bg-[#faf9f6]">
                  <Search className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    Tidak ada hak akses yang cocok dengan &ldquo;{searchQuery}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-xs text-accent font-semibold hover:underline"
                  >
                    Bersihkan pencarian
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGroups.map((group) => {
                    const groupConfig =
                      GROUP_CONFIG[group.id] || GROUP_CONFIG.settings;
                    const GroupIcon = groupConfig.icon;

                    const allGroupKeys = group.permissions.map((p) => p.key);
                    const selectedInGroup = allGroupKeys.filter((k) =>
                      selectedPermissions.includes(k)
                    ).length;
                    const allInGroupSelected =
                      allGroupKeys.length > 0 &&
                      selectedInGroup === allGroupKeys.length;
                    const percentSelected =
                      allGroupKeys.length > 0
                        ? (selectedInGroup / allGroupKeys.length) * 100
                        : 0;

                    return (
                      <div
                        key={group.id}
                        className="rounded-xl border border-[#e8e6df] bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        {/* Group Header */}
                        <div className="p-3 sm:px-4 sm:py-3 bg-[#faf9f6] border-b border-[#e8e6df]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg ${groupConfig.bg} ${groupConfig.text} flex items-center justify-center shrink-0 border ${groupConfig.border}`}
                              >
                                <GroupIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs font-bold text-primary truncate">
                                    {group.name}
                                  </h4>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${groupConfig.badge}`}
                                  >
                                    {selectedInGroup} / {allGroupKeys.length}
                                  </span>
                                </div>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-md">
                                  {group.description}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleGroup(allGroupKeys)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-primary hover:bg-slate-200/60 rounded-md transition-colors shrink-0"
                            >
                              {allInGroupSelected ? "Lepas Semua" : "Pilih Semua"}
                            </button>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden mt-2.5">
                            <div
                              className={`h-full transition-all duration-300 ${groupConfig.accentBar}`}
                              style={{ width: `${percentSelected}%` }}
                            />
                          </div>
                        </div>

                        {/* Group Permissions Grid */}
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                          {group.permissions.map((perm) => {
                            const isChecked = selectedPermissions.includes(perm.key);
                            return (
                              <label
                                key={perm.key}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                                  isChecked
                                    ? "bg-accent/8 border-accent/40 shadow-2xs"
                                    : "bg-white border-slate-200/80 hover:bg-slate-50/70 hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.key)}
                                  className="mt-0.5 rounded text-accent focus:ring-[#C8A44E] w-3.5 h-3.5 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="text-xs font-semibold text-primary leading-tight truncate">
                                      {perm.label}
                                    </div>
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                      {perm.key}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                                    {perm.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-t border-[#e8e6df] shrink-0 bg-[#faf9f6]">
          <div className="text-[11px] text-slate-500">
            {activeTab === "info" ? (
              <button
                type="button"
                onClick={() => setActiveTab("rbac")}
                className="text-accent font-semibold hover:underline flex items-center gap-1"
              >
                <span>Lanjut ke Hak Akses & RBAC ({selectedPermissions.length} Izin)</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className="text-slate-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>&larr;</span>
                <span>Kembali ke Informasi Akun</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="user-form"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-xs"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "Simpan Perubahan" : "Buat Pengguna"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
