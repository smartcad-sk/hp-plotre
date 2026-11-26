import type { Metadata } from "next";
import Image from "next/image";
import { ContactDetails } from "@/components/blocks/ContactDetails";
import { ContactForm } from "@/components/blocks/ContactForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd, breadcrumbLd, organizationLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { contactPeople, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktujte smartCAD s.r.o. – predaj a servis HP plotrov. Čajakova 19, Bratislava. Tel.: 0940 636 489, obchod@smartcad.sk.",
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={organizationLd} />
      <JsonLd data={breadcrumbLd([{ label: "Úvod", href: "/" }, { label: "Kontakt", href: "/kontakt" }])} />
      <PageHeader
        title="Kontakt"
        lead="Potrebujete viac informácií? Poradíme vám! Sme HP DesignJet Specialist a HP Technical Production Specialist."
        crumbs={[{ label: "Úvod", href: "/" }]}
      />

      <Section aria-labelledby="tim">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <Heading id="tim" level={2} size="xl" className="text-brand-900">
              Váš tím pre plotre
            </Heading>
            <p className="text-lg text-ink-muted">
              Vyše 20 rokov sa špecializujeme na dodávku a montáž veľkoformátových tlačiarní HP pre CAD a grafické systémy.
              Plotre denne používame a servisujeme – zariadenia poznáme a vieme vám pomôcť v každej situácii.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {contactPeople.map((p) => (
                <li key={p.email} className="flex items-center gap-4 rounded-(--radius-card) border border-line bg-white p-4 shadow-(--shadow-card)">
                  <Image src={p.photo} alt="" width={80} height={80} className="size-16 shrink-0 rounded-full object-cover sm:size-20" />
                  <div className="min-w-0">
                    <p className="font-semibold">{p.name}</p>
                    <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="block py-1 text-brand-700 underline underline-offset-4">
                      {p.phone}
                    </a>
                    <a href={`mailto:${p.email}`} className="block break-all py-1 text-brand-700 underline underline-offset-4">
                      {p.email}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-sm text-ink-muted">
              Vyplnením formulára sa {site.company} stáva prevádzkovateľom vašich osobných údajov. Viac informácií nájdete na{" "}
              <a href={site.gdpr} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
                www.smartcad.sk/gdpr<span className="sr-only"> (otvorí sa v novom okne)</span>
              </a>
              .
            </p>
          </div>
          <ContactForm heading="Máte otázky? Pýtajte sa, radi vám odpovieme" />
        </Container>
      </Section>

      <ContactDetails />
    </>
  );
}
