"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { currentPageType, track } from "@/lib/analytics";

/**
 * Pushes a virtual `page_view` on first load and after every client-side navigation
 * (Next.js does not reload the page, so GA4's automatic page_view would only see the
 * landing page). In GTM the GA4 Google tag must have `send_page_view: false`.
 *
 * After a client-side navigation Next.js updates <title> a moment after the route renders,
 * so wait (max ~1 s) until the title has changed before reporting.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);
  const previousTitle = useRef<string | null>(null);

  useEffect(() => {
    let tries = 0;
    let timer: number | undefined;
    const send = () => {
      const title = document.title;
      const titleReady = title !== "" && (previousTitle.current === null || title !== previousTitle.current);
      if (!titleReady && tries++ < 20) {
        timer = window.setTimeout(send, 50);
        return;
      }
      track({
        event: "page_view",
        page_location: window.location.href,
        page_path: window.location.pathname,
        page_title: title,
        page_type: currentPageType(),
        page_referrer: previousPath.current
          ? new URL(previousPath.current, window.location.origin).href
          : document.referrer || undefined,
      });
      previousPath.current = window.location.pathname;
      previousTitle.current = title;
    };
    const frame = requestAnimationFrame(send);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
