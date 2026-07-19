import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site-brand";

type SiteLogoProps = {
  className?: string;
  dark?: boolean;
};

function PinMark({ dark }: { dark: boolean }) {
  return (
    <svg
      width="34"
      height="40"
      viewBox="0 0 28 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="drop-shadow-sm"
    >
      <defs>
        <linearGradient id="pin-grad-vivid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF7A45" />
          <stop offset="100%" stopColor="#E8482C" />
        </linearGradient>
      </defs>
      {/* Pin body — vivid, high-contrast against both light and dark backgrounds */}
      <path
        d="M14 2C8.477 2 4 6.477 4 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10Z"
        fill="url(#pin-grad-vivid)"
        stroke={dark ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.6)"}
        strokeWidth="0.5"
      />
      {/* Inner dot */}
      <circle cx="14" cy="12" r="4" fill="white" />
    </svg>
  );
}

export function SiteLogo({ className, dark = false }: SiteLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <PinMark dark={dark} />
      <span
        className={cn(
          "font-extrabold tracking-tight leading-none text-[1.65rem] sm:text-[1.8rem]",
          dark ? "text-white" : "text-[#1C1409]"
        )}
      >
        Via<span className="text-[#E8482C]">Pins</span>
      </span>
      <span className="sr-only">{SITE_NAME}</span>
    </div>
  );
}
