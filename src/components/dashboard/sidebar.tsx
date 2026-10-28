"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Users,
  Settings,
  FileText,
  Palette,
  MessageSquare,
  Tag,
  Newspaper,
  Megaphone,
  Wrench,
  Activity,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, getPermissions, type Permission } from "@/lib/rbac";
import type { Role } from "@prisma/client";

interface SidebarProps {
  user: {
    name: string;
    role: string;
    permissions?: string[];
  };
  siteName?: string;
  siteLogo?: string | null;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Unit Villa", href: "/dashboard/villas", icon: Building2, permission: "villa:read" },
  { label: "Reservasi", href: "/dashboard/bookings", icon: CalendarDays, permission: "booking:read" },
  { label: "Pengguna & Tim", href: "/dashboard/users", icon: Users, permission: "user:read" },
];

const cmsItems: NavItem[] = [
  { label: "Hero, Branding & Desain", href: "/dashboard/cms/hero", icon: Palette, permission: "cms:hero" },
  { label: "Halaman Tentang Kami", href: "/dashboard/cms/about", icon: Info, permission: "cms:about" },
  { label: "Artikel & SEO", href: "/dashboard/cms/articles", icon: Newspaper, permission: "cms:articles" },
  { label: "Pop-up Promo", href: "/dashboard/cms/popups", icon: Megaphone, permission: "cms:popups" },
  { label: "Testimoni", href: "/dashboard/cms/testimonials", icon: MessageSquare, permission: "cms:testimonials" },
  { label: "Kode Promo", href: "/dashboard/cms/promos", icon: Tag, permission: "cms:promos" },
];

const guestNavItems: NavItem[] = [
  { label: "Portal & Pesanan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jelajahi Villa", href: "/villas", icon: Building2 },
  { label: "Lacak Status Pesanan", href: "/booking/status", icon: CalendarDays },
];

const settingsItems: NavItem[] = [
  { label: "Pengaturan Situs", href: "/dashboard/settings", icon: Settings, permission: "settings:read" },
  { label: "Laporan", href: "/dashboard/reports", icon: FileText, permission: "reports:view" },
  { label: "Log Aktivitas", href: "/dashboard/activity", icon: Activity, permission: "activity:view" },
];

export function DashboardSidebar({
  user,
  siteName = "singgahsana",
  siteLogo,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const role = user.role as Role;
  const userPermissions =
    user.permissions && Array.isArray(user.permissions)
      ? user.permissions
      : getPermissions(role);

  function filterItems(items: NavItem[]) {
    return items.filter((item) => {
      if (!item.permission) return true;
      if (role === "ADMIN") return true;
      // Direct permission match
      if (userPermissions.includes(item.permission)) return true;
      // General CMS read allows all CMS sub-modules
      if (item.href.startsWith("/dashboard/cms") && userPermissions.includes("cms:read")) return true;
      // General Settings read/update/payment allows settings page
      if (
        item.href === "/dashboard/settings" &&
        (userPermissions.includes("settings:read") ||
          userPermissions.includes("settings:update") ||
          userPermissions.includes("settings:payment"))
      )
        return true;
      return false;
    });
  }

  function NavLink({ item }: { item: NavItem }) {
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));

    return (
      <Link
        href={item.href}
        onClick={onCloseMobile}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150",
          isActive
            ? "bg-accent/15 text-accent font-semibold"
            : "text-white/65 hover:bg-white/5 hover:text-white"
        )}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-accent" : "text-white/45"
          )}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  const filteredNav = role === "GUEST" ? guestNavItems : filterItems(navItems);
  const filteredCms = role === "GUEST" ? [] : filterItems(cmsItems);
  const filteredSettings = role === "GUEST" ? [] : filterItems(settingsItems);

  const initialLetter = siteName ? siteName.charAt(0).toUpperCase() : "S";

  const sidebarContent = (
    <div className="flex h-full flex-col bg-primary-dark text-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5 shrink-0">
        <Link href="/dashboard" onClick={onCloseMobile} className="flex items-center gap-2.5 min-w-0">
          {siteLogo ? (
            <img
              src={siteLogo}
              alt={siteName}
              className="h-8 w-8 rounded-lg object-contain bg-white/10 p-0.5 shrink-0 shadow-xs"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-primary-dark font-black text-sm shadow-xs shrink-0">
              {initialLetter}
            </span>
          )}
          <span className="text-base font-bold tracking-tight font-display text-white truncate">
            {siteName}<span className="text-accent">.</span>
          </span>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5">
        {/* Main Nav */}
        <div className="space-y-1">
          {filteredNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* CMS */}
        {filteredCms.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-white/30">
              CMS
            </p>
            <div className="space-y-1">
              {filteredCms.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {filteredSettings.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-white/30">
              Sistem
            </p>
            <div className="space-y-1">
              {filteredSettings.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-[#1a1a2e]/10 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
