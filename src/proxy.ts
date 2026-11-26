import { type NextRequest, NextResponse } from "next/server";
import { allRoutes } from "@/lib/content";

/**
 * With Cache Components the catch-all route streams its shell before `notFound()`
 * can run, so an unknown URL would answer 200 (a "soft 404" – bad for SEO).
 * The set of pages is fully known at build time, so reject unknown paths up-front.
 */
const known = new Set(allRoutes().map((r) => r.route));

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/+$/, "").toLowerCase() || "/";
  if (known.has(path)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}

export const config = {
  // Only page-like paths: skip Next internals, files with an extension and metadata routes.
  matcher: ["/((?!_next/|_not-found|media/|brand/|api/|.*\\.[a-z0-9]+$).*)"],
};
