export const SITE_NAME = "ViaPins";
export const SITE_TAGLINE = "Travel Platform";
export const SITE_FULL_NAME = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SITE_LOGO_PATH = "/brand/viapins-logo.png";
export const SITE_METADATA_TITLE = SITE_NAME;
export const SITE_METADATA_TEMPLATE = `%s | ${SITE_NAME}`;
export const SITE_DEFAULT_URL = "https://viapins.com";
export const SITE_CONTACT_EMAIL = "hello@viapins.com";
export const SITE_PRIVACY_EMAIL = "privacy@viapins.com";
export const SITE_LEGAL_EMAIL = "legal@viapins.com";

/** Local dev only — never enable SKIP_ADMIN_AUTH in production. */
export function adminAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.SKIP_ADMIN_AUTH === "true"
  );
}