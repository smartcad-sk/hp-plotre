import Image from "next/image";
import Link from "next/link";
import type { ContentSection } from "@/lib/content";
import { tidyHeading } from "@/lib/normalize";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";

type Data = Extract<ContentSection, { type: "portfolio" }>;

/**
 * Product categories (image, short description) with their models in a native <details>
 * dropdown – works without JavaScript and is keyboard/screen-reader friendly.
 */
export function PortfolioSection({ data }: { data: Data }) {
  const headingId = `${data.id}-title`;
  return (
    <section aria-labelledby={headingId}>
      <Section as="div" tone="brand" spacing="sm">
        <Container>
          <Heading id={headingId} level={2} size="xl">
            {tidyHeading(data.title)}
          </Heading>
        </Container>
      </Section>
      <Section as="div">
        <Container>
          <ul className="flex flex-wrap items-start justify-center gap-6">
            {data.categories.map((cat) => (
              <li
                key={cat.title}
                className="flex w-full min-w-0 flex-col rounded-(--radius-card) border border-line bg-white p-5 shadow-(--shadow-card) sm:w-[calc((100%-1.5rem)/2)] sm:p-6 lg:w-[calc((100%-3rem)/3)]"
              >
                {cat.image && (
                  <div className="mb-4 flex h-40 items-center justify-center">
                    <Image
                      src={cat.image.src}
                      alt=""
                      width={cat.image.width ?? 600}
                      height={cat.image.height ?? 400}
                      sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                      className="max-h-40 w-auto object-contain"
                    />
                  </div>
                )}
                <Heading level={3} size="md" className="text-brand-800">
                  {cat.href ? (
                    <Link href={cat.href} className="underline-offset-4 hover:underline">
                      {cat.title}
                    </Link>
                  ) : (
                    cat.title
                  )}
                </Heading>
                {cat.description && <p className="mb-4 mt-2 text-ink-muted sm:min-h-[4lh]">{cat.description}</p>}
                <details className="group border-t border-line pt-2 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md font-semibold text-brand-700 hover:text-brand-900">
                    Zobraziť modely ({cat.models.length})
                    <Icon name="chevron-down" className="size-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="mt-1 space-y-1 pb-1">
                    {cat.models.map((m) => (
                      <li key={m.label}>
                        <Link
                          href={m.href}
                          className="flex min-h-11 items-center gap-2 rounded-md px-1 text-ink underline-offset-4 hover:text-brand-800 hover:underline"
                        >
                          <Icon name="chevron-right" className="size-4 shrink-0 text-brand-600" />
                          {m.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </section>
  );
}
