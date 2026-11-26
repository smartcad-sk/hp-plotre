"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

const ESHOP_HOST = "kancelaria.smartcad.sk";
const FILE_EXT = /\.(pdf|zip|exe|msi|dmg|docx?|xlsx?)(\?|$)/i;

/** One delegated listener that turns link clicks into dataLayer events. */
export function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.href;
      const text = (a.textContent ?? "").replace(/\s+/g, " ").replace("(otvorí sa v novom okne)", "").trim().slice(0, 100);

      if (href.startsWith("tel:")) return track({ event: "click_phone", link_url: href, link_text: text });
      if (href.startsWith("mailto:")) return track({ event: "click_email", link_url: href.split("?")[0], link_text: text });

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
        });
      }
      if (url.origin !== window.location.origin) {
        return track({
          event: "click_outbound",
          link_url: href,
          link_domain: url.hostname,
          link_text: text,
          outbound_type: url.hostname === ESHOP_HOST ? "eshop" : "external",
        });
      }
      if (a.dataset.cta !== undefined) {
        track({ event: "cta_click", cta_text: text, cta_url: url.pathname, cta_location: a.dataset.cta || "page" });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
