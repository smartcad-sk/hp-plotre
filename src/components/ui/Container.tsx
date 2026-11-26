import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & { size?: "content" | "prose" | "wide" };

/** Horizontal page gutter + max width. 16px gutter on phones, 24/32px above. */
export function Container({ size = "content", className, ...rest }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "content" && "max-w-(--container-content)",
        size === "prose" && "max-w-(--container-prose)",
        size === "wide" && "max-w-screen-2xl",
        className,
      )}
      {...rest}
    />
  );
}
