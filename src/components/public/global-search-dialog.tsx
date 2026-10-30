"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Home,
  BookOpen,
  ArrowRight,
  Loader2,
  MapPin,
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
}

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Focus input otomatis saat dialog terbuka & reset state saat ditutup
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults(null);
      setLoading(false);
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

  // Fetch hasil pencarian hanya saat ada teks input
  async function fetchResults(q: string) {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
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
    const trimmed = query.trim();

    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchResults(trimmed);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const trimmedQuery = query.trim();
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Kolom Pencarian Atas */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-100 bg-white">
          <Search className="w-4 h-4 text-gray-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik untuk mencari villa, lokasi, atau artikel..."
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {loading && <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />}
            {query && !loading && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults(null);
                }}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                title="Hapus"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="sm:hidden p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Konten Pencarian */}
        {trimmedQuery && (
          <div className="overflow-y-auto p-3 space-y-4 flex-1">
            {/* Loading State */}
            {loading && !results && (
              <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span>Mencari...</span>
              </div>
            )}

            {/* Empty State jika tidak ada hasil */}
            {!loading && results && totalFound === 0 && (
              <div className="py-10 text-center text-xs text-gray-400">
                Tidak ada hasil untuk &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Bagian: Villa */}
            {villas.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Villa
                </div>
                <div className="space-y-1">
                  {villas.map((villa) => (
                    <div
                      key={villa.id}
                      onClick={() => handleNavigate(villa.url)}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                        {villa.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={villa.image}
                            alt={villa.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Home className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-xs text-gray-900 group-hover:text-accent transition-colors truncate">
                            {villa.name}
                          </h4>
                          <span className="text-xs font-bold text-primary shrink-0">
                            {formatPrice(villa.pricePerNight)}
                            <span className="text-[10px] font-normal text-gray-400">/mlm</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
                          <span>{villa.location}</span>
                          <span>•</span>
                          <span>{villa.bedrooms} Kamar</span>
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bagian: Artikel */}
            {articles.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Artikel &amp; Panduan
                </div>
                <div className="space-y-1">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => handleNavigate(article.url)}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative flex items-center justify-center">
                        {article.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-medium text-accent uppercase tracking-wider">
                          {article.category}
                        </span>
                        <h4 className="font-medium text-xs text-gray-900 group-hover:text-accent transition-colors truncate">
                          {article.title}
                        </h4>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bagian: Halaman Pintas */}
            {pages.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Halaman
                </div>
                <div className="space-y-1">
                  {pages.map((page) => (
                    <div
                      key={page.url}
                      onClick={() => handleNavigate(page.url)}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-accent shrink-0">
                        {page.url === "/villas" ? (
                          <Home className="w-3.5 h-3.5" />
                        ) : page.url === "/artikel" ? (
                          <BookOpen className="w-3.5 h-3.5" />
                        ) : page.url === "/booking/status" ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Compass className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-xs text-gray-900 group-hover:text-accent transition-colors truncate">
                          {page.title}
                        </h5>
                        <p className="text-[10px] text-gray-400 truncate">
                          {page.url}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Minimalis */}
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/50 flex items-center justify-between text-[11px] text-gray-400">
          <span>Pencarian website</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-gray-400 shadow-2xs">
              ESC
            </kbd>
            <span>tutup</span>
          </span>
        </div>
      </div>
    </div>
  );
}
