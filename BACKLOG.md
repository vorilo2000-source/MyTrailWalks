# MyTrailWalks — BACKLOG.md
## Bijgewerkt: 29-06-2026
> Versie: v2.9.0 · MVP backlog structure

---

# [BACKLOG]

---

## Fase 0 — Concept & architectuur

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T0-001 | architecture | Project setup | Basis projectstructuur opzetten (HTML/CSS/JS + folders data/assets/js/css) | Feature | 🔴 High | 📋 Open |
| T0-002 | architecture | JSON data model | Definitief routes.json schema implementeren | Feature | 🔴 High | ✅ Done — sessie 01 (18-06-2026). |
| T0-003 | architecture | Route template | Standaard routepagina template (hero, stats, map, story) bouwen | Feature | 🔴 High | ✅ Done — sessie 05 (25-06-2026). |
| T0-004 | architecture | Design system | Basis UI design rules (typografie, spacing, kleuren outdoor theme) | Improvement | 🟡 Medium | ✅ Done |
| T0-005 | architecture, i18n | I18next systeem | `js/i18n.js` v1.3.0: loadPath dynamisch, localStorage via `mtw_language`. getBasePath() filtert .html segmenten. | Feature | 🔴 High | ✅ Done — sessie 03 (21-06-2026). |
| T0-006 | architecture, components | Component-systeem | `js/app.js` v3.3.0: centrale i18n init + fetch+injectie topbar/footer via `window.appReady` + `window.i18nReady` Promise. applyTranslations per component na injectie. | Feature | 🔴 High | ✅ Done — sessie 04 (22-06-2026). |
| T0-007 | architecture, media | Cloudinary integratie | Cloudinary gratis tier. Cloud name: dgzlcqdcc. Upload workflow gedocumenteerd in `data/docs/cloudinary-workflow.md`. Automatische WebP via f_auto. Hero: w_1200,f_auto. Thumbnail: w_400,f_auto. Galerij: w_800,f_auto. | Feature | 🔴 High | ✅ Done — sessie 05 (25-06-2026). |
| T0-008 | architecture, api | API integraties | Drie externe APIs: Open-Meteo, Nominatim, Anthropic API. Leaflet.js via jsdelivr CDN voor kaarten. | Feature | 🔴 High | ✅ Done — sessie 03 (21-06-2026). |
| T0-009 | architecture, analytics | Analytics systeem | `js/analytics.js` v1.1.0: pageviews, sessieduur, terugkerende bezoekers via Supabase `page_views` tabel. | Feature | 🔴 High | ✅ Done — sessie 04 (22-06-2026). |
| T0-010 | architecture | Standaard pagina template | `construction.html` als basis voor pagina's onder constructie. Topbar + main + footer. i18n via common namespace. | Feature | 🔴 High | ✅ Done — sessie 06 (28-06-2026). |

---

## Fase 1 — Core MVP (routesysteem)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T1-001 | routes | Homepage grid | Route-overzicht met tiles (foto + stats + titel). Top 3 meest recente routes per categorie. Link naar wandelingen.html. | Feature | 🔴 High | ✅ Done — sessie 02 + sessie 05 + sessie 06. |
| T1-002 | routes | Route detail page | `routes/route.html` v2.0.0 + `js/route.js` v2.0.0 + `css/route.css` v2.0.0. 2-koloms lay-out: stats+kaart links/rechts, verhaal+foto's links/rechts, slideshow galerij. Bronvermelding. Status badge. | Feature | 🔴 High | ✅ Done — sessie 06 (28-06-2026). |
| T1-003 | routes | JSON loader | routes-index.json inladen en per ID de volledige JSON ophalen | Feature | 🔴 High | ✅ Done — sessie 06. |
| T1-004 | routes | Routing logic | Navigatie via `?id=` query parameter. `wandelingen.html` als overzicht. `routes/route.html` als detail. | Feature | 🔴 High | ✅ Done — sessie 05 (25-06-2026). |
| T1-005 | routes | Eerste route entry | Kalmthoutse Heide + Grenspark Kalmthout aangemaakt. JSON in `routes/`. | Feature | 🔴 High | ✅ Done — sessie 05 (25-06-2026). |
| T1-006 | routes, ui, ai | Route creator | `creator.html` v2.0.0 + `js/creator.js` v2.2.0. country/region/place via Nominatim. gpx_raw embed in JSON export + herstel bij import. GPS-ruis filtering: hoogte-drempel 2m, koude-start skip 10 punten, snelheidspieken waarschuwing ≥ 3× gemiddelde. Meerdere GPX segmenten: toekomstig. | Feature | 🔴 High | ✅ Done — sessie 06 (28-06-2026) + patch 29-06-2026. |
| T1-007 | routes, ui | Route kaartpagina | `routes/[id]-map.html`: interactieve Leaflet kaart + GPX overlay. Apart tabblad. | Feature | 🟡 Medium | 📋 Open |
| T1-008 | routes, ux | Draft management | Draft/Final badge op route tiles. Alle tiles klikbaar. | Feature | 🟡 Medium | ✅ Done — sessie 06 (28-06-2026). |
| T1-009 | routes | Wandelingen overzicht | `wandelingen.html` + `js/wandelingen.js` v1.3.0 + `css/wandelingen.css` v1.1.0. Filters: moeilijkheid, land, regio, plaats. | Feature | 🔴 High | ✅ Done — sessie 06 (28-06-2026). |
| T1-010 | routes | Categorieën: Dagtrips | `dagtrips.html` + `js/dagtrips.js` + `css/dagtrips.css`. Eigen map + index. Bezoeken aan attracties, grotten, musea, … Zelfde JSON structuur als wandelingen. | Feature | 🔴 High | 📋 Open |
| T1-011 | routes | Categorieën: Trails | `trails.html` + `js/trails.js` + `css/trails.css`. Eigen map + index. Zwaardere wandelingen, meerdere dagen mogelijk. Zelfde JSON structuur als wandelingen. | Feature | 🔴 High | 📋 Open |

---

## Fase 2 — Maps & GPX integratie

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T2-001 | maps | Leaflet setup | Leaflet.js via jsdelivr CDN. Kaart in creator preview + route detail pagina. | Feature | 🔴 High | ✅ Done — sessie 05 (25-06-2026). |
| T2-002 | maps | GPX parser | GPX bestand client-side parsen: coördinaten, tijdstempels, hoogte, snelheid. trackPoints opgeslagen voor routetekening. startLat/startLon opgeslagen in JSON export. GPS-ruis filtering toegevoegd (29-06-2026). | Feature | 🔴 High | ✅ Done — sessie 03 + sessie 05 + patch 29-06-2026. |
| T2-003 | maps | Route overlay | GPX track overlay in creator preview + route detail pagina via Leaflet polyline. track_points in gpx_stats. | Feature | 🔴 High | ✅ Done — sessie 06 (28-06-2026). |
| T2-004 | maps | Elevation profile | Hoogteprofiel genereren uit GPX data. Placeholder aanwezig in route detail lay-out. | Feature | 🟡 Medium | 📋 Open |
| T2-005 | maps | GPX upload | GPX-bestand inladen in creator. trackPoints samplen tot max 500 voor performantie. gpx_raw opgeslagen als string in JSON export. | Feature | 🟡 Medium | ✅ Done — sessie 05 + patch 29-06-2026. |
| T2-006 | maps, print | Statische kaartafbeelding | Bij afdrukken: interactieve kaart vervangen door statische kaartafbeelding. | Feature | 🟡 Medium | 📋 Open |
| T2-007 | maps | Meerdere GPX segmenten | Meerdere GPX bestanden per route, elk met eigen vervoerstype. `segments` array in JSON. Kleurcode per vervoerstype op kaart. | Feature | 🟡 Medium | 📋 Open |

---

## Fase 3 — Storytelling UI

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T3-001 | ui | Hero section | Fullscreen hero foto op route detail pagina. Gradient overlay + titel + badges + status badge. | Feature | 🔴 High | ✅ Done — sessie 06. |
| T3-002 | ui | Story blocks | Blokken-editor in creator: tekst, foto (volledig breed), fotogrid (2 of 3 kolommen), link. Vrije volgorde. Tekst/link links, foto's rechts in route detail pagina. | Feature | 🔴 High | ✅ Done — sessie 06 (28-06-2026). |
| T3-003 | ui | Galerij slideshow | Slideshow galerij onderaan route pagina met pijlen en dots. | Feature | 🟡 Medium | ✅ Done — sessie 06 (28-06-2026). |
| T3-004 | ui | Stats dashboard | Afstand, duur, stijging, daling, gem. snelheid, hoogste/laagste punt op route detail pagina. | Feature | 🔴 High | ✅ Done — sessie 05. |
| T3-005 | ui | Tips & info blocks | Tips sectie op route detail pagina. | Feature | 🟡 Medium | ✅ Done — sessie 05. |
| T3-006 | ui | Weer-blok | Weerdata op route detail pagina: temperatuur, neerslag, wind, conditie. | Feature | 🟡 Medium | ✅ Done — sessie 05. |
| T3-007 | ui | Bronvermelding | Bronvermelding sectie op route detail pagina. | Feature | 🟡 Medium | ✅ Done — sessie 06 (28-06-2026). |

---

## Fase 4 — UX & filtering

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T4-001 | ux | Filters | Filter routes op moeilijkheid, land, regio, plaats. Dropdowns boven grid. Dynamisch gevuld vanuit route JSON data. | Feature | 🟡 Medium | ✅ Done — sessie 06 (28-06-2026). |
| T4-002 | ux | Search | Zoekfunctie op routes (naam + tags) | Feature | 🟡 Medium | 📋 Open |
| T4-003 | ux | Tags system | Tag-based categorisatie (waterval, bos, berg) | Feature | 🟡 Medium | 📋 Open |
| T4-004 | ux | Route rating | Persoonlijke rating per route | Feature | 🟢 Low | 📋 Open |

---

## Fase 5 — Performance & scaling

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T5-001 | performance | Lazy loading | Lazy load images via `loading="lazy"` op alle route foto's. | Improvement | 🔴 High | ✅ Done — sessie 05. |
| T5-002 | performance | Image optimization | WebP via Cloudinary f_auto. Transformaties w_1200/w_800/w_400 per context. Auto-fix in creator bij import. | Improvement | 🔴 High | ✅ Done — sessie 05. |
| T5-003 | performance | Code splitting | Modulaire JS per feature (map, routes, ui) | Improvement | 🟡 Medium | 📋 Open |

---

## Fase 6 — Cloud & Accounts

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T6-001 | cloud | Supabase auth | Auth systeem live. profiles tabel met role (gast/creator/admin). | Feature | 🟡 Medium | ✅ Done — sessie 04 (22-06-2026). |
| T6-002 | cloud | Sync | Offline → cloud sync engine | Feature | 🟡 Medium | 🔮 Future |
| T6-003 | cloud | Sharing | Shareable trail links. Deel-knop op route detail pagina via Web Share API + clipboard fallback. | Feature | 🟡 Medium | ✅ Done — sessie 05. |
| T6-004 | i18n, community | User-generated taal-content | Wandelverhalen in eigen taal. Vereist T6-001. | Feature | 🟡 Medium | 🔮 Future |
| T6-005 | cloud, analytics | Analytics dashboard | Admin dashboard voor page_views data. | Feature | 🟡 Medium | 📋 Open |

---

## Fase 7 — Print & Publiek gebruik

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T7-001 | print, ux | Print CSS routepagina | `@media print`: galerij verborgen. Topbar/footer verbergen nog open. | Feature | 🟡 Medium | 🔄 Gedeeltelijk — sessie 06. |
| T7-002 | print, ux | Print knop | Print-knop aanwezig op route detail pagina via `window.print()`. | Feature | 🟡 Medium | ✅ Done — sessie 05. |
| T7-003 | print, ux | Planningsinformatie | Vervoer-links, parkeerinfo, startpunt-coördinaten op routepagina. | Feature | 🟢 Low | 📋 Open |

---

## Fase 8 — Community & Growth (post-MVP)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T8-001 | community | Public trails | Publieke route gallery | Feature | 🟢 Low | 🔮 Future |
| T8-002 | community | Likes | Likes/bookmarks systeem | Feature | 🟢 Low | 🔮 Future |
| T8-003 | community | Comments | Comment systeem per route | Feature | 🟢 Low | 🔮 Future |

---

## Fase 9 — Advanced Features (post-MVP)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T9-001 | ai | AI route analyse | Uitgebreide AI-analyse van GPX: vergelijking met vorige wandelingen, trends, aanbevelingen | Feature | Future | 🔮 Future |
| T9-002 | analytics | Stats dashboard | Route analytics dashboard | Feature | Future | 🔮 Future |
| T9-003 | marketplace | Community trails | Community trail marketplace | Feature | Future | 🔮 Future |

---

## TECHNISCHE SCHULD

| ID | Tags | Taak | Omschrijving | Type | Status |
|----|------|------|--------------|------|--------|
| TD-001 | cleanup | Legacy JS | Vermijden van globale variabelen in app.js | Tech Debt | 📋 Open |
| TD-002 | cleanup | DOM coupling | HTML structuur te sterk gekoppeld aan JS selectors | Tech Debt | 📋 Open |
| TD-003 | cleanup | Map logic | Leaflet logic nog niet modulair gescheiden. Creator heeft eigen initLeafletMap(). Route detail heeft eigen implementatie. | Tech Debt | 📋 Open |
| TD-004 | cleanup | app.js herzien | Herzien naar i18next-architectuur. | Tech Debt | ✅ Done — sessie 02 (20-06-2026) |
| TD-005 | cleanup | localStorage prefix | `mtw_language` geïmplementeerd in `js/i18n.js` v1.2.0. | Tech Debt | ✅ Done — sessie 02 (20-06-2026) |
| TD-006 | cleanup | Favicon toevoegen | Favicon tags toegevoegd aan alle HTML pagina's. | Tech Debt | ✅ Done — sessie 05 (25-06-2026) |
| TD-007 | cleanup | i18n init centraliseren | i18nModule.init() gecentraliseerd in app.js v3.0.0. | Tech Debt | ✅ Done — sessie 04 (22-06-2026) |
| TD-008 | cleanup | Supabase RLS policies | RLS policies correct ingesteld op profiles en page_views tabellen. | Tech Debt | ✅ Done — sessie 04 (22-06-2026) |
| TD-009 | cleanup | Bestandsstructuur routes | Route JSON bestanden verplaatst naar `routes/`. routes-index.json vervangt routes.json. | Tech Debt | ✅ Done — sessie 06 (28-06-2026) |
| TD-010 | cleanup | Route IDs | Route IDs mogen geen spaties bevatten. Gebruik koppeltekens. | Tech Debt | ✅ Done — sessie 05 (25-06-2026) |
| TD-011 | cleanup | Absolute paden | Alle HTML bestanden gebruiken absolute paden (/MyTrailWalks/...) voor scripts, CSS, afbeeldingen. | Tech Debt | ✅ Done — sessie 06 (28-06-2026) |
| TD-012 | bug | Footer i18n bug | Op route.html en wandelingen.html toont footer © common.footer.copyright i.p.v. © MyTrailWalks. Oorzaak onbekend. Meerdere fixes geprobeerd zonder succes. | Bug | 🔴 Open |

---

## OPEN BUG — Footer i18n

**TD-012** — Zie sessie 07 inbrief voor volledige analyse.

---

## AANBEVOLEN VOLGORDE SESSIE 07

1. **T1-010** — Dagtrips categorie
2. **T1-011** — Trails categorie
3. **T2-007** — Meerdere GPX segmenten
4. **TD-012** — Footer i18n bug
5. **T1-007** — Route kaartpagina
6. **T2-004** — Hoogteprofiel

---

## STANDAARD AFSPRAKEN (bijgewerkt 29-06-2026)

| Onderwerp | Afspraak |
|-----------|---------|
| **Script volgorde** | Eruda → Supabase SDK → i18next CDN → i18n.js → auth.js → topbar-auth.js → analytics.js → app.js → Leaflet (indien nodig) → [pagina].js |
| **Eruda** | Niet verwijderen uit HTML pagina's |
| **CSS** | Altijd in `<head>` |
| **Favicon** | Elke nieuwe pagina krijgt favicon tags na `<title>`, vóór CSS |
| **Cache busting** | `?v=x.x.x` aan script tags bij elke deploy |
| **Paden** | Altijd absolute paden (`/MyTrailWalks/...`) in HTML bestanden |
| **Standaard template** | `construction.html` als basis voor nieuwe pagina's |
| **Rollen** | gast / creator / admin — via `role` kolom in profiles tabel |
| **i18n namespaces** | common (altijd) + auth (altijd) + paginaspecifiek via app.js |
| **Cloudinary URL's** | Hero: w_1200,f_auto · Galerij/blokken: w_800,f_auto · Thumbnail: w_400,f_auto |
| **Routes index** | `routes/routes-index.json` — array van IDs |
| **Categorieën** | Elke categorie krijgt eigen map, index, HTML, JS, CSS |
| **JSON structuur** | `country`, `region`, `place` als aparte velden (v2.2.0) |
| **Track points** | Opgeslagen in `gpx_stats.track_points` |
| **gpx_raw** | Volledige GPX-tekst als string in JSON export (v2.2.0) |
| **Leaflet CDN** | `https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js` (geen integrity check) |

---

## DEFINITION OF DONE

- [ ] Werkt op desktop én mobile
- [ ] Geen console errors
- [ ] Code gedocumenteerd (inline comments)
- [ ] JSON data correct geïntegreerd
- [ ] UI consistent met route template
- [ ] Absolute paden in HTML

---

# END OF BACKLOG.md
