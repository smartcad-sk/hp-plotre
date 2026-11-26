import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";

export default function NotFound() {
  return (
    <Container size="prose" className="space-y-6 py-20 text-center sm:py-28">
      <p className="font-display text-6xl font-bold text-brand-600">404</p>
      <Heading level={1} size="xl">
        Stránku sme nenašli
      </Heading>
      <p className="text-lg text-ink-muted">Odkaz mohol byť zmenený alebo stránka už neexistuje.</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/">Späť na úvod</ButtonLink>
        <ButtonLink href="/velkoformatove-tlaciarne" variant="outline">
          Ponuka plotrov
        </ButtonLink>
      </div>
    </Container>
  );
}
