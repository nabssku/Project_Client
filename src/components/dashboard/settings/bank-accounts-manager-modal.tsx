"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Edit2,
  Check,
  ShieldCheck,
  Power,
} from "lucide-react";
import { type BankAccount, DEFAULT_BANK_ACCOUNTS } from "@/lib/payment-config";

interface BankAccountsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (banks: BankAccount[]) => void;
}

const POPULAR_BANKS = [
  "Bank BCA",
  "Bank Mandiri",
  "Bank BRI",
  "Bank BNI",
  "Bank BSI",
  "Bank Jago",
  "Bank CIMB Niaga",
  "Bank Permata",
];

export function BankAccountsManagerModal({
  isOpen,
  onClose,
  onSaved,
}: BankAccountsManagerModalProps) {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form for adding a new bank
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBankName, setNewBankName] = useState("Bank BCA");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState(
    "PT Villa Hospitality"
  );
  const [newInstructions, setNewInstructions] = useState(
    "Transfer sesuai nominal total tagihan hingga digit terakhir"
  );

  // Fetch banks from API on open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    fetch("/api/config/payment")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.success && Array.isArray(data.banks)) {
          setBanks(data.banks);
        } else {
          setBanks(DEFAULT_BANK_ACCOUNTS);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Fetch banks error:", err);
        setBanks(DEFAULT_BANK_ACCOUNTS);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Add new bank handler
  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccountNumber.trim() || !newAccountHolder.trim()) {
      setError("Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi.");
      return;
    }

    const newAccount: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: newBankName.trim(),
      accountNumber: newAccountNumber.trim(),
      accountHolder: newAccountHolder.trim(),
      instructions: newInstructions.trim() || undefined,
      isActive: true,
    };

    setBanks((prev) => [...prev, newAccount]);
    setNewAccountNumber("");
    setShowAddForm(false);
    setError("");
  };

  // Toggle active/inactive
  const handleToggleActive = (id: string) => {
    setBanks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  // Delete bank
  const handleDeleteBank = (id: string) => {
    if (banks.length <= 1) {
      setError("Minimal harus ada 1 rekening bank di sistem.");
      return;
    }
    setBanks((prev) => prev.filter((b) => b.id !== id));
    setError("");
  };

  // Update bank field
  const handleUpdateField = (
    id: string,
    field: keyof BankAccount,
    value: string
  ) => {
    setBanks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  // Save changes to database (site_configs)
  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      if (banks.length === 0) {
        throw new Error("Minimal harus ada 1 rekening bank.");
      }

      // Check if all fields are filled
      for (let i = 0; i < banks.length; i++) {
        const b = banks[i];
        if (!b.bankName.trim() || !b.accountNumber.trim() || !b.accountHolder.trim()) {
          throw new Error(`Rekening #${i + 1} memiliki kolom yang masih kosong.`);
        }
      }

      const res = await fetch("/api/config/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banks }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan perubahan rekening.");
      }

      setSuccessMsg("Nomor rekening transfer berhasil disimpan ke database!");
      if (onSaved) onSaved(data.banks);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan rekening.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-cream/40 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
              Konfigurasi Sistem Pembayaran (site_configs)
            </span>
            <h3 className="font-bold text-lg font-display text-primary flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              <span>Kelola Rekening Bank Transfer</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Nomor rekening ini akan otomatis tampil pada halaman instruksi pembayaran tamu saat memilih metode Transfer Bank.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
              <span className="text-xs">Memuat konfigurasi rekening...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account Cards */}
              <div className="space-y-3">
                {banks.map((bank, idx) => (
                  <div
                    key={bank.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      bank.isActive
                        ? "bg-white border-gray-200 shadow-2xs"
                        : "bg-gray-50/70 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-accent/15 text-accent font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={bank.bankName}
                          onChange={(e) =>
                            handleUpdateField(bank.id, "bankName", e.target.value)
                          }
                          placeholder="Nama Bank (misal: Bank BCA)"
                          className="font-bold text-sm text-primary bg-transparent border-b border-dashed border-gray-300 focus:border-accent focus:outline-none px-1 py-0.5"
                        />
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(bank.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            bank.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                          title="Klik untuk mengaktifkan / menonaktifkan rekening ini di halaman pemesanan"
                        >
                          <Power className="w-3 h-3" />
                          <span>{bank.isActive ? "Aktif (Tampil)" : "Nonaktif"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBank(bank.id)}
                          className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Rekening"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                          Nomor Rekening
                        </label>
                        <input
                          type="text"
                          value={bank.accountNumber}
                          onChange={(e) =>
                            handleUpdateField(
                              bank.id,
                              "accountNumber",
                              e.target.value
                            )
                          }
                          placeholder="8001 2345 67"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                          Nama Pemilik Rekening (Atas Nama)
                        </label>
                        <input
                          type="text"
                          value={bank.accountHolder}
                          onChange={(e) =>
                            handleUpdateField(
                              bank.id,
                              "accountHolder",
                              e.target.value
                            )
                          }
                          placeholder="Contoh: PT Villa Hospitality"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-xs">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                        Instruksi Tambahan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={bank.instructions || ""}
                        onChange={(e) =>
                          handleUpdateField(
                            bank.id,
                            "instructions",
                            e.target.value
                          )
                        }
                        placeholder="Contoh: Transfer tepat hingga 3 digit terakhir untuk verifikasi otomatis."
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Bank Section */}
              {showAddForm ? (
                <form
                  onSubmit={handleAddBank}
                  className="p-5 rounded-2xl bg-cream/70 border border-gray-200 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wide">
                      Tambah Rekening Bank Baru
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                      Batal
                    </button>
                  </div>

                  {/* Preset bank selectors */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Pilih atau Ketik Nama Bank
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {POPULAR_BANKS.map((bName) => (
                        <button
                          key={bName}
                          type="button"
                          onClick={() => setNewBankName(bName)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                            newBankName === bName
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {bName}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      placeholder="Nama Bank Lainnya"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Nomor Rekening <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        placeholder="Contoh: 1234 5678 90"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Atas Nama (Pemilik) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccountHolder}
                        onChange={(e) => setNewAccountHolder(e.target.value)}
                        placeholder="Contoh: PT Villa Hospitality"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Catatan / Petunjuk Transfer
                    </label>
                    <input
                      type="text"
                      value={newInstructions}
                      onChange={(e) => setNewInstructions(e.target.value)}
                      placeholder="Contoh: Cantumkan kode booking pada berita transfer."
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-light"
                    >
                      + Tambahkan ke Daftar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-accent text-gray-600 hover:text-accent font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer bg-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Pilihan Rekening Bank</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-cream/30 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tersimpan di tabel database site_configs</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-light transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Simpan Perubahan Rekening</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
