"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { NavItem } from "@/lib/site";
import { blogNav, site } from "@/lib/site";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { buttonClasses } from "@/components/ui/Button";

function isActive(pathname: string, item: NavItem) {
  if (item.external) return false;
  if (pathname === item.href) return true;
  return item.children?.some((c) => !c.external && pathname === c.href) ?? false;
}

function NavLink({ item, className, onNavigate }: { item: NavItem; className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = !item.external && pathname === item.href;
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate}>
        {item.label}
        <Icon name="external" className="size-3.5 opacity-70" />
        <span className="sr-only"> (otvorí sa v novom okne)</span>
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} aria-current={current ? "page" : undefined} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

const topLink =
  "inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[0.9375rem] font-medium text-ink hover:bg-brand-50 hover:text-brand-800 xl:px-3 xl:text-base";

/* ------------------------------------------------------------------------- */
/* Desktop: parent is a link; a separate ▾ button opens the sub-menu.         */
/* Hover opens it too (like the original site). Esc / outside click closes.   */
/* ------------------------------------------------------------------------- */
function MenuWithSubmenu({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const id = useId();
  const pathname = usePathname();
  const active = isActive(pathname, item);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button[aria-controls]")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <li
      ref={ref}
      className="relative flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <NavLink
        item={item}
        onNavigate={() => setOpen(false)}
        className={cn(topLink, "pr-1", active && "text-brand-700 underline decoration-2 underline-offset-8")}
      />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 w-8 items-center justify-center rounded-md text-ink hover:bg-brand-50"
      >
        <Icon name="chevron-down" className={cn("size-4 transition-transform", open && "rotate-180")} />
        <span className="sr-only">Podmenu {item.label}</span>
      </button>
      <div id={id} hidden={!open} className="absolute left-0 top-full z-50 w-72 pt-2">
        <ul className="rounded-(--radius-card) border border-line bg-white p-2 shadow-(--shadow-card-hover)">
          {item.children?.map((child) => (
            <li key={child.href + child.label}>
              <NavLink
                item={child}
                onNavigate={() => setOpen(false)}
                className="flex min-h-11 items-center gap-1 rounded-lg px-3 py-2.5 hover:bg-brand-50 aria-[current=page]:bg-brand-50 aria-[current=page]:font-semibold"
              />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Hlavná navigácia" className="hidden lg:block">
      <ul className="flex items-center gap-0.5">
        {items.map((item) =>
          item.children ? (
            <MenuWithSubmenu key={item.label} item={item} />
          ) : item.href === "/kontakt" ? (
            <li key={item.label} className="ml-2">
              <NavLink item={item} className={buttonClasses({ size: "sm", className: "whitespace-nowrap" })} />
            </li>
          ) : (
            <li key={item.label}>
              <NavLink
                item={item}
                className={cn(topLink, isActive(pathname, item) && "text-brand-700 underline decoration-2 underline-offset-8")}
              />
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------------- */
/* Mobile: native <dialog> drawer; parents are links with an expand button.   */
/* ------------------------------------------------------------------------- */
function MobileGroup({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => isActive(pathname, item));
  const id = useId();
  return (
    <li>
      <div className="flex items-center">
        <NavLink
          item={item}
          onNavigate={onNavigate}
          className="flex min-h-11 flex-1 items-center rounded-md px-3 font-medium hover:bg-brand-50 aria-[current=page]:text-brand-700"
        />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex size-11 items-center justify-center rounded-md hover:bg-brand-50"
        >
          <Icon name="chevron-down" className={cn("size-4 transition-transform", open && "rotate-180")} />
          <span className="sr-only">Podmenu {item.label}</span>
        </button>
      </div>
      <ul id={id} hidden={!open} className="ml-3 border-l border-line pl-2">
        {item.children?.map((child) => (
          <li key={child.href + child.label}>
            <NavLink
              item={child}
              onNavigate={onNavigate}
              className="flex min-h-11 items-center gap-1 rounded-md px-3 text-ink-muted hover:bg-brand-50 hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-brand-700"
            />
          </li>
        ))}
      </ul>
    </li>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const linkClass =
    "flex min-h-11 items-center gap-1 rounded-md px-3 font-medium hover:bg-brand-50 aria-[current=page]:text-brand-700";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-brand-50"
        aria-haspopup="dialog"
      >
        <Icon name="menu" className="size-6" />
        <span className="sr-only">Otvoriť menu</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="ml-auto mr-0 h-dvh max-h-dvh w-[min(22rem,100vw)] max-w-none bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50"
        onClick={(e) => {
          if (e.target === dialogRef.current) close(); // click on backdrop
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <span className="font-display text-lg font-semibold text-brand-800">Menu</span>
            <button
              type="button"
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-md hover:bg-brand-50"
              autoFocus
            >
              <Icon name="close" className="size-6" />
              <span className="sr-only">Zavrieť menu</span>
            </button>
          </div>
          <nav aria-label="Mobilná navigácia" className="flex-1 overflow-y-auto px-2 py-4">
            <ul className="space-y-1">
              {items.map((item) =>
                item.children ? (
                  <MobileGroup key={item.label} item={item} onNavigate={close} />
                ) : (
                  <li key={item.label}>
                    <NavLink item={item} onNavigate={close} className={linkClass} />
                  </li>
                ),
              )}
              <li className="mt-2 border-t border-line pt-2">
                <NavLink item={blogNav} onNavigate={close} className={linkClass} />
              </li>
            </ul>
          </nav>
          <div className="space-y-2 border-t border-line p-4 text-sm">
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex min-h-11 items-center gap-2 font-medium text-brand-700">
              <Icon name="phone" /> {site.phoneDisplay}
            </a>
            <a href={`mailto:${site.email}`} className="flex min-h-11 items-center gap-2 font-medium text-brand-700">
              <Icon name="mail" /> {site.email}
            </a>
          </div>
        </div>
      </dialog>
    </div>
  );
}
