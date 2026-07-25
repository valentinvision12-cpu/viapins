import { Link } from "@/i18n/navigation";
import { ArrowRight, BookOpen, Compass, MapPin, Landmark } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  pickRelatedContent,
  type RelatedContentContext,
  type RelatedContentItem,
} from "@/lib/seo/related-content";

type Props = RelatedContentContext & {
  locale: string;
  className?: string;
};

function KindIcon({ kind }: { kind: RelatedContentItem["kind"] }) {
  if (kind === "guide") return <BookOpen className="h-3.5 w-3.5" />;
  if (kind === "adventure") return <Compass className="h-3.5 w-3.5" />;
  if (kind === "place") return <Landmark className="h-3.5 w-3.5" />;
  return <MapPin className="h-3.5 w-3.5" />;
}

export async function RelatedContent({
  locale,
  className,
  ...ctx
}: Props) {
  const items = await pickRelatedContent(ctx);
  if (items.length === 0) return null;

  let title = "Related content";
  let explore = "Explore";
  try {
    const t = await getTranslations({ locale, namespace: "relatedContent" });
    title = t("title");
    explore = t("explore");
  } catch {
    // English fallbacks when namespace missing in a locale file.
  }

  return (
    <section
      className={
        className ?? "container mx-auto max-w-4xl px-6 pt-10 pb-14"
      }
      aria-labelledby="related-content-heading"
    >
      <header className="mb-6 flex items-center gap-2.5">
        <h2
          id="related-content-heading"
          className="text-base font-bold tracking-tight text-stone-800"
        >
          {title}
        </h2>
        <div className="h-px flex-1 bg-stone-200" />
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              locale={locale}
              className="group flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white/70 px-4 py-3 transition-colors hover:border-amber-300/70 hover:bg-amber-50/40"
            >
              <span className="mt-0.5 text-amber-700/80">
                <KindIcon kind={item.kind} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-900 group-hover:text-amber-950">
                  {item.title}
                </span>
                {item.subtitle ? (
                  <span className="mt-0.5 block text-xs text-stone-500">
                    {item.subtitle}
                  </span>
                ) : null}
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-stone-600">
                  {explore}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
