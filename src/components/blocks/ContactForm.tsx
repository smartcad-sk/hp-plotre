"use client";

import { useId, useState } from "react";
import { currentPageType, track } from "@/lib/analytics";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/Button";

const fieldClass =
  "block w-full rounded-(--radius-control) border border-line bg-white px-3.5 py-2.5 text-base text-ink " +
  "placeholder:text-ink-muted/70 focus:border-brand-600 focus:outline-2 focus:outline-offset-0 focus:outline-brand-600 " +
  "aria-[invalid=true]:border-danger";

type Errors = Partial<Record<"name" | "email" | "message" | "consent", string>>;

/**
 * Contact form without a backend: validates in the browser and opens the visitor's
 * e-mail client with a pre-filled message to the sales address. Swap `onSubmit` for a
 * server action once a mail backend (with rate limiting + spam protection) exists.
 */
export function ContactForm({ heading = "Napíšte nám" }: { heading?: string }) {
  const uid = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [started, setStarted] = useState(false);
  const formName = heading;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const v = (k: string) => String(data.get(k) ?? "").trim();
    const next: Errors = {};
    if (!v("name")) next.name = "Zadajte meno a priezvisko.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) next.email = "Zadajte platný e-mail, napr. meno@firma.sk.";
    if (v("message").length < 5) next.message = "Napíšte nám, s čím vám môžeme pomôcť.";
    if (!data.get("consent")) next.consent = "Pre odoslanie potrebujeme váš súhlas.";
    setErrors(next);
    if (Object.keys(next).length) {
      track({ event: "form_error", form_id: "contact", form_name: formName, error_fields: Object.keys(next).join(",") });
    }
    if (Object.keys(next).length) {
      const firstKey = Object.keys(next)[0];
      e.currentTarget.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }
    const header = [
      `Meno: ${v("name")}`,
      v("company") ? `Firma: ${v("company")}` : null,
      v("phone") ? `Telefón: ${v("phone")}` : null,
      `E-mail: ${v("email")}`,
    ].filter(Boolean);
    const body = `${header.join("\n")}\n\n${v("message")}`;
    track({ event: "generate_lead", form_id: "contact", form_name: formName, lead_source: currentPageType() });
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("Dopyt z webu HPplotre.sk")}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${uid}-${k}-err`} className="mt-1.5 text-sm font-medium text-danger">
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: keyof Errors) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined,
  });

  return (
    <form
      data-location="content"
      onFocusCapture={() => {
        if (started) return;
        setStarted(true);
        track({ event: "form_start", form_id: "contact", form_name: formName });
      }}
      noValidate
      onSubmit={onSubmit}
      aria-labelledby={`${uid}-heading`}
      className="space-y-5 rounded-(--radius-card) border border-line bg-white p-5 text-ink shadow-(--shadow-card) sm:p-8"
    >
      <h3 id={`${uid}-heading`} className="font-display text-xl font-semibold text-brand-900">
        {heading}
      </h3>
      <p className="text-sm text-ink-muted">Polia označené * sú povinné.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className="mb-1.5 block font-medium">Meno a priezvisko *</label>
          <input id={`${uid}-name`} name="name" autoComplete="name" required className={fieldClass} {...a11y("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={`${uid}-company`} className="mb-1.5 block font-medium">Názov firmy</label>
          <input id={`${uid}-company`} name="company" autoComplete="organization" className={fieldClass} />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1.5 block font-medium">E-mail *</label>
          <input id={`${uid}-email`} name="email" type="email" inputMode="email" autoComplete="email" required className={fieldClass} {...a11y("email")} />
          {err("email")}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className="mb-1.5 block font-medium">Telefón</label>
          <input id={`${uid}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" className={fieldClass} />
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-message`} className="mb-1.5 block font-medium">Vaša správa *</label>
        <textarea id={`${uid}-message`} name="message" rows={5} required className={fieldClass} {...a11y("message")} />
        {err("message")}
      </div>
      <div>
        <div className="flex items-start gap-3">
          <input id={`${uid}-consent`} name="consent" type="checkbox" className="mt-1 size-5 shrink-0 accent-brand-600" {...a11y("consent")} />
          <label htmlFor={`${uid}-consent`} className="text-sm text-ink-muted">
            Súhlasím so spracovaním osobných údajov spoločnosťou {site.company} za účelom vybavenia dopytu v súlade s{" "}
            <a href={site.gdpr} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
              pravidlami GDPR<span className="sr-only"> (otvorí sa v novom okne)</span>
            </a>
            . *
          </label>
        </div>
        {err("consent")}
      </div>
      <Button type="submit" size="lg" arrow className="w-full sm:w-auto">
        Odoslať správu
      </Button>
      <p role="status" className="text-sm text-success">
        {sent ? "Otvorili sme váš e-mailový program s pripravenou správou. Ak sa neotvoril, napíšte nám na " + site.email + "." : ""}
      </p>
    </form>
  );
}
