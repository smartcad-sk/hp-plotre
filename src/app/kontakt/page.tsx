import type { Metadata } from "next";
import Image from "next/image";
import { ContactDetails } from "@/components/blocks/ContactDetails";
import { ContactFormSection } from "@/components/blocks/ContactFormSection";
import { IntroBand } from "@/components/layout/IntroBand";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd, breadcrumbLd, organizationLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { contactPeople } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktujte smartCAD s.r.o. – predaj a servis HP plotrov. Čajakova 19, Bratislava. Tel.: 0940 636 489, obchod@smartcad.sk.",
  alternates: { canonical: "/kontakt" },
};

/**
 * Same order as the original contact page: title band → specialist band → about (photo
 * background) → people → "Máte otázky?" band → form + GDPR note → company details.
 */
export default function ContactPage() {
  return (
    <>
      <JsonLd data={organizationLd} />
      <JsonLd data={breadcrumbLd([{ label: "Úvod", href: "/" }, { label: "Kontakt", href: "/kontakt" }])} />
      <PageHeader
        title="Kontakt"
        pageType="contact"
        lead="Potrebujete viac informácií? Poradíme vám!"
        crumbs={[{ label: "Úvod", href: "/" }]}
      />
      <IntroBand data={{ title: "Sme HP DesignJet Specialist a HP Technical Production Specialist", actions: [] }} />

      <Section tone="brand-dark" className="relative isolate overflow-hidden" aria-label="O nás">
        <Image src="/media/2017/03/portfolio.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brand-950/80" />
        <Container className="max-w-3xl space-y-4 text-lg text-white">
          <p>Vyše 20 rokov sa špecializujeme na dodávku a montáž veľkoformátových tlačiarní HP pre CAD a grafické systémy.</p>
          <p>
            Našim cieľom je dodávať najlepšie riešenia na trhu v oblasti veľkoformátových zariadení. Poskytujeme individuálne
            poradenstvo a výnimočné zákaznícke služby.
          </p>
          <p>Plotre dennodenne používame a servisujeme. To vám dáva istotu, že zariadenia poznáme a vieme vám pomôcť v každej situácii.</p>
        </Container>
      </Section>

      <Section aria-labelledby="tim">
        <Container className="space-y-6">
          <Heading id="tim" level={2} size="xl" className="text-brand-900">
            Váš tím pre plotre
          </Heading>
          <ul className="grid gap-4 sm:grid-cols-2 lg:max-w-4xl">
            {contactPeople.map((p) => (
              <li key={p.email} className="flex items-center gap-4 rounded-(--radius-card) border border-line bg-white p-4 shadow-(--shadow-card) sm:p-5">
                <Image src={p.photo} alt="" width={96} height={96} className="size-20 shrink-0 rounded-full object-cover sm:size-24" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center text-brand-700 underline underline-offset-4">
                    {p.phone}
                  </a>
                  <a href={`mailto:${p.email}`} className="flex min-h-11 items-center break-all text-brand-700 underline underline-offset-4">
                    {p.email}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ContactFormSection />

      <ContactDetails tone="default" />
    </>
  );
}
