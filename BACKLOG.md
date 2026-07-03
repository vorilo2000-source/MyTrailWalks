# MyTrailWalks — BACKLOG.md
## Bijgewerkt: 03-07-2026 (sessie 07)
> Versie: v3.3.0 · MVP backlog structure

---

# [BACKLOG]

---

## Fase 0 — Concept & architectuur
Zie vorige versie — geen wijzigingen deze sessie.

---

## Fase 1 — Core MVP (routesysteem)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T1-002 | routes | Route detail page | `routes/route.html` v2.1.0 + `js/route.js` v2.4.0 + `css/route.css` v2.1.0. Segmenten-sectie met vervoer + label in gekleurde header. **Sessie 07:** vervoerslabel `hike` hernoemd van "🥾 Hike / Trail" naar "🥾 Adventure" (interne sleutel `hike` ongewijzigd — bestaande route-JSON's blijven werken). | Feature | 🔴 High | ✅ Done — sessie 06 + patches 29-06 + patch 02-07 + sessie 07. |
| T1-009 | routes | Wandelingen overzicht | `wandelingen.html` + `js/wandelingen.js` v1.3.0 + `css/wandelingen.css` v1.1.0. | Feature | 🔴 High | ✅ Done — sessie 06. |
| T1-010 | routes | Categorieën: Dagtrips | `dagtrips.html` v1.0.0 + `js/dagtrips.js` v1.0.0 + `css/dagtrips.css` v1.0.0 + `dagtrips/dagtrips-index.json`. Identiek qua opbouw/logica aan wandelingen. Homepage-sectie toegevoegd. Route detail hergebruikt `routes/route.html`/`route.js` ongewijzigd (identiek JSON-schema). | Feature | 🔴 High | ✅ Done — sessie 07. |
| T1-011 | routes | Categorieën: Adventure | Was gepland als "Trails", **hernoemd naar "Adventure"** op vraag van gebruiker. `adventure.html` v1.0.0 + `js/adventure.js` v1.0.0 + `css/adventure.css` v1.0.0 + `adventure/adventure-index.json`. Identiek qua opbouw/logica aan wandelingen/dagtrips. Homepage-sectie toegevoegd. Route detail hergebruikt `routes/route.html`/`route.js` ongewijzigd. | Feature | 🔴 High | ✅ Done — sessie 07. |
| T1-012 | routes, ui | Homepage 3 categorieën | `index.html` v2.7.0: drie secties (Wandelingen, Dagtrips, Adventure) met elk top-3 tiles. `js/home.js` v2.6.0: `loadRoutes()` veralgemeend tot generieke `loadItems(indexPath, folder)`, hergebruikt voor alle drie categorieën. Elke categorie laadt onafhankelijk (mislukte fetch blokkeert de andere niet). | Feature | 🔴 High | ✅ Done — sessie 07 (nieuw item, niet in oorspronkelijke backlog). |

---

## Fase 2 t.e.m. Fase 9 — geen wijzigingen deze sessie
Zie vorige versie van dit document.

---

## TECHNISCHE SCHULD

| ID | Tags | Taak | Omschrijving | Type | Status |
|----|------|------|--------------|------|--------|
| TD-012 | bug | Footer i18n bug | Op route.html en wandelingen.html toonde footer `© common.footer.copyright` i.p.v. `© MyTrailWalks`. | Bug | ✅ Done — opgelost vóór sessie 07 (bevestigd door gebruiker, oorzaak/fix niet gedocumenteerd in deze sessie — bij volgende patch de details toevoegen indien nog bekend). |
| TD-013 | cleanup | Dubbele stats/weer/vervoer-UI | Route detail pagina toonde stats/weer/vervoer zowel los bovenaan als per segment. Los blok verwijderd. | Tech Debt | ✅ Done — patch 02-07-2026. |
| TD-014 | cleanup | Creator categorie-selector ontbreekt | Route creator (`creator.html`/`js/creator.js`) heeft geen categorie-veld bij export. Elk JSON-bestand moet **handmatig** in de juiste map (`routes/`, `dagtrips/`, `adventure/`) geplaatst worden én het ID moet **handmatig** toegevoegd worden aan de juiste index (`routes-index.json`, `dagtrips-index.json`, `adventure-index.json`). Er is geen backend/Git-API — dit blijft een handmatige stap zolang de site statisch is (GitHub Pages). Mogelijke verbetering: bij export toont de creator de exacte regel + doelmap, klaar om te copy-pasten (nog niet gebouwd, `js/creator.js` nog niet aangeleverd voor bewerking). | Tech Debt | 🔴 Open |
| TD-015 | cleanup | Topbar-navigatie ontbreekt voor nieuwe categorieën | `components/topbar.html` nooit aangeleverd tijdens sessie 07 — geen navigatielinks naar dagtrips.html/adventure.html toegevoegd aan de topbar. Gebruikers vinden de nieuwe categorieën enkel via de homepage-secties. | Tech Debt | 🔴 Open |

---

## AANBEVOLEN VOLGORDE VOLGENDE SESSIE

1. **TD-014** — Creator categorie-selector (vereist `js/creator.js` v2.4.2 aan te leveren)
2. **TD-015** — Topbar-navigatielinks (vereist `components/topbar.html` aan te leveren)
3. **T1-007** — Route kaartpagina
4. **T2-004** — Hoogteprofiel
5. Overweeg: creator.js `TRANSPORT_LABELS` ook bijwerken naar "Adventure" (nu enkel `route.js` aangepast — creator.js nog niet gezien/gewijzigd, kans op inconsistente labels tussen creator-preview en gepubliceerde pagina)

---

## DEFINITION OF DONE

- [x] Werkt op desktop én mobile
- [x] Geen console errors
- [x] Code gedocumenteerd (inline comments)
- [x] JSON data correct geïntegreerd
- [x] UI consistent met route template
- [x] Absolute paden in HTML

---

# END OF BACKLOG.md
