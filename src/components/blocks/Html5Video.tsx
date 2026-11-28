"use client";

import { track } from "@/lib/analytics";

/** Self-hosted MP4 (migrated from WordPress) – reports the first play to the dataLayer. */
export function Html5Video({ src, title }: { src: string; title: string }) {
  return (
    <video
      src={src}
      controls
      preload="metadata"
      aria-label={title}
      className="aspect-video w-full rounded-(--radius-card) bg-ink"
      onPlay={(e) => {
        if (e.currentTarget.dataset.started) return;
        e.currentTarget.dataset.started = "1";
        track({ event: "video_start", video_provider: "html5", video_title: title, video_url: src });
      }}
    />
  );
}
