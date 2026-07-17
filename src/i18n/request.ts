import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { routing } from "./routing";

function deepMerge(
  base: AbstractIntlMessages,
  override: AbstractIntlMessages
): AbstractIntlMessages {
  const out: AbstractIntlMessages = { ...base };
  for (const key of Object.keys(override)) {
    const b = base[key];
    const o = override[key];
    if (
      b &&
      o &&
      typeof b === "object" &&
      typeof o === "object" &&
      !Array.isArray(b) &&
      !Array.isArray(o)
    ) {
      out[key] = deepMerge(
        b as AbstractIntlMessages,
        o as AbstractIntlMessages
      );
    } else if (o !== undefined) {
      out[key] = o;
    }
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  const enMessages = (await import("../../messages/en.json")).default as AbstractIntlMessages;
  const localeMessages =
    locale === "en"
      ? enMessages
      : deepMerge(
          enMessages,
          (await import(`../../messages/${locale}.json`)).default as AbstractIntlMessages
        );

  return {
    locale,
    messages: localeMessages,
  };
});
