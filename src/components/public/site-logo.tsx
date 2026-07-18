import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site-brand";

type SiteLogoProps = {
  className?: string;
  dark?: boolean;
};

function PinMark({ dark }: { dark: boolean }) {
  return (
    <svg
      width="28"
      height="32"
      viewBox="0 0 28 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="pin-grad-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C4935A" />
          <stop offset="100%" stopColor="#8B6130" />
        </linearGradient>
        <linearGradient id="pin-grad-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8C99B" />
          <stop offset="100%" stopColor="#C4935A" />
        </linearGradient>
      </defs>
      {/* Pin body */}
      <path
        d="M14 2C8.477 2 4 6.477 4 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10Z"
        fill={dark ? "url(#pin-grad-dark)" : "url(#pin-grad-light)"}
      />
      {/* Inner dot */}
      <circle cx="14" cy="12" r="3.5" fill="white" fillOpacity={dark ? 0.95 : 0.9} />
    </svg>
  );
}

export function SiteLogo({ className, dark = false }: SiteLogoProps) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <PinMark dark={dark} />
      <span
        className={cn(
          "font-bold tracking-tight leading-none text-[1.35rem]",
          dark ? "text-white" : "text-[#1C1409]"
        )}
      >
        via<span className={dark ? "text-[#E8C99B]" : "text-[#9A7B4F]"}>pins</span>
      </span>
      <span className="sr-only">{SITE_NAME}</span>
    </div>
  );
}
