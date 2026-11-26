import { site } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";

/** Consistent closing call-to-action used at the bottom of content pages. */
export function CtaBand({
  title = "Potrebujete poradiť s výberom alebo servisom?",
  text = "Ozvite sa nám – pomôžeme vám vybrať správny ploter, zabezpečíme dovoz, inštaláciu aj zaškolenie.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section aria-labelledby="cta-title" className="bg-brand-800 text-white" data-location="cta_band">
      <Container className="flex flex-col gap-6 py-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl flex-1 space-y-2">
          <Heading id="cta-title" level={2} size="lg">
            {title}
          </Heading>
          <p className="text-white/85">{text}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <ButtonLink href="/kontakt" variant="secondary" size="lg" arrow className="whitespace-nowrap">
            Kontaktujte nás
          </ButtonLink>
          <ButtonLink href={`tel:${site.phone.replace(/\s/g, "")}`} variant="inverse" size="lg" className="whitespace-nowrap">
            {site.phoneDisplay}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
