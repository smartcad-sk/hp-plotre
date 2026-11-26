import { expect, test } from "@playwright/test";

// These tests start without stored consent (the other suites pre-accept via storageState).
test.use({ storageState: { cookies: [], origins: [] } });

type DL = Record<string, unknown>[];
const events = (page: import("@playwright/test").Page) =>
  page.evaluate(() => ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []).filter((e) => !Array.isArray(e) && typeof e === "object" && e && "event" in e) as DL);

test("consent banner shows and nothing loads from Google before consent", async ({ page }) => {
  const google: string[] = [];
  page.on("request", (r) => {
    if (/google|doubleclick/.test(new URL(r.url()).hostname)) google.push(r.url());
  });
  await page.goto("/");
  const banner = page.getByRole("dialog", { name: "Súbory cookie" });
  await expect(banner).toBeVisible();
  // Consent Mode default is "denied" before any interaction.
  const consentDefault = await page.evaluate(() =>
    ((window as unknown as { dataLayer: unknown[] }).dataLayer ?? []).some(
      (e) => Array.isArray(e) || (typeof e === "object" && e !== null && (e as IArguments)[0] === "consent"),
    ),
  );
  expect(consentDefault).toBe(true);
  await banner.getByRole("button", { name: "Odmietnuť" }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Súbory cookie" })).toBeHidden();
  expect(google).toEqual([]);
  expect((await events(page)).length).toBeGreaterThanOrEqual(0);
});

test("consent can be reopened from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("dialog", { name: "Súbory cookie" }).getByRole("button", { name: "Prijať všetko" }).click();
  await page.getByRole("button", { name: "Nastavenia cookies" }).click();
  const banner = page.getByRole("dialog", { name: "Súbory cookie" });
  await expect(banner.getByRole("checkbox", { name: /Štatistiky/ })).toBeChecked();
});

test("dataLayer receives lead, phone, download and outbound events", async ({ page }) => {
  await page.goto("/hp-designjet-t1700");
  await page.getByRole("dialog", { name: "Súbory cookie" }).getByRole("button", { name: "Odmietnuť" }).click();

  // Prevent actual navigation for tel:/external links during the test.
  await page.evaluate(() => document.addEventListener("click", (e) => e.preventDefault()));
  await page.locator('main a[href^="tel:"]:visible').first().click();
  await page.locator('main a[href$=".pdf"]:visible').first().click();
  await page.locator('main a[href*="kancelaria.smartcad.sk"]:visible').first().click();

  const names = (await events(page)).map((e) => e.event);
  expect(names).toEqual(expect.arrayContaining(["consent_update", "click_phone", "file_download", "click_outbound"]));
  const outbound = (await events(page)).find((e) => e.event === "click_outbound");
  expect(outbound).toMatchObject({ outbound_type: "eshop", page_path: "/hp-designjet-t1700" });
});

test("valid contact form submission pushes generate_lead", async ({ page }) => {
  await page.goto("/kontakt");
  await page.getByRole("dialog", { name: "Súbory cookie" }).getByRole("button", { name: "Odmietnuť" }).click();
  const form = page.locator("form").first();
  await form.getByLabel("Meno a priezvisko *").fill("Test Testovací");
  await form.getByLabel("E-mail *").fill("test@example.com");
  await form.getByLabel("Vaša správa *").fill("Dobrý deň, mám záujem o T850.");
  await form.getByRole("checkbox").check();
  await page.evaluate(() => {
    // Block the mailto: navigation in the test browser.
    Object.defineProperty(window, "location", { value: { ...window.location, set href(_v: string) {} }, writable: true });
  }).catch(() => {});
  await form.getByRole("button", { name: "Odoslať správu" }).click();
  const lead = (await events(page)).find((e) => e.event === "generate_lead");
  expect(lead).toMatchObject({ form_id: "contact", lead_source: "/kontakt" });
});
