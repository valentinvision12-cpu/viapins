import {
  applyInternalLinks,
  getHubIndex,
} from "@/lib/seo/internal-linking";

type Props = {
  text: string | null | undefined;
  currentPath: string;
  locale?: string;
  maxLinks?: number;
  className?: string;
  as?: "p" | "div";
};

/**
 * Server component: renders plain text with auto internal links to hub pages.
 */
export async function LinkedProse({
  text,
  currentPath,
  locale,
  maxLinks = 4,
  className,
  as = "p",
}: Props) {
  const raw = (text ?? "").trim();
  if (!raw) return null;

  const hubs = await getHubIndex();
  const html = applyInternalLinks(raw, hubs, {
    currentPath,
    locale,
    maxLinks,
  });

  const Tag = as;
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
