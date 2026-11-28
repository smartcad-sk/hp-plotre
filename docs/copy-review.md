# Copy-structure review (all pages)

Review of `src/content/pages.json` (60 pages) and `posts.json` (9 posts): where the copy is a wall of text and how
to structure it. The proposed Slovak copy keeps the original facts; nothing is invented.

## Status

The edits are applied by `scripts/copy-edits.mjs`. The importer runs it on every `npm run import:content`, and it warns
when a rewrite no longer matches the live text.

**Applied:**
- items 1–5, 7, 8, 10–12;
- item 6, except moving "Prvá pomoc";
- item 9: price under the heading, spec bullets split;
- item 13: "Výroba ukončená" note at the top; captions that repeat on every slide are shown once;
- item 14: typo "vyskrutkujte";
- item 15: `/rada-t850_t950` and `/diagnostika_plotra`;
- the pattern fixes for pseudo-link arrows, caps e-shop/spec labels, and ↘ / › / – lines turned into (nested) lists.

Fixed earlier:
- the "Slider Title / Short Excerpt" demo slides;
- the WordPress error text in a post;
- the GDPR text, now part of the shared form block.

**Not applied (needs content work or a decision):**
- the owner decisions below;
- the "Prvá pomoc" box on `/diagnostika-plotra`;
- a warranty badge on bazár cards;
- a successor link for discontinued models;
- the knife-replacement post as a numbered list;
- a comparison table for the Epson post;
- definition-list and subheading patterns.

## Needs an owner decision

- Years of experience: `/smart-sluzby` says **16 rokov**, while `/` and `/kontakt` say **20 rokov**.
- Phone numbers: the site uses three numbers (0940 636 481 / 482 / 489) and two e-mails for "servis/obchod". Which
  one belongs in the shared CTA? The product pages say "Máte otázky? … 0940 636 481".
- On `/velkoformatove-tlaciarne`, Z6610/Z6810 are listed under both "Produkčné" and "Grafické". Is that intended?

## Proposed changes (worst first)

1. **`/`, section "Sme autorizovaný servisný partner spoločnosti HP"**: three paragraphs of about 900 characters.
   > ### HP Amplify Power Partner
   > Spĺňame najprísnejšie kritériá HP a sme vyškolení na predaj a podporu produktov HP.
   > - **Prístup k najnovším technológiám** – sme v neustálom kontakte s HP
   > - **Riešenia na mieru** – vďaka certifikáciám a znalosti produktov HP
   > - **Vysokokvalitný zákaznícky servis**
2. **`/smart-sluzby`, section "Koniec HP technickej podpory"**: the dates are buried in the text. Use a table:
   | Dátum | Modely |
   |---|---|
   | 30. 4. 2024 | Z6200, Z5200, T520, T120 |
   | 30. 10. 2024 | T930, T1530, T2530, T3500 |
   | už skončila | T1200, T770, 4020, 4520, T7100, 5500, 4500ps, 4000ps, … |

   Follow the table with **Čo to znamená:** no original spare parts, CarePacks, original inks or support for new Windows
   versions. Then **Poradíme vám:** phone or the form.
3. **`/smart-sluzby`, about paragraph**: turn it into a list under "Prečo smartCAD":
   - certifikovaný partner HP
   - HP DesignJet Specialist / Technical Production Specialist
   - **jediní na Slovensku** s autorizáciou na servis T1700, T3500, T7200, Z6/Z9, XL 3600/3800, Z6610/Z6810
   - tlačiarne denne sami používame
4. **`/`, section "Kúpa, prenájom alebo splácanie"**: use three cards (Prenájom **od 125 € mesačne** / Splátky / Starý za
   nový). Today the price is hidden mid-sentence inside » «.
5. **`/`, intro "🔸 DOVOZ PLOTRA 🔸 MONTÁŽ…"**: all caps with emoji separators. Make it a 6-step list "Ako to prebieha"
   (Dovoz · Montáž · Zapojenie do siete · Inštalácia · Testovanie · Zaškolenie). The same sequence is on `/smart-sluzby` and in the
   installation post, so one shared block can serve all three.
6. **`/diagnostika-plotra`**: separate the error codes (21:10, 45:10, 86:01 …) from the symptoms (nôž, remeň, hučí
   ale netlačí) under two headings. Also:
   - Fix the heading "Nechajte servis nechajte na nás".
   - The gallery caption "Roztrhnutý remeň" appears twice.
   - Move "Prvá pomoc" (phone and e-mail) higher up the page.
7. **`/stary_za_novy`, section "Čo od nás získate?"**: nest the reasons under the bullet "Nový ploter lacnejšie…, pretože:".
   Also fix "doveziem" → "dovezieme".
8. **`/`, section "Náplne a rolky"**: turn the run-on questions into a short FAQ:
   - Skladom?
   - Aké náplne a hlavy?
   - Aký návin a dutinka?
   - Bezokrajová tlač?
9. **`/bazar-plotrov`**:
   - Put the price under the heading in one format: **690 € bez DPH**.
   - Split the bullets that join specs with semicolons.
   - Show the 3-month warranty as a badge.
10. **`/velkoformatove-tlaciarne`**:
    - The checklist "Pri výbere plotra treba brať do úvahy" is stored 4 times; show it once.
    - The ↘ / › lines should become real link lists.
11. **`/hp-designjet-t1700`, section "Bezpečnosť"**:
    - Show the four bold-lead paragraphs as a definition list (Secure Boot, Whitelisting, Self-Encrypted HDD, PIN).
    - Fix the Czech words: předběžného, při, najbezbečnejšiu tliačiareň.
12. **`/hp-designjet-z6810-printer`**: the paragraphs that start with "–" should be a nested list of models (42"/2QU12A, 60"/2QU14A).
13. **`/hp-designjet-t520-printer`, `/hp-designjet-t120`**:
    - Show "UKONČENÁ VÝROBA" at the top as a badge "Výroba ukončená – pozrite nástupcu".
    - The T520 intro is stored twice.
14. **`/smart-sluzby/rady_tipy` and the knife-replacement post**: the 11 steps should be a numbered list. Also fix "vyšrobujte" → "vyskrutkujte".
15. **Posts**:
    - `/rada-t850_t950`: the Secure Boot / Whitelisting bullets are scrambled.
    - `/diagnostika_plotra`: "Ale čo ak…" should be a list of symptoms.
    - `/hp-dj-t850-v-porovnani-s-epson-t5405`: the security features should be a `<ul>`; a summary table would also help.

## Patterns that could be fixed systematically in rendering/import

| Pattern | Count | Fix |
|---|---|---|
| `>> text <<` pseudo-links | 53 | render as a button |
| "CHCEM OBJEDNAŤ cez e-shop" in caps | 47 | sentence-case secondary button "Objednať v e-shope" |
| lines starting with ↘ / › instead of `<li>` | 80 | convert to a link list |
| `<strong>Term</strong> – text` paragraphs | 9+ | definition list / feature cards |
| bold-only line followed by text ("FUNKCIE:", "Tlač") | ~15 | promote to `<h3>` |
| paragraphs starting with "–", "•", ✅, ➡️ | 7+ | convert to `<ul>` |
| identical sections stored 2–4× | 2 pages | dedupe adjacent duplicates |
