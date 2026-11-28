/**
 * Editorial copy edits applied by import-content.mjs after the crawl (so a re-import keeps them).
 * Source: docs/copy-review.md. Facts, prices and model lists are unchanged – only structure,
 * casing and obvious typos. Open owner decisions (16 vs 20 years, phone numbers) are NOT touched.
 *
 * 1. Systematic cleanups on every html/excerpt string:
 *    - ">> Technická špecifikácia … <<" / "» … «" pseudo-link arrows removed
 *    - "CHCEM OBJEDNAŤ cez e-shop" / "TECHNICKÁ ŠPECIFIKÁCIA" in sentence case
 *    - paragraphs starting with ↘ › – • become list items; "›" markers inside list items dropped
 * 2. Per-page rewrites (REWRITES): route + a unique text snippet → replacement html.
 *    A rewrite whose snippet is no longer found is reported (content changed on the live site).
 */
import * as cheerio from "cheerio";

const MARKER = /^[\s ]*(?:↘|›|–|•|-(?=\s))[\s ]*/;

function systematic(html) {
  if (!html || typeof html !== "string") return html;
  let out = html
    // pseudo-link arrows around link texts
    .replace(/&gt;&gt;(?:\s|&nbsp;)*/g, "")
    .replace(/(?:\s|&nbsp;)*&lt;&lt;/g, "")
    .replace(/»(?:\s|&nbsp;)*|(?:\s|&nbsp;)*«/g, "")
    .replace(/CHCEM OBJEDNAŤ cez e-shop(?:&nbsp;|\s)*/g, "Objednať v e-shope")
    .replace(/TECHNICKÁ ŠPECIFIKÁCIA/g, "Technická špecifikácia");
  // "stav: UKONČENÁ VÝROBA" at the end of discontinued models → a clear note at the top.
  if (/<p>\s*stav:\s*UKONČENÁ VÝROBA\s*<\/p>/i.test(out)) {
    out = "<p><strong>Výroba ukončená</strong></p>" + out.replace(/<p>\s*stav:\s*UKONČENÁ VÝROBA\s*<\/p>/gi, "");
  }
  // Formatting tags left empty by the removals above.
  for (let prev; prev !== out; ) {
    prev = out;
    out = out.replace(/<(strong|b|em|u)>(?:\s|&nbsp;)*<\/\1>/g, "");
  }

  if (!/[↘›–•]|<p>\s*-\s/.test(out)) return out;
  const $ = cheerio.load(out, null, false);
  // "›" / "↘" markers inside existing list items
  $("li").each((_, li) => {
    const first = li.firstChild;
    if (first?.type === "text" && /^[\s ]*(?:↘|›)/.test(first.data)) first.data = first.data.replace(MARKER, "");
  });
  // Runs of <p> that start with a marker → one <ul>. A marked <p> directly followed by a <ul>
  // (series → its models) becomes a list item with that nested list.
  const isMarked = (el) => el?.tagName === "p" && MARKER.test($(el).text()) && $(el).text().replace(MARKER, "").trim().length > 0;
  const starts = $("p").toArray().filter((p) => {
    if (!isMarked(p)) return false;
    const prev = prevTag(p);
    return !(isMarked(prev) || (prev?.tagName === "ul" && isMarked(prevTag(prev))));
  });
  for (const p of starts) {
    const run = [];
    for (let n = p; isMarked(n); ) {
      const item = { p: n, nested: null };
      const after = nextTag(n);
      if (after?.tagName === "ul") item.nested = after;
      run.push(item);
      n = nextTag(item.nested ?? n);
    }
    const isLink = (el) => $(el).find("a").length > 0 && !$(el).clone().find("a").remove().end().text().replace(MARKER, "").trim();
    if (run.length < 2 && !run[0].nested) {
      // A single "↘ Technická špecifikácia" link: just drop the arrow; a lone dash line is prose.
      if (isLink(run[0].p)) stripLeadingMarker($, run[0].p);
      continue;
    }
    const ul = $("<ul></ul>");
    for (const { p: el, nested } of run) {
      stripLeadingMarker($, el);
      const li = $("<li></li>").append($(el).contents());
      if (nested) li.append($(nested));
      ul.append(li);
    }
    $(run[0].p).before(ul);
    run.forEach(({ p: el }) => $(el).remove());
  }
  return $.html();
}

const prevTag = (el) => { let n = el.prev; while (n && n.type !== "tag") n = n.prev; return n; };
const nextTag = (el) => { let n = el.next; while (n && n.type !== "tag") n = n.next; return n; };

/** Removes the marker from the first text node, even when it is wrapped (<strong>↘</strong>). */
function stripLeadingMarker($, el) {
  const walk = (node) => {
    for (const c of [...(node.children ?? [])]) {
      if (c.type === "text") {
        if (!c.data.trim()) continue;
        c.data = c.data.replace(MARKER, "");
        if (!c.data.trim() && node !== el && !$(node).text().trim()) $(node).remove();
        return true;
      }
      if (c.type === "tag") {
        if (walk(c)) {
          if (!$(c).text().trim()) $(c).remove();
          return true;
        }
      }
    }
    return false;
  };
  walk(el);
}

/* ---------------------------------------------------------------------------------------------- */

const REWRITES = [
  {
    route: "/",
    find: "Keď vidíte logo <strong>HP Amplify Power Partner</strong>",
    html:
      "<p>Logo <strong>HP Amplify Power Partner</strong> znamená, že sa o vás stará spoločnosť, ktorá spĺňa najprísnejšie kritériá HP a absolvovala školenia na predaj a podporu produktov HP.</p>" +
      "<ul>" +
      "<li><strong>Najnovšie technológie</strong> – sme v neustálom kontakte so spoločnosťou HP, takže máte prístup ku všetkým novinkám, ktoré sú zárukou dlhodobej návratnosti investícií.</li>" +
      "<li><strong>Riešenia na mieru</strong> – certifikácie a znalosť produktov HP nám umožňujú navrhnúť riešenie presne pre vaše potreby.</li>" +
      "<li><strong>Vysokokvalitný zákaznícky servis</strong> – rady, technológie aj služby navrhnuté s ohľadom na zákazníka.</li>" +
      "</ul>" +
      "<p>Vy sa môžete sústrediť na to, čo je pre vás najdôležitejšie.</p>",
  },
  {
    route: "/",
    find: "DOVOZ PLOTRA",
    html: "<p><em>O všetko sa postaráme:</em> dovoz plotra · montáž · zapojenie do siete · inštalácia · testovanie · zaškolenie užívateľov</p>",
  },
  {
    route: "/",
    find: "Ak chcete minimalizovať vstupné náklady",
    html:
      "<p>Ak chcete minimalizovať vstupné náklady, ponúkame prenájom alebo splátky.</p>" +
      "<ul>" +
      '<li><strong>Prenájom</strong> – napr. <a href="/hp-designjet-t1600-printer-series">HP DesignJet T1600, 36“</a> <strong>od 125 € mesačne</strong> vrátane náplní a servisu.</li>' +
      "<li><strong>Splátky</strong> – ideálne, ak nechcete ísť do dlhodobého prenájmu a jednorazová kúpa je veľká investícia.</li>" +
      "<li><strong>Výmena starého plotra za nový</strong> – staršie alebo nefunkčné zariadenie odkúpime za zostatkovú cenu, zrecyklujeme ho a vy si vyberiete nové.</li>" +
      "</ul>",
  },
  {
    route: "/",
    find: "Plotrovacie rolky, odpadové nádoby, tlačové hlavy",
    html:
      "<p>Plotrovacie rolky, odpadové nádoby, tlačové hlavy a atramentové náplne máme štandardne <strong>skladom alebo dostupné do 1–3 dní</strong>.</p>" +
      "<p><strong>Poradíme vám:</strong></p>" +
      "<ul>" +
      "<li>aké atramentové náplne a tlačové hlavy pasujú do vášho plotra,</li>" +
      "<li>aký návin roliek objednať – 50, 90, 100 alebo 150 m – a akú dutinku (50 alebo 75 mm),</li>" +
      "<li>aké šírky roliek potrebujete na bezokrajovú tlač.</li>" +
      "</ul>",
  },
  {
    route: "/smart-sluzby",
    find: "<p>Spoločnosť HP postupne ukončuje",
    html:
      "<p>Spoločnosť HP postupne ukončuje technickú podporu pre staršie plotre:</p>" +
      "<table><thead><tr><th>Koniec podpory</th><th>Modely HP DesignJet</th></tr></thead><tbody>" +
      "<tr><td><strong>od&nbsp;30.&nbsp;4.&nbsp;2024</strong></td><td>Z6200, Z5200, T520, T120</td></tr>" +
      "<tr><td><strong>od&nbsp;30.&nbsp;10.&nbsp;2024</strong></td><td>T930, T1530, T2530, T3500</td></tr>" +
      "<tr><td><strong>už&nbsp;skončila</strong></td><td>T1200, T1200ps, T770, T770 HD, 4020, 4020ps, 4520, 4520ps, T7100 mono, 5500 42in, 5500 60in, 4500ps, 4000ps, 70, 100/110, 500, 800/815, 1050/1055, 4000/4500, 5000/5500</td></tr>" +
      "</tbody></table>" +
      "<p><strong>Čo to znamená pre majiteľov starších plotrov:</strong> nie sú dostupné originálne náhradné diely, CarePacky, originálne atramentové náplne ani softvérová podpora pre nové verzie napr. Windowsu.</p>" +
      "<p><strong>Potrebujete sa poradiť?</strong> Zavolajte nám na <strong>0940 636 489</strong> alebo napíšte cez formulár nižšie.</p>",
  },
  {
    route: "/smart-sluzby",
    find: "<p>Sme certifikovaný servisný partner spoločnosti HP",
    html:
      "<ul>" +
      "<li><strong>Certifikovaný servisný partner HP</strong> – tím s viac ako 16-ročnými skúsenosťami s predajom a servisom kancelárskych, multifunkčných, produkčných a grafických plotrov.</li>" +
      "<li><strong>Akreditované HP špecializácie:</strong> HP DesignJet Specialist a HP Technical Production Specialist.</li>" +
      "<li><strong>Ako jediní na Slovensku</strong> máme autorizáciu na servis produkčných tlačiarní DesignJet T1700, T3500, T7200, Z6 / Z9, XL 3600, XL 3800, Z6610 a Z6810.</li>" +
      "<li><strong>Tlačiarne sami denne používame</strong> – zariadenia poznáme a vieme vám pomôcť v každej situácii.</li>" +
      "</ul>",
  },
  {
    route: "/diagnostika-plotra",
    find: "<ul><li>Vypisuje displej Vášho zariadenia chybovú hlášku",
    html:
      "<p><strong>Vypisuje displej chybovú hlášku?</strong></p>" +
      "<ul>" +
      "<li><strong>21:10</strong> – System Error / Service Station – najčastejšia chybová hláška, signalizuje problém so servisnou stanicou</li>" +
      "<li><strong>45:10</strong> – porucha motora prevíjača</li>" +
      "<li><strong>86:01</strong> – possible paper jam</li>" +
      "<li>ďalšie: 79:04, 55:10, 14:10, 21.2:13, 22.0:00, 08:04, paper mismatch…</li>" +
      "</ul>" +
      "<p><strong>Iné príznaky:</strong></p>" +
      "<ul>" +
      '<li>pokazený rezací nôž – <a href="/smart-sluzby/rady_tipy">návod na výmenu rezacieho noža</a></li>' +
      "<li>roztrhnutý remeň</li>" +
      "<li>zariadenie hučí, ale výkres nevytlačí</li>" +
      "</ul>",
  },
  { route: "/diagnostika-plotra", find: "Nechajte servis nechajte na nás.", field: "title", html: "Servis nechajte na nás" },
  { route: "/diagnostika-plotra", find: "Roztrhnutý remeň", nth: 0, html: "<p>Ploter počas opravy</p>" },
  {
    route: "/stary_za_novy",
    find: "<ul><li>NOVÝ ploter, lacnejšie ako od internetových predajcov",
    html:
      "<p><strong>Nový ploter lacnejšie ako od internetových predajcov, pretože:</strong></p>" +
      "<ul>" +
      "<li>ušetríte náklady za odvoz a likvidáciu starého plotra,</li>" +
      "<li>starý ploter ekologicky zlikvidujeme,</li>" +
      "<li>nový ploter dovezieme k vám, tam kam potrebujete.</li>" +
      "</ul>" +
      "<p><strong>Navyše:</strong></p>" +
      "<ul>" +
      "<li>zapojenie do siete, inštalácia, kalibrácia plotra a zaškolenie užívateľov,</li>" +
      "<li>istota certifikovaného, dlhoročného servisu a poradenstva,</li>" +
      "<li>náplne, všetky druhy roliek aj náhradné diely.</li>" +
      "</ul>",
  },
  {
    route: "/hp-designjet-t1700",
    find: "<p><strong>Prečo je T1700 najbezpečnejšia tlačiareň",
    html:
      "<ul><li>Ochrana dát, informácií a dokumentov</li><li>Správa zabezpečenia tlačiarne</li><li>Kontrola a optimalizácia tlačových nákladov</li></ul>" +
      "<p><strong>Prečo je T1700 najbezpečnejšia tlačiareň:</strong></p>" +
      "<ul>" +
      "<li><strong>Secure Boot</strong> – overuje integritu bootovacieho kódu už v štartovacom cykle a zabraňuje načítaniu neoprávnených operačných systémov.</li>" +
      "<li><strong>Whitelisting</strong> – pri štarte overuje integritu systémových súborov firmvéru; ak overenie zlyhá, zariadenie sa reštartuje a zostane v stave predbežného spustenia.</li>" +
      "<li><strong>Self-Encrypted HDD</strong> – dáta v tlačiarni sú čitateľné len tlačiarňou a automaticky sa šifrujú pri každom odoslaní do tlačiarne a zápise na disk.</li>" +
      "<li><strong>PIN printing</strong> – tlačové úlohy môžete chrániť identifikačným kódom (PIN).</li>" +
      "</ul>",
  },
  {
    route: "/hp-designjet-z6810-printer",
    find: "<li>ponúkaná v 2 modeloch: </li></ul>",
    html:
      "<p>Splňte očakávania svojich zákazníkov.</p><p>HP Z6810 je najrýchlejšia produkčná tlačiareň pre grafickú oblasť. Dosahuje špičkové výstupy v perokresbe aj fototlači.</p>" +
      "<ul>" +
      "<li>ponúkaná v 2 modeloch:<ul>" +
      "<li>HP DJ Z6810 Production Printer <strong>42-in / 1067 mm</strong> (2QU12A)</li>" +
      "<li>HP DJ Z6810 Production Printer <strong>60-in / 1524 mm</strong> (2QU14A)</li>" +
      "</ul></li>" +
      "<li>8-farebný atramentový systém tlače (cyan, magenta, yellow, photo black, matte black, light gray, light magenta, chromatic red)</li>" +
      "<li>rozlíšenie až 2400 x 1200 optimised dpi</li><li>pamäť 64 GB / pevný disk 500 GB</li><li>maximálna šírka rolky až 1524 mm</li>" +
      "<li>rýchlosť tlače vo „fast-eco“ móde: až 140 m² / hod na obyčajný papier</li><li>záruka na HW: 1 rok</li>" +
      "</ul>",
  },
  {
    route: "/smart-sluzby/rady_tipy",
    find: "<li>vyšrobujte skrutku</li>",
    replace: ["<li>vyšrobujte skrutku</li>", "<li>vyskrutkujte skrutku</li>"],
  },
  {
    route: "/rada-t850_t950",
    find: "<p><strong>Whitelisting</strong> a <strong>ochrana firmvéru</strong>",
    replaceBlock: [
      /<p><strong>Whitelisting<\/strong> a <strong>ochrana firmvéru<\/strong>[\s\S]*?<p><strong>Secure Boot<\/strong>[^<]*<\/p>/,
      "<ul>" +
        "<li><strong>Whitelisting</strong> a <strong>ochrana firmvéru</strong> – zabezpečenie integrity zariadenia</li>" +
        "<li><strong>Secure Boot</strong> – zabraňuje načítaniu neautorizovaných operačných systémov</li>" +
        "</ul>" +
        "<p>Tieto funkcie výrazne znižujú riziko kybernetických útokov či straty dát, čo konkurencia v tejto triede často nedokáže ponúknuť.</p>",
    ],
  },
  {
    route: "/diagnostika_plotra",
    find: "<p>ploter nemá dostatočnú pamäť",
    replaceBlock: [
      /<p>ploter nemá dostatočnú pamäť[\s\S]*?<\/p>/,
      "<ul><li>ploter nemá dostatočnú pamäť a nenačíta výkres,</li><li>vytlačené čiary nie sú ostré,</li><li>pretrhne sa remeň,</li><li>nefunguje dotykový displej (ako na videu nižšie)?</li></ul>",
    ],
  },
];

/** Title images the owner asked to remove (matched by image file name). */
const REMOVE_IMAGE_SLIDERS = [
  { route: "/stary_za_novy", image: "PRODUCTION_MAIN_1430x600" },
  { route: "/plotrovanie", image: "planografia.jpg" },
];

/** Columns shown as standard text instead of a card. */
const PLAIN_COLUMNS = [{ route: "/stary_za_novy", title: "Ekologický zber a recyklácia" }];

/** Bazár: price as "690 € bez DPH" right under the heading, long spec bullets split. */
function bazaar(page) {
  for (const s of page.sections) {
    for (const c of s.columns ?? []) {
      if (!c.html || !/Eur|cenová ponuka/.test(c.html)) continue;
      const $ = cheerio.load(c.html, null, false);
      const priceP = $("p").filter((_, p) => /(\d[\d\s]*),-\s*Eur|cenová ponuka na vyžiadanie/i.test($(p).text())).last();
      if (!priceP.length) continue;
      const t = priceP.text().replace(/\s+/g, " ").trim();
      const num = t.match(/(\d[\d\s]*),-/)?.[1]?.replace(/\s/g, "");
      const price = num ? `${Number(num).toLocaleString("sk-SK").replace(/ /g, " ")} € bez DPH` : "Cena na vyžiadanie";
      priceP.remove();
      $("li").each((_, li) => {
        const txt = $(li).html();
        if (!/podávač hárkov; Výstup:/.test(txt)) return;
        $(li).replaceWith(
          "<li>podávač hárkov</li><li>výstup: integrovaný výstupný stohovač (od A4 do A0, s kapacitou až 100 formátu A1), priehradka na médiá, automatická rezačka</li><li>skener: priama dráha skenovania papiera pre listové a kartónové originály</li>",
        );
      });
      c.html = `<p><strong>${price}</strong></p>` + $.html();
    }
  }
}

function forEachString(node, fn, key = "") {
  if (Array.isArray(node)) node.forEach((n, i) => (typeof n === "string" ? (node[i] = fn(n, key)) : forEachString(n, fn, key)));
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string") node[k] = fn(v, k);
      else forEachString(v, fn, k);
    }
}

export function applyCopyEdits(pages, posts) {
  const all = [...pages, ...posts];
  const missed = [];
  for (const item of all) forEachString(item, (v, k) => (k === "html" || k === "excerpt" ? systematic(v) : v));

  for (const r of REWRITES) {
    const item = all.find((p) => p.route === r.route);
    let hits = 0;
    if (item) {
      forEachString(item, (v, k) => {
        if (r.field && k !== r.field) return v;
        if (!v.includes(r.find)) return v;
        const n = hits++;
        if (r.nth !== undefined && n !== r.nth) return v;
        if (r.replace) return v.replace(r.replace[0], r.replace[1]);
        if (r.replaceBlock) return v.replace(r.replaceBlock[0], r.replaceBlock[1]);
        return r.html;
      });
    }
    if (!hits) missed.push(`${r.route}: "${r.find.slice(0, 50)}"`);
  }

  const bazar = pages.find((p) => p.route === "/bazar-plotrov");
  if (bazar) bazaar(bazar);

  // Layout edits requested by the owner.
  for (const { route, image } of REMOVE_IMAGE_SLIDERS) {
    const p = pages.find((x) => x.route === route);
    const i = p?.sections.findIndex((s) => s.type === "slider" && s.slides.some((sl) => sl.image?.src.includes(image))) ?? -1;
    if (i >= 0) p.sections.splice(i, 1);
    else missed.push(`${route}: title image ${image}`);
  }
  for (const { route, title } of PLAIN_COLUMNS) {
    const col = pages.find((x) => x.route === route)?.sections.flatMap((s) => s.columns ?? []).find((c) => c.title === title);
    if (col) col.plain = true;
    else missed.push(`${route}: column "${title}"`);
  }
  if (!portfolio(pages)) missed.push('/velkoformatove-tlaciarne: "Aktuálne portfólio" section');
  return { missed };
}

/* ---------------------------------------------------------------------------------------------- */
/* Product overview: "Aktuálne portfólio" as category cards (image, short description, models).  */
/* Models come from the imported link columns; scanners get their own category; Latex and       */
/* cutting plotters are added from their own pages.                                              */
/* ---------------------------------------------------------------------------------------------- */

const CATEGORY_COPY = {
  "Technické tlačiarne": "Plotre na tlač výkresov CAD, GIS a projektovej dokumentácie – pre architektúru, strojárstvo a stavebníctvo.",
  "Multifunkčné tlačiarne": "Tlač, kopírovanie a skenovanie v jednom zariadení – skenuje, kopíruje a tlačí na 1 klik.",
  "Veľkoformátové skenery": "Samostatné veľkoformátové skenery na digitalizáciu výkresov a grafických predlôh.",
  "Produkčné tlačiarne": "Výkonné tlačiarne pre veľké objemy technickej aj grafickej tlače.",
  "Grafické tlačiarne": "Profesionálna tlač fotografií, plátna a grafiky pre fotografov a dizajnérov.",
  "Latexové tlačiarne": "Latexové tlačiarne HP na tlač reklamy a polepov – od HP Latex 115 po R2000.",
  "Vyrezávacie plotre": "Rezacie plotre Summa s tangenciálnym alebo drag systémom.",
};

function linksFrom(html) {
  const $ = cheerio.load(html ?? "", null, false);
  const seen = new Set();
  return $("a")
    .toArray()
    .map((a) => ({ label: $(a).text().replace(/\s+/g, " ").trim(), href: $(a).attr("href") }))
    .filter((l) => l.label && l.href && !seen.has(l.label) && seen.add(l.label));
}

function portfolio(pages) {
  const page = pages.find((p) => p.route === "/velkoformatove-tlaciarne");
  const i = page?.sections.findIndex((s) => s.type === "content" && /^Aktuálne portfólio/.test(s.title ?? ""));
  if (!page || i < 0) return false;
  const band = page.sections[i];
  const grid = band.columns.length ? band : page.sections[i + 1];
  if (!grid?.columns?.length) return false;

  const cats = grid.columns
    .filter((c) => c.title)
    .map((c) => ({ title: c.title.trim(), image: c.image, models: linksFrom(c.html) }));
  const mfp = cats.find((c) => c.title === "Multifunkčné tlačiarne");
  const isScanner = (m) => /scanner|skener/i.test(m.href + m.label);
  const scanners = mfp ? mfp.models.filter(isScanner) : [];
  if (mfp) mfp.models = mfp.models.filter((m) => !isScanner(m));
  if (scanners.length) {
    const sd = pages.find((p) => p.route === "/hp-sd-pro-scanner");
    const img = sd?.sections.flatMap((s) => s.slides ?? []).map((s) => s.image).find((im) => im?.src.includes("HP-SD-Pro"));
    cats.splice(cats.indexOf(mfp) + 1, 0, { title: "Veľkoformátové skenery", image: img, models: scanners });
  }
  const fromPage = (route, title, imageMatch) => {
    const p = pages.find((x) => x.route === route);
    if (!p) return null;
    const cols = p.sections.flatMap((s) => s.columns ?? []).filter((c) => c.title && c.image);
    return {
      title,
      href: route,
      image: cols.find((c) => c.image.src.includes(imageMatch))?.image ?? cols[0]?.image,
      models: cols.map((c) => ({ label: c.title.trim(), href: route })),
    };
  };
  for (const extra of [fromPage("/latex", "Latexové tlačiarne", "335"), fromPage("/vyrezavacie-plotre", "Vyrezávacie plotre", "summa-S2")]) {
    if (extra?.models.length) cats.push(extra);
  }

  const section = {
    type: "portfolio",
    id: grid.id,
    title: band.title,
    categories: cats.map((c) => ({ ...c, description: CATEGORY_COPY[c.title] ?? "" })),
  };
  page.sections.splice(i, grid === band ? 1 : 2, section);
  return true;
}
