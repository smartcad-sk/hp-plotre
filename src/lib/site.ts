/** Company, navigation and contact data – single source of truth for the whole site. */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hpplotre.sk";

export const site = {
  name: "HPplotre.sk",
  company: "smartCAD s.r.o.",
  tagline: "Predaj a servis veľkoformátových tlačiarní HP",
  description:
    "Autorizovaný predaj a servis HP DesignJet plotrov, skenerov a skladačiek výkresov. Viac ako 20 rokov skúseností – dovoz, montáž, inštalácia, zaškolenie a záručný aj pozáručný servis.",
  locale: "sk_SK",
  address: { street: "Čajakova 19", zip: "811 05", city: "Bratislava", country: "SK" },
  ico: "44 743 289",
  dic: "SK2022818457",
  registry: "Zapísaná v OR Bratislava 1, odd. Sro., vložka č. 58126/B",
  phone: "+421 940 636 489",
  phoneDisplay: "0940 636 489",
  email: "obchod@smartcad.sk",
  serviceEmail: "hw@smartcad.sk",
  eshop: "https://kancelaria.smartcad.sk",
  bazaar: "https://kancelaria.smartcad.sk/bazar-plotrov/",
  gdpr: "https://www.smartcad.sk/gdpr",
  social: {
    facebook: "https://www.facebook.com/cadpodpora",
    instagram: "https://www.instagram.com/smartcad.sk/",
    linkedin: "https://www.linkedin.com/company/smartcad",
    youtube: "https://www.youtube.com/c/smartCADsroBratislava",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
  description?: string;
  children?: NavItem[];
};

/** Product pages listed in the footer (the main menu links to the overview only). */
export const productNav: NavItem[] = [
  { label: "Skladačky výkresov", href: "/skladacky-vykresov" },
  { label: "Latex", href: "/latex" },
  { label: "Vyrezávacie plotre", href: "/vyrezavacie-plotre" },
];

/** Service pages; "Rady a návody" stays reachable from the footer only. */
const serviceNav: NavItem[] = [
  { label: "Diagnostika a servis plotra", href: "/diagnostika-plotra" },
  { label: "Výmena starého plotra za nový", href: "/stary_za_novy" },
  { label: "Ovládače pre HP plotre", href: "/smart-sluzby/ovladace-pre-hp-plotre" },
];

export const blogNav: NavItem = { label: "Blog", href: "/blogy" };

/**
 * Main navigation. The logo links home (no "Úvod" item); Produkty links to the overview,
 * which lists every category and model; only the service section has a sub-menu.
 */
export const mainNav: NavItem[] = [
  { label: "Produkty", href: "/velkoformatove-tlaciarne" },
  { label: "Služby a technická podpora", href: "/smart-sluzby", children: serviceNav },
  { label: "Bazár plotrov", href: site.bazaar, external: true },
  { label: "Planografia", href: "/plotrovanie" },
  blogNav,
  { label: "Kontakt", href: "/kontakt" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Produkty",
    items: [{ label: "Plotre a skenery", href: "/velkoformatove-tlaciarne" }, ...productNav],
  },
  {
    title: "Služby",
    items: [{ label: "Služby a technická podpora", href: "/smart-sluzby" }, ...serviceNav, { label: "Rady a návody", href: "/smart-sluzby/rady_tipy" }],
  },
  {
    title: "Ďalšie",
    items: [
      { label: "Planografia", href: "/plotrovanie" },
      blogNav,
      { label: "Kontakt", href: "/kontakt" },
      { label: "Bazár plotrov", href: site.bazaar, external: true },
      { label: "E-shop", href: site.eshop, external: true },
      { label: "Ochrana osobných údajov (GDPR)", href: site.gdpr, external: true },
    ],
  },
];

export const contactPeople = [
  { name: "Mgr. Martin Straško", phone: "+421 940 636 481", email: "strasko@smartcad.sk", photo: "/media/2017/10/martin-strasko.jpg" },
  { name: "Ing. Ladislav Líška", phone: "+421 940 636 482", email: "liska@smartcad.sk", photo: "/media/2017/10/ladislav-liska.jpg" },
] as const;
