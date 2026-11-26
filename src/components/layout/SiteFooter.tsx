import Image from "next/image";
import Link from "next/link";
import { footerNav, site } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";

// Evaluated once at build/module load – keeps the footer static under cacheComponents.
const BUILD_YEAR = new Date().getFullYear();

export function SiteFooter() {
  const year = BUILD_YEAR;
  return (
    <footer className="bg-brand-950 text-white/85" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Päta stránky
      </h2>
      <div className="mx-auto grid max-w-(--container-content) gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <p className="font-display text-xl font-semibold text-white">{site.company}</p>
          <address className="space-y-1 not-italic">
            <p>
              {site.address.street}
              <br />
              {site.address.zip} {site.address.city}
            </p>
            <p>IČO: {site.ico}</p>
            <p>IČ DPH: {site.dic}</p>
          </address>
          <ul className="space-y-1">
            <li>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-2 hover:text-white hover:underline">
                <Icon name="phone" className="size-4" /> {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center gap-2 hover:text-white hover:underline">
                <Icon name="mail" className="size-4" /> {site.email}
              </a>
            </li>
          </ul>
        </div>
        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="font-display text-lg font-semibold text-white">{group.title}</p>
            <ul className="mt-3 space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href + item.label}>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 hover:text-white hover:underline sm:pointer-fine:min-h-9">
                      {item.label}
                      <span className="sr-only"> (otvorí sa v novom okne)</span>
                    </a>
                  ) : (
                    <Link href={item.href} className="inline-flex min-h-11 items-center hover:text-white hover:underline sm:pointer-fine:min-h-9">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-(--container-content) flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/media/2018/10/iso-logo.jpg" alt="Certifikát STN EN ISO 9001:2015" width={48} height={48} className="rounded bg-white" />
            <p>Systém riadenia kvality podľa STN EN ISO 9001:2015</p>
          </div>
          <p>
            © 2016 – {year} {site.company}. {site.registry}
          </p>
        </div>
      </div>
    </footer>
  );
}
