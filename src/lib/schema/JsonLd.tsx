import type { JsonLdGraph } from "./types";
import { serializeJsonLd } from "./utils";

export function toJsonLdScript(data: JsonLdGraph): string {
  return serializeJsonLd(data);
}

export function JsonLd({ data }: { data: JsonLdGraph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLdScript(data) }}
    />
  );
}
