"use client";

import { useTranslations } from "next-intl";
import { Ban, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { LUXURY } from "@/lib/luxury-palette";

interface Props {
  variant?: "home" | "city" | "compact";
  className?: string;
}

const ICONS = [Ban, MapPin, Sparkles, CheckCircle2] as const;

export function TrustPromise({ variant = "home", className = "" }: Props) {
  const t = useTranslations("trust");
  const items = ["overload", "fake", "fees", "app"] as const;

  if (variant === "compact") {
    return (
      <p
        className={`text-center text-xs leading-relaxed ${className}`}
        style={{ color: LUXURY.textMuted }}
      >
        {t("compact")}
      </p>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 ${className}`}
      style={{
        background: variant === "city" ? "white" : "rgba(253,251,247,0.92)",
        borderColor: LUXURY.bronzeBorder,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3 text-center"
        style={{ color: LUXURY.bronze }}
      >
        {t("title")}
      </p>
      <ul className="grid sm:grid-cols-2 gap-3">
        {items.map((key, i) => {
          const Icon = ICONS[i];
          return (
            <li key={key} className="flex gap-2.5 items-start text-left">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${LUXURY.bronze}18`, color: LUXURY.bronze }}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-stone-400 text-[11px] line-through decoration-stone-300/80">
                  {t(`${key}Problem`)}
                </p>
                <p className="text-stone-800 text-xs font-medium leading-snug mt-0.5">
                  {t(`${key}Solution`)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
