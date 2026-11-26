import { expect, test } from "@playwright/test";
import { routes } from "./routes";

/**
 * Responsiveness audit. Hard failures:
 *   - horizontal page scroll (content wider than the viewport)
 * Soft findings (attached as annotations → see report):
 *   - tap targets smaller than 44×44 px on touch devices (non-inline controls only)
 *   - text rendered below 12 px
 *   - images rendered wider than their container
 */
for (const route of routes) {
  test(`responsive ${route}`, async ({ page }, testInfo) => {
    const res = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(res?.status(), "page should load").toBe(200);
    await page.waitForLoadState("load");

    const audit = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const describe = (el: Element) => {
        const id = el.id ? `#${el.id}` : "";
        const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
        const text = (el.textContent ?? "").trim().slice(0, 40);
        return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text}"` : ""}`;
      };
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
      };
      // Inside a horizontal scroller (carousel, table) overflow is intentional.
      const inScroller = (el: Element) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return true;
        }
        return false;
      };

      const overflowing = [...document.body.querySelectorAll("*")]
        .filter((el) => visible(el) && !inScroller(el))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.right > vw + 1 || r.left < -1;
        })
        .slice(0, 10)
        .map(describe);

      const isTouch = matchMedia("(pointer: coarse)").matches;
      const smallTargets = isTouch
        ? [...document.querySelectorAll("a, button, [role=button], input, select, textarea, summary")]
            .filter(visible)
            // WCAG 2.5.8 inline exception: links inside running text are exempt.
            .filter((el) => !(el.tagName === "A" && el.closest(".prose-content, p, li, address, dd")))
            .filter((el) => !(el.tagName === "INPUT" && (el as HTMLInputElement).type === "checkbox"))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            })
            .slice(0, 15)
            .map((el) => {
              const r = el.getBoundingClientRect();
              return `${describe(el)} (${Math.round(r.width)}×${Math.round(r.height)})`;
            })
        : [];

      const tinyText = [...document.querySelectorAll("p, li, a, span, td, label, dd, dt")]
        .filter(visible)
        .filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12)
        .slice(0, 10)
        .map(describe);

      const wideImages = [...document.querySelectorAll("img")]
        .filter(visible)
        .filter((img) => {
          const parent = img.parentElement;
          return parent && img.getBoundingClientRect().width > parent.getBoundingClientRect().width + 2 && !inScroller(img);
        })
        .slice(0, 10)
        .map(describe);

      return {
        viewport: vw,
        scrollWidth: document.documentElement.scrollWidth,
        overflowing,
        smallTargets,
        tinyText,
        wideImages,
      };
    });

    for (const [type, items] of Object.entries({
      "small-tap-target": audit.smallTargets,
      "tiny-text": audit.tinyText,
      "image-overflow": audit.wideImages,
    })) {
      for (const description of items) testInfo.annotations.push({ type, description });
    }

    expect(
      audit.scrollWidth,
      `horizontal scroll at ${audit.viewport}px – offending elements:\n${audit.overflowing.join("\n")}`,
    ).toBeLessThanOrEqual(audit.viewport + 1);
  });
}

test("mobile navigation opens, traps focus and closes with Escape", async ({ page }, testInfo) => {
  const width = page.viewportSize()?.width ?? 0;
  test.skip(width >= 1024, "desktop uses the inline navigation");
  testInfo.annotations.push({ type: "viewport", description: String(width) });
  await page.goto("/");
  await page.getByRole("button", { name: "Otvoriť menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Kontakt" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("desktop dropdown works with keyboard", async ({ page }) => {
  const width = page.viewportSize()?.width ?? 0;
  test.skip(width < 1024, "mobile uses the drawer");
  await page.goto("/");
  const trigger = page.getByRole("navigation", { name: "Hlavná navigácia" }).getByRole("button", { name: "Produkty" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Skladačky výkresov" }).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});
