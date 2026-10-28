"use client";

import { signOut } from "next-auth/react";
import { LogOut, ExternalLink, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeaderProps {
  user: {
    name: string;
    role: string;
    avatar?: string | null;
  };
  siteName?: string;
  siteLogo?: string | null;
  onMenuToggle?: () => void;
}

export function DashboardHeader({
  user,
  siteName = "Singgahsana",
  siteLogo,
  onMenuToggle,
}: HeaderProps) {
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    MANAJER: "Manajer Operasional",
    MARKETING: "Marketing",
    MAINTENANCE: "Housekeeping / Maintenance",
    GUEST: "Tamu / Pelanggan",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e8e6df] bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Buka Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          {siteLogo ? (
            <img
              src={siteLogo}
              alt={siteName}
              className="lg:hidden h-6 w-auto max-w-[80px] object-contain"
            />
          ) : null}
          <span className="text-sm sm:text-base font-bold font-display text-primary tracking-tight">
            Dashboard
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent/10 text-accent border border-accent/30">
            {roleLabels[user.role] || user.role}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-[#e8e6df] hover:bg-[#f8f7f4] transition-colors"
        >
          <span>Lihat Website</span>
          <ExternalLink className="h-3 w-3" />
        </Link>

        <div className="flex items-center gap-2 pl-2 sm:border-l border-[#e8e6df]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-accent font-bold text-xs">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-primary leading-tight truncate max-w-[120px]">
              {user.name}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Keluar"
          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
