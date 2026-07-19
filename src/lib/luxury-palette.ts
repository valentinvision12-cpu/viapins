/** Editorial luxury palette — warm, muted, retention-focused */
export const LUXURY = {
  cream: "#F7F3EB",
  creamCard: "#FDFBF7",
  creamDeep: "#F0EAE0",
  section: "#F5F0E8",
  text: "#1C1409",
  textSecondary: "#4A3F34",
  textMuted: "#6B5E52",
  bronze: "#8B6530",
  bronzeHover: "#704F22",
  bronzeMuted: "rgba(139, 101, 48, 0.55)",
  bronzeLight: "rgba(139, 101, 48, 0.08)",
  bronzeBorder: "rgba(139, 101, 48, 0.18)",
  bronzeBorderStrong: "rgba(139, 101, 48, 0.32)",
} as const;

/** My Passport — editorial profile surface (warm ivory, bronze accents) */
export const PASSPORT = {
  bg: LUXURY.cream,
  bgGradient: `linear-gradient(168deg, ${LUXURY.creamCard} 0%, ${LUXURY.section} 48%, ${LUXURY.creamDeep} 100%)`,
  card: LUXURY.creamCard,
  cardHover: "#FFFFFF",
  cardBorder: LUXURY.bronzeBorder,
  cardShadow: "0 1px 3px rgba(28, 20, 9, 0.06), 0 8px 24px rgba(28, 20, 9, 0.04)",
  cardShadowHover: "0 4px 16px rgba(28, 20, 9, 0.08), 0 12px 32px rgba(28, 20, 9, 0.06)",
  text: LUXURY.text,
  textSecondary: LUXURY.textSecondary,
  textMuted: LUXURY.textMuted,
  accent: LUXURY.bronze,
  accentSoft: LUXURY.bronzeLight,
  accentBorder: LUXURY.bronzeBorderStrong,
  heroGradient: `linear-gradient(135deg, rgba(139, 101, 48, 0.12) 0%, rgba(247, 243, 235, 0.6) 55%, ${LUXURY.creamCard} 100%)`,
} as const;

/** Palette extracted from the compass artwork — pale blue-teal wash */
export const COMPASS = {
  mist: "#E6F0F4",
  sky: "#D2E4EB",
  teal: "#8AADB8",
  silver: "#B8CDD6",
  deep: "#3A5C6E",
  navy: "#2A4555",
  grid: "rgba(58, 92, 110, 0.1)",
  glow: "rgba(138, 173, 184, 0.22)",
  textScrim: "rgba(230, 240, 244, 0.82)",
} as const;
