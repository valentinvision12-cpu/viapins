"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Compass, Briefcase } from "lucide-react";
import { SiteLogo } from "@/components/public/site-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CORE_LOCALES } from "@/i18n/routing";
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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const dark = !scrolled && isDarkHeroPage;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#FDFBF7]/97 backdrop-blur-md border-b py-3"
          : isDarkHeroPage
          ? "bg-transparent py-5"
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
      <div className="container max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center group shrink-0">
          <SiteLogo dark={dark} />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={cn(
              "text-sm transition-colors duration-300",
              pathname === "/" || pathname === ""
                ? "font-semibold"
                : "",
              dark
                ? "text-white/70 hover:text-white"
                : "hover:opacity-80"
            )}
            style={dark ? undefined : { color: pathname === "/" ? LUXURY.bronze : LUXURY.textSecondary }}
          >
            {t("home")}
          </Link>
          <Link
            href="/my-passport"
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-300",
              isMyTrip
                ? dark
                  ? "text-white"
                  : "text-stone-900"
                : dark
                ? "text-white/70 hover:text-white"
                : "text-stone-600 hover:text-stone-900"
            )}
          >
            <Briefcase className="w-3.5 h-3.5" />
            {t("myPassport")}
            <NavTripBadge dark={dark} />
          </Link>
          <Link
            href="/adventures"
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-300",
              pathname.includes("/adventures")
                ? "text-orange-600"
                : dark
                ? "text-orange-200 hover:text-orange-100"
                : "text-orange-700 hover:text-orange-900"
            )}
          >
            <Compass className="w-3.5 h-3.5" />
            {t("adventures")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/my-passport"
            className={cn(
              "md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all",
              dark
                ? "border-white/15 text-white/70"
                : "border-stone-200 text-stone-600 bg-stone-50"
            )}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <NavTripBadge dark={dark} />
          </Link>
          {CORE_LOCALES.length > 1 && (
            <LanguageSwitcher variant={dark ? "default" : "minimal"} />
          )}
          <UserNav dark={dark} />
        </div>
      </div>
    </header>
  );
}
