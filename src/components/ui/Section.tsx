import type { Tone } from "@/lib/content";
import { cn } from "@/lib/cn";

export const toneClasses: Record<Tone, string> = {
  default: "bg-surface text-ink",
  muted: "bg-surface-muted text-ink",
  brand: "bg-brand-600 text-white",
  "brand-strong": "bg-brand-700 text-white",
  "brand-dark": "bg-brand-800 text-white",
};

export const isDarkTone = (tone: Tone) => tone === "brand" || tone === "brand-strong" || tone === "brand-dark";

type Props = React.HTMLAttributes<HTMLElement> & {
  tone?: Tone;
  spacing?: "none" | "sm" | "md" | "lg";
  as?: "section" | "div" | "aside";
};

/** Vertical rhythm + background tone for a page band. */
export function Section({ tone = "default", spacing = "md", as: Tag = "section", className, ...rest }: Props) {
  return (
    <Tag
      data-tone={tone}
      className={cn(
        toneClasses[tone],
        spacing === "sm" && "py-8 sm:py-10",
        spacing === "md" && "py-12 sm:py-16",
        spacing === "lg" && "py-16 sm:py-24",
        className,
      )}
      {...rest}
    />
  );
}
