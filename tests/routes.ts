import pages from "../src/content/pages.json" with { type: "json" };
import posts from "../src/content/posts.json" with { type: "json" };

const hidden = new Set(["/kontaktny-formular"]);

/** Every public route of the site, derived from the same content the app renders. */
export const routes: string[] = [
  ...pages.map((p) => p.route).filter((r) => !hidden.has(r)),
  ...posts.map((p) => p.route),
];

/** Representative subset for the slower audits (one of each template). */
export const sampleRoutes = [
  "/",
  "/kontakt",
  "/blogy",
  "/velkoformatove-tlaciarne",
  "/t850",
  "/hp-designjet-t1700",
  "/smart-sluzby",
  "/diagnostika-plotra",
  "/plotrovanie",
  "/pigmentove_atramenty",
];
