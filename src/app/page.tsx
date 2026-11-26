import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/blocks/ContactForm";
import { ImageCarousel } from "@/components/blocks/ImageCarousel";
import { JsonLd, organizationLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eyebrow, Heading } from "@/components/ui/Heading";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Prose } from "@/components/ui/Prose";
import { Section } from "@/components/ui/Section";
import { type ContentSection, getPage, getPosts } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.company} | Predaj a servis HP plotrov` },
  description:
    "Autorizované servisné stredisko HP pre záručný a pozáručný servis plotrov. Predaj, prenájom a splátky HP DesignJet plotrov, skenerov a skladačiek – viac ako 20 rokov skúseností.",
  alternates: { canonical: "/" },
};

const services = ["Dovoz plotra", "Montáž", "Zapojenie do siete", "Inštalácia", "Testovanie", "Zaškolenie užívateľov"];

const entryPoints: { title: string; text: string; href: string; icon: IconName }[] = [
  { title: "Pozriem si ponuku plotrov", text: "HP DesignJet plotre, skenery a skladačky.", href: "/velkoformatove-tlaciarne", icon: "printer" },
  { title: "Potrebujem servis a opravu", text: "Záručný aj pozáručný servis, náhradné diely.", href: "/smart-sluzby", icon: "wrench" },
  { title: "Chcem sa s vami poradiť", text: "Pomôžeme vybrať správne riešenie.", href: "/kontakt", icon: "chat" },
];

type Content = Extract<ContentSection, { type: "content" }>;
type Slider = Extract<ContentSection, { type: "slider" }>;

export default function HomePage() {
  // Copy for the longer blocks comes straight from the imported homepage.
  const home = getPage("/")!;
  const byId = <T extends ContentSection>(id: string) => home.sections.find((s) => s.id === id) as T | undefined;
  const solutions = byId<Content>("layers-widget-column-148")?.columns ?? [];
  const help = byId<Content>("layers-widget-column-95")?.columns ?? [];
  const series = byId<Slider>("layers-widget-slide-95")?.slides ?? [];
  const partner = byId<Slider>("layers-widget-slide-75")?.slides[0];
  const eco = byId<Slider>("layers-widget-slide-230")?.slides[0];
  const posts = getPosts().slice(0, 3);

  return (
    <>
      <JsonLd data={organizationLd} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white" aria-labelledby="hero-title">
        <div aria-hidden="true" className="absolute -left-32 top-10 size-96 rounded-full bg-brand-400/30 blur-3xl" />
        <Container className="relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="space-y-6">
            <Badge tone="inverse">
              <Icon name="award" className="size-4" /> Autorizovaný HP DesignJet partner
            </Badge>
            <Heading id="hero-title" level={1} size="display">
              Veľkoformátové HP tlačiarne a skladačky
            </Heading>
            <p className="max-w-xl text-lg text-white/90 sm:text-xl">
              Využite naše viac ako 20-ročné skúsenosti s predajom a servisom HP plotrov. O všetko sa postaráme.
            </p>
            <ul className="grid max-w-xl grid-cols-1 gap-x-6 gap-y-2 min-[400px]:grid-cols-2 sm:grid-cols-3" aria-label="Čo pre vás zabezpečíme">
              {services.map((s) => (
                <li key={s} className="flex items-center gap-2 font-medium">
                  <Icon name="check" className="size-5 shrink-0 text-accent-400" /> {s}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/velkoformatove-tlaciarne" variant="secondary" size="lg" arrow>
                Ponuka plotrov
              </ButtonLink>
              <ButtonLink href="/kontakt" variant="inverse" size="lg">
                Poradiť sa s nami
              </ButtonLink>
            </div>
          </div>
          <Image
            src="/media/2023/10/T850.png"
            alt="Plotre HP DesignJet T850 a T950"
            width={4459}
            height={2209}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-auto w-full drop-shadow-2xl"
          />
        </Container>
      </section>

      {/* Entry points */}
      <Section spacing="sm" className="-mt-px" aria-label="Rýchla navigácia">
        <Container>
          <ul className="grid gap-4 md:grid-cols-3">
            {entryPoints.map((e) => (
              <li key={e.href}>
                <a
                  href={e.href}
                  className="group flex h-full items-start gap-4 rounded-(--radius-card) border border-line bg-white p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-card-hover)"
                >
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={e.icon} className="size-6" />
                  </span>
                  <span>
                    <span className="flex items-center gap-1 font-display text-lg font-semibold text-brand-900">
                      {e.title}
                      <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="mt-1 block text-ink-muted">{e.text}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Intro */}
      <Section aria-labelledby="intro-title">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <Eyebrow>Sme smartCAD s.r.o.</Eyebrow>
            <Heading id="intro-title" level={2} size="xl" className="text-brand-900">
              Dostaneme vaše projekty na papier
            </Heading>
            <p className="text-lg text-ink-muted">
              Či už ste architekt, projektant alebo poskytovateľ tlačových služieb, na nás sa môžete spoľahnúť. Pomôžeme
              vám zorientovať sa a poradíme pri výbere veľkoformátovej tlačiarne alebo skladačky.
            </p>
            <p className="text-lg text-ink-muted">
              Ako jediní na Slovensku máme akreditáciu pre servis veľkých produkčných tlačiarní DesignJet T1600, T1700,
              T2600, T3500, XL3600, T7200, Z6 a Z9.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Image src="/media/2023/10/T850.1.png" alt="Ploter HP DesignJet T850 v kancelárii" width={1701} height={1694} sizes="(min-width: 1024px) 25vw, 50vw" className="h-auto w-full rounded-(--radius-card) bg-surface-muted" />
            <Image src="/media/2023/10/T850.2.png" alt="Detail plotra HP DesignJet T850" width={1701} height={1701} sizes="(min-width: 1024px) 25vw, 50vw" className="mt-8 h-auto w-full rounded-(--radius-card) bg-surface-muted" />
          </div>
        </Container>
      </Section>

      {/* Solutions */}
      <Section tone="muted" aria-labelledby="solutions-title">
        <Container className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <Eyebrow>Pomôžeme vám</Eyebrow>
            <Heading id="solutions-title" level={2} size="xl" className="text-brand-900">
              Vyberte si riešenie, ktoré vám vyhovuje
            </Heading>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {solutions.map((c) => (
              <Card key={c.title} title={c.title} image={c.image}>
                {c.html && <Prose html={c.html} className="text-ink" />}
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Series carousel */}
      {series.length > 0 && (
        <Section aria-labelledby="series-title">
          <Container className="space-y-6">
            <Heading id="series-title" level={2} size="xl" className="text-brand-900">
              Aktuálne rady plotrov HP DesignJet
            </Heading>
            <ImageCarousel slides={series.map((s, i) => ({ image: s.image && { ...s.image, alt: s.image.alt || `Rad plotrov HP DesignJet – snímka ${i + 1}` } }))} label="Rady plotrov HP DesignJet" />
            <div className="flex justify-center">
              <ButtonLink href="/velkoformatove-tlaciarne" variant="outline" arrow>
                Celý produktový rad
              </ButtonLink>
            </div>
          </Container>
        </Section>
      )}

      {/* Help */}
      <Section tone="muted" aria-labelledby="help-title">
        <Container className="space-y-8">
          <Heading id="help-title" level={2} size="xl" className="text-brand-900">
            Prečo smartCAD
          </Heading>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {help.map((c) => (
              <Card key={c.title} title={c.title} image={c.image}>
                {c.html && <Prose html={c.html} className="text-sm text-ink" />}
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Partner + eco */}
      <Section aria-label="Certifikácie a ekológia">
        <Container className="grid gap-10 lg:grid-cols-2">
          {[partner, eco].map(
            (s) =>
              s && (
                <div key={s.title} className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  {s.image && (
                    <Image src={s.image.src} alt="" width={s.image.width ?? 200} height={s.image.height ?? 200} className="h-auto w-28 shrink-0 sm:w-36" />
                  )}
                  <div className="space-y-3">
                    <Heading level={2} size="lg" className="text-brand-900">{s.title}</Heading>
                    {s.excerpt && <Prose html={s.excerpt} className="text-ink-muted" />}
                  </div>
                </div>
              ),
          )}
        </Container>
      </Section>

      {/* Blog */}
      <Section tone="muted" aria-labelledby="blog-title">
        <Container className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Heading id="blog-title" level={2} size="xl" className="text-brand-900">
              Novinky z blogu
            </Heading>
            <ButtonLink href="/blogy" variant="ghost" arrow>
              Všetky články
            </ButtonLink>
          </div>
          <ul className="grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <li key={p.route}>
                <Card href={p.route} title={p.title} image={p.thumbnail} imageFit="cover">
                  <p className="line-clamp-3">{p.description}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Contact */}
      <Section aria-labelledby="contact-title">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-5">
            <Heading id="contact-title" level={2} size="xl" className="text-brand-900">
              Máte na nás otázky?
            </Heading>
            <p className="text-lg text-ink-muted">Pýtajte sa, radi vám odpovieme – zvyčajne ešte v ten istý pracovný deň.</p>
            <address className="space-y-3 not-italic">
              <p className="flex items-start gap-3">
                <Icon name="map-pin" className="mt-0.5 text-brand-600" />
                <span>{site.company}<br />{site.address.street}, {site.address.zip} {site.address.city}</span>
              </p>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center gap-3 font-semibold text-brand-700 underline underline-offset-4">
                <Icon name="phone" /> {site.phoneDisplay}
              </a>
              <a href={`mailto:${site.email}`} className="flex min-h-11 items-center gap-3 font-semibold text-brand-700 underline underline-offset-4">
                <Icon name="mail" /> {site.email}
              </a>
            </address>
          </div>
          <ContactForm />
        </Container>
      </Section>
    </>
  );
}
