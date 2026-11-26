import type { Metadata, Viewport } from "next";
import { Exo_2, Inter } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { ClickTracker } from "@/components/analytics/ClickTracker";
import { ConsentManager } from "@/components/analytics/ConsentManager";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { SITE_URL, site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap" });
const exo = Exo_2({ variable: "--font-exo", subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.company} | Predaj a servis HP plotrov`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", locale: site.locale, siteName: site.name, images: ["/media/2023/10/T850.png"] },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

const CONSENT_DEFAULT =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}" +
  "gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});" +
  // Returning visitor: apply the stored choice before anything else is queued, so GTM starts with the right state.
  "try{var c=JSON.parse(localStorage.getItem('hpplotre-consent-v1')||'null');if(c){var a=c.analytics?'granted':'denied',m=c.marketing?'granted':'denied';" +
  "gtag('consent','update',{analytics_storage:a,ad_storage:m,ad_user_data:m,ad_personalization:m});}}catch(e){}";

export const viewport: Viewport = {
  themeColor: "#008080",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sk" className={`${inter.variable} ${exo.variable}`}>
      <head>
        {/* Google Consent Mode v2: everything denied until the visitor opts in (ConsentManager). */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <SiteHeader />
        <main id="obsah" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter />
        <ConsentManager />
        <ClickTracker />
        <PageViewTracker />
      </body>
    </html>
  );
}
