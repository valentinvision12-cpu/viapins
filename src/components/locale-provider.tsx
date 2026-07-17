"use client";

import { useEffect } from "react";

interface LocaleProviderProps {
  locale: string;
  children: React.ReactNode;
}

/**
 * Sets the `lang` attribute on <html> to the current locale.
 * This is a client-side workaround because Next.js root layout
 * doesn't have access to dynamic route params.
 */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
