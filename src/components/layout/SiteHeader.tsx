import Image from "next/image";
import Link from "next/link";
import { blogNav, mainNav, site } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { DesktopNav, MobileNav } from "./Navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      {/* Utility bar */}
      <div className="hidden bg-brand-900 text-sm text-white md:block">
        <div className="mx-auto flex max-w-(--container-content) items-center justify-between gap-4 px-4 py-1.5 sm:px-6 lg:px-8">
          <p className="text-white/85">{site.tagline}</p>
          <ul className="flex items-center gap-5">
            <li>
              <Link href={blogNav.href} className="inline-flex items-center gap-1.5 py-1 font-semibold hover:underline pointer-coarse:min-h-11">
                {blogNav.label}
              </Link>
            </li>
            <li>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 py-1 hover:underline pointer-coarse:min-h-11">
                <Icon name="phone" className="size-4" /> {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-1.5 py-1 hover:underline pointer-coarse:min-h-11">
                <Icon name="mail" className="size-4" /> {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-(--container-content) items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/" className="flex min-h-11 shrink-0 items-center rounded-md" aria-label={`${site.company} – úvodná stránka`}>
          <Image
            src="/brand/logo-smartcad-480.png"
            alt=""
            width={480}
            height={75}
            sizes="240px"
            priority
            className="h-7 w-auto sm:h-8 lg:h-8 xl:h-9"
          />
        </Link>
        <DesktopNav items={mainNav} />
        <MobileNav items={mainNav} />
      </div>
    </header>
  );
}
