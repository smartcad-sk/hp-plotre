import type { IntroBand as IntroBandData } from "@/lib/normalize";
import { tidyHeading } from "@/lib/normalize";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Icon } from "@/components/ui/Icon";
import { Prose } from "@/components/ui/Prose";

/**
 * The original site's lighter teal subtitle band under the page title, e.g.
 * "36-palcová farebná veľkoformátová tlačiareň" + spec / e-shop buttons.
 */
export function IntroBand({ data, children }: { data: IntroBandData; children?: React.ReactNode }) {
  return (
    <section aria-labelledby="intro-title" className="bg-brand-600 text-white" data-location="page_header">
      <Container className="space-y-4 py-8 sm:py-10">
        <Heading id="intro-title" level={2} size="lg" className="max-w-4xl">
          {tidyHeading(data.title)}
        </Heading>
        {data.excerptHtml && <Prose html={data.excerptHtml} invert className="max-w-3xl text-lg" />}
        {children}
        {data.actions.length > 0 && (
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
            {data.actions.map((a, i) => {
              const pdf = /\.pdf($|\?)/i.test(a.href);
              return (
                <ButtonLink key={a.href + i} href={a.href} variant={i === 0 ? "secondary" : "inverse"} arrow={!pdf}>
                  {pdf && <Icon name="document" className="size-5 shrink-0" />}
                  {a.label}
                  {pdf && <span className="sr-only"> (PDF)</span>}
                </ButtonLink>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
