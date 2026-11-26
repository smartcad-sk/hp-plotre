import type { ContentSection, Page } from "./content";
import { displayTitle } from "./content";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
      leadHtml = `<p><strong>${esc(second.title ?? "")}</strong></p>${second.excerpt ?? ""}`;
    }
  }

  // A band right under the header that only holds a subtitle + link buttons
  // (e.g. "Technická špecifikácia", "Zakúpiť na e-shope") becomes header content.
  const actions: { href: string; label: string }[] = [];
  const top = sections[0];
  if (top?.type === "content" && top.title && !top.bgImage && top.columns.length <= 3) {
    const links = top.columns.map((c) => (!c.title && !c.image ? singleLinkColumn(c.html) : null));
    if (links.every(Boolean)) {
      sections.shift();
      actions.push(...(links as { href: string; label: string }[]));
      leadHtml = `${leadHtml ?? ""}<p><strong>${esc(top.title)}</strong></p>${top.excerpt ?? ""}`;
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

  return { title, leadHtml, actions, sections: merged };
}

/** A column that only contains one link (WordPress "button" made from a paragraph). */
export function singleLinkColumn(html?: string): { href: string; label: string } | null {
  if (!html) return null;
  const links = [...html.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  if (links.length !== 1) return null;
  const raw = strip(links[0][2]);
  if (!raw || strip(html) !== raw) return null;
  return { href: links[0][1], label: friendlyLabel(raw, links[0][1]) };
}

/** Some WordPress links used the bare URL as their text – give them a human label. */
export function friendlyLabel(label: string, href: string) {
  if (!/^https?:\/\//.test(label)) return label;
  if (/\.pdf($|\?)/i.test(href)) return "Technická špecifikácia (PDF)";
  if (href.includes("kancelaria.smartcad.sk")) return "Zakúpiť na e-shope";
  return "Viac informácií";
}
