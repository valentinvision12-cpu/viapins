import { cn } from "@/lib/utils";
import { PASSPORT } from "@/lib/luxury-palette";

export type PassportStatItem = {
  id: string;
  label: string;
  value: string | number;
  /** e.g. "/ 195" under Countries */
  hint?: string;
};

interface Props {
  items: PassportStatItem[];
  className?: string;
  title?: string;
}

/**
 * Travel identity stats — visual “visa stamps” strip.
 * Presentational only: pass ready-to-display values.
 */
export function PassportStats({
  items,
  className,
  title = "Travel record",
}: Props) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label={title}
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{
        background: PASSPORT.card,
        border: `1px solid ${PASSPORT.cardBorder}`,
        boxShadow: PASSPORT.cardShadow,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(28,20,9,0.04) 0.6px, transparent 0.6px)",
          backgroundSize: "11px 11px",
        }}
      />

      <div
        className="relative px-4 pt-3.5 pb-2 sm:px-5"
        style={{ borderBottom: `1px solid ${PASSPORT.cardBorder}` }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: PASSPORT.accent }}
        >
          {title}
        </p>
      </div>

      <ul
        className={cn(
          "relative grid",
          items.length <= 3
            ? "grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
        )}
      >
        {items.map((item) => (
          <li
            key={item.id}
            className="relative flex flex-col items-center justify-center px-3 py-4 text-center sm:py-5"
            style={{
              boxShadow: `inset -1px 0 0 ${PASSPORT.cardBorder}, inset 0 -1px 0 ${PASSPORT.cardBorder}`,
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-2.5 h-2 w-2 border-l border-t opacity-45"
              style={{ borderColor: PASSPORT.accent }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2.5 right-2.5 h-2 w-2 border-b border-r opacity-45"
              style={{ borderColor: PASSPORT.accent }}
            />

            <span
              className="tabular-nums text-[1.65rem] font-black leading-none tracking-tight sm:text-[1.85rem]"
              style={{ color: PASSPORT.text }}
            >
              {item.value}
            </span>
            {item.hint ? (
              <span
                className="mt-0.5 text-[11px] font-semibold tabular-nums"
                style={{ color: PASSPORT.accent }}
              >
                {item.hint}
              </span>
            ) : null}
            <span
              className="mt-1.5 max-w-[7.5rem] text-[10px] font-semibold uppercase leading-snug tracking-[0.12em]"
              style={{ color: PASSPORT.textMuted }}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
