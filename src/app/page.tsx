import type { Metadata } from "next";
import { SectionRenderer } from "@/components/blocks/SectionRenderer";
import { IntroBand } from "@/components/layout/IntroBand";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd, organizationLd } from "@/components/seo/JsonLd";
import { getPage } from "@/lib/content";
import { normalizePage } from "@/lib/normalize";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.company} | Predaj a servis HP plotrov` },
  description:
    "Autorizovaný HP servis a predaj plotrov. Predaj, prenájom a splátky HP DesignJet plotrov, skenerov a skladačiek – viac ako 20 rokov skúseností.",
  alternates: { canonical: "/" },
};

/**
 * Home page – same section order and content as the original hpplotre.sk home page
 * (title band → services band → series slider → entry buttons → about → solutions →
 * awards/diagnostics/trade-in → HP partner → recycling → contact form → company info),
 * rendered with the design-system blocks.
 */
export default function HomePage() {
  const { title, leadHtml, intro, sections } = normalizePage(getPage("/")!);
  return (
    <>
      <JsonLd data={organizationLd} />
      <PageHeader title={title} leadHtml={leadHtml} pageType="home" />
      {intro && <IntroBand data={intro} />}
      <SectionRenderer sections={sections} pageTitle="HPplotre.sk" />
    </>
  );
}
