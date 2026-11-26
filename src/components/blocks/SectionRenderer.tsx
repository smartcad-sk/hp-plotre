import type { ContentSection as Data } from "@/lib/content";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { slideLinkLabel } from "@/lib/normalize";
import { Heading } from "@/components/ui/Heading";
import { Prose } from "@/components/ui/Prose";
import { Section } from "@/components/ui/Section";
import { ContactDetails } from "./ContactDetails";
import { ContentSection } from "./ContentSection";
import { ImageCarousel } from "./ImageCarousel";
import { Html5Video } from "./Html5Video";
import { YouTubeEmbed } from "./YouTubeEmbed";

/** Maps imported WordPress sections to design-system blocks. */
export function SectionRenderer({ sections, pageTitle }: { sections: Data[]; pageTitle: string }) {
  // Carousels are landmarks (region) – each needs a unique name.
  const galleries = sections.filter((s) => s.type === "slider" && s.slides.some((sl) => sl.image)).length;
  let galleryNo = 0;
  const galleryLabel = () => (galleries > 1 ? `Galéria ${++galleryNo} – ${pageTitle}` : `Galéria – ${pageTitle}`);
  return (
    <>
      {sections.map((s, i) => {
        switch (s.type) {
          case "content":
            return <ContentSection key={s.id + i} data={s} />;
          case "slider": {
            const withImages = s.slides.filter((sl) => sl.image);
            if (withImages.length === 0) {
              // Text-only slides → callout band.
              return (
                <Section key={s.id + i} tone="muted" spacing="sm">
                  <Container className="space-y-2">
                    {s.slides.map((sl, j) => (
                      <div key={j}>
                        {sl.title && <Heading level={2} size="lg" className="text-brand-900">{sl.title}</Heading>}
                        {sl.excerpt && <Prose html={sl.excerpt} />}
                      </div>
                    ))}
                  </Container>
                </Section>
              );
            }
            const captioned = s.slides.filter((sl) => sl.excerpt);
            const linked = [...new Map(withImages.filter((sl) => sl.link).map((sl) => [sl.link!, sl])).values()];
            return (
              <Section key={s.id + i} spacing="sm">
                <Container className="space-y-6">
                  <ImageCarousel slides={withImages.map(({ image, title }) => ({ image, title }))} label={galleryLabel()} />
                  {linked.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3">
                      {linked.map((sl) => (
                        <ButtonLink key={sl.link} href={sl.link!} variant="outline" arrow>
                          {/youtu\.?be/.test(sl.link!) ? "Pozrieť video" : slideLinkLabel(sl)}
                        </ButtonLink>
                      ))}
                    </div>
                  )}
                  {captioned.map((sl, j) => (
                    <Prose key={j} html={sl.excerpt!} className="mx-auto max-w-(--container-prose)" />
                  ))}
                </Container>
              </Section>
            );
          }
          case "links":
            return (
              <Section key={s.id + i} spacing="sm" tone="muted">
                <Container className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {s.links.map((l, j) => {
                    const pdf = /\.pdf($|\?)/i.test(l.href);
                    return (
                      <ButtonLink key={l.href + j} href={l.href} variant={pdf ? "outline" : "primary"} arrow={!pdf}>
                        {pdf && <Icon name="document" className="size-5 shrink-0" />}
                        {l.label}
                        {pdf && <span className="sr-only"> (PDF)</span>}
                      </ButtonLink>
                    );
                  })}
                </Container>
              </Section>
            );
          case "video":
            return (
              <Section key={s.id + i} spacing="sm">
                <Container size="prose">
                  {s.youtubeId ? (
                    <YouTubeEmbed id={s.youtubeId} title={s.title ?? `Video – ${pageTitle}`} />
                  ) : (
                    <Html5Video src={s.src!} title={s.title ?? `Video – ${pageTitle}`} />
                  )}
                </Container>
              </Section>
            );
          case "html":
            return (
              <Section key={s.id + i} spacing="sm">
                <Container size="prose">
                  <Prose html={s.html} />
                </Container>
              </Section>
            );
          case "contact":
            return <ContactDetails key={s.id + i} />;
        }
      })}
    </>
  );
}
