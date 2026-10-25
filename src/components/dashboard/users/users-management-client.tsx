"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Power,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  UserX,
  Lock,
  Layers,
} from "lucide-react";
import { UserFormModal, type UserFormData } from "./user-form-modal";
import { DeleteUserModal } from "./delete-user-modal";
import { getRoleDefaultPermissions } from "@/lib/rbac";
import type { Role } from "@prisma/client";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  isActive: boolean;
  permissions: string[];
  createdAt: string | Date;
  _count?: {
    bookings: number;
    maintenanceTasks: number;
  };
}

interface UsersManagementClientProps {
  initialUsers: UserItem[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export function UsersManagementClient({
  initialUsers,
  currentUser,
}: UsersManagementClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Toast / Notice
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form Modal (Add / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] =
    useState<UserFormData | null>(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Quick Status Toggle loading ID
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const staff = users.filter((u) => u.role !== "GUEST" && u.isActive).length;
    const guests = users.filter((u) => u.role === "GUEST").length;
    const deactivated = users.filter((u) => !u.isActive).length;
    return { total, staff, guests, deactivated };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "ALL" && u.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === "ACTIVE" && !u.isActive) {
        return false;
      }
      if (statusFilter === "INACTIVE" && u.isActive) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(query);
        const matchEmail = u.email.toLowerCase().includes(query);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Handle Add New
  const handleOpenAddModal = () => {
    setSelectedUserForEdit(null);
    setFormModalOpen(true);
  };

  // Handle Edit
  const handleOpenEditModal = (user: UserItem) => {
    setSelectedUserForEdit({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions || [],
    });
    setFormModalOpen(true);
  };

  // Handle Save (Add or Edit) success
  const handleFormSuccess = (savedUser: UserItem) => {
    setFormModalOpen(false);
    setSelectedUserForEdit(null);

    setUsers((prev) => {
      const exists = prev.some((u) => u.id === savedUser.id);
      if (exists) {
        return prev.map((u) => (u.id === savedUser.id ? { ...u, ...savedUser } : u));
      } else {
        return [savedUser, ...prev];
      }
    });

    showToast(
      "success",
      `Data pengguna "${savedUser.name}" berhasil disimpan.`
    );
    router.refresh();
  };

  // Handle Quick Toggle Status
  const handleToggleStatus = async (user: UserItem) => {
    if (user.id === currentUser.id) {
      showToast("error", "Anda tidak dapat menonaktifkan akun Anda sendiri.");
      return;
    }

    const nextStatus = !user.isActive;
    setTogglingId(user.id);

    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengubah status pengguna");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
      );

      showToast(
        "success",
        `Akun "${user.name}" berhasil di${nextStatus ? "aktifkan" : "nonaktifkan"}.`
      );
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Gagal memperbarui status akun");
    } finally {
      setTogglingId(null);
    }
  };

  // Handle Delete Modal
  const handleOpenDeleteModal = (user: UserItem) => {
    if (user.id === currentUser.id) {
      showToast("error", "Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    setUserToDelete(user);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menghapus pengguna");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setDeleteModalOpen(false);
      setUserToDelete(null);
      showToast("success", "Akun pengguna berhasil dihapus dari sistem.");
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Gagal menghapus pengguna");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1a1a2e] text-white tracking-wide">
            <Shield className="w-3 h-3 text-[#C8A44E]" />
            <span>ADMIN</span>
          </span>
        );
      case "MANAJER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            <span>MANAJER</span>
          </span>
        );
      case "MARKETING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span>MARKETING</span>
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
            <span>MAINTENANCE</span>
          </span>
        );
      case "GUEST":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
            <span>GUEST</span>
          </span>
        );
    }
  };

  const formatDate = (dateValue: string | Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateValue));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all animate-in slide-in-from-top-2 duration-200 ${
            toast.type === "success"
              ? "bg-white border-emerald-200 text-emerald-900"
              : "bg-white border-rose-200 text-rose-900"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
            {toast.message}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8e6df]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e] tracking-tight">
              Pengguna & Tim
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8A44E]/15 text-[#1a1a2e]">
              RBAC Aktif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola staf, tamu publik, granular izin fitur (RBAC), dan status aktivasi akun pengguna.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a2e] text-white hover:bg-[#12121f] text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4 text-[#C8A44E]" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e8e6df] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Pengguna</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-display text-[#1a1a2e] mt-2">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Akun terdaftar dalam database
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e8e6df] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Staf & Manajemen</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-display text-indigo-700 mt-2">
            {metrics.staff}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Admin, Manajer, Staf aktif
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e8e6df] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tamu (Guest)</span>
            <ShieldCheck className="w-4 h-4 text-[#C8A44E]" />
          </div>
          <div className="text-2xl font-bold font-display text-[#1a1a2e] mt-2">
            {metrics.guests}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Pelanggan pemesan villa
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e8e6df] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Akun Nonaktif</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-display text-rose-700 mt-2">
            {metrics.deactivated}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Akses login & booking diblokir
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#e8e6df] shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengguna berdasarkan nama atau email..."
            className="w-full h-10 pl-9 pr-8 text-xs rounded-xl border border-[#e8e6df] bg-[#faf9f6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#faf9f6] border border-[#e8e6df] rounded-xl text-xs overflow-x-auto">
            {["ALL", "ADMIN", "MANAJER", "MARKETING", "MAINTENANCE", "GUEST"].map(
              (r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all whitespace-nowrap ${
                    roleFilter === r
                      ? "bg-[#1a1a2e] text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:text-[#1a1a2e] hover:bg-slate-200/50"
                  }`}
                >
                  {r === "ALL" ? "Semua Peran" : r}
                </button>
              )
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-[#e8e6df] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 text-slate-700 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Hanya Aktif</option>
            <option value="INACTIVE">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-[#e8e6df] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e8e6df] bg-[#faf9f6] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Pengguna</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Izin Akses (RBAC)</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Terdaftar</th>
                <th className="py-3.5 px-4 text-right pr-4 sm:pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e6df] text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada pengguna yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba sesuaikan kata kunci pencarian atau filter status.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  const defaultRolePerms = getRoleDefaultPermissions(user.role);
                  const isDefaultMatch =
                    user.permissions &&
                    user.permissions.length === defaultRolePerms.length &&
                    user.permissions.every((p) => defaultRolePerms.includes(p as any));
                  const hasCustomPermissions = !isDefaultMatch;
                  const effectiveCount = user.permissions
                    ? user.permissions.length
                    : defaultRolePerms.length;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#faf9f6]/70 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#C8A44E]/15 text-[#1a1a2e] flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#1a1a2e] truncate max-w-[180px] sm:max-w-xs">
                                {user.name}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-xs">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>

                      {/* Permissions */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-[11px] font-medium transition-colors"
                          title="Klik untuk melihat dan mengubah izin akses"
                        >
                          <Layers className="w-3 h-3 text-[#C8A44E]" />
                          <span>
                            {hasCustomPermissions
                              ? `${effectiveCount} Izin (Kustom)`
                              : `${effectiveCount} Izin (Default)`}
                          </span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={isSelf || togglingId === user.id}
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            isSelf
                              ? "opacity-80 cursor-default"
                              : "hover:shadow-2xs cursor-pointer"
                          } ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100"
                          }`}
                          title={
                            isSelf
                              ? "Anda tidak dapat menonaktifkan akun sendiri"
                              : `Klik untuk me-${user.isActive ? "nonaktifkan" : "ngaktifkan"} akun`
                          }
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.isActive ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          />
                          <span>{user.isActive ? "Aktif" : "Nonaktif"}</span>
                        </button>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] hidden md:table-cell">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right pr-4 sm:pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-slate-500 hover:text-[#1a1a2e] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Akun & Izin RBAC"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Toggle Power */}
                          <button
                            type="button"
                            disabled={isSelf || togglingId === user.id}
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf
                                ? "text-slate-300 cursor-not-allowed"
                                : user.isActive
                                ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={
                              isSelf
                                ? "Proteksi akun sendiri"
                                : user.isActive
                                ? "Nonaktifkan Akun"
                                : "Aktifkan Akun"
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleOpenDeleteModal(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title={
                              isSelf
                                ? "Tidak dapat menghapus akun sendiri"
                                : "Hapus Akun Pengguna"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer count */}
        <div className="px-4 sm:px-6 py-3 bg-[#faf9f6] border-t border-[#e8e6df] text-[11px] text-slate-500 flex items-center justify-between">
          <div>
            Menampilkan <strong className="text-[#1a1a2e]">{filteredUsers.length}</strong> dari{" "}
            <strong className="text-[#1a1a2e]">{users.length}</strong> akun pengguna
          </div>
          <div className="text-slate-400">
            Perubahan izin & status langsung berlaku secara real-time
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <UserFormModal
        isOpen={formModalOpen}
        user={selectedUserForEdit}
        currentUserId={currentUser.id}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Modal */}
      <DeleteUserModal
        isOpen={deleteModalOpen}
        user={userToDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />
    </div>
  );
}
