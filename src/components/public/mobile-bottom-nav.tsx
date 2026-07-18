"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Home, Globe, Heart, User } from "lucide-react";
import { useFavorites } from "@/lib/context/favorites-context";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { key: "home",    href: "/",            icon: "Home",  label: "Home"    },
  { key: "explore", href: "/explore",     icon: "Globe", label: "Explore" },
  { key: "saved",   href: "/my-passport", icon: "Heart", label: "Saved"   },
  { key: "profile", href: "/my-passport", icon: "User",  label: "Profile" },
] as const;

function matchKey(pathname: string, key: string): boolean {
  if (key === "home")    return pathname === "/" || pathname === "";
  if (key === "explore") return pathname.includes("/explore");
  if (key === "saved")   return pathname.includes("/my-passport");
  if (key === "profile") return pathname.includes("/my-passport");
  return false;
}

const ICON_MAP: Record<string, React.ElementType> = { Home, Globe, Heart, User };

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalFavorites } = useFavorites();

  if (pathname.includes("/my-passport")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-white/85 backdrop-blur-xl border-t border-stone-200/70" />
      <div className="relative container max-w-lg mx-auto px-6 py-2 pb-safe">
        <div className="grid grid-cols-4 gap-1">
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
                  <Icon className={`w-5 h-5 relative z-10 transition-all ${active ? "stroke-[2.5px]" : "stroke-[1.75px]"} ${item.key === "saved" && active ? "fill-red-500 text-red-500" : ""}`} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none z-20">
                      {totalFavorites > 99 ? "99+" : totalFavorites}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium relative z-10 leading-none ${active ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}