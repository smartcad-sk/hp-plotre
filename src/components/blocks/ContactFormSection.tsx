import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Icon } from "@/components/ui/Icon";
import { Prose } from "@/components/ui/Prose";
import { Section } from "@/components/ui/Section";
import { tidyHeading } from "@/lib/normalize";
import { site } from "@/lib/site";
import { ContactForm } from "./ContactForm";

const DEFAULT_TITLE = "Máte otázky? Pýtajte sa, radi vám odpovieme";

/**
 * The one contact-form layout used on every page (40+ imported pages had the form in
 * different column widths and backgrounds). Brand title band, then the form card with the
 * GDPR note and direct contacts beside it.
 */
export function ContactFormSection({ id = "otazky", title, excerpt }: { id?: string; title?: string; excerpt?: string }) {
  const headingId = `${id}-title`;
  return (
    <section aria-labelledby={headingId}>
      <Section as="div" tone="brand" spacing="sm">
        <Container>
          <div className="max-w-3xl space-y-3">
            <Heading id={headingId} level={2} size="xl">
              {title ? tidyHeading(title).replace(/:\s*$/, "") : DEFAULT_TITLE}
            </Heading>
            {excerpt && <Prose html={excerpt} invert className="text-lg" />}
          </div>
        </Container>
      </Section>
      <Section as="div" tone="muted">
        <Container className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <ContactForm heading="Napíšte nám" />
          <aside aria-label="Kontakt a ochrana osobných údajov" className="space-y-6 text-ink-muted lg:pt-8">
            <ul className="space-y-1 text-ink">
              <li>
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-brand-700 underline-offset-4 hover:underline">
                  <Icon name="phone" className="size-5" />
                  {site.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center gap-2 break-all font-medium text-brand-700 underline-offset-4 hover:underline">
                  <Icon name="mail" className="size-5" />
                  {site.email}
                </a>
              </li>
            </ul>
            <div className="space-y-3 text-sm">
              <p>Vyplnením vašich osobných údajov sa {site.company} stáva prevádzkovateľom vašich osobných údajov.</p>
              <p>
                Odoslaním formulára súhlasíte so spracovaním osobných údajov v súlade s pravidlami GDPR. Viac informácií nájdete
                na stránke{" "}
                <a href={site.gdpr} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
                  www.smartcad.sk/gdpr<span className="sr-only"> (otvorí sa v novom okne)</span>
                </a>
                .
              </p>
            </div>
          </aside>
        </Container>
      </Section>
    </section>
  );
}
