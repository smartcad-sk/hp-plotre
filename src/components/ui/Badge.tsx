import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLSpanElement> & { tone?: "brand" | "accent" | "neutral" | "inverse" };

export function Badge({ tone = "brand", className, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        tone === "brand" && "bg-brand-50 text-brand-800 ring-1 ring-brand-200",
        tone === "accent" && "bg-accent-300/40 text-accent-700 ring-1 ring-accent-300",
        tone === "neutral" && "bg-surface-muted text-ink-muted ring-1 ring-line",
        tone === "inverse" && "bg-white/15 text-white ring-1 ring-white/30",
        className,
      )}
      {...rest}
    />
  );
}
