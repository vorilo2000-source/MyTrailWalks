# MyTrailWalks — PROJECTLOG.md
## Bijgewerkt: 18-06-2026
> Versie: v1.0.0 · Projectlog — chronologisch overzicht van sessies en wijzigingen

---

# ======================= ENTRIES =======================

---

## Sessie 01 — 18-06-2026
**Onderwerp:** T0-005 (i18next systeem) + T0-002 (routes.json schema) + T1-001 (homepage grid) + component-fragmenten (topbar/navbar/footer)
**Status aan einde sessie:** T0-005 ✅ Done · T0-002 ✅ Done · T1-001 🔄 Gedeeltelijk (grid gebouwd, fetch-injectie componenten volgt in T0-006)

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/i18n.js` | v1.1.0 | Nieuwe wrapper rond i18next: init, loadNamespace, t(), applyTranslations(), loadScript(), changeLanguage(), buildLanguageSwitcher(). Vervangt oude handgeschreven i18n-loader uit app.js (TrailStories-era). |
| `data/i18n/nl/common.json` | v1.0.0 | Gedeelde NL UI-teksten: navigatie, footer, route-stat-labels, moeilijkheidsgraden, a11y-labels. |
| `data/i18n/nl/home.json` | v1.0.0 | Homepage-specifieke NL UI-teksten: paginatitel, intro-zin, grid-sectiekop, status-berichten (laden/leeg/fout). |
| `data/i18n/en/common.json` | v1.0.0 | Engelse fallback voor common namespace. Structuur identiek aan NL-variant (vereist voor i18next fallback-mechanisme). |
| `data/i18n/en/home.json` | v1.0.0 | Engelse fallback voor home namespace. |
| `data/routes.json` | v2.0.0 | Schema bijgewerkt: `language`-veld toegevoegd (verplicht conform CLAUDE.md), `detail_json` hernoemd naar `content_json`, pad gecorrigeerd naar `data/content/ninglinspo.json`. |
| `index.html` | v1.1.0 | Homepage grid: CDN-scripts i18next, component-placeholders (topbar/navbar/footer), page-header met data-i18n, routes-grid container. CSS-links toegevoegd in v1.1.0. |
| `css/home.css` | v1.0.0 | Grid-layout (mobile-first: 1→2→3 kolommen), tile-component, sticky nav-spacing via CSS-variabelen (--topbar-height / --navbar-height). |
| `js/home.js` | v1.0.0 | Homepage init: i18next init + vertalingen toepassen + routes.json laden + grid renderen via createElement (geen innerHTML). |
| `components/topbar.html` | v1.0.0 | Topbar fragment: auth-slot placeholder links, merknaam midden, taalwisselaar rechts. |
| `css/topbar.css` | v1.0.0 | Topbar stijlen: sticky top:0, --topbar-height: 44px, lichte achtergrond (cream). |
| `components/navbar.html` | v1.0.0 | Navbar fragment: logo links, drie directe links (Home/Wandelingen/Over), hamburger knop mobile. Geen dropdowns in MVP. |
| `css/navbar.css` | v1.0.0 | Navbar stijlen: sticky top:var(--topbar-height), forest achtergrond, --navbar-height: 60px, mobile hamburger animatie. |
| `components/footer.html` | v1.0.0 | Footer fragment: logo links, copyright + placeholder-links (disclaimer/privacy/terms) midden. Gebaseerd op MyFamTreeCollab footer v1.6, bewust aangepast (geen Ko-fi, geen inline styles, MyTrailWalks branding). |
| `css/footer.css` | v1.0.0 | Footer stijlen: forest-dark achtergrond, flex-layout logo + center. |

### Architectuurbeslissingen vastgelegd deze sessie

- **T0-005 herzien naar i18next** — `js/i18n.js` is volledig nieuw gebouwd als wrapper rond i18next (vervangt de handgeschreven loader uit de TrailStories-era `app.js`). De oude `app.js` is nog niet bijgewerkt — dat is een openstaand punt voor de volgende sessie.
- **`mtw_` localStorage prefix** — taalvoorkeur wordt opgeslagen als `mtw_language` (prefix `mtw_` i.p.v. de verouderde `ts_` uit CLAUDE.md tabel — tabel moet bijgewerkt worden).
- **Navbar: geen dropdowns in MVP** — bewuste keuze op basis van projectomvang. CSS-klassen zijn uitbreidbaar naar dropdown-structuur zonder herontwerp.
- **Component-fragmenten als losse bestanden** — topbar/navbar/footer zijn aangeleverd als fragmenten. Fetch-injectie + hamburger-JS + buildLanguageSwitcher()-aanroep volgen in T0-006.
- **CSS-variabelen voor sticky nav-spacing** — `--topbar-height: 44px` en `--navbar-height: 60px` staan in respectievelijk `topbar.css` en `navbar.css`. `home.css` gebruikt `calc(var(--nav-total-height) + var(--space-xl))` voor `main-content padding-top`. T0-006 hoeft `home.css` niet aan te raken.

### Openstaande punten na deze sessie

- `js/app.js` is nog de oude TrailStories-versie — moet herzien worden naar i18next-architectuur (aanroep van `i18nModule.init()` i.p.v. eigen loader). Aanbeveling: oppakken als eerste stap in volgende sessie vóór T0-006.
- `data/content/ninglinspo.json` bestaat nog niet — aanmaken als T1-005.
- Logo-pad in navbar/footer (`assets/images/Logo1.png`) werkt vanuit root maar niet vanuit `routes/` submappen — T0-006 lost dit op via base-pad helper of absolute paden.
- CLAUDE.md localStorage-prefixtabel vermeldt nog `ts_*` — bijwerken naar `mtw_*`.

---

# END OF PROJECTLOG.md
