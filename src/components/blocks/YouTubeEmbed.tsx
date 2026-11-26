"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";

/**
 * Privacy-friendly YouTube facade: nothing is loaded from Google until the
 * visitor clicks play (no cookies, no consent banner needed). Uses youtube-nocookie.
 */
export function YouTubeEmbed({ id, title = "Video" }: { id: string; title?: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-(--radius-card) bg-ink">
      {active ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setActive(true);
            track({ event: "video_start", video_provider: "youtube", video_title: title, video_url: `https://www.youtube.com/watch?v=${id}` });
          }}
          className="group absolute inset-0 flex size-full items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail, intentionally not optimized */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
          />
          <span className="relative inline-flex size-16 items-center justify-center rounded-full bg-accent-500 text-ink shadow-lg transition-transform group-hover:scale-110 sm:size-20">
            <Icon name="play" className="size-8 fill-current" />
          </span>
          <span className="sr-only">Prehrať video: {title} (načíta obsah z YouTube)</span>
        </button>
      )}
    </div>
  );
}
