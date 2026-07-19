"use client";

import { useTranslations } from "next-intl";
import {
  computeAchievements,
  computePassportLevel,
  type AchievementInput,
} from "@/lib/passport-achievements";
import { PASSPORT } from "@/lib/luxury-palette";

interface Props {
  input: AchievementInput;
}

export function PassportAchievements({ input }: Props) {
  const t = useTranslations("myTrip");
  const level = computePassportLevel(input);
  const achievements = computeAchievements(input);

  return (
    <section
      className="mb-6 rounded-2xl border p-4 sm:p-5"
      style={{
        background: PASSPORT.card,
        borderColor: PASSPORT.cardBorder,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: PASSPORT.accent }}
          >
            {t("passportLevelEyebrow")}
          </p>
          <h2 className="mt-1 text-lg font-bold" style={{ color: PASSPORT.text }}>
            {t(level.labelKey)}
          </h2>
          {level.nextKey ? (
            <p className="mt-0.5 text-xs" style={{ color: PASSPORT.textMuted }}>
              {t(level.nextKey)}
            </p>
          ) : null}
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round(level.progress * 100)}%`,
              background: PASSPORT.accent,
            }}
          />
        </div>
      </div>

      <p
        className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: PASSPORT.textMuted }}
      >
        {t("passportAchievementsTitle")}
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {achievements.map((a) => (
          <li
            key={a.id}
            className="rounded-xl border px-3 py-2.5"
            style={{
              borderColor: PASSPORT.cardBorder,
              opacity: a.unlocked ? 1 : 0.45,
              background: a.unlocked ? PASSPORT.accentSoft : "transparent",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: PASSPORT.text }}
            >
              {t(`passportAchievement_${a.id}`)}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: PASSPORT.textMuted }}>
              {a.unlocked
                ? t("passportAchievementUnlocked")
                : t(`passportAchievementDesc_${a.id}`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
