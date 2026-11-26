import pagesData from "@/content/pages.json";
import postsData from "@/content/posts.json";

export type ContentImage = { src: string; alt: string; width?: number; height?: number; href?: string };
export type ContentLink = { href: string; label: string };

export type ContentColumn = {
  span: number;
  title?: string;
  image?: ContentImage;
  html?: string;
  button?: ContentLink;
  bg?: string;
  form?: boolean;
};

export type ContentSection =
  | {
      type: "content";
      id: string;
      title?: string;
      excerpt?: string;
      bg?: string;
      bgImage?: ContentImage;
      button?: ContentLink;
      columns: ContentColumn[];
    }
  | {
      type: "slider";
      id: string;
      slides: { image?: ContentImage; title?: string; excerpt?: string; button?: ContentLink; link?: string }[];
    }
  | { type: "video"; id: string; youtubeId?: string; src?: string; title?: string }
  | { type: "html"; id: string; html: string }
  | { type: "contact"; id: string }
  /** Produced by normalizePage from link-only slides (spec PDF, e-shop, video bars). */
  | { type: "links"; id: string; links: ContentLink[] };

export type Page = {
  id: number;
  route: string;
  title: string;
  seoTitle?: string;
  description?: string;
  modified: string;
  sections: ContentSection[];
};

export type Post = {
  id: number;
  route: string;
  title: string;
  description?: string;
  date: string;
  modified: string;
  thumbnail?: ContentImage;
  html: string;
};

const pages = pagesData as Page[];
const posts = postsData as Post[];

/** Routes rendered by hand-built pages; excluded from the generic catch-all. */
export const CUSTOM_ROUTES = new Set(["/", "/kontakt", "/blogy"]);

/** Pages that are WordPress leftovers (duplicate contact form etc.) – redirected, not rendered. */
export const HIDDEN_ROUTES = new Set(["/kontaktny-formular"]);

const PRODUCT_CATEGORY: Record<string, string> = {
  "/velkoformatove-tlaciarne": "Plotre a skenery",
  "/skladacky-vykresov": "Skladačky výkresov",
  "/latex": "Latex",
  "/vyrezavacie-plotre": "Vyrezávacie plotre",
};

/** Human friendly titles – WordPress had lowercase/internal ones. */
const TITLE_OVERRIDES: Record<string, string> = {
  "/velkoformatove-tlaciarne": "Produktový rad plotrov a skenerov",
  "/latex": "HP Latex tlačiarne",
  "/bazar-plotrov": "Bazár plotrov",
  "/diagnostika-plotra": "Diagnostika a servis plotra",
  "/stary_za_novy": "Výmena starého plotra za nový",
  "/smart-sluzby": "Služby a technická podpora",
  "/smart-sluzby/rady_tipy": "Rady a návody",
  "/kontakt": "Kontakt",
  "/blogy": "Blog o HP plotroch",
  "/plotrovanie": "Planografia – tlač výkresov",
};

export function isProductRoute(route: string) {
  if (posts.some((p) => p.route === route)) return false; // some blog slugs also start with "hp-"
  return /^\/(hp-|t8|t9|xl-)/.test(route) && !route.startsWith("/hp-plotre-2019");
}

export function displayTitle(page: Pick<Page, "route" | "title">) {
  return TITLE_OVERRIDES[page.route] ?? page.title.replace(/\s{2,}/g, " ");
}

export function getPage(route: string): Page | undefined {
  return pages.find((p) => p.route === route);
}

export function getPost(route: string): Post | undefined {
  return posts.find((p) => p.route === route);
}

export function getPosts(): Post[] {
  return posts;
}

export function getProducts(): Page[] {
  return pages.filter((p) => isProductRoute(p.route));
}

/** First image found on a page – used for cards / Open Graph. */
export function pageImage(page: Page): ContentImage | undefined {
  for (const s of page.sections) {
    if (s.type === "slider") {
      const img = s.slides.find((sl) => sl.image)?.image;
      if (img) return img;
    }
    if (s.type === "content") {
      const img = s.columns.find((c) => c.image)?.image;
      if (img) return img;
    }
  }
  return undefined;
}

export function breadcrumbFor(route: string): { label: string; href: string }[] {
  const crumbs = [{ label: "Úvod", href: "/" }];
  if (isProductRoute(route)) crumbs.push({ label: "Produkty", href: "/velkoformatove-tlaciarne" });
  else if (route.startsWith("/smart-sluzby/")) crumbs.push({ label: "Služby", href: "/smart-sluzby" });
  else if (getPost(route)) crumbs.push({ label: "Blog", href: "/blogy" });
  else if (PRODUCT_CATEGORY[route] && route !== "/velkoformatove-tlaciarne")
    crumbs.push({ label: "Produkty", href: "/velkoformatove-tlaciarne" });
  return crumbs;
}

/** Every route served by the catch-all `[...slug]` page. */
export function catchAllRoutes(): string[] {
  return [
    ...pages.map((p) => p.route).filter((r) => !CUSTOM_ROUTES.has(r) && !HIDDEN_ROUTES.has(r)),
    ...posts.map((p) => p.route),
  ];
}

/** Every public route (for sitemap & tests). */
export function allRoutes(): { route: string; modified: string }[] {
  return [
    ...pages.filter((p) => !HIDDEN_ROUTES.has(p.route)).map((p) => ({ route: p.route, modified: p.modified })),
    ...posts.map((p) => ({ route: p.route, modified: p.modified })),
  ];
}

/** Map arbitrary WordPress background colors to design-system tones. */
export type Tone = "default" | "muted" | "brand" | "brand-dark";
export function toneFromColor(color?: string): Tone {
  switch (color?.toLowerCase()) {
    case "#008080":
    case "#000000":
      return "brand";
    case "#49a7b1":
      return "brand-dark";
    case "#bababa":
    case "#c1c1c1":
    case "#eaeaea":
    case "#dcdcdc":
    case "#cdcdcd":
    case "#f3f3f3":
      return "muted";
    default:
      return "default";
  }
}

const TITLE_SUFFIX = " | HPplotre.sk";
const TITLE_MAX = 65;

/**
 * SERP title: uses the layout's " | HPplotre.sk" suffix when it fits, otherwise drops the
 * suffix, and for very long headlines keeps the most descriptive segment ("A: B" / "A – B").
 */
export function seoTitle(title: string): string | { absolute: string } {
  if ((title + TITLE_SUFFIX).length <= TITLE_MAX) return title;
  if (title.length <= TITLE_MAX) return { absolute: title };
  const parts = title.split(/:\s+|\s+–\s+/).filter((p) => p.length >= 20 && p.length <= TITLE_MAX - TITLE_SUFFIX.length);
  if (parts.length) return parts.sort((a, b) => b.length - a.length)[0];
  return { absolute: title.slice(0, TITLE_MAX - 1).replace(/\s+\S*$/, "") + "…" };
}

const strip = (html?: string) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Description fallback: first meaningful text on the page. */
export function pageDescription(page: Page): string {
  if (page.description) return page.description;
  for (const s of page.sections) {
    if (s.type !== "content") continue;
    const txt = strip(s.excerpt) || strip(s.columns.find((c) => (c.html?.length ?? 0) > 80)?.html);
    if (txt.length > 50) return txt.slice(0, 155).replace(/\s\S*$/, "") + "…";
  }
  return `${displayTitle(page)} – predaj, servis a poradenstvo. smartCAD s.r.o., autorizovaný HP DesignJet partner.`;
}
