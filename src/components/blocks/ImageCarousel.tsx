"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ContentImage } from "@/lib/content";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type Slide = { image?: ContentImage; title?: string };

/**
 * Accessible carousel (WAI-ARIA APG pattern) built on native scroll-snap:
 * swipeable on touch, no autoplay, prev/next + slide picker buttons, announces position.
 */
export function ImageCarousel({ slides, label = "Galéria", priority = false }: { slides: Slide[]; label?: string; priority?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const id = useId();
  const count = slides.length;

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (i + count) % count;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }, [count]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setIndex(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  // Common aspect ratio from the first image keeps the frame stable.
  const first = slides.find((s) => s.image)?.image;
  // Never taller than 16:9 so a slide can't push the page content off-screen.
  const ratio = first?.width && first?.height ? Math.max(first.width / first.height, 16 / 9) : 16 / 9;

  return (
    <section aria-roledescription="carousel" aria-label={label} className="relative">
      <div
        ref={trackRef}
        id={id}
        aria-live="polite"
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
        }}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="snímka"
            aria-label={`${i + 1} z ${count}${s.title ? `: ${s.title}` : ""}`}
            className="relative w-full shrink-0 snap-center"
            style={{ aspectRatio: String(ratio) }}
          >
            {s.image && (
              <Image
                src={s.image.src}
                alt={s.image.alt || s.title || ""}
                fill
                sizes="(min-width: 1152px) 1152px, 100vw"
                className="object-contain"
                priority={priority && i === 0}
              />
            )}
            {s.title && (
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-10 text-lg font-semibold text-white">
                {s.title}
              </p>
            )}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
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
