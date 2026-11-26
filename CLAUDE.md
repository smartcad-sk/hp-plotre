@AGENTS.md

# hpplotre.sk – Next.js rebuild

Rebuild of the WordPress site https://hpplotre.sk (smartCAD s.r.o., HP large-format printers – sales & service).
Content language is **Slovak** (`lang="sk"`); keep all UI copy in Slovak.

## Stack
- Next.js 16 (App Router, `cacheComponents`, Turbopack), React 19, TypeScript strict, Tailwind CSS v4.
- **Read `node_modules/next/dist/docs/` before using a Next.js API** – this version differs from older training data
  (e.g. `middleware` is now `proxy`, request APIs are async).
- Playwright (`tests/`) for responsive, accessibility (axe) and SEO checks.
- Storybook (`.storybook/`, `src/**/*.stories.tsx`) is the design-system storyboard.

## Commands
| Task | Command |
| --- | --- |
| Dev server | `npm run dev` (http://localhost:3000) |
| Production build | `npm run build` then `npm start` |
| Lint / types | `npm run lint` · `npm run typecheck` |
| E2E tests (all devices) | `npm run test:e2e` |
| Storybook | `npm run storybook` (http://localhost:6006) |
| Re-import content | `npm run import:content` (crawls live hpplotre.sk) |

## Architecture
- `src/content/pages.json`, `posts.json` – **generated** by `scripts/import-content.mjs`. Don't hand-edit large
  chunks; fix the importer and re-run. HTML inside is already sanitized (allow-list) at import time.
- `src/lib/content.ts` – typed access to content (`getPage`, `getPost`, `allRoutes`…). Single source of truth.
- `src/lib/site.ts` – company info, navigation, contact details. Change nav/contact only here.
- `src/app/[...slug]/page.tsx` – renders every imported page/post; `src/app/page.tsx` – home.
- `src/components/ui/*` – design-system primitives (Button, Container, Section, Card, Heading…).
  `src/components/blocks/*` – content blocks mapping imported sections (content grid, slider, video, prose).
- Design tokens live in `src/app/globals.css` (`@theme`). **Never hard-code colors/spacing** in components –
  use the tokens (`bg-brand-600`, `text-ink`, …). Imported per-section background colors are mapped to tokens via
  `toneFromColor()`.
- Images: imported to `public/media/` and served through `next/image`. PDFs/videos stay on the original host.

## Conventions
- Server Components by default; add `"use client"` only for interactivity (mobile nav, slider, video facade).
- Every page needs `generateMetadata` (title, description, canonical). Keep `sitemap.ts`/`robots.ts` in sync with routes.
- Accessibility: one `<h1>` per page, visible focus states, 44px min tap targets, alt text on content images,
  WCAG AA contrast (check in Storybook a11y panel / axe tests).
- Responsiveness: mobile-first; test widths 320, 375, 414, 768, 1024, 1280, 1920. No horizontal scroll.
- Commit small, focused changes with conventional-commit style messages (`feat:`, `fix:`, `test:`, `docs:`…).

## Security
- Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) are set in `next.config.ts`.
  If you add a third-party origin (fonts, analytics, embeds), update the CSP there deliberately.
- Never commit `.env*` files or secrets. Third-party embeds (YouTube) load only after user click (privacy/GDPR).
- Never render unsanitized HTML; `dangerouslySetInnerHTML` is only allowed for content from `src/content/*.json`
  and for JSON-LD in `src/components/seo/JsonLd.tsx` (escapes `<`) and the static Consent Mode default in `layout.tsx`.
- Analytics: events go through `track()` in `src/lib/analytics.ts` (typed dataLayer contract). Google tags load only
  after opt-in consent (`ConsentManager`) and only if `NEXT_PUBLIC_GA4_IDS` / `NEXT_PUBLIC_GADS_ID` are set.
- The contact form has no backend yet – do not add one that emails/stores data without a spam/rate-limit strategy.
