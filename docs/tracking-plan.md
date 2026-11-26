# Tracking plan – hpplotre.sk (GTM + GA4 + Google Ads)

The website only **pushes events to `window.dataLayer`**. Everything else (GA4, Ads conversions, LinkedIn, etc.)
is configured in **Google Tag Manager**. The code that implements the contract is `src/lib/analytics.ts`.

## 1. Setup

| What | Where | Value |
| --- | --- | --- |
| GTM container ID | Default in `src/lib/analytics.ts` | `GTM-5DFN7L8W` (override with `NEXT_PUBLIC_GTM_ID`, `off` disables) |
| GA4 property | GTM constant `CONST - GA4 Measurement ID` | `G-Z3TY0XF1SL` |
| Local testing | `.env.local` (not committed) | same variable |

A redeploy is required after the variable changes (it is inlined at build time).

**Consent behaviour (basic Consent Mode v2)**
1. `<head>` sets `gtag('consent','default', { analytics_storage, ad_storage, ad_user_data, ad_personalization: 'denied' })`.
2. The visitor chooses in the cookie banner. Categories: *Štatistiky* = `analytics_storage`, *Marketing* = `ad_*`.
3. The site calls `gtag('consent','update', …)`, pushes `consent_update` and **only then loads GTM**, if at least one
   category was granted. Nothing loads from Google before consent. This matches the previous Complianz behaviour.
4. The choice is stored in `localStorage["hpplotre-consent-v1"]`. A returning visitor's consent is re-applied on every page.
   The footer has a **Nastavenia cookies** link that reopens the banner.

## 2. dataLayer events

Rules:
- Every push is flat: `{ event, ...params }`, snake_case, strings or numbers.
- Every push resets all event-specific keys to `undefined`, so no value leaks from a previous event (GTM merges dataLayer state).
- Names follow GA4 **recommended / enhanced-measurement** names, so standard GA4 reports work.
  ➜ In the GA4 property, **turn off Enhanced Measurement** for *Outbound clicks*, *File downloads*, *Form interactions*,
  *Video engagement* and *Page changes based on browser history*. Otherwise those events are counted twice.

| Event | When | Parameters |
| --- | --- | --- |
| `page_view` | First load **and every client-side navigation** (Next.js does not reload the page) | `page_location`, `page_path`, `page_title`, `page_type`, `page_referrer` |
| `generate_lead` | Valid contact form submit (opens the mail client) | `form_id`, `form_name`, `lead_source` (= `page_type`) |
| `form_start` | First focus in the contact form | `form_id`, `form_name` |
| `form_error` | Submit blocked by validation | `form_id`, `form_name`, `error_fields` (e.g. `email,consent`) |
| `click_phone` | `tel:` link | `link_url`, `link_text`, `link_location` |
| `click_email` | `mailto:` link | `link_url`, `link_text`, `link_location` |
| `file_download` | PDF / ZIP / EXE / DOCX / XLSX link (tech specs, drivers) | `file_name`, `file_extension`, `link_url`, `link_text`, `link_location` |
| `click` | Link to another domain | `outbound` (= `true`), `outbound_type` (`eshop` \| `social` \| `external`), `link_url`, `link_domain`, `link_text`, `link_location` |
| `cta_click` | Internal call-to-action button | `link_url`, `link_text`, `link_location` |
| `video_start` | YouTube facade clicked / MP4 first play | `video_provider` (`youtube` \| `html5`), `video_title`, `video_url` |
| `consent_update` | Banner choice saved | `consent_analytics`, `consent_marketing` (`granted` \| `denied`) |

**`page_type` values:** `home`, `product`, `product_category`, `service`, `blog_post`, `blog_index`, `contact`, `page`, `not_found`

**`link_location` values:** `header`, `mobile_menu`, `footer`, `content`, `cta_band`, `page_header`, `consent`

`outbound_type = eshop` means a link to `kancelaria.smartcad.sk`. This is the main "purchase intent" signal.

## 3. Proposed GTM container structure

### Variables (Data Layer Variable, version 2)
`DLV - page_type`, `DLV - page_location`, `DLV - page_path`, `DLV - page_title`, `DLV - page_referrer`,
`DLV - form_id`, `DLV - form_name`, `DLV - lead_source`, `DLV - error_fields`,
`DLV - link_url`, `DLV - link_text`, `DLV - link_domain`, `DLV - link_location`, `DLV - outbound`, `DLV - outbound_type`,
`DLV - file_name`, `DLV - file_extension`, `DLV - video_provider`, `DLV - video_title`, `DLV - video_url`
Constant: `CONST - GA4 Measurement ID`

### Triggers (Custom Event, exact match)
| Trigger | Event name | Extra condition |
| --- | --- | --- |
| `CE - page_view` | `page_view` | – |
| `CE - generate_lead` | `generate_lead` | – |
| `CE - form_start` / `CE - form_error` | `form_start` / `form_error` | – |
| `CE - click_phone` / `CE - click_email` | `click_phone` / `click_email` | – |
| `CE - file_download` | `file_download` | – |
| `CE - outbound click` | `click` | `DLV - outbound` equals `true` |
| `CE - eshop click` | `click` | `DLV - outbound_type` equals `eshop` |
| `CE - cta_click` | `cta_click` | – |
| `CE - video_start` | `video_start` | – |

> **Don't** use GTM's built-in *Page View* / *History Change* triggers for GA4 page views. The site sends `page_view` itself.

### Tags
| Tag | Type | Trigger | Consent check (Advanced settings → Consent) |
| --- | --- | --- | --- |
| `GA4 - Google tag` | Google tag, ID = GA4 constant, config parameter **`send_page_view = false`** | *Initialization – All Pages* | `analytics_storage` |
| `GA4 - page_view` | GA4 Event `page_view` + `page_location`, `page_title`, `page_referrer`, `page_type` | `CE - page_view` | `analytics_storage` |
| `GA4 - generate_lead` | GA4 Event, params `form_id`, `form_name`, `lead_source` | `CE - generate_lead` | `analytics_storage` |
| `GA4 - form_start` / `form_error` | GA4 Event | matching CE | `analytics_storage` |
| `GA4 - click_phone` / `click_email` | GA4 Event + `link_*` | matching CE | `analytics_storage` |
| `GA4 - file_download` | GA4 Event + `file_*`, `link_*` | `CE - file_download` | `analytics_storage` |
| `GA4 - click (outbound)` | GA4 Event `click` + `outbound`, `outbound_type`, `link_*` | `CE - outbound click` | `analytics_storage` |
| `GA4 - cta_click` | GA4 Event | `CE - cta_click` | `analytics_storage` |
| `GA4 - video_start` | GA4 Event + `video_*` | `CE - video_start` | `analytics_storage` |
| `Ads - Conversion Linker` | Conversion Linker | *All Pages* | `ad_storage` |
| `Ads - Lead` | Google Ads Conversion (AW-416814067 / *label*) | `CE - generate_lead` | `ad_storage`, `ad_user_data` |
| `Ads - Phone click` | Google Ads Conversion | `CE - click_phone` | `ad_storage`, `ad_user_data` |
| `Ads - E-shop click` (optional) | Google Ads Conversion | `CE - eshop click` | `ad_storage`, `ad_user_data` |
| `LinkedIn Insight` (optional) | LinkedIn template | *Initialization – All Pages* | `ad_storage` |

Container **Consent Overview** must be enabled. Every tag uses "Require additional consent" as listed above.

### GA4 property configuration
- **Custom dimensions** (event scope): `page_type`, `link_location`, `outbound_type`, `form_id`, `lead_source`, `error_fields`.
- **Key events:** `generate_lead` (primary), `click_phone`, `click_email`. Optionally the `click` event with `outbound_type = eshop`,
  or create a derived event `eshop_click` in GA4.
- Data retention: 14 months. Internal traffic filter for the smartCAD office IP.

## 3b. Importing the container
`node scripts/gtm/build-container.mjs private/gtm/<export>.json` generates
`private/gtm/GTM-5DFN7L8W_tracking-plan.json` (private/ is gitignored). It contains every variable, trigger and tag above.
The existing *GA4 - page view* Google tag is updated (renamed *GA4 - Google tag*, `send_page_view=false`, consent).
GTM → Admin → **Import Container** → choose the file → workspace *Default/new* → **Merge** → *Overwrite conflicting*.
Then add the Ads conversion labels to the 3 paused `Ads - Conversion - …` tags, unpause them, Preview, and Publish.

## 4. What I need from you
1. **GTM container ID** (`GTM-…`), or the exported container JSON if you want me to review it.
2. **Which GA4 property should stay.** The old site sends to two: `G-XX30HXQ0MC` and `G-C4J5Q9T7V2`.
   Universal Analytics `UA-198004299-1` is dead and should be removed.
3. **Google Ads conversion labels** for Lead / Phone (account `AW-416814067`).
4. Whether LinkedIn Insight should stay (marketing consent).

## 5. QA checklist
- GTM **Preview** (Tag Assistant). Accept cookies → the container loads; `page_view` fires once per navigation.
- Reject cookies → no request to `googletagmanager.com` / `google-analytics.com` (covered by `tests/analytics.spec.ts`).
- GA4 **DebugView**: lead flow, PDF download, e-shop click, video, phone click.
- Automated: `npx playwright test tests/analytics.spec.ts` checks the dataLayer contract.
