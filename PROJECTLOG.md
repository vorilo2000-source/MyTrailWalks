# MyTrailWalks — PROJECTLOG.md
## Bijgewerkt: 20-06-2026
> Versie: v1.1.0 · Projectlog — chronologisch overzicht van sessies en wijzigingen

---

# ======================= ENTRIES =======================

---

## Sessie 01 — 18-06-2026
**Onderwerp:** T0-005 (i18next systeem) + T0-002 (routes.json schema) + T1-001 (homepage grid) + component-fragmenten (topbar/navbar/footer)
**Status aan einde sessie:** T0-005 ✅ Done · T0-002 ✅ Done · T1-001 🔄 Gedeeltelijk (grid gebouwd, fetch-injectie componenten volgt in T0-006)

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/i18n.js` | v1.1.0 | Nieuwe wrapper rond i18next: init, loadNamespace, t(), applyTranslations(), loadScript(), changeLanguage(), buildLanguageSwitcher(). |
| `data/i18n/nl/common.json` | v1.0.0 | Gedeelde NL UI-teksten: navigatie, footer, route-stat-labels, moeilijkheidsgraden, a11y-labels. |
| `data/i18n/nl/home.json` | v1.0.0 | Homepage-specifieke NL UI-teksten. |
| `data/i18n/en/common.json` | v1.0.0 | Engelse fallback voor common namespace. |
| `data/i18n/en/home.json` | v1.0.0 | Engelse fallback voor home namespace. |
| `data/routes.json` | v2.0.0 | Schema bijgewerkt: `language`-veld toegevoegd, `content_json` pad gecorrigeerd. |
| `index.html` | v1.1.0 | Homepage grid: CDN-scripts i18next, component-placeholders, page-header. |
| `css/home.css` | v1.0.0 | Grid-layout (mobile-first), tile-component, sticky nav-spacing via CSS-variabelen. |
| `js/home.js` | v1.0.0 | Homepage init: i18next + routes.json laden + grid renderen. |
| `components/topbar.html` | v1.0.0 | Topbar fragment: auth-slot, merknaam midden, taalwisselaar rechts. |
| `css/topbar.css` | v1.0.0 | Topbar stijlen: sticky, --topbar-height: 44px. |
| `components/navbar.html` | v1.0.0 | Navbar fragment: logo, navigatielinks, hamburger mobile. |
| `css/navbar.css` | v1.0.0 | Navbar stijlen: sticky, forest achtergrond, --navbar-height: 60px. |
| `components/footer.html` | v1.0.0 | Footer fragment: logo + copyright + placeholder-links. |
| `css/footer.css` | v1.0.0 | Footer stijlen: forest-dark achtergrond. |

### Openstaande punten na sessie 01
- `js/app.js` herzien naar i18next-architectuur (TD-004)
- `data/content/ninglinspo.json` aanmaken (T1-005)
- CLAUDE.md localStorage-prefixtabel bijwerken naar `mtw_*` (TD-005)

---

## Sessie 02 — 20-06-2026
**Onderwerp:** UI/UX redesign homepage — hero sectie, component-injectie, topbar zichtbaar, i18n keys, favicon, logo
**Status aan einde sessie:** T0-006 ✅ Done · T0-005 ✅ Done (v1.2.0) · T1-001 ✅ Done · TD-004 ✅ Done · TD-005 ✅ Done

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `index.html` | v2.1.0 | Navbar verwijderd. Hero sectie toegevoegd (eyebrow + titel + subtitel + CTA). `app.js` als script toegevoegd. |
| `css/home.css` | v2.1.0 | Dubbele hero-definitie verwijderd. Hero hoogte: `height: 55vh; max-height: 500px`. Overlay verlicht (neutraal zwart i.p.v. groen). Hero achtergrondafbeelding: `assets/images/hero.jpg`. |
| `js/app.js` | v2.1.0 | Nieuw: fetch+injectie topbar + footer via `window.appReady` Promise. `getBasePath()` helper voor correcte paden vanuit submappen. `setActiveNavLink()`. |
| `js/home.js` | v2.0.0 | Wacht op `window.appReady` vóór `buildLanguageSwitcher()`. i18n init volgorde gecorrigeerd. |
| `js/i18n.js` | v1.2.0 | `loadPath` dynamisch via `getBasePath()` — werkt correct vanuit root én submappen. localStorage-detectie via `mtw_language`. |
| `data/i18n/nl/home.json` | v2.0.0 | Hero keys toegevoegd: `hero.tagline`, `hero.title`, `hero.sub`, `hero.cta`. |
| `data/i18n/en/home.json` | v2.0.0 | Hero keys toegevoegd (Engelse fallback). |
| `data/i18n/en/common.json` | v1.0.0 | Nieuw aangemaakt — Engelse fallback voor common namespace. |
| `components/topbar.html` | v1.1.0 | Logo (Logo2.png) toegevoegd naast merknaam. |
| `css/topbar.css` | v1.1.0 | Logo stijlen: `height: 32px`, flex naast merknaam. --topbar-height: 52px. |
| `assets/images/hero.jpg` | — | Hero achtergrondafbeelding homepage (woestijnlandschap). |
| `assets/images/Logo2.png` | — | MyTrailWalks logo (wandelaar met wandelstok, boom, bergen). |
| `assets/images/favicon.ico` | — | Favicon gegenereerd uit Logo2.png (16/32/48px). |
| `assets/images/favicon-32x32.png` | — | Favicon PNG 32x32. |
| `assets/images/favicon-180x180.png` | — | Apple touch icon 180x180. |
| `assets/images/favicon-192x192.png` | — | Android favicon 192x192. |

### Architectuurbeslissingen sessie 02

- **Navbar verwijderd** — bewuste beslissing: topbar doet het navigatiewerk (merknaam + taalswitch + inlog post-MVP). Geen aparte navbar op de homepage.
- **Hero sectie toegevoegd** — fullwidth, donkere overlay, gecentreerde tekst + CTA. Achtergrondafbeelding via `hero__bg` element.
- **`window.appReady` patroon** — `app.js` exporteert een Promise die resolvet na component-injectie. `home.js` wacht hierop zodat `buildLanguageSwitcher()` pas aangeroepen wordt als de `<select>` in de DOM zit.
- **Dynamisch loadPath in i18n.js** — `getBasePath()` berekent het juiste pad op basis van paginadiepte. Lost het `../` probleem op voor pagina's in submappen.
- **Favicon toegevoegd** — gegenereerd uit Logo2.png via Pillow. Toe te voegen in `<head>` van elke pagina na `<title>`.

### Openstaande punten na sessie 02
- Favicon `<link>` tags toevoegen aan elke pagina's `<head>`
- `T1-005` — `data/content/ninglinspo.json` aanmaken
- `T0-003` — Route template herzien
- `T1-002` — Route detail pagina

---

# END OF PROJECTLOG.md

---

## Sessie 02b — 20-06-2026 (vervolg)
**Onderwerp:** Architectuurbeslissingen route creator, print-functie, foto-opslag, login-strategie
**Status:** Beslissingen vastgelegd, taken toegevoegd aan backlog. Geen code gebouwd.

### Beslissingen

| Onderwerp | Beslissing |
|-----------|-----------|
| **Foto-opslag** | Cloudinary gratis tier (25GB opslag, 25GB bandbreedte/maand, automatische WebP). Beter dan Supabase Storage (1GB) voor media. pCloud afgevallen — geen directe img-links. |
| **Login creator** | Uitgesteld naar T6-001 (Supabase auth). In MVP geen login op creator. |
| **Interactieve kaart** | Opent in apart tabblad via "Bekijk kaart" knop. Routepagina zelf blijft A4-clean. |
| **Print-functie** | `@media print` CSS. Browser-native "Bewaar als PDF". Geen externe PDF-library. Kaart vervangen door statische afbeelding bij afdrukken. Actieve links blijven werken in PDF. |
| **WYSIWYG** | Routepagina ziet er op scherm hetzelfde uit als bij afdrukken — A4-breedte alleen actief bij `@media print`. |
| **Print publiek** | Print-knop wordt publiek toegankelijk zodat wandelaars pagina kunnen gebruiken voor planning, vervoer, navigatie. |
| **Navbar** | Definitief verwijderd. Topbar doet het navigatiewerk. |
| **Hosting** | Blijft GitHub Pages. Netlify uitgesteld (niet nodig zonder login in MVP). |

### Nieuwe taken toegevoegd aan backlog

| ID | Omschrijving |
|----|-------------|
| T0-007 | Cloudinary integratie |
| T1-006 | Route creator (`creator.html`) |
| T1-007 | Route kaartpagina (apart tabblad) |
| T2-006 | Statische kaartafbeelding voor print |
| T7-001 | Print CSS routepagina |
| T7-002 | Print knop publiek |
| T7-003 | Planningsinformatie op routepagina |
| TD-006 | Favicon toevoegen aan alle pagina's |

---

# END OF PROJECTLOG.md

---

## Sessie 02c — 20-06-2026 (vervolg)
**Onderwerp:** AI-integratie in route creator + GPX interpretatie + weerdata
**Status:** Beslissingen vastgelegd, taken toegevoegd aan backlog.

### Beslissingen

| Onderwerp | Beslissing |
|-----------|-----------|
| **AI in creator** | Anthropic API — verhaal, tips, samenvatting, captions, vertaling genereren op basis van GPX + weerdata + steekwoorden |
| **API-key** | Gebruiker voert key in bij openen creator, wordt niet opgeslagen |
| **Modi creator** | Handmatig (geen AI) of AI-assisted (AI stelt voor, gebruiker past aan) |
| **GPX interpretatie** | Client-side parser berekent: afstand, duur, hoogtemeters, snelheid, steilste stukken, rustpunten, hoogste/laagste punt |
| **Weerdata** | Open-Meteo API — historische data op basis van datum + coördinaten. Gratis, geen key. |
| **Locatienaam** | Nominatim (OSM) — automatisch uit GPX-coördinaten. Gratis, geen key. |
| **JSON schema** | Uitgebreid met `gpx_stats` en `weather` velden |

### Nieuwe taken toegevoegd

| ID | Omschrijving |
|----|-------------|
| T0-008 | API integraties (Open-Meteo, Nominatim, Anthropic) |
| T3-006 | Weer-blok op routepagina |
| T1-006 | Route creator uitgebreid met AI + GPX + weer |

---

# END OF PROJECTLOG.md
