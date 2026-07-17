# ViaPins — Production Refactor Report

**Date:** 12 July 2026
**Brand:** ViaPins (viapins.com)

## Build Status
- tsc: 0 errors
- npm run build: SUCCESS (53 pages)
- i18n MISSING_MESSAGE: fixed via English fallback

## This session fixes
- i18n English fallback for es/fr/de/it (src/i18n/request.ts)
- Bulgarian text removed from passport-route-card.tsx and route-scope.ts
- NEXT_PUBLIC_SITE_URL added to .env.local and .env.local.example
- New route.* i18n keys in messages/en.json

## Production env
NEXT_PUBLIC_SITE_URL=https://viapins.com
Do NOT use NODE_TLS_REJECT_UNAUTHORIZED=0 or SKIP_ADMIN_AUTH=true in production.

## Smoke test checklist
- Home, city map, route cart optimise+GPX, adventure map, passport, shared route, embed, AdBlock, auth, mobile
