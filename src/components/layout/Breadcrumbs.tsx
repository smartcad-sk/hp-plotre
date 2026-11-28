import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href: string };

export function Breadcrumbs({ items, current, invert }: { items: Crumb[]; current: string; invert?: boolean }) {
  return (
    <nav aria-label="Omrvinková navigácia" className="text-sm">
      <ol className={cn("flex flex-wrap items-center gap-x-1 gap-y-1", invert ? "text-white/85" : "text-ink-muted")}>
        {items.map((c) => (
          <li key={c.href} className="inline-flex items-center gap-1">
            <Link href={c.href} className="inline-flex items-center rounded py-1 underline-offset-4 hover:underline pointer-coarse:min-h-11">
              {c.label}
            </Link>
            <Icon name="chevron-right" className="size-3.5 opacity-70" />
          </li>
        ))}
        <li aria-current="page" className={cn("font-medium", invert ? "text-white" : "text-ink")}>
          {current}
        </li>
      </ol>
    </nav>
  );
}
