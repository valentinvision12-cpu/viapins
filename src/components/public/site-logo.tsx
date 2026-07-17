import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site-brand";

type SiteLogoProps = {
  className?: string;
  dark?: boolean;
};

export function SiteLogo({ className, dark = false }: SiteLogoProps) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div
        className={cn(
          "rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          "w-10 h-10",
          dark ? "bg-white/12 ring-1 ring-white/20" : "bg-[#3D2914] ring-1 ring-[#3D2914]/10"
        )}
      >
        <MapPin
          className="w-[18px] h-[18px] text-[#E8C99B]"
          fill="#C4A574"
          strokeWidth={2.25}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-bold tracking-tight text-xl sm:text-[1.35rem]",
            dark ? "text-white" : "text-[#2C2416]"
          )}
        >
          Via<span className={dark ? "text-[#E8C99B]" : "text-[#9A7B4F]"}>Pins</span>
        </span>
        <span
          className={cn(
            "font-semibold uppercase tracking-[0.2em] mt-1 text-[10px] sm:text-[11px]",
            dark ? "text-white/60" : "text-[#6B5E52]"
          )}
          aria-hidden
        >
          {SITE_TAGLINE}
        </span>
        <span className="sr-only">{SITE_NAME}</span>
      </div>
    </div>
  );
}
