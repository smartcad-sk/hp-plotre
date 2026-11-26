# Site audit – live hpplotre.sk vs. Next.js rebuild

Re-run any time: `npm run build && npm start`, then `node scripts/audit-site.mjs` → `audit/site-audit.json`.

## Pages
- All 61 live pages and 9 posts in the WordPress sitemaps exist in the rebuild.
- WordPress-only URLs now get 301 redirects: 28 attachment pages (e.g. `/stary_za_novy/kampan2`), `/category/*`,
  `/feed`, `/kontaktny-formular`, `/rady_tipy`, `/bazar`, `/hp-designjet-t120-printer`, the URL-titled bazaar page.
- Unknown URLs return HTTP 404 (the live site's homepage would otherwise be duplicated).

## Images
- 246 content images are imported, and none are broken. `.avif` images (diagnostika page) were missing and have been fixed.
- Intentional differences: the home hero uses an optimized 15 KB WebP instead of a 1.2 MB PNG, and the contact page doesn't use the `portfolio.jpg` background.

## Links
- Fixed: about 60 links were lost in the first import, including spec PDFs, e-shop links, consumables and service tiles.
  The causes were linked slides, links inside text slides, and images wrapped in links.
- **Broken on the e-shop (also broken on the live site). These need fixing in kancelaria.smartcad.sk or in the content:**
  - `https://kancelaria.smartcad.sk/plotroverole/` (+ sorted/paged variants) – Z6810, Z6610, Z9 Pro, Z6 Pro, T940, T600, Studio, T830
  - `https://kancelaria.smartcad.sk/pr80g/` – T600, T200, Studio
  - `https://kancelaria.smartcad.sk/hp711printheadreplacementkit-sk` – T500, T100, T520
  - `https://kancelaria.smartcad.sk/hp-dh-pro-2-42-in-scanner` – HD Pro 2
  - `https://kancelaria.smartcad.sk/velkoformatove-scannery/` – SD Pro
  - `https://kancelaria.smartcad.sk/t730` – T730
- A WordPress fatal-error block was embedded in 8 live blog posts and linked to wordpress.org. It isn't carried over.

## Metadata
- Every page has a unique title, a description of 158 characters or fewer, a canonical URL, Open Graph tags and JSON-LD.
- Yoast reused one description on 6 posts and 2 page pairs. These are now de-duplicated, and the pages that lost it fall back to their own text.
- 59 of the 68 live pages have **no `<h1>`**. Every rebuilt page has exactly one.

## Tracking / dataLayer
- **Live site:** Complianz opt-in consent; GA4 `G-C4J5Q9T7V2` and `G-XX30HXQ0MC`; Universal Analytics `UA-198004299-1`
  (shut down by Google in 2023, so dead); Google Ads `AW-416814067`; LinkedIn Insight. **Pageviews only.** Leads,
  phone/e-mail clicks, PDF downloads and e-shop clicks are not measured.
- **Rebuild:**
  - Opt-in banner with Google Consent Mode v2 (default *denied*), which can be reopened from the footer.
  - A typed dataLayer with these events: `generate_lead`, `click_phone`, `click_email`, `file_download`,
    `click_outbound` (`outbound_type: eshop|external`), `video_start`, `cta_click` and `consent_update`.
  - Every event carries `page_path`.
  - Google tags load only after consent **and** only when `NEXT_PUBLIC_GA4_IDS` / `NEXT_PUBLIC_GADS_ID` are set.
    They are not set yet, so no data leaves the site.
- LinkedIn Insight isn't ported. It can be added under the "marketing" consent category.

## Design consistency (fixed)
- The menu listed "Bazár plotrov" 3×.
- Internal links opened in new tabs.
- White text on `#49a7b1` failed contrast.
- ALL CAPS and lowercase headings.
- Raw URLs were shown as link text.
- Buttons and phone numbers wrapped mid-label.
- The footer had no social links.
