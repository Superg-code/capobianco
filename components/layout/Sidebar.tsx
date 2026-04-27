"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Trophy,
  Settings,
  Tractor,
  CalendarDays,
} from "lucide-react";
import { clsx } from "clsx";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contatti", label: "Contatti", icon: Users },
  { href: "/vendite", label: "Vendite", icon: TrendingUp },
  { href: "/classifica", label: "Classifica", icon: Trophy },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings, adminOnly: true },
];

type SidebarProps = {
  role: "admin" | "salesperson";
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || role === "admin"
  );

  return (
    <aside className="w-60 bg-text flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-brand rounded-lg p-1.5">
            <Tractor className="w-5 h-5 text-text" />
          </div>
          <div>
            <p className="font-heading font-bold text-white text-sm leading-tight">
              Capobianco
            </p>
            <p className="text-brand text-xs font-semibold">CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                isActive
                  ? "bg-brand text-text"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom brand */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          Capobianco Group © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
