"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SiteLogo } from "@/components/public/site-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserNav } from "@/components/public/user-nav";
import { NavTripBadge } from "@/components/public/nav-trip-badge";
import { openCommandPalette } from "@/components/public/command-palette";
import { cn } from "@/lib/utils";
import { LUXURY } from "@/lib/luxury-palette";
import { useEffect, useState } from "react";
import { Command, Search } from "lucide-react";

export function NavHeader() {
  const t = useTranslations("nav");
  const tTrips = useTranslations("MyTrips");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const isDarkHeroPage = pathname.includes("/explore/");
  const isMyTrip = pathname.includes("/my-passport");
  const isAdventures = pathname.includes("/adventures");
  const isExplore = pathname === "/" || pathname === "";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const dark = !scrolled && isDarkHeroPage;

  function linkClass(active: boolean) {
    return cn(
      "text-[15px] font-medium tracking-wide transition-colors duration-300",
      active ? "font-semibold" : "",
      dark
        ? active
          ? "text-white"
          : "text-white/65 hover:text-white"
        : active
        ? ""
        : "hover:opacity-80"
    );
  }

  function linkStyle(active: boolean) {
    if (dark) return undefined;
    return { color: active ? LUXURY.bronze : LUXURY.textSecondary };
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#FDFBF7]/97 backdrop-blur-md border-b py-3.5"
          : isDarkHeroPage
          ? "bg-black/25 backdrop-blur-md border-b border-white/10 py-4"
          : "backdrop-blur-sm py-4 md:py-5"
      )}
      style={
        !scrolled && !isDarkHeroPage
          ? {
              backgroundColor: "rgba(247, 243, 235, 0.92)",
              borderBottom: `1px solid ${LUXURY.bronzeBorder}`,
            }
          : scrolled
          ? { borderColor: LUXURY.bronzeBorder }
          : undefined
      }
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center group shrink-0">
            <SiteLogo dark={dark} />
          </Link>
          <LanguageSwitcher variant={dark ? "default" : "minimal"} />
        </div>

        <nav className="hidden md:flex items-center gap-10 lg:gap-12">
          <Link
            href="/"
            className={linkClass(isExplore)}
            style={linkStyle(isExplore)}
          >
            {t("home")}
          </Link>
          <Link
            href="/adventures"
            className={linkClass(isAdventures)}
            style={linkStyle(isAdventures)}
          >
            {t("adventures")}
          </Link>
          <Link
            href="/my-passport"
            className={cn(
              "inline-flex items-center gap-2",
              linkClass(isMyTrip)
            )}
            style={linkStyle(isMyTrip)}
          >
            {tTrips("title")}
            <NavTripBadge dark={dark} />
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openCommandPalette}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
              dark
                ? "border-white/20 bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
                : "hover:opacity-90"
            )}
            style={
              dark
                ? undefined
                : {
                    borderColor: LUXURY.bronzeBorder,
                    background: LUXURY.creamCard,
                    color: LUXURY.textSecondary,
                  }
            }
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd
              className={cn(
                "hidden md:inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-mono text-[10px]",
                dark ? "border-white/15 bg-black/20 text-white/55" : ""
              )}
              style={
                dark
                  ? undefined
                  : {
                      borderColor: LUXURY.bronzeBorder,
                      color: LUXURY.textMuted,
                      background: LUXURY.section,
                    }
              }
            >
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
          <UserNav dark={dark} />
        </div>
      </div>
    </header>
  );
}
