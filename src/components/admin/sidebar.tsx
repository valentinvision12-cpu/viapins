"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site-brand";
import {
  LayoutDashboard,
  Map,
  Settings,
  LogOut,
  Globe2,
  ChevronRight,
  DollarSign,
  FileJson,
  Users,
  Compass,
  Radar,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Начало",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/destinations",
    label: "Дестинации",
    icon: Map,
  },
  {
    href: "/admin/adventures",
    label: "Adventures",
    icon: Compass,
  },
  {
    href: "/admin/import",
    label: "Качи държава",
    icon: FileJson,
  },
  {
    href: "/admin/indexing",
    label: "Индексиране",
    icon: Radar,
  },
  {
    href: "/admin/users",
    label: "Потребители",
    icon: Users,
  },
  {
    href: "/admin/monetization",
    label: "Монетизация",
    icon: DollarSign,
    badge: "Модул 7",
  },
  {
    href: "/admin/settings",
    label: "Настройки",
    icon: Settings,
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[oklch(0.13_0.01_260)] text-white flex flex-col h-screen sticky top-0 border-r border-white/5">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.72_0.13_82)] flex items-center justify-center flex-shrink-0">
            <Globe2 className="w-4.5 h-4.5 text-[oklch(0.12_0.008_260)]" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{SITE_NAME}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Travel Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-[oklch(0.72_0.13_82)] text-[oklch(0.12_0.008_260)] font-semibold shadow-sm"
                  : "text-white/50 hover:bg-white/6 hover:text-white/90"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge && !isActive && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/30 font-medium">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:bg-white/6 hover:text-white/70 transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Изход от системата</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
