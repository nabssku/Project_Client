"use client";

import { useState } from "react";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";

interface DashboardLayoutClientProps {
  user: {
    name: string;
    role: string;
    avatar?: string | null;
    permissions?: string[];
  };
  siteName?: string;
  siteLogo?: string | null;
  children: React.ReactNode;
}

export function DashboardLayoutClient({
  user,
  siteName = "Villa",
  siteLogo,
  children,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8f7f4] text-[#1a1a2e]">
      {/* Sidebar with Mobile Drawer support */}
      <DashboardSidebar
        user={user}
        siteName={siteName}
        siteLogo={siteLogo}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Body */}
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardHeader
          user={user}
          siteName={siteName}
          siteLogo={siteLogo}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
