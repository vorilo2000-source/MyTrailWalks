# MyTrailWalks — BACKLOG.md
## Bijgewerkt: 18-06-2026
> Versie: v2.1.0 · MVP backlog structure

---

# [BACKLOG]

---

## Fase 0 — Concept & architectuur

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T0-001 | architecture | Project setup | Basis projectstructuur opzetten (HTML/CSS/JS + folders data/assets/js/css) | Feature | 🔴 High | 📋 Open |
| T0-002 | architecture | JSON data model | Definitief routes.json schema implementeren | Feature | 🔴 High | ✅ Done — `language`-veld toegevoegd, `content_json` pad gecorrigeerd naar `data/content/`, `_meta`-velden toegevoegd. Sessie 01 (18-06-2026). |
| T0-003 | architecture | Route template | Standaard routepagina template (hero, stats, map, story) bouwen | Feature | 🔴 High | 🔄 Heropend — data-i18n keys omzetten naar i18next namespace-notatie (`namespace:key`) |
| T0-004 | architecture | Design system | Basis UI design rules (typografie, spacing, kleuren outdoor theme) | Improvement | 🟡 Medium | ✅ Done |
| T0-005 | architecture, i18n | I18next systeem | `js/i18n.js` wrapper bouwen rond i18next (init, loadNamespace, t(), applyTranslations(), changeLanguage(), buildLanguageSwitcher(), loadScript()) + `data/i18n/nl/` en `data/i18n/en/` JSON-bestanden (common + home namespace). `js/app.js` nog niet herzien — openstaand punt voor volgende sessie. | Feature | 🔴 High | ✅ Done — sessie 01 (18-06-2026). Zie PROJECTLOG.md sessie 01 voor details. |
| T0-006 | architecture, components | Component-systeem | `loadScript()` Promise-helper ✅ (zit in i18n.js). Component-fragmenten ✅ (topbar/navbar/footer aangeleverd als losse HTML-bestanden). Nog open: fetch+injectie logica in app.js, hamburger-toggle JS (navbar.js), buildLanguageSwitcher()-aanroep na injectie, base-pad helper voor logo in submappen, aria-current="page" zetten op actieve nav-link. | Feature | 🔴 High | 🔄 Gedeeltelijk — fragmenten klaar, injectie-logica volgt |

---

## Fase 1 — Core MVP (routesysteem)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T1-001 | routes | Homepage grid | Route-overzicht met tiles (foto + stats + titel) | Feature | 🔴 High | 🔄 Gedeeltelijk — `index.html`, `css/home.css`, `js/home.js` aangeleverd. Grid rendert vanuit `routes.json` via i18next. Fetch-injectie componenten (topbar/navbar/footer) volgt in T0-006. Sessie 01 (18-06-2026). |
| T1-002 | routes | Route detail page | Dynamische routepagina rendering via JSON | Feature | 🔴 High | 📋 Open |
| T1-003 | routes | JSON loader | routes.json inladen en renderen in UI | Feature | 🔴 High | ✅ Done — geïmplementeerd als onderdeel van T1-001 in `js/home.js`. |
| T1-004 | routes | Routing logic | Navigatie tussen homepage en route detail pages | Feature | 🔴 High | 📋 Open |
| T1-005 | routes | Ninglinspo route entry | Eerste route toevoegen: Ninglinspo (`data/content/ninglinspo.json` incl. verplicht `language`-veld, placeholder data, later aanvullen met GPX/foto's/stats) | Feature | 🔴 High | 📋 Open |

---

## Fase 2 — Maps & GPX integratie

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T2-001 | maps | Leaflet setup | Leaflet.js integratie met OpenStreetMap tiles | Feature | 🔴 High | 📋 Open |
| T2-002 | maps | GPX parser | GPX bestand (uit GPX Viewer / AllTrails) client-side parsen en renderen | Feature | 🔴 High | 📋 Open |
| T2-003 | maps | Route overlay | GPX track overlay op interactieve kaart | Feature | 🔴 High | 📋 Open |
| T2-004 | maps | Elevation profile | Hoogteprofiel genereren uit GPX data | Feature | 🟡 Medium | 📋 Open |
| T2-005 | maps | Ninglinspo GPX | GPX-bestand Ninglinspo inladen zodra beschikbaar | Feature | 🟡 Medium | 📋 Open |

---

## Fase 3 — Storytelling UI

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T3-001 | ui | Hero section | Fullscreen hero foto per route | Feature | 🔴 High | 📋 Open |
| T3-002 | ui | Story blocks | Alternating tekst/foto storytelling layout | Feature | 🔴 High | 📋 Open |
| T3-003 | ui | Masonry gallery | Foto galerij in masonry grid layout | Feature | 🟡 Medium | 📋 Open |
| T3-004 | ui | Stats dashboard | Afstand, duur, hoogtemeters, moeilijkheid blok | Feature | 🔴 High | 📋 Open |
| T3-005 | ui | Tips & info blocks | Praktische info + tips & waarschuwingen sectie | Feature | 🟡 Medium | 📋 Open |

---

## Fase 4 — UX & filtering

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T4-001 | ux | Filters | Filter routes op moeilijkheid, afstand, regio | Feature | 🟡 Medium | 📋 Open |
| T4-002 | ux | Search | Zoekfunctie op routes (naam + tags) | Feature | 🟡 Medium | 📋 Open |
| T4-003 | ux | Tags system | Tag-based categorisatie (waterval, bos, berg) | Feature | 🟡 Medium | 📋 Open |
| T4-004 | ux | Route rating | Persoonlijke rating per route | Feature | 🟢 Low | 📋 Open |

---

## Fase 5 — Performance & scaling

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T5-001 | performance | Lazy loading | Lazy load images en media content | Improvement | 🔴 High | 🔄 Gedeeltelijk — `loading="lazy"` op tile hero-afbeeldingen in `js/home.js`. Volledige implementatie volgt. |
| T5-002 | performance | Image optimization | WebP conversion + compressie pipeline | Improvement | 🔴 High | 📋 Open |
| T5-003 | performance | Code splitting | Modulaire JS per feature (map, routes, ui) | Improvement | 🟡 Medium | 📋 Open |

---

## Fase 6 — Cloud & Accounts (post-MVP)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T6-001 | cloud | Supabase auth | Auth systeem implementeren | Feature | 🟡 Medium | 🔮 Future |
| T6-002 | cloud | Sync | Offline → cloud sync engine | Feature | 🟡 Medium | 🔮 Future |
| T6-003 | cloud | Sharing | Shareable trail links | Feature | 🟡 Medium | 🔮 Future |
| T6-004 | i18n, community | User-generated taal-content | Mensen kunnen zelf wandelverhalen aanmaken in hun eigen taal (`language`-veld vrij invulbaar, niet beperkt tot ondersteunde UI-talen). Vereist: content-invoerformulier, taal-detectie of -keuze bij aanmaken, validatie dat UI-fallback-regel (zie CLAUDE.md) correct toegepast wordt bij weergave. Vereist waarschijnlijk accounts (T6-001) als voorwaarde. | Feature | 🟡 Medium | 🔮 Future |

---

## Fase 7 — Community & Growth (post-MVP)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T7-001 | community | Public trails | Publieke route gallery | Feature | 🟢 Low | 🔮 Future |
| T7-002 | community | Likes | Likes/bookmarks systeem | Feature | 🟢 Low | 🔮 Future |
| T7-003 | community | Comments | Comment systeem per route | Feature | 🟢 Low | 🔮 Future |

---

## Fase 8 — Advanced Features (post-MVP)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T8-001 | ai | Route suggestions | AI route aanbevelingen | Feature | Future | 🔮 Future |
| T8-002 | analytics | Stats dashboard | Route analytics dashboard (afstand/tijd/hoogte trends) | Feature | Future | 🔮 Future |
| T8-003 | marketplace | Community trails | Community trail marketplace | Feature | Future | 🔮 Future |

---

## TECHNISCHE SCHULD

| ID | Tags | Taak | Omschrijving | Type | Status |
|----|------|------|--------------|------|--------|
| TD-001 | cleanup | Legacy JS | Vermijden van globale variabelen in app.js | Tech Debt | 📋 Open |
| TD-002 | cleanup | DOM coupling | HTML structuur te sterk gekoppeld aan JS selectors | Tech Debt | 📋 Open |
| TD-003 | cleanup | Map logic | Leaflet logic nog niet modulair gescheiden | Tech Debt | 📋 Open |
| TD-004 | cleanup | app.js herzien | `js/app.js` is nog de TrailStories-era versie met eigen i18n-loader. Moet herzien worden naar `i18nModule.init()` aanroep conform nieuwe i18next-architectuur. Aanbeveling: eerste stap in volgende sessie vóór T0-006. | Tech Debt | 📋 Open — toegevoegd sessie 01 (18-06-2026) |
| TD-005 | cleanup | localStorage prefix | CLAUDE.md localStorage-prefixtabel vermeldt nog `ts_*` — bijwerken naar `mtw_*` (conform `mtw_language` key in `js/i18n.js`). | Tech Debt | 📋 Open — toegevoegd sessie 01 (18-06-2026) |

---

## AANBEVOLEN VOLGORDE VOLGENDE SESSIE

Op basis van openstaande afhankelijkheden:

1. **TD-004** — `js/app.js` herzien naar i18next-architectuur
2. **T0-006** — fetch-injectie logica + hamburger-JS + buildLanguageSwitcher()-aanroep
3. **T1-005** — `data/content/ninglinspo.json` aanmaken (placeholder data)
4. **T0-003** — Route template herzien naar i18next namespace-notatie
5. **T1-002** — Route detail pagina

---

## DEFINITION OF DONE

Een taak is afgerond wanneer:

- [ ] Werkt op desktop én mobile
- [ ] Geen console errors
- [ ] Code gedocumenteerd (inline comments)
- [ ] JSON data correct geïntegreerd
- [ ] UI consistent met route template
- [ ] Performance getest (load time < 2s target)

---

## WERKWIJZE

1. Kies taak uit backlog
2. Vraag toestemming vóór uitvoering
3. Bouw feature in kleine iteraties
4. Test direct in browser
5. Update JSON + UI samen
6. Markeer taakstatus
7. Log wijziging in PROJECTLOG.md

---

# END OF BACKLOG.md
