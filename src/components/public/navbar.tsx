"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Menu, X, Phone, Search, User } from "lucide-react";
import { GlobalSearchDialog } from "@/components/public/global-search-dialog";

interface NavbarProps {
  contactPhone?: string;
  siteName?: string;
  siteLogo?: string | null;
}

export function Navbar({
  contactPhone = "628111141888",
  siteName = "Villa",
  siteLogo,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSolidNav = pathname
    ? (pathname.startsWith("/villas/") && pathname !== "/villas") ||
      pathname.startsWith("/booking")
    : false;
  const isDarkBackground = false;
  const { data: session, status } = useSession();

  const waNumber = (contactPhone || "628111141888").replace(/\D/g, "").replace(/^0/, "62");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut listener for Cmd + K or Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSolidNav || scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt={siteName}
                className="h-8 md:h-9 w-auto max-w-[140px] md:max-w-[180px] object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : null}
            <span
              className={`text-xl font-bold font-display tracking-tight transition-colors duration-300 ${
                isDarkBackground ? "text-white" : "text-primary"
              }`}
            >
              {siteName}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            <Link
              href="/"
              className={`link-underline text-sm font-medium tracking-wide transition-colors duration-300 ${
                isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/villas"
              className={`link-underline text-sm font-medium tracking-wide transition-colors duration-300 ${
                isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
            >
              Villa
            </Link>
            <Link
              href="/artikel"
              className={`link-underline text-sm font-medium tracking-wide transition-colors duration-300 ${
                isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
            >
              Artikel
            </Link>
            <Link
              href="/about"
              className={`link-underline text-sm font-medium tracking-wide transition-colors duration-300 ${
                isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
            >
              Tentang Kami
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`p-2 rounded-full transition-colors cursor-pointer hover:bg-black/5 ${
                isDarkBackground ? "text-white/80 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
              aria-label="Cari Villa atau Artikel"
              title="Pencarian Global (Cmd / Ctrl + K)"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:inline-flex items-center gap-2.5 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300 ${
                isDarkBackground
                  ? "bg-white/15 text-white border border-white/25 hover:bg-white/25"
                  : "bg-primary-dark/10 text-primary-dark border border-primary-dark/25 hover:bg-primary-dark/20"
              }`}
            >
              <Phone className="w-4 h-4" />
              Hubungi Kami
            </a>

            {/* Auth Button */}
            {status === "loading" ? (
              <div className={`hidden md:block h-9 w-20 animate-pulse rounded-full ${isDarkBackground ? "bg-white/10" : "bg-primary-dark/10"}`} />
            ) : session ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>{session.user.name}</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className={`hidden md:inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300 ${
                  isDarkBackground
                    ? "bg-accent text-primary-dark hover:bg-accent-light"
                    : "bg-primary-dark text-white hover:bg-primary-dark/90"
                }`}
              >
                <User className="w-4 h-4" />
                Masuk
              </Link>
            )}

            {/* Mobile Search Button */}
            <button
              className={`lg:hidden p-2 rounded-full transition-colors cursor-pointer ${
                isDarkBackground ? "text-white/80 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
              onClick={() => setIsSearchOpen(true)}
              aria-label="Cari"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile Toggle */}
            <button
              className={`lg:hidden transition-colors cursor-pointer ${
                isDarkBackground ? "text-white" : "text-primary-dark"
              }`}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={`lg:hidden border-t transition-all duration-300 ${
          isDarkBackground
            ? "bg-primary-dark border-white/10"
            : "bg-white border-primary-dark/10 shadow-lg"
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
            {/* Mobile Brand Header */}
            <div className={`flex items-center gap-2.5 pb-4 border-b ${isDarkBackground ? "border-white/10" : "border-gray-200"}`}>
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt={siteName}
                  className="h-8 w-auto max-w-[120px] object-contain"
                />
              ) : null}
              <span className={`text-lg font-bold font-display ${isDarkBackground ? "text-white" : "text-primary"}`}>
                {siteName}
              </span>
            </div>

            {/* Quick Search Button in Mobile Menu */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsSearchOpen(true);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium transition cursor-pointer text-left ${
                isDarkBackground
                  ? "bg-white/10 text-white/70 hover:bg-white/20"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200/70"
              }`}
            >
              <Search className="w-4 h-4 text-accent shrink-0" />
              <span>Cari villa, artikel panduan, fasilitas...</span>
            </button>

            <Link
              href="/"
              className={`block py-2 text-sm font-medium ${
                isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Beranda
            </Link>
            <Link
              href="/villas"
              className={`block py-2 text-sm font-medium ${
                isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Villa
            </Link>
            <Link
              href="/artikel"
              className={`block py-2 text-sm font-medium ${
                isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Artikel
            </Link>
            <Link
              href="/about"
              className={`block py-2 text-sm font-medium ${
                isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Tentang Kami
            </Link>

            {/* Mobile Auth */}
            {status === "loading" ? (
              <div className={`h-12 animate-pulse rounded-full ${isDarkBackground ? "bg-white/10" : "bg-primary-dark/10"}`} />
            ) : session ? (
              <div className={`space-y-3 border-t pt-4 ${isDarkBackground ? "border-white/10" : "border-primary-dark/10"}`}>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 py-2 text-sm font-medium ${
                    isDarkBackground ? "text-white/90 hover:text-white" : "text-primary-dark/80 hover:text-primary-dark"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-4 w-4" />
                  {session.user.name}
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold transition-colors ${
                  isDarkBackground
                    ? "bg-accent text-primary-dark hover:bg-accent-light"
                    : "bg-primary-dark text-white hover:bg-primary-dark/90"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                Masuk
              </Link>
            )}

            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold transition-colors ${
                isDarkBackground
                  ? "bg-white/15 text-white border border-white/25 hover:bg-white/25"
                  : "bg-primary-dark/10 text-primary-dark border border-primary-dark/25 hover:bg-primary-dark/20"
              }`}
            >
              <Phone className="w-4 h-4" />
              Hubungi Kami
            </a>
          </div>
        </div>
      )}
    </header>

    {/* Global Search Dialog Modal */}
    <GlobalSearchDialog
      isOpen={isSearchOpen}
      onClose={() => setIsSearchOpen(false)}
    />
  </>
  );
}
