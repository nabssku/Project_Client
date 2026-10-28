"use client";

import React, { useState, useRef } from "react";
import {
  CreditCard,
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Power,
  Globe,
  Phone,
  Mail,
  MapPin,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Video,
  Palette,
  Type,
  BarChart3,
  Search,
  Sparkles,
  Lock,
  RefreshCw,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import { type BankAccount, DEFAULT_BANK_ACCOUNTS } from "@/lib/payment-config";

interface SettingsClientProps {
  initialBanks: BankAccount[];
  initialConfigs: Record<string, string>;
  userRole: string;
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

type ConfigCategory =
  | "identity"
  | "hero"
  | "contact"
  | "social"
  | "auth"
  | "stats_design";

interface ConfigFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "textarea" | "color" | "image";
  category: ConfigCategory;
}

const CONFIG_FIELDS: ConfigFieldDef[] = [
  // 1. Identitas & Branding
  {
    key: "site_name",
    label: "Nama Situs / Brand",
    placeholder: "Nama Villa / Brand",
    description: "Nama brand yang tampil di navbar, footer, dan meta title.",
    category: "identity",
  },
  {
    key: "site_logo",
    label: "Logo Situs & Brand",
    placeholder: "/logo.png atau https://...",
    description: "Logo resmi yang tampil di header beranda, navbar, login, register, sidebar dashboard, dan invoice PDF.",
    type: "image",
    category: "identity",
  },
  {
    key: "company_name",
    label: "Nama Legal Perusahaan",
    placeholder: "PT Villa Hospitality",
    description: "Nama badan usaha untuk footer dan dokumen resmi.",
    category: "identity",
  },
  {
    key: "site_tagline",
    label: "Tagline Situs",
    placeholder: "Pengalaman menginap lengkap untuk momen yang lebih berkesan",
    description: "Slogan singkat brand.",
    category: "identity",
  },
  {
    key: "site_description",
    label: "Deskripsi Situs (SEO)",
    placeholder: "Pengelola villa terdepan di Puncak, Bogor yang menawarkan akomodasi berkualitas...",
    description: "Meta description situs untuk Google Search.",
    type: "textarea",
    category: "identity",
  },
  {
    key: "watermark_text",
    label: "Teks Watermark Foto Villa",
    placeholder: "villa",
    description: "Teks watermark transparan saat upload galeri villa.",
    category: "identity",
  },

  // 2. Hero Beranda
  {
    key: "hero_title",
    label: "Judul Utama Hero",
    placeholder: "Villa & Resort Booking Puncak Bogor",
    description: "Teks judul besar di halaman utama.",
    category: "hero",
  },
  {
    key: "hero_title_italic",
    label: "Kata Penekanan (Italic)",
    placeholder: "kenyamanan",
    description: "Kata bersambung dengan gaya font serif miring.",
    category: "hero",
  },
  {
    key: "hero_tagline",
    label: "Badge Tagline Hero",
    placeholder: "InfoVilla",
    description: "Label pil kecil di bagian atas banner hero.",
    category: "hero",
  },
  {
    key: "hero_subtitle",
    label: "Subjudul Hero",
    placeholder: "Pengalaman menginap lengkap untuk momen yang lebih berkesan.",
    description: "Paragraf pengantar di bawah judul hero.",
    type: "textarea",
    category: "hero",
  },
  {
    key: "hero_video",
    label: "URL Video Hero (YouTube / Embed)",
    placeholder: "https://www.youtube.com/embed/...",
    description: "Link video autoplay sebagai latar belakang hero banner.",
    category: "hero",
  },
  {
    key: "hero_image",
    label: "URL Poster / Gambar Cadangan Hero",
    placeholder: "https://...",
    description: "Gambar fallback jika video tidak dapat diputar.",
    category: "hero",
  },
  {
    key: "hero_gradient_accent",
    label: "Warna Aksen Gradient Hero",
    placeholder: "#C8A44E",
    description: "Kode warna aksen emas / brand.",
    category: "hero",
  },

  // 3. Kontak & Alamat
  {
    key: "contact_phone_1",
    label: "Hotline Utama / WhatsApp",
    placeholder: "(+62) 811-1141-052",
    description: "Nomor WhatsApp customer service dan tombol chat.",
    category: "contact",
  },
  {
    key: "contact_phone_2",
    label: "Nomor Telepon Cadangan",
    placeholder: "(+62) 8521-9949-626",
    description: "Nomor telepon alternatif di footer kontak.",
    category: "contact",
  },
  {
    key: "contact_email",
    label: "Email Kontak Resmi",
    placeholder: "admin@example.com",
    description: "Alamat email publik untuk pertanyaan tamu.",
    category: "contact",
  },
  {
    key: "contact_address",
    label: "Alamat Kantor / Operasional",
    placeholder: "Jl. Alternatif Puncak, Cisarua – Bogor 16750",
    description: "Alamat fisik properti / pengelola.",
    type: "textarea",
    category: "contact",
  },

  // 4. Media Sosial
  {
    key: "social_instagram",
    label: "Link Instagram",
    placeholder: "https://www.instagram.com/username",
    category: "social",
  },
  {
    key: "social_facebook",
    label: "Link Facebook",
    placeholder: "https://www.facebook.com/username",
    category: "social",
  },
  {
    key: "social_tiktok",
    label: "Link TikTok",
    placeholder: "https://www.tiktok.com/@username",
    category: "social",
  },
  {
    key: "social_youtube",
    label: "Link YouTube",
    placeholder: "https://www.youtube.com/@username",
    category: "social",
  },

  // 5. Autentikasi (Login & Register)
  {
    key: "auth_video",
    label: "URL Video Latar Login / Register",
    placeholder: "https://www.youtube.com/embed/...",
    description: "Video latar di samping form masuk & daftar akun.",
    category: "auth",
  },
  {
    key: "login_title",
    label: "Judul Halaman Login",
    placeholder: "Selamat Datang",
    category: "auth",
  },
  {
    key: "login_subtitle",
    label: "Subjudul Halaman Login",
    placeholder: "Masuk untuk melihat riwayat booking dan mengelola akun Anda",
    category: "auth",
  },
  {
    key: "register_title",
    label: "Judul Halaman Register",
    placeholder: "Bergabung Bersama Kami",
    category: "auth",
  },
  {
    key: "register_subtitle",
    label: "Subjudul Halaman Register",
    placeholder: "Daftar sekarang untuk mulai menikmati pengalaman booking villa yang mudah",
    category: "auth",
  },

  // 6. Statistik, CTA & Desain
  {
    key: "stats_properties",
    label: "Statistik Properti Villa",
    placeholder: "50+",
    description: "Label angka jumlah unit villa di bagian stats.",
    category: "stats_design",
  },
  {
    key: "stats_guests",
    label: "Statistik Tamu Menginap",
    placeholder: "10K+",
    description: "Label angka total tamu puas.",
    category: "stats_design",
  },
  {
    key: "stats_rating",
    label: "Statistik Rating Rata-rata",
    placeholder: "4.8",
    description: "Angka rating kepuasan pelanggan.",
    category: "stats_design",
  },
  {
    key: "cta_title",
    label: "Judul Banner CTA",
    placeholder: "Siap Untuk Liburan?",
    description: "Judul ajakan pemesanan di bagian bawah halaman.",
    category: "stats_design",
  },
  {
    key: "cta_subtitle",
    label: "Subjudul Banner CTA",
    placeholder: "Hubungi kami dan dapatkan penawaran terbaik untuk villa impian Anda",
    category: "stats_design",
  },
  {
    key: "font_display",
    label: "Font Display (Judul)",
    placeholder: "Playfair Display",
    description: "Nama font Google Fonts untuk heading.",
    category: "stats_design",
  },
  {
    key: "font_body",
    label: "Font Body (Teks Umum)",
    placeholder: "DM Sans",
    description: "Nama font Google Fonts untuk teks umum.",
    category: "stats_design",
  },
  {
    key: "primary_color",
    label: "Warna Primer Situs (Hex)",
    placeholder: "#1a1a2e",
    category: "stats_design",
  },
  {
    key: "secondary_color",
    label: "Warna Sekunder Situs (Hex)",
    placeholder: "#C8A44E",
    category: "stats_design",
  },
];

export function SettingsClient({
  initialBanks,
  initialConfigs,
  userRole,
}: SettingsClientProps) {
  const isAdmin = userRole === "ADMIN";
  const [activeMainTab, setActiveMainTab] = useState<"site" | "payment">("site");

  // Site Configs State
  const [configs, setConfigs] = useState<Record<string, string>>(initialConfigs);
  const [activeCategory, setActiveCategory] =
    useState<ConfigCategory>("identity");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingSite, setSavingSite] = useState(false);
  const [siteSuccess, setSiteSuccess] = useState("");
  const [siteError, setSiteError] = useState("");

  const [purgingCache, setPurgingCache] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState("");

  const handlePurgeCache = async () => {
    setPurgingCache(true);
    setPurgeSuccess("");
    try {
      const res = await fetch("/api/config/revalidate", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setPurgeSuccess(data.message || "Cache Vercel & Website berhasil dibersihkan!");
        setTimeout(() => setPurgeSuccess(""), 5000);
      } else {
        alert(data.error || "Gagal menyegarkan cache");
      }
    } catch {
      alert("Terjadi kesalahan jaringan saat menyegarkan cache.");
    } finally {
      setPurgingCache(false);
    }
  };

  // Payment Banks State
  const [banks, setBanks] = useState<BankAccount[]>(initialBanks);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  // New Bank Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBankName, setNewBankName] = useState("Bank BCA");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState(
    "PT Villa Hospitality"
  );
  const [newInstructions, setNewInstructions] = useState(
    "Transfer sesuai nominal total tagihan hingga digit terakhir"
  );

  // Logo Upload State & Ref
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setSiteError("");
    setSiteSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "branding");

      const res = await fetch("/api/upload/cms-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah logo");
      }

      handleConfigChange("site_logo", data.url);
      setSiteSuccess("File logo berhasil diunggah! Klik 'Simpan Perubahan Situs' untuk mengaktifkannya di seluruh halaman.");
      setTimeout(() => setSiteSuccess(""), 5000);
    } catch (err: any) {
      setSiteError(err.message || "Gagal mengunggah file logo");
    } finally {
      setUploadingLogo(false);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = "";
      }
    }
  };

  // Update Config Field
  const handleConfigChange = (key: string, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save General Site Configs (Admin Only)
  const handleSaveSiteConfigs = async () => {
    if (!isAdmin) {
      setSiteError("Hanya akun dengan role Administrator yang dapat menyimpan konfigurasi situs.");
      return;
    }

    setSavingSite(true);
    setSiteSuccess("");
    setSiteError("");

    try {
      const res = await fetch("/api/config/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan konfigurasi situs");
      }

      setSiteSuccess("Seluruh konfigurasi situs berhasil diperbarui ke database!");
      setTimeout(() => setSiteSuccess(""), 4000);
    } catch (err: any) {
      setSiteError(err.message || "Gagal menyimpan konfigurasi situs");
    } finally {
      setSavingSite(false);
    }
  };

  // Bank Handlers
  const handleToggleActiveBank = (id: string) => {
    setBanks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const handleDeleteBank = (id: string) => {
    if (banks.length <= 1) {
      setPaymentError("Minimal harus ada 1 rekening bank di sistem.");
      return;
    }
    setBanks((prev) => prev.filter((b) => b.id !== id));
    setPaymentError("");
  };

  const handleUpdateBankField = (
    id: string,
    field: keyof BankAccount,
    value: string
  ) => {
    setBanks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccountNumber.trim() || !newAccountHolder.trim()) {
      setPaymentError("Nama bank, nomor rekening, dan nama pemilik wajib diisi.");
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
    setPaymentError("");
  };

  const handleSavePaymentBanks = async () => {
    setSavingPayment(true);
    setPaymentError("");
    setPaymentSuccess("");

    try {
      if (banks.length === 0) {
        throw new Error("Minimal harus ada 1 rekening bank.");
      }

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
        throw new Error(data.error || "Gagal menyimpan rekening pembayaran");
      }

      setPaymentSuccess("Nomor rekening transfer berhasil disimpan ke database (site_configs)!");
      setTimeout(() => setPaymentSuccess(""), 4000);
    } catch (err: any) {
      setPaymentError(err.message || "Gagal menyimpan perubahan rekening");
    } finally {
      setSavingPayment(false);
    }
  };

  // Filtered config fields
  const displayedFields = CONFIG_FIELDS.filter((f) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.key.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return f.category === activeCategory;
  });

  const categoriesDef: { id: ConfigCategory; label: string; icon: any }[] = [
    { id: "identity", label: "Identitas & Brand", icon: Building },
    { id: "hero", label: "Hero Banner", icon: Sparkles },
    { id: "contact", label: "Kontak & Alamat", icon: Phone },
    { id: "social", label: "Media Sosial", icon: Share2 },
    { id: "auth", label: "Login & Register", icon: Lock },
    { id: "stats_design", label: "Statistik & Desain", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-primary">
            Pengaturan Situs & Konfigurasi
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola seluruh sistem website
          </p>
        </div>

        {/* Actions & Role Badge Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePurgeCache}
            disabled={purgingCache}
            title="Bersihkan cache ISR/PPR di server dan Vercel agar perubahan database langsung tampil"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${purgingCache ? "animate-spin text-accent" : ""}`} />
            <span>{purgingCache ? "Membersihkan Cache..." : "Bersihkan Cache Vercel"}</span>
          </button>

          {isAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akses Penuh Admin</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Role: {userRole} (Read-Only Situs)</span>
            </span>
          )}
        </div>
      </div>

      {purgeSuccess && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{purgeSuccess}</span>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveMainTab("site")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            activeMainTab === "site"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Informasi Kontak & Situs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("payment")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            activeMainTab === "payment"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rekening Transfer Bank</span>
        </button>
      </div>

      {/* TAB 1: INFORMASI KONTAK & SITUS (FULL SITE_CONFIGS) */}
      {activeMainTab === "site" && (
        <div className="space-y-5">
          {/* Admin vs Non-admin Alert */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Mode Pratinjau:</strong> Pengubahan nilai konfigurasi umum situs dikhususkan untuk akun dengan role <strong>ADMIN</strong>. Anda tetap dapat mengelola rekening pembayaran transfer di tab sebelah.
              </span>
            </div>
          )}

          {siteSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{siteSuccess}</span>
            </div>
          )}

          {siteError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{siteError}</span>
            </div>
          )}

          {/* Sub-Category Navigation Bar */}
          <div className="bg-white rounded-3xl p-3 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {categoriesDef.map((cat) => {
                const IconComp = cat.icon;
                const isSelected = activeCategory === cat.id && !searchQuery.trim();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory(cat.id);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent text-white shadow-2xs"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari kunci konfigurasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent bg-white"
              />
            </div>
          </div>

          {/* Configuration Inputs Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold font-display text-primary flex items-center gap-2">
                  <span>
                    {searchQuery.trim()
                      ? `Hasil Pencarian: "${searchQuery}" (${displayedFields.length})`
                      : categoriesDef.find((c) => c.id === activeCategory)?.label}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Perubahan akan otomatis diterapkan ke seluruh antarmuka publik dan meta tag sistem.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  disabled={savingSite}
                  onClick={handleSaveSiteConfigs}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-accent text-white font-semibold text-xs sm:text-sm hover:bg-accent-light transition-all shadow-md shadow-accent/20 cursor-pointer self-start sm:self-auto disabled:opacity-50"
                >
                  {savingSite ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Simpan Perubahan Situs</span>
                </button>
              )}
            </div>

            {/* Grid of inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedFields.map((field) => {
                const val = configs[field.key] ?? "";

                return (
                  <div
                    key={field.key}
                    className={`p-4 rounded-2xl border transition-all ${
                      field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""
                    } border-gray-100 bg-[#fafafa]/80 hover:bg-white hover:border-gray-200 focus-within:bg-white focus-within:border-accent/60`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-800">
                        {field.label}
                      </label>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                        {field.key}
                      </span>
                    </div>

                    {field.description && (
                      <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                        {field.description}
                      </p>
                    )}

                    {field.type === "image" ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Light Preview */}
                          <div className="p-3.5 rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center min-h-[90px] text-center shadow-xs">
                            <span className="text-[10px] font-medium text-gray-400 mb-2">Pratinjau Background Terang (Invoice / Card)</span>
                            {val ? (
                              <img
                                src={val}
                                alt="Logo Preview Light"
                                className="h-10 max-w-full object-contain"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                                <ImageIcon className="w-4 h-4" />
                                <span>Belum ada logo (tampilan teks monogram)</span>
                              </div>
                            )}
                          </div>

                          {/* Dark Preview */}
                          <div className="p-3.5 rounded-xl border border-white/10 bg-[#1a1a2e] flex flex-col items-center justify-center min-h-[90px] text-center shadow-xs">
                            <span className="text-[10px] font-medium text-white/50 mb-2">Pratinjau Background Gelap (Navbar / Hero / Sidebar)</span>
                            {val ? (
                              <img
                                src={val}
                                alt="Logo Preview Dark"
                                className="h-10 max-w-full object-contain"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/40">
                                <ImageIcon className="w-4 h-4" />
                                <span>Belum ada logo (tampilan teks monogram)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Input & Upload Controls */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <input
                            type="text"
                            disabled={!isAdmin}
                            value={val}
                            onChange={(e) =>
                              handleConfigChange(field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />

                          <input
                            type="file"
                            ref={logoFileInputRef}
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />

                          {isAdmin && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={uploadingLogo}
                                onClick={() => logoFileInputRef.current?.click()}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-light transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                {uploadingLogo ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UploadCloud className="w-3.5 h-3.5" />
                                )}
                                <span>{uploadingLogo ? "Mengunggah..." : "Unggah Logo"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleConfigChange(field.key, "/logo.png")}
                                title="Kembalikan ke logo bawaan"
                                className="px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                              >
                                Bawaan
                              </button>

                              {val && (
                                <button
                                  type="button"
                                  onClick={() => handleConfigChange(field.key, "")}
                                  title="Hapus logo (gunakan teks/monogram saja)"
                                  className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : field.type === "textarea" ? (
                      <textarea
                        rows={3}
                        disabled={!isAdmin}
                        value={val}
                        onChange={(e) =>
                          handleConfigChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    ) : (
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={val}
                        onChange={(e) =>
                          handleConfigChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Button for Admin */}
            {isAdmin && (
              <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Pastikan memeriksa kembali nilai konfigurasi sebelum menyimpan.
                </span>

                <button
                  type="button"
                  disabled={savingSite}
                  onClick={handleSaveSiteConfigs}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-accent text-white font-semibold text-xs sm:text-sm hover:bg-accent-light transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
                >
                  {savingSite ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Simpan Perubahan Situs</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REKENING PEMBAYARAN TRANSFER */}
      {activeMainTab === "payment" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">

          </div>

          {paymentError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          {paymentSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{paymentSuccess}</span>
            </div>
          )}

          {/* List of accounts */}
          <div className="space-y-4">
            {banks.map((bank, idx) => (
              <div
                key={bank.id}
                className={`p-5 rounded-2xl border transition-all ${
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
                        handleUpdateBankField(bank.id, "bankName", e.target.value)
                      }
                      placeholder="Nama Bank (misal: Bank BCA)"
                      className="font-bold text-base text-primary bg-transparent border-b border-dashed border-gray-300 focus:border-accent focus:outline-none px-1 py-0.5"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleActiveBank(bank.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        bank.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                      title="Klik untuk mengubah status aktif"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{bank.isActive ? "Aktif (Tampil)" : "Nonaktif"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBank(bank.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Rekening"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={bank.accountNumber}
                      onChange={(e) =>
                        handleUpdateBankField(
                          bank.id,
                          "accountNumber",
                          e.target.value
                        )
                      }
                      placeholder="8001 2345 67"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent"
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
                        handleUpdateBankField(
                          bank.id,
                          "accountHolder",
                          e.target.value
                        )
                      }
                      placeholder="PT Villa Hospitality"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs">
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Petunjuk Transfer untuk Tamu
                  </label>
                  <input
                    type="text"
                    value={bank.instructions || ""}
                    onChange={(e) =>
                      handleUpdateBankField(
                        bank.id,
                        "instructions",
                        e.target.value
                      )
                    }
                    placeholder="Contoh: Transfer sesuai nominal total tagihan hingga digit terakhir."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Bank Form */}
          {showAddForm ? (
            <form
              onSubmit={handleAddBank}
              className="p-6 rounded-2xl bg-cream/70 border border-gray-200 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-primary uppercase tracking-wide">
                  Tambah Rekening Bank Baru
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Pilih atau Ketik Nama Bank
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {POPULAR_BANKS.map((bName) => (
                    <button
                      key={bName}
                      type="button"
                      onClick={() => setNewBankName(bName)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Atas Nama Pemilik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccountHolder}
                    onChange={(e) => setNewAccountHolder(e.target.value)}
                    placeholder="Contoh: PT Villa Hospitality"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Petunjuk Tambahan
                </label>
                <input
                  type="text"
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Contoh: Mohon sertakan kode booking di berita transfer."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-light cursor-pointer"
                >
                  + Tambahkan ke Daftar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-accent text-gray-600 hover:text-accent font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer bg-white"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Rekening Bank Baru</span>
            </button>
          )}

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
            <button
              type="button"
              disabled={savingPayment}
              onClick={handleSavePaymentBanks}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-accent text-white font-semibold text-xs sm:text-sm hover:bg-accent-light transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
            >
              {savingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Simpan Perubahan Rekening</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
