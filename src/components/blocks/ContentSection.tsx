import Image from "next/image";
import type { ContentColumn, ContentSection as ContentSectionData } from "@/lib/content";
import { toneFromColor } from "@/lib/content";
import { singleLinkColumn, tidyHeading } from "@/lib/normalize";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Prose } from "@/components/ui/Prose";
import { Section, isDarkTone } from "@/components/ui/Section";
import { ContactForm } from "./ContactForm";
import { ContactFormSection } from "./ContactFormSection";
import { YouTubeEmbed } from "./YouTubeEmbed";

type Data = Extract<ContentSectionData, { type: "content" }>;

/*
 * Panel layout. Layers stored a 12-column span per panel, often mixed within one group
 * (3+4+4, 6+6+5…). Instead of mapping spans 1:1 (which leaves uneven "2 + 1" rows), each
 * group is laid out as a whole:
 *  - panels per row from the typical span: 3 → 4-up, 4 → 3-up, 5–6 → 2-up, wider → 1-up,
 *    stepping down on tablets (4-up → 2×2, 3-up stays 3-up from 768px) and phones;
 *  - a shorter last row is centred;
 *  - exactly two panels of clearly different widths (image + text) keep their proportion;
 *  - full-width panels (span ≥ 10) stay full width.
 * Literal class names so Tailwind can see them. Widths subtract the 1.5rem gap.
 */
const W = {
  sm2: "sm:w-[calc((100%-1.5rem)/2)]",
  md2: "md:w-[calc((100%-1.5rem)/2)]",
  md3: "md:w-[calc((100%-3rem)/3)]",
  lg2: "lg:w-[calc((100%-1.5rem)/2)]",
  lg3: "lg:w-[calc((100%-3rem)/3)]",
  lg4: "lg:w-[calc((100%-4.5rem)/4)]",
};
const perRowClasses: Record<1 | 2 | 3 | 4, string> = {
  1: "",
  2: cn(W.sm2, W.md2, W.lg2),
  3: cn(W.md3, W.lg3), // phones: 1 per row (no 2 + 1), tablets+: 3
  4: cn(W.sm2, W.md2, W.lg4), // phones/tablets: 2×2, desktop: 4
};
// md:col-span-4 … md:col-span-8 for the proportional two-panel case.
const mdSpan: Record<number, string> = {
  4: "md:col-span-4", 5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
};

function layoutFor(columns: ContentColumn[]) {
  const regular = columns.filter((c) => c.span < 10);
  const spans = regular.map((c) => c.span).sort((a, b) => a - b);
  const median = spans[Math.floor(spans.length / 2)] ?? 12;
  const raw = median <= 3 ? 4 : median <= 4 ? 3 : median <= 6 ? 2 : 1;
  const perRow = Math.max(1, Math.min(raw, regular.length)) as 1 | 2 | 3 | 4;
  // Two panels with clearly different widths (4+8, 3+6, 4+7…): keep the proportion.
  if (columns.length === 2 && regular.length === 2 && Math.abs(regular[0].span - regular[1].span) >= 3) {
    const a = Math.min(8, Math.max(4, Math.round((12 * regular[0].span) / (regular[0].span + regular[1].span))));
    return { kind: "split" as const, spans: [a, 12 - a] };
  }
  return { kind: "flow" as const, perRow };
}

/** Wraps an image in its original link (service tiles, e-shop consumables). */
function MaybeLink({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      aria-label={external ? `${label} (otvorí sa v novom okne)` : label}
      className="block rounded-(--radius-card) transition-opacity hover:opacity-90"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function imageLinkLabel(col: ContentColumn) {
  const href = col.image?.href ?? "";
  if (col.title) return col.title;
  if (col.image?.alt) return col.image.alt;
  if (href.includes("kancelaria.smartcad.sk")) return "Zobraziť v e-shope";
  return "Zobraziť viac";
}

function Column({ col, dark, headingLevel }: { col: ContentColumn; dark: boolean; headingLevel: 2 | 3 }) {
  if (col.form) return <ContactForm />;

  const cta = !col.title && !col.image && singleLinkColumn(col.html);
  if (cta) {
    return (
      <ButtonLink href={cta.href} variant={dark ? "inverse" : "primary"} size="lg" arrow className="h-full w-full">
        {cta.label}
      </ButtonLink>
    );
  }

  const panelTone = toneFromColor(col.bg);
  const isPanel = col.bg && panelTone !== "default";
  const panelDark = isPanel ? isDarkTone(panelTone) : dark;
  const imageOnly = col.image && !col.title && !col.html && !col.button && !col.youtubeId;

  if (col.youtubeId && !col.title && !col.html && !col.image) {
    return <YouTubeEmbed id={col.youtubeId} title="Video" />;
  }

  if (imageOnly && col.image) {
    return (
      <MaybeLink href={col.image.href} label={imageLinkLabel(col)}>
      <Image
        src={col.image.src}
        alt={col.image.alt}
        width={col.image.width ?? 1200}
        height={col.image.height ?? 800}
        sizes={col.span >= 10 ? "(min-width: 1152px) 1152px, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
        className="mx-auto h-auto w-full rounded-(--radius-card) object-contain"
        style={{ maxWidth: col.image.width ? `min(100%, ${col.image.width}px)` : undefined }}
      />
      </MaybeLink>
    );
  }

  // Small icons (warning sign, download arrow…) align with the text instead of floating centred;
  // in wide panels the icon sits beside the content like a notice.
  const icon = col.image && (col.image.width ?? Infinity) <= 160 && col.title;
  const iconAside = icon && col.span >= 8;

  const image = col.image && (
    <MaybeLink href={col.image.href} label={imageLinkLabel(col)}>
      <Image
        src={col.image.src}
        alt={col.image.alt}
        width={col.image.width ?? 800}
        height={col.image.height ?? 600}
        sizes={icon ? `${col.image.width}px` : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
        className={cn(
          "object-contain",
          icon ? "h-12 w-auto sm:h-14" : "mx-auto h-auto max-h-80 w-full rounded-lg",
        )}
        style={icon ? undefined : { maxWidth: col.image.width ? `min(100%, ${col.image.width}px)` : undefined }}
      />
    </MaybeLink>
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4",
        iconAside && "sm:flex-row sm:items-start sm:gap-6",
        isPanel && "rounded-(--radius-card) p-5 sm:p-6",
        isPanel && panelTone === "muted" && "bg-surface-muted",
        isPanel && panelTone === "brand" && "bg-brand-600 text-white",
        isPanel && panelTone === "brand-strong" && "bg-brand-700 text-white",
        isPanel && panelTone === "brand-dark" && "bg-brand-800 text-white",
        !isPanel && !dark && "rounded-(--radius-card) border border-line bg-white p-5 shadow-(--shadow-card) sm:p-6",
      )}
    >
      {iconAside ? <div className="shrink-0">{image}</div> : image}
      <div className={cn("flex flex-1 flex-col gap-4", iconAside && "min-w-0")}>
        {/* Media first, like image panels: video, then heading and text. */}
        {col.youtubeId && <YouTubeEmbed id={col.youtubeId} title={col.title ? tidyHeading(col.title) : "Video"} />}
        {col.title && (
          <Heading level={headingLevel} size="md" className={panelDark ? "text-white" : "text-brand-800"}>
            {tidyHeading(col.title)}
          </Heading>
        )}
        {col.html && <Prose html={col.html} invert={panelDark} className="flex-1" />}
        {col.button && (
          <ButtonLink href={col.button.href} variant={panelDark ? "inverse" : "outline"} arrow className="self-start">
            {col.button.label}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

function Panels({ data, dark }: { data: Data; dark: boolean }) {
  const layout = layoutFor(data.columns);
  const level = data.title ? 3 : 2;
  if (layout.kind === "split") {
    return (
      <div data-panels="" className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {data.columns.map((col, i) => (
          <div key={i} className={cn("min-w-0", mdSpan[layout.spans[i]])}>
            <Column col={col} dark={dark} headingLevel={level} />
          </div>
        ))}
      </div>
    );
  }
  return (
    // Flex-wrap so an incomplete last row is centred; items stretch to equal height per row.
    <div data-panels="" className="flex flex-wrap justify-center gap-6">
      {data.columns.map((col, i) => (
        <div key={i} className={cn("w-full min-w-0", col.span < 10 && perRowClasses[layout.perRow])}>
          <Column col={col} dark={dark} headingLevel={level} />
        </div>
      ))}
    </div>
  );
}

function Grid({ data, dark }: { data: Data; dark: boolean }) {
  return (
    <>
      {data.columns.length > 0 && <Panels data={data} dark={dark} />}
      {data.button && (
        <ButtonLink href={data.button.href} variant={dark ? "inverse" : "primary"} arrow>
          {data.button.label}
        </ButtonLink>
      )}
    </>
  );
}

function Title({ data, dark, id }: { data: Data; dark: boolean; id?: string }) {
  if (!data.title && !data.excerpt) return null;
  return (
    <div className="max-w-3xl space-y-3">
      {data.title && (
        <Heading id={id} level={2} size="xl" className={dark ? "text-white" : "text-brand-900"}>
          {tidyHeading(data.title)}
        </Heading>
      )}
      {data.excerpt && <Prose html={data.excerpt} invert={dark} className="text-lg" />}
    </div>
  );
}

export function ContentSection({ data }: { data: Data }) {
  // Every imported form (with its GDPR note column) renders as the one unified form block.
  if (data.columns.some((c) => c.form)) {
    return <ContactFormSection id={data.id} title={data.title} excerpt={data.excerpt} />;
  }
  const tone = data.bgImage ? "brand-dark" : toneFromColor(data.bg);
  const dark = isDarkTone(tone);
  const headingId = data.title ? `${data.id}-title` : undefined;

  // Original layout: a coloured title band above the content grid.
  if (data.titleBg && !data.bgImage) {
    const bandTone = toneFromColor(data.titleBg);
    return (
      <section aria-labelledby={headingId}>
        <Section as="div" tone={bandTone} spacing="sm">
          <Container>
            <Title data={data} dark={isDarkTone(bandTone)} id={headingId} />
          </Container>
        </Section>
        <Section as="div" tone={tone}>
          <Container className="space-y-8">
            <Grid data={data} dark={dark} />
          </Container>
        </Section>
      </section>
    );
  }

  return (
    <Section
      tone={tone}
      spacing={data.columns.length === 0 && !data.bgImage ? "sm" : "md"}
      aria-labelledby={headingId}
      className={cn(data.bgImage && "relative isolate overflow-hidden")}
    >
      {data.bgImage && (
        <>
          <Image src={data.bgImage.src} alt="" fill sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brand-950/80" />
        </>
      )}
      <Container className="space-y-8">
        <Title data={data} dark={dark} id={headingId} />
        <Grid data={data} dark={dark} />
      </Container>
    </Section>
  );
}
