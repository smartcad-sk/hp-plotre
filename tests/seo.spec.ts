import { expect, test } from "@playwright/test";
import { routes } from "./routes";

/** On-page SEO checks for every route. */
for (const route of routes) {
  test(`seo ${route}`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);

    const meta = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
      h1: [...document.querySelectorAll("h1")].map((h) => h.textContent?.trim()),
      robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
      jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
      imgNoAlt: [...document.querySelectorAll("img:not([alt])")].map((i) => i.getAttribute("src")),
      headingSkips: (() => {
        const levels = [...document.querySelectorAll("main h1, main h2, main h3, main h4")].map((h) => Number(h.tagName[1]));
        return levels.filter((l, i) => i > 0 && l - levels[i - 1] > 1).length;
      })(),
    }));

    expect(meta.lang).toBe("sk");
    expect(meta.title.length, `title "${meta.title}"`).toBeGreaterThan(10);
    expect(meta.title.length, `title too long "${meta.title}"`).toBeLessThanOrEqual(70);
    expect(meta.description.length, `description "${meta.description}"`).toBeGreaterThanOrEqual(50);
    expect(meta.description.length, `description too long "${meta.description}"`).toBeLessThanOrEqual(170);
    expect(meta.canonical).toMatch(/^https:\/\/hpplotre\.sk/);
    expect(meta.ogTitle).not.toBe("");
    expect(meta.h1, "exactly one h1").toHaveLength(1);
    expect(meta.robots).not.toContain("noindex");
    expect(meta.jsonLd).toBeGreaterThan(0);
    expect(meta.imgNoAlt).toEqual([]);
    expect(meta.headingSkips, "heading levels should not skip (e.g. h2 → h4)").toBe(0);
  });
}

test("sitemap lists every route and robots.txt points to it", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const route of routes) expect(sitemap).toContain(`https://hpplotre.sk${route === "/" ? "" : route}<`);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://hpplotre.sk/sitemap.xml");
});

test("all internal links resolve (no 404s)", async ({ page, request }) => {
  test.setTimeout(180_000);
  const links = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")!));
    for (const h of hrefs) if (h.startsWith("/") && !h.startsWith("//")) links.add(h.split("#")[0] || "/");
  }
  const broken: string[] = [];
  for (const href of links) {
    const res = await request.get(href, { maxRedirects: 5 });
    if (res.status() >= 400) broken.push(`${href} → ${res.status()}`);
  }
  expect(broken, broken.join("\n")).toEqual([]);
});
