import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-(--radius-control) font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 " +
  "text-center leading-snug max-w-full min-w-0 [overflow-wrap:anywhere]";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary: "bg-accent-500 text-ink hover:bg-accent-400 focus-visible:outline-accent-700",
  outline: "border-2 border-brand-600 text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600",
  ghost: "text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600",
  inverse: "bg-white text-brand-800 hover:bg-brand-50 focus-visible:outline-white",
};

// Every size keeps a >= 44px tap target (WCAG 2.5.5 / Apple HIG).
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-11 px-5 py-2.5 text-base",
  lg: "min-h-13 px-7 py-3 text-lg",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type CommonProps = { variant?: ButtonVariant; size?: ButtonSize; arrow?: boolean };

type LinkButtonProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

/** A link that looks like a button. External links open in a new tab with an sr-only hint. */
export function ButtonLink({ href, variant, size, arrow, className, children, ...rest }: LinkButtonProps) {
  const classes = buttonClasses({ variant, size, className });
  const content = (
    <>
      {children}
      {arrow && <Icon name="arrow-right" className="size-4 shrink-0" />}
    </>
  );
  if (isExternal(href)) {
    const newTab = href.startsWith("http");
    return (
      <a
        href={href}
        className={classes}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {content}
        {newTab && <span className="sr-only"> (otvorí sa v novom okne)</span>}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {content}
    </Link>
  );
}

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant, size, arrow, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
      {arrow && <Icon name="arrow-right" className="size-4 shrink-0" />}
    </button>
  );
}
