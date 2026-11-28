"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ContentImage } from "@/lib/content";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type Slide = { image?: ContentImage; title?: string; href?: string; linkLabel?: string };

const AUTOPLAY_MS = 5000;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (cb: () => void) => {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Accessible carousel (WAI-ARIA APG pattern) built on native scroll-snap.
 * Like the original site's sliders it rotates automatically, but (WCAG 2.2.2):
 *  - rotation pauses on hover and keyboard focus and can be stopped with a button,
 *  - visitors who prefer reduced motion get no autoplay,
 *  - slide changes are announced only when the visitor changes them.
 */
export function ImageCarousel({
  slides,
  label = "Galéria",
  priority = false,
  autoplay = true,
}: {
  slides: Slide[];
  label?: string;
  priority?: boolean;
  autoplay?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => true, // server: render as paused
  );
  const id = useId();
  const count = slides.length;
  const canRotate = autoplay && count > 1 && !reducedMotion;
  const rotating = canRotate && !userPaused && !hovered && !focused;

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = (i + count) % count;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    },
    [count],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setIndex(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const t = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || document.hidden) return;
      const current = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      goTo(current + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [rotating, goTo]);

  // Common aspect ratio from the first image keeps the frame stable.
  const first = slides.find((s) => s.image)?.image;
  // Never taller than 16:9 so a slide can't push the page content off-screen.
  const ratio = first?.width && first?.height ? Math.max(first.width / first.height, 16 / 9) : 16 / 9;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      <div
        ref={trackRef}
        id={id}
        aria-live={rotating ? "off" : "polite"}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
        }}
      >
        {slides.map((s, i) => {
          const body = (
            <>
              {s.image && (
                <Image
                  src={s.image.src}
                  alt={s.href ? "" : s.image.alt || s.title || ""}
                  fill
                  sizes="(min-width: 1536px) 1536px, 100vw"
                  className="object-contain"
                  priority={priority && i === 0}
                  // Slides sit side by side in a horizontal scroller; Safari/Firefox don't reliably
                  // lazy-load images there, so off-screen slides would appear blank when they rotate in.
                  loading={priority && i === 0 ? undefined : "eager"}
                />
              )}
              {s.title && (
                <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-10 text-lg font-semibold text-white">
                  {s.title}
                </p>
              )}
            </>
          );
          const external = s.href && /^https?:/.test(s.href);
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="snímka"
              aria-label={`${i + 1} z ${count}${s.title ? `: ${s.title}` : ""}`}
              className="relative w-full shrink-0 snap-center"
              style={{ aspectRatio: String(ratio) }}
            >
              {s.href ? (
                <a
                  href={s.href}
                  aria-label={`${s.linkLabel || s.title || s.image?.alt || "Zobraziť viac"}${external ? " (otvorí sa v novom okne)" : ""}`}
                  className="absolute inset-0 block focus-visible:outline-offset-[-4px]"
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {body}
                </a>
              ) : (
                body
              )}
            </div>
          );
        })}
      </div>
      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {canRotate && (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-controls={id}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-brand-800 hover:bg-brand-50"
            >
              <Icon name={userPaused ? "play" : "pause"} className="size-4 fill-current" />
              <span className="sr-only">{userPaused ? "Spustiť automatické prehrávanie" : "Zastaviť automatické prehrávanie"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-controls={id}
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-brand-800 hover:bg-brand-50"
          >
            <Icon name="chevron-left" />
            <span className="sr-only">Predchádzajúca snímka</span>
          </button>
          {/* Phones: compact counter (a row of 44px dots would overflow with many slides). */}
          <p className="min-w-16 text-center font-medium tabular-nums text-ink-muted sm:hidden" aria-hidden="true">
            {index + 1} / {count}
          </p>
          <ul className="hidden flex-wrap items-center justify-center sm:flex">
            {slides.map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-controls={id}
                  aria-current={i === index ? "true" : undefined}
                  className="group inline-flex size-11 items-center justify-center"
                >
                  <span
                    className={cn(
                      "block size-3 rounded-full border-2 border-brand-700 transition-colors",
                      i === index ? "bg-brand-700" : "bg-transparent group-hover:bg-brand-200",
                    )}
                  />
                  <span className="sr-only">Snímka {i + 1}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-controls={id}
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-brand-800 hover:bg-brand-50"
          >
            <Icon name="chevron-right" />
            <span className="sr-only">Nasledujúca snímka</span>
          </button>
        </div>
      )}
    </section>
  );
}
