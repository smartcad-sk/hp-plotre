import { expect, test } from "@playwright/test";

test.describe("usability", () => {
  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/t850");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Preskočiť na obsah" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#obsah$/);
  });

  test("every page exposes a clear path to contact", async ({ page }) => {
    for (const route of ["/", "/t850", "/smart-sluzby", "/pigmentove_atramenty"]) {
      await page.goto(route);
      await expect(page.getByRole("link", { name: /kontakt/i }).first()).toBeAttached();
      await expect(page.locator('a[href^="tel:"]').first()).toBeAttached();
    }
  });

  test("contact form validates and announces errors", async ({ page }) => {
    await page.goto("/kontakt");
    const form = page.locator("form").first();
    await form.getByRole("button", { name: "Odoslať správu" }).click();
    const name = form.getByLabel("Meno a priezvisko *");
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();
    await expect(form.getByText("Zadajte meno a priezvisko.")).toBeVisible();
    await expect(form.getByText("Pre odoslanie potrebujeme váš súhlas.")).toBeVisible();
  });

  test("breadcrumbs show the current location", async ({ page }) => {
    await page.goto("/t850");
    const crumbs = page.getByRole("navigation", { name: "Omrvinková navigácia" });
    await expect(crumbs.getByRole("link", { name: "Produkty" })).toBeVisible();
    await expect(crumbs.locator('[aria-current="page"]')).toContainText("T850");
  });

  test("YouTube is not loaded until the visitor clicks play", async ({ page }) => {
    const ytRequests: string[] = [];
    page.on("request", (r) => {
      if (/youtube(-nocookie)?\.com/.test(r.url())) ytRequests.push(r.url());
    });
    await page.goto("/hp-designjet-t1700");
    await page.waitForLoadState("networkidle");
    expect(ytRequests).toEqual([]);
  });

  test("custom 404 page helps the visitor recover", async ({ page }) => {
    const res = await page.goto("/tato-stranka-neexistuje");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Stránku sme nenašli");
    await expect(page.getByRole("link", { name: "Späť na úvod" })).toBeVisible();
  });
});
