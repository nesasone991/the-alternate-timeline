# Deployment (no cost)

The app is a static site: `npm run build` produces `dist/`. No server, database, API key or payment method is needed. Check the provider's current free-tier terms and limits before deploying; they change.

## Cloudflare Pages (recommended)

The repo includes `public/_redirects` (SPA fallback so deep links like `/campaigns/fall-of-rome` work) and `public/_headers` (Content-Security-Policy and other security headers, long cache for hashed assets).

1. Push the repository to GitHub (private is fine).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo (dashboard labels change over time; look for the Pages "connect to Git" flow).
3. Build settings: framework preset **Vite** (or none), build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION` = `22`.
4. Deploy. The site is served at `<project>.pages.dev`. Do not add a custom domain or any paid add-on without owner approval.
5. Open `/campaigns/fall-of-rome/workspace` directly in a new tab to confirm the SPA fallback works, and check the response headers include `Content-Security-Policy`.

Never enter payment details for this project without owner approval. If the provider asks for them, stop and check whether a free option still exists.

## GitHub Pages (alternative)

GitHub Pages ignores `_redirects` and `_headers`.

- SPA fallback: after building, copy `dist/index.html` to `dist/404.html`.
- If deploying to `https://<user>.github.io/<repo>/`, set `base: '/<repo>/'` in `vite.config.ts`. The router reads Vite's base URL automatically, so no other change is needed.
- Security headers cannot be set; the app still works.

## Local production check

```bash
npm run build
npm run preview   # http://localhost:4173
```

## Before going public

- [ ] Historical review checklist complete (docs/HISTORICAL_REVIEW.md).
- [ ] Privacy page updated to name the host and link its policy.
- [ ] Licence chosen (LICENSE).
- [ ] Channel URLs added to `src/config/brand.ts` if they should appear in the footer.
