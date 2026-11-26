"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { currentPageType, track } from "@/lib/analytics";

/**
 * Pushes a virtual `page_view` on first load and after every client-side navigation
 * (Next.js does not reload the page, so GA4's automatic page_view would only see the
 * landing page). In GTM the GA4 Google tag must have `send_page_view: false`.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    // Wait a frame so the new route's DOM (title, data-page-type) is committed.
    const id = requestAnimationFrame(() => {
      track({
        event: "page_view",
        page_location: window.location.href,
        page_path: window.location.pathname,
        page_title: document.title,
        page_type: currentPageType(),
        page_referrer: previous.current ? new URL(previous.current, window.location.origin).href : document.referrer || undefined,
      });
      previous.current = window.location.pathname;
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
