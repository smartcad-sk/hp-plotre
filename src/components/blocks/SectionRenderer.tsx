import type { ContentSection as Data } from "@/lib/content";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { slideLinkLabel, tidyHeading } from "@/lib/normalize";
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
  const isGallery = (s: Data) =>
    s.type === "slider" && s.slides.some((sl) => sl.image) && !(s.slides.length === 1 && (s.slides[0].title || s.slides[0].excerpt));
  const galleries = sections.filter(isGallery).length;
  let galleryNo = 0;
  let sliderNo = 0;
  // A slider right at the top of the content is likely the LCP element – preload its first image.
  const firstIsSlider = sections.findIndex(isGallery) <= 1 && sections.findIndex(isGallery) >= 0;
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
            // One slide with a heading/text (e.g. "Sme autorizovaný servisný partner HP") → image + text block.
            const only = s.slides.length === 1 ? s.slides[0] : undefined;
            if (only?.image && (only.title || only.excerpt)) {
              const headingId = `${s.id}-title`;
              return (
                <Section key={s.id + i} aria-labelledby={only.title ? headingId : undefined}>
                  <Container className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                    <Image
                      src={only.image.src}
                      alt={only.image.alt}
                      width={only.image.width ?? 600}
                      height={only.image.height ?? 400}
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="mx-auto h-auto w-full max-w-xs rounded-(--radius-card) object-contain"
                    />
                    <div className="space-y-4">
                      {only.title && (
                        <Heading id={headingId} level={2} size="xl" className="text-brand-900">
                          {tidyHeading(only.title)}
                        </Heading>
                      )}
                      {only.excerpt && <Prose html={only.excerpt} />}
                      {only.link && (
                        <ButtonLink href={only.link} variant="outline" arrow>
                          {/youtu\.?be/.test(only.link) ? "Pozrieť video" : "Viac informácií"}
                        </ButtonLink>
                      )}
                    </div>
                  </Container>
                </Section>
              );
            }
            const captioned = s.slides.filter((sl) => sl.excerpt);
            const no = ++sliderNo;
            return (
              <Section key={s.id + i} spacing="sm">
                <Container size="wide" className="space-y-6">
                  <ImageCarousel
                    priority={no === 1 && firstIsSlider}
                    slides={withImages.map((sl) => ({
                      image: sl.image,
                      title: sl.title,
                      href: sl.link,
                      linkLabel: sl.link ? slideLinkLabel(sl, sl.image?.src) : undefined,
                    }))}
                    label={galleryLabel()}
                  />
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
