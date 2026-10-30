"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Home,
  BookOpen,
  FileText,
  Building2,
  ArrowRight,
  Sparkles,
  Loader2,
  MapPin,
  Tag,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface SearchVillaItem {
  id: string;
  name: string;
  slug: string;
  location: string;
  pricePerNight: number;
  bedrooms: number;
  capacity: number;
  image?: string | null;
  type: "villa";
  url: string;
  matchedAmenities?: string[];
}

interface SearchArticleItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt?: string | null;
  image?: string | null;
  type: "article";
  url: string;
  tags?: string[];
}

interface SearchPageItem {
  title: string;
  description: string;
  url: string;
  type: "page";
  category: string;
}

interface SearchResults {
  query: string;
  villas: SearchVillaItem[];
  articles: SearchArticleItem[];
  pages: SearchPageItem[];
  isDefault?: boolean;
}

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCH_TAGS = [
  "Private Pool",
  "Puncak",
  "Keluarga",
  "Tips Liburan",
  "Cek Status Booking",
  "Tentang Kami",
];

export function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Focus input otomatis saat dialog terbuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
      fetchResults(""); // Memuat rekomendasi bawaan
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults(null);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle tombol ESC untuk keluar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch hasil pencarian dari API
  async function fetchResults(q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Search fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // Debounced pencarian saat user mengetik
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const villas = results?.villas || [];
  const articles = results?.articles || [];
  const pages = results?.pages || [];
  const totalFound = villas.length + articles.length + pages.length;

  function handleNavigate(url: string) {
    onClose();
    startTransition(() => {
      router.push(url);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150">
        {/* Kolom Pencarian Atas */}
        <div className="relative flex items-center border-b border-gray-100 px-5 py-4 bg-gray-50/50">
          <Search className="w-5 h-5 text-accent shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari villa, lokasi, artikel, tips, atau halaman..."
            className="w-full bg-transparent text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {loading && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
            {query && !loading && (
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 shadow-2xs">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="sm:hidden p-1 rounded-full text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Konten Hasil Pencarian */}
        <div className="overflow-y-auto p-5 space-y-6 flex-1 divide-y divide-gray-100">
          {/* Tag Populer saat kotak pencarian kosong */}
          {results?.isDefault && (
            <div className="space-y-3 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Pencarian Populer &amp; Topik Hangat</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/70 px-3 py-1 text-xs font-medium text-gray-700 hover:border-accent hover:bg-accent/10 hover:text-accent transition cursor-pointer"
                  >
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kondisi saat tidak ada hasil ditemukan */}
          {!loading && results && !results.isDefault && totalFound === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">
                Tidak ada hasil untuk &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Coba gunakan kata kunci lain seperti nama villa, lokasi (misal: Puncak, Bogor), atau fasilitas (pool, karaoke).
              </p>
            </div>
          )}

          {/* Bagian: Koleksi Villa */}
          {villas.length > 0 && (
            <div className="space-y-3 pt-4 first:pt-0">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5 text-primary">
                  <Building2 className="w-4 h-4 text-accent" />
                  Koleksi Villa
                </span>
                <Link
                  href="/villas"
                  onClick={onClose}
                  className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-0.5"
                >
                  Lihat Semua
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {villas.map((villa) => (
                  <div
                    key={villa.id}
                    onClick={() => handleNavigate(villa.url)}
                    className="group flex gap-3 p-2.5 rounded-2xl border border-gray-100 hover:border-accent/40 bg-white hover:bg-accent/5 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                      {villa.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={villa.image}
                          alt={villa.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Home className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-accent transition-colors truncate">
                          {villa.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>{villa.location}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100/80">
                        <span className="text-[10px] text-gray-400">
                          {villa.bedrooms} Kamar • {villa.capacity} Tamu
                        </span>
                        <span className="text-xs font-bold text-primary">
                          {formatPrice(villa.pricePerNight)}
                          <span className="text-[10px] font-normal text-gray-400">/mlm</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bagian: Artikel & Panduan */}
          {articles.length > 0 && (
            <div className="space-y-3 pt-4 first:pt-0">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5 text-primary">
                  <BookOpen className="w-4 h-4 text-accent" />
                  Artikel &amp; Panduan Wisata
                </span>
                <Link
                  href="/artikel"
                  onClick={onClose}
                  className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-0.5"
                >
                  Lihat Semua
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => handleNavigate(article.url)}
                    className="group flex gap-3 p-2.5 rounded-2xl border border-gray-100 hover:border-accent/40 bg-white hover:bg-accent/5 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                      {article.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-accent/15 text-accent">
                          {article.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-accent transition-colors line-clamp-1 mt-1">
                        {article.title}
                      </h4>
                      {article.excerpt && (
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="self-center pr-2 text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bagian: Halaman Pintas & Layanan Publik */}
          {pages.length > 0 && (
            <div className="space-y-3 pt-4 first:pt-0">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 text-primary">
                <Compass className="w-4 h-4 text-accent" />
                Halaman &amp; Layanan Publik
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pages.map((page) => (
                  <div
                    key={page.url}
                    onClick={() => handleNavigate(page.url)}
                    className="group flex items-start gap-3 p-3 rounded-2xl border border-gray-100 hover:border-accent/40 bg-gray-50/50 hover:bg-accent/5 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="p-2 rounded-xl bg-white border border-gray-100 text-accent group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                      {page.url === "/villas" ? (
                        <Home className="w-4 h-4" />
                      ) : page.url === "/artikel" ? (
                        <BookOpen className="w-4 h-4" />
                      ) : page.url === "/booking/status" ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <Compass className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-gray-900 group-hover:text-accent transition-colors truncate">
                        {page.title}
                      </h5>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {page.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Shortcut */}
        <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/70 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[9px] shadow-2xs">
                ESC
              </kbd>
              <span>untuk menutup</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[9px] shadow-2xs">
                Cmd / Ctrl + K
              </kbd>
              <span>pencarian cepat</span>
            </span>
          </div>
          <span className="text-gray-400">Pencarian real-time seluruh website</span>
        </div>
      </div>
    </div>
  );
}
