import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { IntroBand } from "@/components/layout/IntroBand";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "./ContactForm";
import { ContentSection } from "./ContentSection";
import { CtaBand } from "./CtaBand";
import { ImageCarousel } from "./ImageCarousel";
import { YouTubeEmbed } from "./YouTubeEmbed";

const meta: Meta = { title: "Components/Blocks", parameters: { layout: "fullscreen" } };
export default meta;

export const Header: StoryObj = {
  name: "PageHeader + breadcrumbs",
  render: () => (
    <PageHeader
      title="HP DesignJet T850 Printer"
      leadHtml="<p><strong>36-palcová farebná veľkoformátová tlačiareň</strong></p>"
      crumbs={[{ label: "Úvod", href: "/" }, { label: "Produkty", href: "/velkoformatove-tlaciarne" }]}
    />
  ),
};

export const Intro: StoryObj = {
  name: "Intro band (subtitle + actions)",
  render: () => (
    <IntroBand
      data={{
        title: "36-palcová farebná veľkoformátová tlačiareň",
        excerptHtml: "<p>s automatickým prepínaním tlače medzi rolkou a zásobníkom na A4/A3 listy</p>",
        actions: [
          { href: "https://hpplotre.sk/spec.pdf", label: "Technická špecifikácia" },
          { href: "https://kancelaria.smartcad.sk/t850-36in/", label: "Zakúpiť na e-shope" },
        ],
      }}
    />
  ),
};

export const BreadcrumbsLight: StoryObj = {
  render: () => (
    <div className="p-6">
      <Breadcrumbs items={[{ label: "Úvod", href: "/" }, { label: "Blog", href: "/blogy" }]} current="Pigmentové atramenty" />
    </div>
  ),
};

export const ContentGrid: StoryObj = {
  name: "Content section (imported grid)",
  render: () => (
    <ContentSection
      data={{
        type: "content",
        id: "story",
        title: "Ideálna veľkoformátová tlačiareň pre menšie tímy",
        titleBg: "#49a7b1",
        columns: [
          { span: 4, image: { src: "/media/2023/10/T850.1.png", alt: "", width: 1701, height: 1694 }, html: "<p>Vstupný zásobník na 50 listov A3.</p>" },
          { span: 4, title: "Atramenty", html: "<p>130 ml alebo 300 ml originálne pigmentové atramenty.</p>" },
          { span: 4, html: '<p><a href="/kontakt">Chcem sa s vami poradiť</a></p>' },
        ],
      }}
    />
  ),
};

export const Carousel: StoryObj = {
  render: () => (
    <div className="mx-auto max-w-4xl p-6">
      <ImageCarousel
        label="Galéria – ukážka"
        slides={[
          { image: { src: "/media/2023/10/seria.png", alt: "Rad HP DesignJet", width: 6054, height: 2075 } },
          { image: { src: "/media/2023/10/seria1.png", alt: "Rad HP DesignJet 2", width: 6050, height: 2075 } },
          { image: { src: "/media/2023/10/T850.png", alt: "T850", width: 4459, height: 2209 }, title: "S titulkom" },
        ]}
      />
    </div>
  ),
};

export const Video: StoryObj = {
  name: "YouTube (click-to-load)",
  render: () => (
    <div className="mx-auto max-w-2xl p-6">
      <YouTubeEmbed id="JBjtX6tin0A" title="HP DesignJet T1700" />
    </div>
  ),
};

export const Form: StoryObj = {
  name: "Contact form",
  render: () => (
    <div className="mx-auto max-w-2xl p-6">
      <ContactForm />
    </div>
  ),
};

export const ClosingCta: StoryObj = { name: "CTA band", render: () => <CtaBand /> };
