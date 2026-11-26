/**
 * dataLayer contract for hpplotre.sk – consumed by Google Tag Manager.
 * Full spec + GTM container structure: docs/tracking-plan.md
 *
 * Rules
 *  - Event and parameter names follow GA4 recommended / enhanced-measurement naming
 *    so GA4 reports work without remapping.
 *  - Every push is a flat object with `event` + snake_case params (strings/numbers only).
 *  - Params that do not apply are sent as `undefined` so GTM's dataLayer model
 *    does not leak a value from a previous event into the next one.
 *  - GTM loads only after opt-in consent (see ConsentManager) and only if
 *    NEXT_PUBLIC_GTM_ID is set. Before that, pushes simply queue in window.dataLayer.
 */

export type PageType =
  | "home"
  | "product"
  | "product_category"
  | "service"
  | "blog_post"
  | "blog_index"
  | "contact"
  | "page"
  | "not_found";

export type LinkLocation = "header" | "mobile_menu" | "footer" | "content" | "cta_band" | "page_header" | "consent";

export type AnalyticsEvent =
  /** Virtual page view – fired on first load and on every client-side navigation. */
  | { event: "page_view"; page_location: string; page_path: string; page_title: string; page_type: PageType; page_referrer?: string }
  /** GA4 recommended event – valid contact form submission. */
  | { event: "generate_lead"; form_id: string; form_name: string; lead_source: PageType; value?: number; currency?: "EUR" }
  /** First interaction with a form field (funnel start). */
  | { event: "form_start"; form_id: string; form_name: string }
  /** Submission blocked by validation – which fields failed. */
  | { event: "form_error"; form_id: string; form_name: string; error_fields: string }
  /** Custom – tel: links (Ads phone-click conversion). */
  | { event: "click_phone"; link_url: string; link_text: string; link_location: LinkLocation }
  /** Custom – mailto: links. */
  | { event: "click_email"; link_url: string; link_text: string; link_location: LinkLocation }
  /** GA4 enhanced-measurement name – PDF / ZIP / driver downloads. */
  | { event: "file_download"; file_name: string; file_extension: string; link_url: string; link_text: string; link_location: LinkLocation }
  /** GA4 enhanced-measurement name for outbound links (`outbound: true`). */
  | { event: "click"; outbound: true; link_url: string; link_domain: string; link_text: string; link_location: LinkLocation; outbound_type: "eshop" | "social" | "external" }
  /** Custom – internal call-to-action buttons. */
  | { event: "cta_click"; link_url: string; link_text: string; link_location: LinkLocation }
  /** GA4 enhanced-measurement name – YouTube facade clicked. */
  | { event: "video_start"; video_provider: "youtube" | "html5"; video_title: string; video_url: string }
  /** Consent state – GTM trigger for tags that must re-evaluate consent. */
  | { event: "consent_update"; consent_analytics: "granted" | "denied"; consent_marketing: "granted" | "denied" };

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/** smartCAD container for hpplotre.sk (public ID). Override per environment with NEXT_PUBLIC_GTM_ID; set it to "off" to disable. */
const GTM_ENV = process.env.NEXT_PUBLIC_GTM_ID?.trim();
export const GTM_ID = GTM_ENV === "off" ? undefined : GTM_ENV || "GTM-5DFN7L8W";

// Keys that may be set by one event type – reset on every push (GTM merges dataLayer state).
const EVENT_KEYS = [
  "form_id", "form_name", "lead_source", "value", "currency", "error_fields",
  "link_url", "link_text", "link_location", "link_domain", "outbound", "outbound_type",
  "file_name", "file_extension", "video_provider", "video_title", "video_url",
  "consent_analytics", "consent_marketing", "page_referrer",
] as const;

export function track(e: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer ?? [];
  const reset = Object.fromEntries(EVENT_KEYS.map((k) => [k, undefined]));
  w.dataLayer.push({ ...reset, ...e });
}

/** Page type of the currently visible route (set by pages via `data-page-type`). */
export function currentPageType(): PageType {
  if (typeof document === "undefined") return "page";
  // With Cache Components, previously visited routes stay in the DOM but hidden – pick the visible one.
  const el = [...document.querySelectorAll<HTMLElement>("[data-page-type]")].find((n) => n.offsetParent !== null || n.getClientRects().length > 0);
  return (el?.dataset.pageType as PageType) ?? "page";
}

/** Which part of the layout a clicked element belongs to. */
export function linkLocation(el: Element): LinkLocation {
  if (el.closest("[data-location]")) return (el.closest("[data-location]") as HTMLElement).dataset.location as LinkLocation;
  if (el.closest("dialog")) return "mobile_menu";
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  return "content";
}
