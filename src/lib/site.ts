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

/**
 * Main navigation – same structure as the original site: parents are links to their
 * overview page and open a sub-menu of the *other* pages (no item repeats its parent).
 * The original menu also listed "Bazár plotrov" three times; it now appears once.
 */
export const mainNav: NavItem[] = [
  { label: "Úvod", href: "/" },
  {
    label: "Produkty",
    href: "/velkoformatove-tlaciarne",
    description: "Plotre a skenery HP DesignJet",
    children: [
      { label: "Skladačky výkresov", href: "/skladacky-vykresov" },
      { label: "Latex", href: "/latex" },
      { label: "Vyrezávacie plotre", href: "/vyrezavacie-plotre" },
    ],
  },
  {
    label: "Služby a technická podpora",
    href: "/smart-sluzby",
    children: [
      { label: "Diagnostika a servis plotra", href: "/diagnostika-plotra" },
      { label: "Rady a návody", href: "/smart-sluzby/rady_tipy" },
      { label: "Výmena starého plotra za nový", href: "/stary_za_novy" },
      { label: "Ovládače pre HP plotre", href: "/smart-sluzby/ovladace-pre-hp-plotre" },
    ],
  },
  { label: "Bazár plotrov", href: site.bazaar, external: true },
  { label: "Planografia", href: "/plotrovanie" },
  { label: "Kontakt", href: "/kontakt" },
];

/** Secondary link shown in the top bar (as on the original site) and in the mobile menu. */
export const blogNav: NavItem = { label: "Blogy o HP plotroch", href: "/blogy" };

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Produkty",
    items: [{ label: "Plotre a skenery", href: "/velkoformatove-tlaciarne" }, ...(mainNav[1].children ?? [])],
  },
  {
    title: "Služby",
    items: [{ label: "Služby a technická podpora", href: "/smart-sluzby" }, ...(mainNav[2].children ?? [])],
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
