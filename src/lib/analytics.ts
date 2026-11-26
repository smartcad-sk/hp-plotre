/**
 * dataLayer contract for hpplotre.sk. Events are always pushed to `window.dataLayer`
 * (harmless without a tag); Google tags load only after the visitor consents
 * (see ConsentManager) and only when IDs are configured:
 *   NEXT_PUBLIC_GA4_IDS   – comma separated, e.g. "G-XXXX,G-YYYY"
 *   NEXT_PUBLIC_GADS_ID   – e.g. "AW-123456789"
 */
export type AnalyticsEvent =
  | { event: "generate_lead"; form_id: string; lead_source: string }
  | { event: "click_phone"; link_url: string; link_text: string }
  | { event: "click_email"; link_url: string; link_text: string }
  | { event: "file_download"; file_name: string; file_extension: string; link_url: string; link_text: string }
  | { event: "click_outbound"; link_url: string; link_domain: string; link_text: string; outbound_type: "eshop" | "external" }
  | { event: "video_start"; video_provider: "youtube"; video_id: string; video_title: string }
  | { event: "cta_click"; cta_text: string; cta_url: string; cta_location: string }
  | { event: "consent_update"; analytics: boolean; marketing: boolean };

type DataLayerWindow = Window & { dataLayer?: unknown[] };

export const GA4_IDS = (process.env.NEXT_PUBLIC_GA4_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
export const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID?.trim() || undefined;
export const analyticsConfigured = GA4_IDS.length > 0 || !!GADS_ID;

export function track(e: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ ...e, page_path: window.location.pathname });
}
