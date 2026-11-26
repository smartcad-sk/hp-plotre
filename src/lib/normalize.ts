import type { ContentSection, Page } from "./content";
import { displayTitle } from "./content";

const strip = (html?: string) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

type ContentBlock = Extract<ContentSection, { type: "content" }>;
const isTitleBand = (s: ContentSection): s is ContentBlock =>
  s.type === "content" && !!s.title && s.columns.length === 0 && !s.bgImage;

/**
 * Turns the Layers-builder section list into a consistent page structure:
 *  - the leading title band(s) become the page header (h1 + lead),
 *  - a title-only band directly followed by an untitled content grid is merged into it,
 *  - empty sections are dropped.
 */
export function normalizePage(page: Page) {
  const sections = structuredClone(page.sections).filter(
    (s) => !(s.type === "content" && !s.title && !s.excerpt && s.columns.length === 0),
  );

  let title = displayTitle(page);
  let leadHtml: string | undefined;

  const first = sections[0];
  if (first && isTitleBand(first)) {
    sections.shift();
    // Product pages already carry their name in the band; prefer it when it's richer.
    if (first.title && first.title.length > 3 && first.title.toLowerCase() !== "kontakt") title = first.title;
    leadHtml = first.excerpt;
    const second = sections[0];
    if (second && isTitleBand(second) && !leadHtml) {
      sections.shift();
      leadHtml = `<p><strong>${second.title}</strong></p>${second.excerpt ?? ""}`;
    }
  }

  const merged: ContentSection[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const next = sections[i + 1];
    if (isTitleBand(s) && next?.type === "content" && !next.title && next.columns.length > 0) {
      merged.push({ ...next, title: s.title, excerpt: s.excerpt ?? next.excerpt, bg: next.bg });
      i++;
    } else {
      merged.push(s);
    }
  }

  return { title, leadHtml, sections: merged };
}

/** A column that only contains one link (WordPress "button" made from a paragraph). */
export function singleLinkColumn(html?: string): { href: string; label: string } | null {
  if (!html) return null;
  const links = [...html.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  if (links.length !== 1) return null;
  const label = strip(links[0][2]);
  if (!label || strip(html) !== label) return null;
  return { href: links[0][1], label };
}
