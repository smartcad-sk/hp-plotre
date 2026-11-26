import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { routes } from "./routes";

/** WCAG 2.2 AA automated audit (axe-core) on every route. */
for (const route of routes) {
  test(`axe ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const summary = results.violations.map(
      (v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}×) → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`,
    );
    expect(summary, summary.join("\n")).toEqual([]);
  });
}
