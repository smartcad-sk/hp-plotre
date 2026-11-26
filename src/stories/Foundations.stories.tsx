import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heading } from "@/components/ui/Heading";
import { Icon, iconNames } from "@/components/ui/Icon";

const meta: Meta = { title: "Foundations/Design tokens", parameters: { layout: "fullscreen" } };
export default meta;

const palettes: { name: string; note: string; swatches: { token: string; hex: string; text?: string }[] }[] = [
  {
    name: "Brand (teal)",
    note: "brand-600 is the original #008080 – AA with white text. brand-400 (#49a7b1) is decorative only.",
    swatches: [
      ["50", "#eef8f8"], ["100", "#d5eeee"], ["200", "#addddd"], ["300", "#7cc4c6"], ["400", "#49a7b1"],
      ["500", "#1f8f95"], ["600", "#008080"], ["700", "#006a6b"], ["800", "#075456"], ["900", "#0c4547"], ["950", "#032a2c"],
    ].map(([s, hex]) => ({ token: `brand-${s}`, hex, text: Number(s) >= 600 ? "#fff" : "#0f1f20" })),
  },
  {
    name: "Accent (orange)",
    note: "accent-500 on buttons with dark ink text; accent-700 is the only text-safe accent.",
    swatches: [
      { token: "accent-300", hex: "#fcd29a" }, { token: "accent-400", hex: "#fdb64e" },
      { token: "accent-500", hex: "#f39200" }, { token: "accent-700", hex: "#b45309", text: "#fff" },
    ],
  },
  {
    name: "Neutrals & status",
    note: "Text and surfaces.",
    swatches: [
      { token: "ink", hex: "#0f1f20", text: "#fff" }, { token: "ink-muted", hex: "#475a5b", text: "#fff" },
      { token: "line", hex: "#d6e1e1" }, { token: "surface-muted", hex: "#f3f7f7" }, { token: "surface", hex: "#ffffff" },
      { token: "danger", hex: "#b42318", text: "#fff" }, { token: "success", hex: "#067647", text: "#fff" },
    ],
  },
];

export const Colors: StoryObj = {
  render: () => (
    <div className="space-y-10 p-6">
      {palettes.map((p) => (
        <section key={p.name} className="space-y-3">
          <Heading level={2} size="lg">{p.name}</Heading>
          <p className="text-ink-muted">{p.note}</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {p.swatches.map((s) => (
              <li key={s.token} className="overflow-hidden rounded-lg border border-line">
                <div className="flex h-16 items-end p-2 text-xs font-medium" style={{ background: s.hex, color: s.text ?? "#0f1f20" }}>
                  Aa
                </div>
                <div className="p-2 text-xs">
                  <p className="font-semibold">{s.token}</p>
                  <p className="text-ink-muted">{s.hex}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  ),
};

export const Typography: StoryObj = {
  render: () => (
    <div className="space-y-6 p-6">
      <Heading level={1} size="display">Display – Veľkoformátové HP tlačiarne</Heading>
      <Heading level={2} size="xl">XL – Vyberte si riešenie</Heading>
      <Heading level={3} size="lg">LG – Servis a náhradné diely</Heading>
      <Heading level={4} size="md">MD – Náplne a rolky</Heading>
      <p className="max-w-prose text-lg">Body large (Inter 18px) – Pomôžeme vám zorientovať sa a poradíme pri výbere.</p>
      <p className="max-w-prose">Body (Inter 16px) – Plotrovacie rolky, odpadové nádoby, tlačové hlavy, atramentové náplne.</p>
      <p className="text-sm text-ink-muted">Small muted (14px) – pomocný text, dátumy, popisky.</p>
    </div>
  ),
};

export const Icons: StoryObj = {
  render: () => (
    <ul className="grid grid-cols-3 gap-4 p-6 sm:grid-cols-6">
      {iconNames.map((n) => (
        <li key={n} className="flex flex-col items-center gap-2 rounded-lg border border-line p-4 text-xs text-ink-muted">
          <Icon name={n} className="size-6 text-brand-700" />
          {n}
        </li>
      ))}
    </ul>
  ),
};

export const SpacingAndRadii: StoryObj = {
  name: "Spacing, radii & elevation",
  render: () => (
    <div className="grid gap-6 p-6 sm:grid-cols-3">
      <div className="rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card)">radius-card + shadow-card</div>
      <div className="rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card-hover)">shadow-card-hover</div>
      <div className="rounded-(--radius-control) border border-line p-6">radius-control (buttons, inputs)</div>
      <p className="text-sm text-ink-muted sm:col-span-3">
        Section rhythm: py-12 / sm:py-16 (md), py-8 (sm), py-16 / sm:py-24 (lg). Container: max 72rem, 16px gutter on phones.
        Min tap target 44px (min-h-11).
      </p>
    </div>
  ),
};
