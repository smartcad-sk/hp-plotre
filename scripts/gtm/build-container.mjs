#!/usr/bin/env node
/**
 * Builds an importable GTM container (Admin → Import Container → Merge) that implements
 * docs/tracking-plan.md on top of an exported container.
 *
 * Usage: node scripts/gtm/build-container.mjs private/gtm/<export>.json [--ga4 G-XXXX] [--ads AW-123]
 * Output: private/gtm/<publicId>_tracking-plan.json   (private/ is gitignored)
 *
 * Google Ads conversion tags are created PAUSED with a placeholder label – fill in the
 * labels in GTM and unpause.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [, , input, ...rest] = process.argv;
if (!input) {
  console.error("usage: node scripts/gtm/build-container.mjs <export.json> [--ga4 G-XXXX] [--ads AW-XXXX]");
  process.exit(1);
}
const arg = (name) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};

const src = JSON.parse(await readFile(input, "utf8"));
const cv = src.containerVersion;
const { accountId, containerId } = cv;
const existingGoogleTag = (cv.tag ?? []).find((t) => t.type === "googtag");
const GA4_ID = arg("--ga4") ?? existingGoogleTag?.parameter?.find((p) => p.key === "tagId")?.value;
const ADS_ID = (arg("--ads") ?? "AW-416814067").replace(/^AW-/, "");
if (!GA4_ID) throw new Error("No GA4 measurement ID found – pass --ga4 G-XXXX");

const ids = { tag: 100, trigger: 100, variable: 100, folder: 100 };
const next = (k) => String(++ids[k]);
const base = { accountId, containerId };
const T = (key, value) => ({ type: "TEMPLATE", key, value });
const B = (key, value) => ({ type: "BOOLEAN", key, value: String(value) });
const consent = (...types) => ({
  consentStatus: "NEEDED",
  consentType: { type: "LIST", list: types.map((v) => ({ type: "TEMPLATE", value: v })) },
});
const INIT_ALL_PAGES = "2147479573"; // built-in "Initialization - All Pages"
const ALL_PAGES = "2147479553"; // built-in "All Pages"

/* ---------------- folders ---------------- */
const folders = Object.fromEntries(
  ["Tracking plan – GA4", "Tracking plan – Google Ads", "Tracking plan – Variables & Triggers"].map((name) => [name, { ...base, folderId: next("folder"), name }]),
);
const F = (name) => folders[name].folderId;

/* ---------------- variables ---------------- */
const DLV_KEYS = [
  "page_type", "page_location", "page_path", "page_title", "page_referrer",
  "form_id", "form_name", "lead_source", "error_fields",
  "link_url", "link_text", "link_domain", "link_location", "outbound", "outbound_type",
  "file_name", "file_extension", "video_provider", "video_title", "video_url",
  "consent_analytics", "consent_marketing",
];
const variables = DLV_KEYS.map((key) => ({
  ...base,
  variableId: next("variable"),
  name: `DLV - ${key}`,
  type: "v",
  parameter: [{ type: "INTEGER", key: "dataLayerVersion", value: "2" }, B("setDefaultValue", false), T("name", key)],
  parentFolderId: F("Tracking plan – Variables & Triggers"),
  formatValue: {},
}));
variables.push({
  ...base,
  variableId: next("variable"),
  name: "CONST - GA4 Measurement ID",
  type: "c",
  parameter: [T("value", GA4_ID)],
  parentFolderId: F("Tracking plan – Variables & Triggers"),
  formatValue: {},
});
const v = (key) => `{{DLV - ${key}}}`;

/* ---------------- triggers ---------------- */
const eq = (arg0, arg1) => ({ type: "EQUALS", parameter: [T("arg0", arg0), T("arg1", arg1)] });
const triggers = {};
const ce = (name, event, extra = []) => {
  triggers[name] = {
    ...base,
    triggerId: next("trigger"),
    name,
    type: "CUSTOM_EVENT",
    customEventFilter: [eq("{{_event}}", event)],
    ...(extra.length ? { filter: extra } : {}),
    parentFolderId: F("Tracking plan – Variables & Triggers"),
  };
};
ce("CE - page_view", "page_view");
ce("CE - generate_lead", "generate_lead");
ce("CE - form_start", "form_start");
ce("CE - form_error", "form_error");
ce("CE - click_phone", "click_phone");
ce("CE - click_email", "click_email");
ce("CE - file_download", "file_download");
ce("CE - outbound click", "click", [eq(v("outbound"), "true")]);
ce("CE - eshop click", "click", [eq(v("outbound_type"), "eshop")]);
ce("CE - cta_click", "cta_click");
ce("CE - video_start", "video_start");
const trig = (name) => triggers[name].triggerId;

/* ---------------- tags ---------------- */
const params = (...keys) => ({
  type: "LIST",
  key: "eventSettingsTable",
  list: keys.map((k) => ({ type: "MAP", map: [T("parameter", k), T("parameterValue", v(k))] })),
});
const ga4Event = (name, eventName, trigger, keys) => ({
  ...base,
  tagId: next("tag"),
  name,
  type: "gaawe",
  parameter: [
    B("sendEcommerceData", false),
    T("eventName", eventName),
    T("measurementIdOverride", "{{CONST - GA4 Measurement ID}}"),
    params(...keys),
  ],
  firingTriggerId: [trigger],
  tagFiringOption: "ONCE_PER_EVENT",
  monitoringMetadata: { type: "MAP" },
  consentSettings: consent("analytics_storage"),
  parentFolderId: F("Tracking plan – GA4"),
});
const LINK = ["link_url", "link_text", "link_location"];

const googleTag = {
  ...(existingGoogleTag ?? { ...base, tagId: next("tag") }),
  name: "GA4 - Google tag",
  type: "googtag",
  parameter: [
    T("tagId", "{{CONST - GA4 Measurement ID}}"),
    {
      type: "LIST",
      key: "configSettingsTable",
      list: [
        // The site sends page_view itself (incl. client-side navigations) – avoid double counting.
        { type: "MAP", map: [T("parameter", "send_page_view"), T("parameterValue", "false")] },
      ],
    },
  ],
  firingTriggerId: [INIT_ALL_PAGES],
  tagFiringOption: "ONCE_PER_EVENT",
  monitoringMetadata: { type: "MAP" },
  consentSettings: consent("analytics_storage"),
  parentFolderId: F("Tracking plan – GA4"),
};
delete googleTag.fingerprint;

const tags = [
  googleTag,
  ga4Event("GA4 - page_view", "page_view", trig("CE - page_view"), ["page_location", "page_title", "page_referrer", "page_type"]),
  ga4Event("GA4 - generate_lead", "generate_lead", trig("CE - generate_lead"), ["form_id", "form_name", "lead_source", "page_type"]),
  ga4Event("GA4 - form_start", "form_start", trig("CE - form_start"), ["form_id", "form_name"]),
  ga4Event("GA4 - form_error", "form_error", trig("CE - form_error"), ["form_id", "form_name", "error_fields"]),
  ga4Event("GA4 - click_phone", "click_phone", trig("CE - click_phone"), LINK),
  ga4Event("GA4 - click_email", "click_email", trig("CE - click_email"), LINK),
  ga4Event("GA4 - file_download", "file_download", trig("CE - file_download"), ["file_name", "file_extension", ...LINK]),
  ga4Event("GA4 - click (outbound)", "click", trig("CE - outbound click"), ["outbound", "outbound_type", "link_domain", ...LINK]),
  ga4Event("GA4 - cta_click", "cta_click", trig("CE - cta_click"), LINK),
  ga4Event("GA4 - video_start", "video_start", trig("CE - video_start"), ["video_provider", "video_title", "video_url"]),
  {
    ...base,
    tagId: next("tag"),
    name: "Ads - Conversion Linker",
    type: "gclidw",
    parameter: [B("enableCrossDomain", false), B("enableUrlPassthrough", false), B("enableCookieOverrides", false)],
    firingTriggerId: [ALL_PAGES],
    tagFiringOption: "ONCE_PER_EVENT",
    monitoringMetadata: { type: "MAP" },
    consentSettings: consent("ad_storage"),
    parentFolderId: F("Tracking plan – Google Ads"),
  },
  ...[
    ["Ads - Conversion - Lead", trig("CE - generate_lead")],
    ["Ads - Conversion - Phone click", trig("CE - click_phone")],
    ["Ads - Conversion - E-shop click", trig("CE - eshop click")],
  ].map(([name, trigger]) => ({
    ...base,
    tagId: next("tag"),
    name,
    type: "awct",
    paused: true, // fill in the conversion label, then unpause
    parameter: [
      B("enableNewCustomerReporting", false),
      B("enableConversionLinker", true),
      B("enableProductReporting", false),
      T("conversionCookiePrefix", "_gcl"),
      B("enableShippingData", false),
      T("conversionId", ADS_ID),
      T("conversionLabel", "REPLACE_WITH_CONVERSION_LABEL"),
      B("rdp", false),
    ],
    firingTriggerId: [trigger],
    tagFiringOption: "ONCE_PER_EVENT",
    monitoringMetadata: { type: "MAP" },
    consentSettings: consent("ad_storage", "ad_user_data"),
    parentFolderId: F("Tracking plan – Google Ads"),
  })),
];

const out = {
  exportFormatVersion: 2,
  exportTime: new Date().toISOString().replace("T", " ").slice(0, 19),
  containerVersion: {
    path: cv.path,
    accountId,
    containerId,
    containerVersionId: "0",
    container: cv.container,
    tag: tags,
    trigger: Object.values(triggers),
    variable: variables,
    folder: Object.values(folders),
    builtInVariable: [
      ...(cv.builtInVariable ?? []),
      ...["Click URL", "Click Text"].filter((n) => !(cv.builtInVariable ?? []).some((b) => b.name === n)).map((name) => ({
        ...base,
        type: name === "Click URL" ? "CLICK_URL" : "CLICK_TEXT",
        name,
      })),
    ],
  },
};

const file = path.join(path.dirname(input), `${cv.container.publicId}_tracking-plan.json`);
await writeFile(file, JSON.stringify(out, null, 2) + "\n");
console.log(`GA4 ${GA4_ID} · Ads AW-${ADS_ID}`);
console.log(`${tags.length} tags, ${Object.keys(triggers).length} triggers, ${variables.length} variables → ${file}`);
