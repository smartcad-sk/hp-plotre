"use client";

import { useEffect } from "react";
import { linkLocation, track } from "@/lib/analytics";

const ESHOP_HOST = "kancelaria.smartcad.sk";
const SOCIAL_HOST = /(^|\.)(facebook|instagram|linkedin|youtube)\.com$/;
const FILE_EXT = /\.(pdf|zip|exe|msi|dmg|docx?|xlsx?)(\?|$)/i;

const linkText = (a: HTMLAnchorElement) =>
  (a.getAttribute("aria-label") || a.textContent || "")
    .replace("(otvorí sa v novom okne)", "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

/** One delegated listener that turns link clicks into dataLayer events. */
export function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.href;
      const text = linkText(a);
      const location = linkLocation(a);

      if (href.startsWith("tel:")) return track({ event: "click_phone", link_url: href, link_text: text, link_location: location });
      if (href.startsWith("mailto:"))
        return track({ event: "click_email", link_url: href.split("?")[0], link_text: text, link_location: location });

      let url: URL;
      try {
        url = new URL(href);
      } catch {
        return;
      }
      const ext = url.pathname.match(FILE_EXT)?.[1]?.toLowerCase();
      if (ext) {
        return track({
          event: "file_download",
          file_name: decodeURIComponent(url.pathname.split("/").pop() ?? ""),
          file_extension: ext,
          link_url: href,
          link_text: text,
          link_location: location,
        });
      }
      if (url.origin !== window.location.origin) {
        return track({
          event: "click",
          outbound: true,
          link_url: href,
          link_domain: url.hostname,
          link_text: text,
          link_location: location,
          outbound_type: url.hostname === ESHOP_HOST ? "eshop" : SOCIAL_HOST.test(url.hostname) ? "social" : "external",
        });
      }
      if (a.dataset.cta !== undefined) {
        track({ event: "cta_click", link_url: url.pathname, link_text: text, link_location: location });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
