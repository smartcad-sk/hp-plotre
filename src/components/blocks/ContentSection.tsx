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

type Data = Extract<ContentSectionData, { type: "content" }>;

// Literal class names so Tailwind can see them.
const spanClass: Record<number, string> = {
  1: "lg:col-span-3", 2: "lg:col-span-3", 3: "lg:col-span-3", 4: "lg:col-span-4", 5: "lg:col-span-6",
  6: "lg:col-span-6", 7: "lg:col-span-8", 8: "lg:col-span-8", 9: "lg:col-span-9", 10: "lg:col-span-12",
  11: "lg:col-span-12", 12: "lg:col-span-12",
};
const smSpanClass = (span: number) => (span >= 7 ? "sm:col-span-2" : "sm:col-span-1");

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
  const imageOnly = col.image && !col.title && !col.html && !col.button;

  if (imageOnly && col.image) {
    return (
      <MaybeLink href={col.image.href} label={imageLinkLabel(col)}>
      <Image
        src={col.image.src}
        alt={col.image.alt}
        width={col.image.width ?? 1200}
        height={col.image.height ?? 800}
        sizes={col.span >= 10 ? "(min-width: 1152px) 1152px, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
        className="h-auto w-full rounded-(--radius-card) object-contain"
      />
      </MaybeLink>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4",
        isPanel && "rounded-(--radius-card) p-5 sm:p-6",
        isPanel && panelTone === "muted" && "bg-surface-muted",
        isPanel && panelTone === "brand" && "bg-brand-600 text-white",
        isPanel && panelTone === "brand-strong" && "bg-brand-700 text-white",
        isPanel && panelTone === "brand-dark" && "bg-brand-800 text-white",
        !isPanel && !dark && "rounded-(--radius-card) border border-line bg-white p-5 shadow-(--shadow-card) sm:p-6",
      )}
    >
      {col.image && (
        <MaybeLink href={col.image.href} label={imageLinkLabel(col)}>
        <Image
          src={col.image.src}
          alt={col.image.alt}
          width={col.image.width ?? 800}
          height={col.image.height ?? 600}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-auto max-h-80 w-full rounded-lg object-contain"
        />
        </MaybeLink>
      )}
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
  );
}

function Grid({ data, dark }: { data: Data; dark: boolean }) {
  return (
    <>
      {data.columns.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12">
          {data.columns.map((col, i) => (
            <div key={i} className={cn("min-w-0", smSpanClass(col.span), spanClass[col.span] ?? "lg:col-span-12")}>
              <Column col={col} dark={dark} headingLevel={data.title ? 3 : 2} />
            </div>
          ))}
        </div>
      )}
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
