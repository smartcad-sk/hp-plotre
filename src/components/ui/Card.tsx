import Image from "next/image";
import Link from "next/link";
import type { ContentImage } from "@/lib/content";
import { cn } from "@/lib/cn";
import { Heading } from "./Heading";
import { Icon } from "./Icon";

type CardProps = {
  title?: string;
  href?: string;
  image?: ContentImage;
  imageFit?: "cover" | "contain";
  eyebrow?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

/**
 * Content card. When `href` is set the whole card is clickable via a stretched link
 * on the title (keeps a single, meaningful link for screen readers).
 */
export function Card({
  title,
  href,
  image,
  imageFit = "contain",
  eyebrow,
  children,
  footer,
  headingLevel = 3,
  className,
}: CardProps) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-(--radius-card) border border-line bg-surface text-ink shadow-(--shadow-card)",
        href && "transition-shadow hover:shadow-(--shadow-card-hover) focus-within:shadow-(--shadow-card-hover)",
        className,
      )}
    >
      {image && (
        <div className={cn("relative aspect-[4/3] w-full", imageFit === "contain" ? "bg-white p-4" : "bg-surface-muted")}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(imageFit === "contain" ? "object-contain p-2" : "object-cover")}
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        {eyebrow && <p className="text-sm font-medium text-brand-700">{eyebrow}</p>}
        {title && (
          <Heading level={headingLevel} size="md" className="text-brand-900">
            {href ? (
              <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
                {title}
              </Link>
            ) : (
              title
            )}
          </Heading>
        )}
        {children && <div className="flex-1 text-ink-muted">{children}</div>}
        {footer}
        {href && (
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-700" aria-hidden="true">
            Zobraziť viac <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </div>
    </article>
  );
}
