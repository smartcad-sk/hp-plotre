import { cn } from "@/lib/cn";

type Level = 1 | 2 | 3 | 4;
type Size = "display" | "xl" | "lg" | "md" | "sm";

const sizes: Record<Size, string> = {
  display: "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight",
  xl: "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight",
  lg: "text-xl sm:text-2xl font-semibold",
  md: "text-lg sm:text-xl font-semibold",
  sm: "text-base font-semibold",
};

const defaultSize: Record<Level, Size> = { 1: "xl", 2: "lg", 3: "md", 4: "sm" };

type Props = React.HTMLAttributes<HTMLHeadingElement> & { level?: Level; size?: Size };

/** Semantic level and visual size are independent so the outline stays correct. */
export function Heading({ level = 2, size, className, ...rest }: Props) {
  const Tag = `h${level}` as const;
  return <Tag className={cn("font-display leading-tight", sizes[size ?? defaultSize[level]], className)} {...rest} />;
}

export function Eyebrow({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm font-semibold uppercase tracking-wider text-brand-700", className)} {...rest} />;
}
