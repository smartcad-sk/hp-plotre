#!/usr/bin/env node
/**
 * One-off content importer: crawls the live WordPress site (hpplotre.sk, Layers theme)
 * and converts every page/post into structured, sanitized JSON in src/content/.
 * Images are downloaded into public/media/ so the Next.js site is self-contained.
 * PDFs and videos stay linked to the original host (large binaries).
 *
 * Usage: node scripts/import-content.mjs
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import { imageSize } from "image-size";
import { trimTransparentBorders } from "./trim-images.mjs";
import { readFile } from "node:fs/promises";

const ORIGIN = "https://hpplotre.sk";
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "src", "content");
const MEDIA_DIR = path.join(ROOT, "public", "media");
const UA = "Mozilla/5.0 (content-import; hpplotre-nextjs)";

// Pages that are WordPress artifacts, not real content.
const SKIP_PAGE_IDS = new Set([31449 /* page whose title is a URL */]);

const images = new Map(); // remote URL -> local path

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  return { status: res.status, html: await res.text() };
}

const IMG_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

/** Normalise an uploads URL and register it for download; returns local path. */
function localImage(src) {
  if (!src) return null;
  let url;
  try {
    url = new URL(src, ORIGIN);
  } catch {
    return null;
  }
  if (!/(^|\.)hpplotre\.sk$/.test(url.hostname)) return null;
  if (!url.pathname.startsWith("/wp-content/uploads/") || !IMG_EXT.test(url.pathname)) return null;
  url.protocol = "https:";
  url.hostname = "hpplotre.sk";
  const rel = decodeURIComponent(url.pathname.replace("/wp-content/uploads/", ""))
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9/._-]+/g, "-");
  if (rel.split("/").some((seg) => seg === ".." || seg === ".")) return null; // no path traversal
  const local = `/media/${rel}`;
  images.set(url.href, local);
  return local;
}

/** Rewrite links to the old site into local routes. */
function rewriteHref(href) {
  if (!href) return href;
  if (href.startsWith("mailto:")) return href.replace("(a)", "@");
  try {
    const url = new URL(href, ORIGIN);
    if (/(^|\.)hpplotre\.sk$/.test(url.hostname)) {
      if (url.pathname.startsWith("/wp-content/")) {
        url.protocol = "https:";
        const img = IMG_EXT.test(url.pathname) ? localImage(url.href) : null;
        return img ?? url.href;
      }
      const p = url.pathname.toLowerCase().replace(/\/+$/, "") || "/";
      return p + url.hash;
    }
    return url.href;
  } catch {
    return href;
  }
}

function clean(html) {
  // WordPress replaces emoji with <img class="emoji" alt="🔸" src="s.w.org/...">; restore the glyph.
  // The live database lost 4-byte characters (alt="????"), so rebuild the glyph from the file
  // name (".../svg/1f538.svg" → 🔸; multi-codepoint names are joined with "-").
  const withEmoji = (html ?? "")
    .replace(/<img[^>]*?s\.w\.org\/images\/core\/emoji[^>]*>/g, (tag) => {
      const code = tag.match(/\/([0-9a-f-]+)\.(?:svg|png)/)?.[1];
      if (code) {
        try {
          return String.fromCodePoint(...code.split("-").map((h) => parseInt(h, 16)));
        } catch {
          /* fall through */
        }
      }
      const alt = tag.match(/alt="([^"]*)"/)?.[1] ?? "";
      return /^\?+$/.test(alt) ? "•" : alt;
    })
    // Emoji typed directly into posts were destroyed the same way ("???? nižšia spotreba").
    .replace(/\?{4}/g, "•");
  const cleaned = sanitizeHtml(withEmoji, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "h2", "h3", "h4",
      "blockquote", "table", "thead", "tbody", "tr", "th", "td", "img", "figure", "figcaption",
      "video", "source", "hr", "sup", "sub",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      video: ["src", "controls", "preload"],
      source: ["src", "type"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      b: "strong",
      i: "em",
      h1: "h2",
      h5: "h4",
      h6: "h4",
      // Internal links open in the same tab (WP opened almost everything in a new tab);
      // external links get a new tab + rel=noopener.
      a: (tagName, attribs) => {
        const href = rewriteHref(attribs.href);
        const external = /^https?:/.test(href ?? "");
        return {
          tagName,
          attribs: { href, ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}) },
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          src: localImage(attribs.src) ?? attribs.src,
          alt: attribs.alt ?? "",
          ...(attribs.width ? { width: attribs.width } : {}),
          ...(attribs.height ? { height: attribs.height } : {}),
        },
      }),
    },
    exclusiveFilter: (frame) =>
      ["p", "strong", "em", "li", "h2", "h3", "h4"].includes(frame.tag) &&
      !frame.text.trim() &&
      !frame.mediaChildren?.length &&
      !/<(img|video)/.test(frame.text),
  })
    .replace(/&nbsp;/g, " ")
    .replace(/(<br \/>\s*){2,}/g, "<br />")
    .replace(/\s{2,}/g, " ")
    .trim();
  return nameLinks(cleaned);
}

/** Links must have an accessible name: image-only links get alt text, empty links are dropped. */
function nameLinks(html) {
  if (!html.includes("<a")) return html;
  const $ = cheerio.load(html, null, false);
  $("a").each((_, a) => {
    const $a = $(a);
    if (text($a.text())) return;
    const imgs = $a.find("img");
    if (!imgs.length) {
      $a.replaceWith($a.contents());
      return;
    }
    imgs.each((__, img) => {
      const $img = $(img);
      if (text($img.attr("alt"))) return;
      const href = $a.attr("href") ?? "";
      $img.attr("alt", IMG_EXT.test(href) ? "Zobraziť obrázok vo veľkom rozlíšení" : "Odkaz na súvisiacu stránku");
    });
  });
  return $.html();
}

/** Decode HTML entities and trim to a SERP-friendly length at a word boundary. */
function metaDescription(s, max = 158) {
  const plain = text(cheerio.load(`<p>${s ?? ""}</p>`).text());
  if (plain.length <= max) return plain || undefined;
  return plain.slice(0, max - 1).replace(/[\s,;:–-]+\S*$/, "") + "…";
}

const text = (s) => (s ?? "").replace(/\s+/g, " ").trim();

/** Parse the per-widget inline CSS into { [elementId]: { bg, color, image } }. */
function parseInlineCss(css) {
  const out = {};
  const re = /#([\w-]+)\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const [, id, body] = m;
    const entry = (out[id] ??= {});
    const bg = body.match(/background-color:\s*(#[0-9a-f]{3,6})/i);
    if (bg) entry.bg = bg[1].toLowerCase();
    const img = body.match(/background-image:\s*url\('?([^')]+)'?\)/i);
    if (img) entry.image = img[1];
  }
  return out;
}

function imageFrom($, el) {
  const img = $(el).find("img").first();
  if (!img.length) return undefined;
  const src = localImage(img.attr("src"));
  if (!src) return undefined;
  return {
    src,
    alt: text(img.attr("alt")),
    width: Number(img.attr("width")) || undefined,
    height: Number(img.attr("height")) || undefined,
    // Images wrapped in a link (service tiles, e-shop consumables) keep that link.
    href: img.closest("a[href]").length ? rewriteHref(img.closest("a[href]").attr("href")) : undefined,
  };
}

function buttonFrom($, el) {
  const a = $(el).find("a.button").first();
  if (!a.length) return undefined;
  return { href: rewriteHref(a.attr("href")), label: text(a.text()) };
}

function parseLayers($) {
  const sections = [];
  const unknown = new Set();
  $("#wrapper-content > .widget, #wrapper-content > div.widget").each((_, w) => {
    const $w = $(w);
    const id = $w.attr("id") ?? "";
    const css = parseInlineCss($w.find("style").text());
    if ($w.hasClass("layers-content-widget")) {
      const title = text($w.find("> .container .section-title .heading").first().text());
      const excerptHtml = $w.find("> .container .section-title .excerpt").first().html();
      const columns = [];
      $w.find(".layers-masonry-column").each((__, c) => {
        const $c = $(c);
        const span = Number(($c.attr("class") ?? "").match(/span-(\d+)/)?.[1] ?? 12);
        const ex = $c.find(".media-body .excerpt").first();
        // Contact Form 7 markup: replaced by our own <ContactForm/> component.
        if (ex.find("form, .wpcf7").length) {
          columns.push({ span, form: true });
          return;
        }
        const image = imageFrom($, $c.find(".media-image").first());
        // YouTube iframes inside a panel (Complianz keeps the real URL in data-src-cmplz).
        // The sanitizer drops iframes, so lift them out and render them as a click-to-play video.
        let youtubeId;
        $c.find("iframe").each((___, f) => {
          const url = $(f).attr("data-src-cmplz") || $(f).attr("src") || "";
          const yt = url.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/)?.[1];
          if (yt && !youtubeId) youtubeId = yt;
          if (yt) $(f).remove();
        });
        const col = {
          span,
          title: text($c.find(".media-body .heading").first().text()) || undefined,
          image,
          youtubeId,
          html: clean(ex.html()) || undefined,
          button: buttonFrom($, $c.find(".media-body")),
          bg: css[$c.attr("id")]?.bg,
        };
        if (col.title || col.image || col.youtubeId || col.html || col.button) columns.push(col);
      });
      const sectionButton = buttonFrom($, $w.find("> .container .section-title"));
      if (!title && !excerptHtml && !columns.length) return;
      sections.push({
        type: "content",
        id,
        title: title || undefined,
        excerpt: clean(excerptHtml) || undefined,
        bg: css[id]?.bg,
        bgImage: localImage(css[id]?.image) ? { src: localImage(css[id]?.image), alt: "" } : undefined,
        button: sectionButton,
        columns,
      });
    } else if ($w.hasClass("layers-slider-widget")) {
      const slides = [];
      $w.find(".swiper-slide").each((__, s) => {
        const $s = $(s);
        const sid = $s.attr("id");
        const bgSrc = localImage(css[sid]?.image);
        const image = bgSrc
          ? { src: bgSrc, alt: "" }
          : imageFrom($, $s.find(".image-container, .overlay").first());
        // Layers lets a whole slide be a link (<a class="swiper-slide" href>) – used for
        // "Technická špecifikácia" / e-shop / YouTube bars. Keep that link.
        const slideHref = s.tagName === "a" ? $s.attr("href") : undefined;
        const title = text($s.find(".heading").first().text()) || undefined;
        slides.push({
          image,
          title,
          excerpt: clean($s.find(".excerpt").first().html()) || undefined,
          button: buttonFrom($, $s),
          link: slideHref && !/^(#|\/?#more$)/.test(slideHref.replace(/^https?:\/\/hpplotre\.sk/, "")) ? rewriteHref(slideHref) : undefined,
        });
      });
      const real = slides.filter((s) => s.image || s.link || (s.title && s.title.length > 2) || /<a /.test(s.excerpt ?? ""));
      if (real.length) sections.push({ type: "slider", id, slides: real });
    } else if ($w.hasClass("widget_media_video")) {
      const src = $w.find("source[type='video/youtube'], iframe").first().attr("src") ?? "";
      const youtubeId = src.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)?.[1];
      const mp4 = $w.find("video source[type='video/mp4'], video[src]").first().attr("src");
      const vtitle = text($w.find(".widget-title, h3").first().text()) || undefined;
      if (youtubeId) sections.push({ type: "video", id, youtubeId, title: vtitle });
      else if (mp4) sections.push({ type: "video", id, src: rewriteHref(mp4.split("?")[0]), title: vtitle });
    } else if ($w.hasClass("layers-contact-widget")) {
      sections.push({ type: "contact", id });
    } else if ($w.hasClass("layers-post-widget") || $w.hasClass("widget_text") || $w.hasClass("widget")) {
      const html = clean($w.find(".textwidget, .widget-content, .container").first().html());
      if (html) sections.push({ type: "html", id, html });
      unknown.add(($w.attr("class") ?? "").split(/\s+/).find((c) => c.startsWith("layers-") || c.startsWith("widget_")) ?? "widget");
    }
  });
  return { sections, unknown: [...unknown] };
}

function parsePost($) {
  const $a = $("article").first();
  const thumb = imageFrom($, $a.find(".thumbnail"));
  const story = $a.find(".story").first().clone();
  story.find("script, style, noscript, iframe, form").remove();
  // A WordPress fatal error page sometimes gets injected into the story; cut there.
  let html = story.html() ?? "";
  const cut = html.search(/<!DOCTYPE html>|WordPress &rsaquo; Chyba/i);
  const truncated = cut >= 0;
  if (truncated) html = html.slice(0, cut);
  return { thumbnail: thumb, html: clean(html), truncated };
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadImages() {
  let ok = 0;
  const failed = [];
  const queue = [...images.entries()];
  async function worker() {
    while (queue.length) {
      const [remote, local] = queue.shift();
      const dest = path.join(ROOT, "public", ...local.split("/").filter(Boolean));
      if (await exists(dest)) {
        ok++;
        continue;
      }
      try {
        const res = await fetch(remote, { headers: { "User-Agent": UA } });
        if (!res.ok) throw new Error(String(res.status));
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, Buffer.from(await res.arrayBuffer()));
        await trimTransparentBorders(dest); // empty transparent margins would become page padding
        ok++;
      } catch (e) {
        failed.push(`${remote} (${e.message})`);
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  return { ok, failed };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(MEDIA_DIR, { recursive: true });
  const fields = "id,slug,link,title,parent,modified,date,excerpt,yoast_head_json";
  const wpPages = await getJson(`${ORIGIN}/wp-json/wp/v2/pages?per_page=100&_fields=${fields}`);
  const wpPosts = await getJson(`${ORIGIN}/wp-json/wp/v2/posts?per_page=100&_fields=${fields}`);
  const report = { brokenPages: [], unknownWidgets: {}, truncatedPosts: [] };

  const pages = [];
  for (const p of wpPages) {
    if (SKIP_PAGE_IDS.has(p.id)) continue;
    const route = new URL(p.link).pathname.replace(/\/+$/, "").toLowerCase() || "/";
    const { status, html } = await getHtml(p.link);
    if (status !== 200) report.brokenPages.push(`${route} -> ${status}`);
    const $ = cheerio.load(html);
    const { sections, unknown } = parseLayers($);
    if (unknown.length) report.unknownWidgets[route] = unknown;
    const y = p.yoast_head_json ?? {};
    pages.push({
      id: p.id,
      route,
      title: cheerio.load(p.title.rendered).text().trim(),
      seoTitle: y.title ? cheerio.load(y.title).text() : undefined,
      description: metaDescription(y.description || y.og_description),
      modified: p.modified,
      sections,
    });
    process.stdout.write(".");
  }

  const posts = [];
  for (const p of wpPosts) {
    const route = new URL(p.link).pathname.replace(/\/+$/, "").toLowerCase();
    const { html } = await getHtml(p.link);
    const $ = cheerio.load(html);
    const parsed = parsePost($);
    if (parsed.truncated) report.truncatedPosts.push(route);
    const y = p.yoast_head_json ?? {};
    posts.push({
      id: p.id,
      route,
      title: cheerio.load(p.title.rendered).text().trim(),
      description: metaDescription(y.description || p.excerpt?.rendered),
      excerptDescription: metaDescription(p.excerpt?.rendered),
      date: p.date,
      modified: p.modified,
      thumbnail: parsed.thumbnail,
      html: parsed.html,
    });
    process.stdout.write("+");
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));

  const dl = await downloadImages();
  report.images = { downloaded: dl.ok, failed: dl.failed };
  // Fill real intrinsic dimensions for every local image object (prevents layout shift).
  const sizes = new Map();
  async function fillDims(node) {
    if (Array.isArray(node)) {
      for (const n of node) await fillDims(n);
    } else if (node && typeof node === "object") {
      if (typeof node.src === "string" && node.src.startsWith("/media/")) {
        if (!sizes.has(node.src)) {
          try {
            const buf = await readFile(path.join(ROOT, "public", ...node.src.split("/").filter(Boolean)));
            sizes.set(node.src, imageSize(buf));
          } catch {
            sizes.set(node.src, null);
          }
        }
        const dim = sizes.get(node.src);
        if (dim) {
          node.width = dim.width;
          node.height = dim.height;
        }
      }
      for (const v of Object.values(node)) await fillDims(v);
    }
  }
  // Yoast reused one description on several URLs. Keep it on the item whose title shares
  // the most words with it; the others fall back to their own text (excerpt / page content).
  const words = (s) => new Set((s ?? "").toLowerCase().match(/[\p{L}\d]{4,}/gu) ?? []);
  const byDesc = new Map();
  for (const item of [...pages, ...posts]) if (item.description) byDesc.set(item.description, [...(byDesc.get(item.description) ?? []), item]);
  for (const [desc, items] of byDesc) {
    if (items.length < 2) continue;
    const dw = words(desc);
    // Hand-built pages (/, /kontakt, /blogy) have their own metadata in the app.
    const score = (it) => ["/", "/kontakt", "/blogy"].includes(it.route) ? -1 : [...words(it.title + " " + it.route.replace(/[-_/]/g, " "))].filter((w) => dw.has(w)).length;
    const owner = items.reduce((a, b) => (score(b) > score(a) ? b : a));
    for (const it of items) if (it !== owner) it.description = it.excerptDescription; // undefined → derived in app
    report.dedupedDescriptions = [...(report.dedupedDescriptions ?? []), `${owner.route} keeps "${desc.slice(0, 50)}…"`];
  }
  for (const it of [...pages, ...posts]) delete it.excerptDescription;

  // Legacy URLs that have no page of their own: attachment pages → parent page, archives → blog.
  const known = new Set([...pages.map((p) => p.route), ...posts.map((p) => p.route)]);
  const redirects = [{ source: "/category/:slug*", destination: "/blogy" }];
  try {
    const xml = await (await fetch(`${ORIGIN}/attachment-sitemap.xml`, { headers: { "User-Agent": UA } })).text();
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const p = new URL(loc).pathname.replace(/\/+$/, "").toLowerCase();
      if (!p || known.has(p)) continue;
      const parent = p.split("/").slice(0, -1).join("/") || "/";
      redirects.push({ source: p, destination: known.has(parent) ? parent : "/" });
    }
  } catch (e) {
    report.redirectsError = String(e);
  }
  await writeFile(path.join(OUT_DIR, "redirects.json"), JSON.stringify(redirects, null, 2) + "\n");

  await fillDims(pages);
  await fillDims(posts);
  await writeFile(path.join(OUT_DIR, "pages.json"), JSON.stringify(pages, null, 2) + "\n");
  await writeFile(path.join(OUT_DIR, "posts.json"), JSON.stringify(posts, null, 2) + "\n");
  await writeFile(path.join(OUT_DIR, "import-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`\npages=${pages.length} posts=${posts.length} images=${dl.ok} failed=${dl.failed.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
