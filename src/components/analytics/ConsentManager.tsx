"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { GTM_ID, track } from "@/lib/analytics";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/Button";

type Consent = { analytics: boolean; marketing: boolean; ts: number };
const KEY = "hpplotre-consent-v1";
const OPEN_EVENT = "hpplotre:open-consent";

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; __gtmLoaded?: boolean };

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

/**
 * Google Consent Mode v2 update, then (basic consent mode, like the old Complianz setup)
 * load the GTM container only once the visitor has granted at least one category.
 * Tags inside GTM must use built-in consent checks (analytics_storage / ad_storage).
 */
function applyConsent(c: Consent) {
  const w = window as GtagWindow;
  w.dataLayer = w.dataLayer ?? [];
  // eslint-disable-next-line prefer-rest-params
  w.gtag = w.gtag ?? function gtag() { w.dataLayer!.push(arguments); };
  w.gtag("consent", "update", {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
  });
  if (!GTM_ID || w.__gtmLoaded || !(c.analytics || c.marketing)) return;
  // GTM needs: consent commands → `gtm.js` → app events. Events such as the landing-page
  // `page_view` were queued before consent was given, so re-order the (not yet consumed)
  // queue: otherwise GTM initializes with consent denied and its GA4 tag never fires.
  const isConsentCmd = (e: unknown) =>
    Object.prototype.toString.call(e) === "[object Arguments]" && (e as IArguments)[0] === "consent";
  const queue = w.dataLayer.filter((e) => !(e && typeof e === "object" && (e as { event?: string }).event === "gtm.js"));
  w.dataLayer.length = 0;
  w.dataLayer.push(...queue.filter(isConsentCmd), { "gtm.start": Date.now(), event: "gtm.js" }, ...queue.filter((e) => !isConsentCmd(e)));
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(s);
  w.__gtmLoaded = true;
}

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/** Opt-in cookie banner (GDPR / ePrivacy). Reopen from anywhere via `openConsentSettings()`. */
export function ConsentManager() {
  const stored = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY), () => "ssr");
  const [forcedOpen, setForcedOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const id = useId();

  useEffect(() => {
    const c = readConsent();
    if (c) applyConsent(c);
    const open = () => {
      const cur = readConsent();
      setAnalytics(!!cur?.analytics);
      setMarketing(!!cur?.marketing);
      setDetails(true);
      setForcedOpen(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const save = useCallback((c: Omit<Consent, "ts">) => {
    const full = { ...c, ts: Date.now() };
    try {
      localStorage.setItem(KEY, JSON.stringify(full));
    } catch {
      /* private mode – consent applies to this page view only */
    }
    applyConsent(full);
    track({
      event: "consent_update",
      consent_analytics: c.analytics ? "granted" : "denied",
      consent_marketing: c.marketing ? "granted" : "denied",
    });
    setForcedOpen(false);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }, []);

  const visible = forcedOpen || stored === null;
  if (!visible) return null;

  return (
    <section
      role="dialog"
      data-location="consent"
      aria-modal="false"
      aria-labelledby={`${id}-t`}
      aria-describedby={`${id}-d`}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-4 shadow-[0_-8px_32px_rgb(15_31_32/0.15)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md sm:rounded-(--radius-card) sm:border"
    >
      <h2 id={`${id}-t`} className="font-display text-lg font-semibold text-brand-900">
        Súbory cookie
      </h2>
      <p id={`${id}-d`} className="mt-2 text-sm text-ink-muted">
        Nevyhnutné súbory používame vždy. So súhlasom použijeme aj analytické a marketingové nástroje (Google), aby sme
        mohli zlepšovať web a merať kampane. Súhlas môžete kedykoľvek zmeniť v päte stránky.{" "}
        <a href={site.gdpr} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
          Viac o ochrane údajov<span className="sr-only"> (otvorí sa v novom okne)</span>
        </a>
      </p>
      {details && (
        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">Kategórie súborov cookie</legend>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked disabled className="size-5 accent-brand-600" /> Nevyhnutné (vždy aktívne)
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="size-5 accent-brand-600" />
            Štatistiky (Google Analytics)
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="size-5 accent-brand-600" />
            Marketing (Google Ads)
          </label>
        </fieldset>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button size="sm" onClick={() => save({ analytics: true, marketing: true })}>
          Prijať všetko
        </Button>
        <Button size="sm" variant="outline" onClick={() => save({ analytics: false, marketing: false })}>
          Odmietnuť
        </Button>
        {details ? (
          <Button size="sm" variant="ghost" onClick={() => save({ analytics, marketing })}>
            Uložiť výber
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setDetails(true)}>
            Nastavenia
          </Button>
        )}
      </div>
    </section>
  );
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function ConsentSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Nastavenia cookies
    </button>
  );
}
