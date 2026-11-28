import { cn } from "@/lib/cn";

/**
 * Renders rich text that was sanitized with an allow-list at import time
 * (scripts/import-content.mjs). Never pass user input here.
 */
export function Prose({ html, invert, className }: { html: string; invert?: boolean; className?: string }) {
  return <div className={cn("prose-content", invert && "prose-invert", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
