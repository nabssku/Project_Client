"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Shield,
  KeyRound,
  Check,
  RotateCcw,
  AlertCircle,
  CheckSquare,
  Square,
  Lock,
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

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPassword("");
      setRole(user.role || "GUEST");
      setIsActive(user.isActive !== false);
      // If user has permissions array, load them; otherwise load role defaults
      if (user.permissions && Array.isArray(user.permissions)) {
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
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Handle role change -> optional quick reset to role default permissions
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    // If not editing or user confirms, set defaults
    setSelectedPermissions(getRoleDefaultPermissions(newRole));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-[#e8e6df] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#e8e6df] shrink-0 bg-[#faf9f6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C8A44E]/15 text-[#C8A44E] flex items-center justify-center font-bold text-sm shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#1a1a2e]">
                {isEditing ? `Edit Pengguna: ${user?.name}` : "Tambah Pengguna Baru"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isEditing
                  ? "Atur informasi akun, status aktivasi, dan rincian izin akses (RBAC)"
                  : "Daftarkan akun staf atau tamu baru dan tetapkan peran serta hak akses"}
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
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-[#e8e6df] shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "info"
                ? "border-[#1a1a2e] text-[#1a1a2e]"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <span>Informasi & Akun</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rbac")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "rbac"
                ? "border-[#1a1a2e] text-[#1a1a2e]"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <span>Hak Akses & RBAC</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {selectedPermissions.length}
            </span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form id="user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
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
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E] transition-all"
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
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E] transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEditing ? "Kata Sandi Baru (Opsional)" : "Kata Sandi"} {!isEditing && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required={!isEditing}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEditing ? "Kosongkan jika tidak ingin mengubah kata sandi" : "Minimal 6 karakter"}
                    className="w-full h-10 pl-3.5 pr-10 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E] transition-all"
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
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E] transition-all"
                >
                  <option value="ADMIN">ADMIN — Hak Kontrol Bisnis Penuh</option>
                  <option value="MANAJER">MANAJER — Operasional & Verifikasi Booking</option>
                  <option value="MARKETING">MARKETING — CMS Promo, Testimoni & Diskon</option>
                  <option value="MAINTENANCE">MAINTENANCE — Housekeeping & Pemeliharaan</option>
                  <option value="GUEST">GUEST — Tamu / Pengguna Publik</option>
                </select>
                {isSelf && role === "ADMIN" && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Anda sedang mengedit akun Anda sendiri; peran Administrator tidak dapat diturunkan.
                  </p>
                )}
              </div>

              {/* Status Akun (Aktif / Nonaktif) */}
              <div className="pt-2">
                <div className={`p-4 rounded-xl border transition-all ${
                  isActive ? "bg-emerald-50/50 border-emerald-200/80" : "bg-rose-50/50 border-rose-200/80"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="text-xs font-bold text-[#1a1a2e]">
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
            /* Tab RBAC Matrix */
            <div className="space-y-5">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#faf9f6] border border-[#e8e6df]">
                <div className="text-xs text-slate-600">
                  Total Izin Terpilih: <strong className="text-[#1a1a2e]">{selectedPermissions.length}</strong> / {ALL_PERMISSIONS.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyRoleDefaults}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-[#e8e6df] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3 text-[#C8A44E]" />
                    <span>Default {role}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-[#e8e6df] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3 h-3 text-emerald-600" />
                    <span>Pilih Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPermissions}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-[#e8e6df] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <Square className="w-3 h-3 text-slate-400" />
                    <span>Kosongkan</span>
                  </button>
                </div>
              </div>

              {/* Grouped Permissions */}
              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => {
                  const groupKeys = group.permissions.map((p) => p.key);
                  const selectedInGroup = groupKeys.filter((k) =>
                    selectedPermissions.includes(k)
                  ).length;
                  const allInGroupSelected = selectedInGroup === groupKeys.length;

                  return (
                    <div
                      key={group.id}
                      className="rounded-xl border border-[#e8e6df] bg-white overflow-hidden shadow-2xs"
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#faf9f6] border-b border-[#e8e6df]">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#1a1a2e]">
                              {group.name}
                            </h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700">
                              {selectedInGroup} / {groupKeys.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {group.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleGroup(groupKeys)}
                          className="text-[11px] font-medium text-slate-600 hover:text-[#1a1a2e] transition-colors"
                        >
                          {allInGroupSelected ? "Lepas Semua" : "Pilih Semua"}
                        </button>
                      </div>

                      {/* Group Checkboxes Grid */}
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.permissions.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                                isChecked
                                  ? "bg-[#C8A44E]/8 border-[#C8A44E]/40"
                                  : "bg-white border-transparent hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.key)}
                                className="mt-0.5 rounded text-[#C8A44E] focus:ring-[#C8A44E] w-3.5 h-3.5"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[#1a1a2e] leading-tight">
                                  {perm.label}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
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
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-[#e8e6df] shrink-0 bg-[#faf9f6]">
          <div className="text-[11px] text-slate-500">
            {activeTab === "info" ? (
              <button
                type="button"
                onClick={() => setActiveTab("rbac")}
                className="text-[#C8A44E] font-semibold hover:underline"
              >
                Lanjut ke Konfigurasi RBAC ({selectedPermissions.length} izin) &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className="text-slate-600 font-semibold hover:underline"
              >
                &larr; Kembali ke Informasi Akun
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
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1a1a2e] text-white hover:bg-[#12121f] transition-colors flex items-center gap-2 shadow-xs"
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
