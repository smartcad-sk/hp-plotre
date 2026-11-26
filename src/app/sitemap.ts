import type { MetadataRoute } from "next";
import { allRoutes, isProductRoute } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes().map(({ route, modified }) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    lastModified: new Date(modified),
    changeFrequency: route === "/" || route === "/blogy" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : isProductRoute(route) ? 0.7 : 0.8,
  }));
}
