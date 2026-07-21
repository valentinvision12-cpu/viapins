"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SiteLogo } from "@/components/public/site-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserNav } from "@/components/public/user-nav";
import { NavTripBadge } from "@/components/public/nav-trip-badge";
import { cn } from "@/lib/utils";
import { LUXURY } from "@/lib/luxury-palette";
import { useEffect, useState } from "react";

export function NavHeader() {
  const t = useTranslations("nav");
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
            {t("myPassport")}
            <NavTripBadge dark={dark} />
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <UserNav dark={dark} />
        </div>
      </div>
    </header>
  );
}
