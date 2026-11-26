import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./Badge";
import { Button, ButtonLink } from "./Button";
import { Card } from "./Card";
import { Container } from "./Container";
import { Heading } from "./Heading";
import { Prose } from "./Prose";
import { Section } from "./Section";

const meta: Meta = { title: "Components/Primitives" };
export default meta;

export const Buttons: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md" arrow>Medium + arrow</Button>
        <Button size="lg" arrow>Large + arrow</Button>
      </div>
      <div className="flex flex-wrap gap-3 rounded-xl bg-brand-700 p-4">
        <ButtonLink href="/kontakt" variant="inverse">Inverse on brand</ButtonLink>
        <ButtonLink href="/kontakt" variant="secondary" arrow>Kontaktujte nás</ButtonLink>
        <ButtonLink href="https://kancelaria.smartcad.sk" variant="inverse">External link</ButtonLink>
      </div>
    </div>
  ),
};

export const Badges: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge>HP DesignJet</Badge>
      <Badge tone="accent">Novinka</Badge>
      <Badge tone="neutral">Skladom</Badge>
      <span className="rounded-lg bg-brand-700 p-2"><Badge tone="inverse">Autorizovaný servis</Badge></span>
    </div>
  ),
};

export const Cards: StoryObj = {
  render: () => (
    <div className="grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Card title="Kúpa, prenájom alebo splácanie" image={{ src: "/media/2023/10/1.png", alt: "", width: 300, height: 120 }}>
        <p>Ak chcete minimalizovať vstupné náklady, ponúkame prenájom alebo splátky.</p>
      </Card>
      <Card href="/t850" title="HP DesignJet T850" eyebrow="Plotre" image={{ src: "/media/2023/10/T850.1.png", alt: "HP DesignJet T850", width: 1701, height: 1694 }}>
        <p>36-palcová farebná veľkoformátová tlačiareň.</p>
      </Card>
      <Card title="Bez obrázka">
        <p>Karta len s textom.</p>
      </Card>
    </div>
  ),
};

export const SectionTones: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <>
      {(["default", "muted", "brand", "brand-dark"] as const).map((tone) => (
        <Section key={tone} tone={tone} spacing="sm">
          <Container className="space-y-2">
            <Heading level={2} size="lg">Section tone: {tone}</Heading>
            <Prose invert={tone.startsWith("brand")} html="<p>Rich text with <a href='#'>a link</a> and <strong>bold</strong>.</p><ul><li>Bullet one</li><li>Bullet two</li></ul>" />
          </Container>
        </Section>
      ))}
    </>
  ),
};
