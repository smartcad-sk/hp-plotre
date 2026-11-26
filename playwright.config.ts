import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Device matrix used for responsiveness testing. Chromium only (fast, CI-friendly);
 * device descriptors still emulate touch, DPR and UA for the mobile/tablet sizes.
 */
const viewports = [
  { name: "xs-320", use: { ...devices["iPhone SE"], viewport: { width: 320, height: 640 }, defaultBrowserType: "chromium" as const } },
  { name: "iphone-se-375", use: { ...devices["iPhone SE"], defaultBrowserType: "chromium" as const } },
  { name: "pixel-7-412", use: { ...devices["Pixel 7"] } },
  { name: "iphone-15-pro-max-430", use: { ...devices["iPhone 15 Pro Max"], defaultBrowserType: "chromium" as const } },
  { name: "ipad-mini-768", use: { ...devices["iPad Mini"], defaultBrowserType: "chromium" as const } },
  { name: "ipad-landscape-1024", use: { ...devices["iPad Mini landscape"], viewport: { width: 1024, height: 768 }, defaultBrowserType: "chromium" as const } },
  { name: "laptop-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  { name: "desktop-1920", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
];

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : "50%",
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL,
    // Consent already answered so the cookie banner does not cover controls (tests/analytics.spec.ts clears it).
    storageState: "tests/consent-accepted.json",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Responsive layout checks on every device size.
    ...viewports.map((v) => ({ name: v.name, testMatch: /responsive\.spec\.ts/, use: v.use })),
    // Accessibility + SEO run on one mobile and one desktop size.
    { name: "a11y-mobile", testMatch: /(a11y|usability|analytics)\.spec\.ts/, use: viewports[1].use },
    { name: "a11y-desktop", testMatch: /(a11y|usability)\.spec\.ts/, use: viewports[6].use },
    { name: "seo", testMatch: /seo\.spec\.ts/, use: viewports[6].use },
  ],
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
