# TrailStories — BACKLOG.md
## Bijgewerkt: 17-06-2026
> Versie: v1.2.0 · MVP backlog structure

---

# [BACKLOG]

---

## Fase 0 — Concept & architectuur

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T0-001 | architecture | Project setup | Basis projectstructuur opzetten (HTML/CSS/JS + folders data/assets/js/css) | Feature | 🔴 High | 📋 Open |
| T0-002 | architecture | JSON data model | Definitief routes.json schema implementeren | Feature | 🔴 High | 🔄 Heropend — i18n mapstructuur verwerken (`data/i18n/<taal>/<route-id>.json`) |
| T0-003 | architecture | Route template | Standaard routepagina template (hero, stats, map, story) bouwen | Feature | 🔴 High | 🔄 Heropend — hardcoded tekst vervangen door `data-i18n` attributen |
| T0-004 | architecture | Design system | Basis UI design rules (typografie, spacing, kleuren outdoor theme) | Improvement | 🟡 Medium | ✅ Done |
| T0-005 | architecture, i18n | I18n systeem | Taal-loader bouwen in app.js: detecteert/zet actieve taal, laadt bestanden uit `data/i18n/<taal>/`, vult `data-i18n` elementen. Eerste taal: NL. `data/i18n/nl/ui-strings.json` aanmaken. | Feature | 🔴 High | 📋 Open |

---

## Fase 1 — Core MVP (routesysteem)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T1-001 | routes | Homepage grid | Route-overzicht met tiles (foto + stats + titel) | Feature | 🔴 High | 📋 Open |
| T1-002 | routes | Route detail page | Dynamische routepagina rendering via JSON | Feature | 🔴 High | 📋 Open |
| T1-003 | routes | JSON loader | routes.json inladen en renderen in UI | Feature | 🔴 High | 📋 Open |
| T1-004 | routes | Routing logic | Navigatie tussen homepage en route detail pages | Feature | 🔴 High | 📋 Open |
| T1-005 | routes | Ninglinspo route entry | Eerste route toevoegen: Ninglinspo (`data/i18n/nl/ninglinspo.json`, placeholder data, later aanvullen met GPX/foto's/stats) | Feature | 🔴 High | 📋 Open |

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
| T5-001 | performance | Lazy loading | Lazy load images en media content | Improvement | 🔴 High | 📋 Open |
| T5-002 | performance | Image optimization | WebP conversion + compressie pipeline | Improvement | 🔴 High | 📋 Open |
| T5-003 | performance | Code splitting | Modulaire JS per feature (map, routes, ui) | Improvement | 🟡 Medium | 📋 Open |

---

## Fase 6 — Cloud & Accounts (post-MVP)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T6-001 | cloud | Supabase auth | Auth systeem implementeren | Feature | 🟡 Medium | 🔮 Future |
| T6-002 | cloud | Sync | Offline → cloud sync engine | Feature | 🟡 Medium | 🔮 Future |
| T6-003 | cloud | Sharing | Shareable trail links | Feature | 🟡 Medium | 🔮 Future |

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
