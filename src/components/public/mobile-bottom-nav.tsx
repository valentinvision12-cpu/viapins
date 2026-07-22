"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Globe, MapPin, Bookmark } from "lucide-react";
import { useRouteCart } from "@/lib/context/route-cart-context";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { key: "explore", href: "/", icon: "Globe", labelKey: "home", namespace: "nav" as const },
  { key: "route", icon: "MapPin", labelKey: "myRoute", namespace: "nav" as const },
  { key: "saved", href: "/my-passport", icon: "Bookmark", labelKey: "title", namespace: "MyTrips" as const },
] as const;

function matchKey(pathname: string, key: string): boolean {
  if (key === "explore") return pathname === "/" || pathname === "";
  if (key === "saved") return pathname.includes("/my-passport");
  return false;
}

const ICON_MAP: Record<string, React.ElementType> = { Globe, MapPin, Bookmark };

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, openPanel } = useRouteCart();
  const tNav = useTranslations("nav");
  const tTrips = useTranslations("MyTrips");

  if (pathname.includes("/my-passport")) return null;

  function labelFor(item: (typeof NAV_ITEMS)[number]) {
    return item.namespace === "MyTrips" ? tTrips(item.labelKey) : tNav(item.labelKey);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-stone-200/70" />
      <div className="relative container max-w-lg mx-auto px-6 py-2 pb-safe">
        <div className="grid grid-cols-3 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.key === "route" ? false : matchKey(pathname, item.key);
            const showBadge = item.key === "route" && totalItems > 0;
            const Icon = ICON_MAP[item.icon];
            const label = labelFor(item);

            if (item.key === "route") {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => totalItems > 0 && openPanel()}
                  disabled={totalItems === 0}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-2xl transition-all active:scale-95 ${
                    totalItems > 0 ? "text-stone-900" : "text-stone-300"
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 stroke-[1.75px]" />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none z-20"
                        style={{ background: "oklch(0.68 0.16 82)" }}
                      >
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href!}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-2xl transition-all active:scale-95 ${
                  active ? "text-stone-900" : "text-stone-400 hover:text-stone-700"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 rounded-2xl bg-stone-100"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 ${active ? "stroke-[2.5px]" : "stroke-[1.75px]"}`}
                />
                <span className={`text-[10px] font-medium relative z-10 leading-none ${active ? "font-semibold" : ""}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
