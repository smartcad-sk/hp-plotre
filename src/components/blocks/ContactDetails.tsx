import type { Tone } from "@/lib/content";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";

/** Company contact card – replaces the WordPress map/contact widget. */
export function ContactDetails({ tone = "muted" }: { tone?: Tone } = {}) {
  const tel = site.phone.replace(/\s/g, "");
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.company}, ${site.address.street}, ${site.address.zip} ${site.address.city}`,
  )}`;
  return (
    <Section tone={tone} aria-labelledby="kontakt-udaje">
      <Container>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card)">
            <Heading id="kontakt-udaje" level={2} size="md" className="flex items-center gap-2 text-brand-900">
              <Icon name="map-pin" className="text-brand-600" /> Adresa
            </Heading>
            <address className="mt-3 not-italic text-ink-muted">
              {site.company}
              <br />
              {site.address.street}, {site.address.zip} {site.address.city}
            </address>
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold text-brand-700 underline underline-offset-4">
              Zobraziť na mape <span className="sr-only">(otvorí sa v novom okne)</span>
            </a>
          </div>
          <div className="rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card)">
            <Heading level={2} size="md" className="flex items-center gap-2 text-brand-900">
              <Icon name="phone" className="text-brand-600" /> Telefón a e-mail
            </Heading>
            <ul className="mt-3 space-y-1">
              <li><a className="inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-4" href={`tel:${tel}`}>{site.phoneDisplay}</a></li>
              <li><a className="inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a></li>
              <li className="text-sm text-ink-muted">Servis: <a className="font-medium text-brand-700 underline" href={`mailto:${site.serviceEmail}`}>{site.serviceEmail}</a></li>
            </ul>
          </div>
          <div className="rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card)">
            <Heading level={2} size="md" className="flex items-center gap-2 text-brand-900">
              <Icon name="document" className="text-brand-600" /> Fakturačné údaje
            </Heading>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-ink-muted">
              <dt>IČO</dt><dd>{site.ico}</dd>
              <dt>IČ DPH</dt><dd>{site.dic}</dd>
            </dl>
            <p className="mt-2 text-sm text-ink-muted">{site.registry}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
