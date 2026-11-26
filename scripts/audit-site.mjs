#!/usr/bin/env node
/**
 * Content-parity + quality audit: live WordPress site vs. the local rebuild.
 * Usage: start the app (npm run build && npm start), then `node scripts/audit-site.mjs [baseUrl]`.
 * Writes audit/site-audit.json and prints a summary.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import { chromium } from "@playwright/test";

const LIVE = "https://hpplotre.sk";
const LOCAL = process.argv[2] ?? "http://localhost:3000";
const ROOT = path.resolve(import.meta.dirname, "..");
const pages = (await import("../src/content/pages.json", { with: { type: "json" } })).default;
const posts = (await import("../src/content/posts.json", { with: { type: "json" } })).default;
const routes = [...pages.map((p) => p.route).filter((r) => r !== "/kontaktny-formular"), ...posts.map((p) => p.route)];
const UA = "Mozilla/5.0 (site-audit; hpplotre-nextjs)";

const norm = (href, base) => {
  try {
    const u = new URL(href, base);
    return u;
  } catch {
    return null;
  }
};

async function status(url, method = "HEAD") {
  try {
    const res = await fetch(url, { method, redirect: "follow", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (res.status === 405 && method === "HEAD") return status(url, "GET");
    return res.status;
  } catch (e) {
    return `ERR ${e.cause?.code ?? e.name}`;
  }
}

/* ---------- live side ---------- */
const live = {};
for (const route of routes) {
  const res = await fetch(LIVE + route + "/", { headers: { "User-Agent": UA } });
  const $ = cheerio.load(await res.text());
  const main = $("#wrapper-content, article").first();
  const scope = main.length ? main : $("body");
  live[route] = {
    status: res.status,
    images: [...new Set(scope.find("img").map((_, i) => $(i).attr("src")).get().filter((s) => s && !s.includes("s.w.org/images/core/emoji")))].map((s) => decodeURIComponent(new URL(s, LIVE).pathname).split("/").pop()),
    bgImages: [...(scope.html() ?? "").matchAll(/url\('?([^')]+)'?\)/g)].map((m) => decodeURIComponent(new URL(m[1], LIVE).pathname).split("/").pop()),
    links: [...new Set(scope.find("a[href]").map((_, a) => $(a).attr("href")).get())],
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content") ?? "",
    h1: $("h1").map((_, h) => $(h).text().trim()).get(),
  };
  process.stdout.write(".");
}

/* ---------- local side ---------- */
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const local = {};
const dataLayerSeen = {};
for (const route of routes) {
  const res = await page.goto(LOCAL + route, { waitUntil: "load" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(300);
  local[route] = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("main img")];
    const srcName = (img) => {
      const s = img.currentSrc || img.src;
      const u = new URL(s);
      const inner = u.searchParams.get("url") ?? u.pathname;
      return decodeURIComponent(inner).split("/").pop();
    };
    return {
      images: imgs.map(srcName),
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
      emptyAlt: imgs.filter((i) => i.getAttribute("alt") === "" && !i.closest("[aria-hidden=true]")).length,
      links: [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")),
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content ?? "",
      ogImage: document.querySelector('meta[property="og:image"]')?.content ?? "",
      h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
      textLength: document.querySelector("main")?.innerText.length ?? 0,
      lowercaseHeadings: [...document.querySelectorAll("main h2, main h3")].map((h) => h.textContent.trim()).filter((t) => /^[a-zà-ž]/.test(t)),
      allCapsHeadings: [...document.querySelectorAll("main h2, main h3")].map((h) => h.textContent.trim()).filter((t) => t.length > 12 && t === t.toUpperCase()),
      sections: document.querySelectorAll("main > section, main > div > section").length,
      dataLayer: Array.isArray(window.dataLayer) ? window.dataLayer.length : null,
    };
  });
  local[route].status = res?.status();
  dataLayerSeen[route] = local[route].dataLayer;
  process.stdout.write("+");
}
await browser.close();

/* ---------- compare ---------- */
const sanitizeName = (n) => n.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
const report = { missingImages: {}, brokenImages: {}, droppedLinks: {}, brokenLinks: [], duplicateTitles: {}, duplicateDescriptions: {}, thinPages: [], headingCase: {}, noOgImage: [], liveIssues: {} };
const external = new Map();
const internal = new Set();

for (const route of routes) {
  const L = live[route];
  const R = local[route];
  const ours = new Set(R.images.map(sanitizeName));
  const miss = [...new Set([...L.images, ...L.bgImages])]
    .map(sanitizeName)
    .filter((n) => !ours.has(n) && !/^(ok-1|cropped-|ikona|icon|animated_icons)/.test(n))
    // the importer may keep the full-size original instead of a WP "-300x200" variant
    .filter((n) => !ours.has(n.replace(/-\d+x\d+(?=\.\w+$)/, "")));
  if (miss.length) report.missingImages[route] = miss;
  if (R.broken.length) report.brokenImages[route] = R.broken;

  const liveLinks = L.links
    .map((h) => norm(h, LIVE))
    .filter(Boolean)
    .filter((u) => !u.href.startsWith("javascript"))
    .map((u) => (/(^|\.)hpplotre\.sk$/.test(u.hostname) && !u.pathname.startsWith("/wp-content") ? u.pathname.replace(/\/+$/, "").toLowerCase() || "/" : u.href.replace(/^http:/, "https:")));
  const ourLinks = new Set(R.links.map((h) => (h.startsWith("/") ? h.split("#")[0] || "/" : h.replace(/^http:/, "https:"))));
  const dropped = [...new Set(liveLinks)].filter((l) => !ourLinks.has(l) && !l.startsWith("mailto:") && l !== "#" && !l.includes("#top"));
  if (dropped.length) report.droppedLinks[route] = dropped;

  for (const h of R.links) {
    if (h.startsWith("/")) internal.add(h.split("#")[0] || "/");
    else if (/^https?:/.test(h)) external.set(h, [...(external.get(h) ?? []), route]);
  }
  if (!R.ogImage) report.noOgImage.push(route);
  if (R.textLength < 600) report.thinPages.push(`${route} (${R.textLength} chars)`);
  if (R.lowercaseHeadings.length || R.allCapsHeadings.length) report.headingCase[route] = [...R.lowercaseHeadings.map((t) => `lowercase: ${t}`), ...R.allCapsHeadings.map((t) => `ALL CAPS: ${t}`)];
  if (L.h1.length !== 1) report.liveIssues[route] = `live page has ${L.h1.length} <h1>`;
}

const group = (key) => {
  const m = new Map();
  for (const r of routes) m.set(local[r][key], [...(m.get(local[r][key]) ?? []), r]);
  return Object.fromEntries([...m].filter(([, v]) => v.length > 1));
};
report.duplicateTitles = group("title");
report.duplicateDescriptions = group("description");

for (const href of internal) {
  const s = await status(LOCAL + href, "GET");
  if (s !== 200) report.brokenLinks.push(`${href} → ${s}`);
}
for (const [href, from] of external) {
  const s = await status(href);
  if (typeof s !== "number" || s >= 400) report.brokenLinks.push(`${href} → ${s} (on ${from.slice(0, 3).join(", ")}${from.length > 3 ? "…" : ""})`);
}
report.dataLayer = { pagesWithDataLayer: Object.values(dataLayerSeen).filter((v) => v !== null).length, total: routes.length };

await mkdir(path.join(ROOT, "audit"), { recursive: true });
await writeFile(path.join(ROOT, "audit", "site-audit.json"), JSON.stringify(report, null, 2) + "\n");
const count = (o) => (Array.isArray(o) ? o.length : Object.keys(o).length);
console.log("\n" + Object.entries(report).map(([k, v]) => `${k}: ${typeof v === "object" && v && !("total" in v) ? count(v) : JSON.stringify(v)}`).join("\n"));
