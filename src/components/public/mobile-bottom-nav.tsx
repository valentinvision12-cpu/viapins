"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Globe, Heart, Users } from "lucide-react";
import { useFavorites } from "@/lib/context/favorites-context";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { key: "explore", href: "/", icon: "Globe", labelKey: "home" },
  { key: "saved", href: "/my-passport", icon: "Heart", labelKey: "myPassport" },
  { key: "community", href: "/discover", icon: "Users", labelKey: "community" },
] as const;

function matchKey(pathname: string, key: string): boolean {
  if (key === "explore") return pathname === "/" || pathname === "";
  if (key === "saved") return pathname.includes("/my-passport");
  if (key === "community") return pathname.includes("/discover");
  return false;
}

const ICON_MAP: Record<string, React.ElementType> = { Globe, Heart, Users };

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalFavorites } = useFavorites();
  const t = useTranslations("nav");

  if (pathname.includes("/my-passport")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-white/85 backdrop-blur-xl border-t border-stone-200/70" />
      <div className="relative container max-w-lg mx-auto px-6 py-2 pb-safe">
        <div className="grid grid-cols-3 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = matchKey(pathname, item.key);
            const showBadge = item.key === "saved" && totalFavorites > 0;
            const Icon = ICON_MAP[item.icon];

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-2xl transition-all active:scale-95 ${active ? "text-stone-900" : "text-stone-400 hover:text-stone-700"}`}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 rounded-2xl bg-stone-100"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 relative z-10 transition-all ${active ? "stroke-[2.5px]" : "stroke-[1.75px]"} ${item.key === "saved" && active ? "fill-red-500 text-red-500" : ""}`}
                  />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none z-20">
                      {totalFavorites > 99 ? "99+" : totalFavorites}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium relative z-10 leading-none ${active ? "font-semibold" : ""}`}>
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
