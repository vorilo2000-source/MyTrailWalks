# MyTrailWalks — BACKLOG.md
## Bijgewerkt: 04-07-2026 (sessie 08)
> Versie: v3.4.0 · MVP backlog structure

---

# [BACKLOG]

---

## Fase 0 — Concept & architectuur
Zie vorige versie — geen wijzigingen deze sessie.

---

## Fase 1 — Core MVP (routesysteem)

| ID | Tags | Taak | Omschrijving | Type | Prioriteit | Status |
|----|------|------|--------------|------|-----------|--------|
| T1-002 | routes | Route detail page | `routes/route.html` v2.1.0 + `js/route.js` v2.4.0 + `css/route.css` v2.1.0. Segmenten-sectie met vervoer + label in gekleurde header. | Feature | 🔴 High | ✅ Done — sessie 06 + patches 29-06 + patch 02-07 + sessie 07. |
| T1-009 | routes | Wandelingen overzicht | `wandelingen.html` + `js/wandelingen.js` v1.3.0 + `css/wandelingen.css` v1.1.0. | Feature | 🔴 High | ✅ Done — sessie 06. |
| T1-010 | routes | Categorieën: Dagtrips | `dagtrips.html` v1.0.0 + `js/dagtrips.js` v1.0.0 + `css/dagtrips.css` v1.0.0 + `dagtrips/dagtrips-index.json`. | Feature | 🔴 High | ✅ Done — sessie 07. |
| T1-011 | routes | Categorieën: Adventure | `adventure.html` v1.0.0 + `js/adventure.js` v1.0.0 + `css/adventure.css` v1.0.0 + `adventure/adventure-index.json`. | Feature | 🔴 High | ✅ Done — sessie 07. |
| T1-012 | routes, ui | Homepage 3 categorieën | `index.html` v2.7.0 + `js/home.js` v2.6.0, generieke `loadItems(indexPath, folder)`. | Feature | 🔴 High | ✅ Done — sessie 07. |
| T1-013 | routes, ui, navigatie | Terug-navigatie categorieën ↔ home ↔ route detail | Losse "← Terug"-links rechtstreeks in de pagina's toegevoegd (niet via `topbar.html`, zie TD-015). `wandelingen.html`, `dagtrips.html`, `adventure.html` kregen `← MyTrailWalks Home` (link naar `/MyTrailWalks/index.html`). `routes/route.html` kreeg `← Terug` via `history.back()` — werkt categorie-onafhankelijk, geen wijziging aan `route.js` nodig. | Feature | 🟡 Medium | ✅ Done — sessie 08. |
| T1-007 | routes, kaart | Route kaartpagina | `routes/[id]-map.html` — aparte fullscreen Leaflet kaartpagina per route, gelinkt vanaf `#btn-open-map` in `route.html`. Moet kleurcode-per-vervoersmiddel + segmenten-logica hergebruiken uit `route.js`. | Feature | 🟢 Optioneel | 🔴 Open — gepland sessie 09. Vereist `js/route.js` v2.4.0 aan te leveren. |
| T2-004 | routes, kaart | Hoogteprofiel | Placeholder `#route-elevation` aanwezig in `route.html`, nog niet ingevuld. | Feature | 🟢 Optioneel | 🔴 Open — gepland sessie 09. Vereist `js/route.js` v2.4.0 aan te leveren. |

---

## Fase 2 t.e.m. Fase 9 — geen wijzigingen deze sessie
Zie vorige versie van dit document.

---

## TECHNISCHE SCHULD

| ID | Tags | Taak | Omschrijving | Type | Status |
|----|------|------|--------------|------|--------|
| TD-012 | bug | Footer i18n bug | Op route.html en wandelingen.html toonde footer `© common.footer.copyright` i.p.v. `© MyTrailWalks`. | Bug | ✅ Done — opgelost vóór sessie 07. |
| TD-013 | cleanup | Dubbele stats/weer/vervoer-UI | Route detail pagina toonde stats/weer/vervoer zowel los bovenaan als per segment. Los blok verwijderd. | Tech Debt | ✅ Done — patch 02-07-2026. |
| TD-014 | cleanup | Creator categorie-selector ontbreekt | Route creator (`creator.html`/`js/creator.js`) heeft geen categorie-veld bij export; plaatsing in de juiste map + index blijft handmatig. | Tech Debt | ⚪ **Won't do — sessie 08.** Bewust besloten: geen backend/Git-API beschikbaar, dus dit blijft sowieso een handmatige stap. Gebruiker plaatst bestand + index-regel zelf; geen UI-hulp gewenst. `js/creator.js` blijft ongewijzigd. |
| TD-015 | cleanup | Topbar-navigatie ontbreekt voor nieuwe categorieën | `components/topbar.html` had geen navigatielinks naar dagtrips.html/adventure.html. | Tech Debt | ⚪ **Won't do zoals origineel gescoped — sessie 08.** `components/topbar.html` wordt niet aangepast. Vervangen door T1-013 (directe terug-links in de pagina's zelf). |
| TD-016 | bug | Creator-link 404 op route.html | In `js/topbar-auth.js`, functie `_renderTopBar()` (±regel 384), gebruikte de admin-dropdown link naar de creator een relatief pad (`href="creator.html"`). Werkte op pagina's in de root, maar gaf 404 op `routes/route.html` (submap) omdat het pad daar resolveert naar `/MyTrailWalks/routes/creator.html`. | Bug | ✅ Done — sessie 08. Fix: absoluut pad `href="/MyTrailWalks/creator.html"`. Bevestigd werkend door gebruiker. |

**Vervallen aanbeveling uit vorige backlog:** het punt "creator.js `TRANSPORT_LABELS` bijwerken naar Adventure" is **niet doorgevoerd** — bevestigd in sessie 08 dat dit bewust anders is: creator-UI toont "Hike / Trail", publieke pagina's tonen "Adventure". Geen inconsistentie, geen actie nodig.

---

## AANBEVOLEN VOLGORDE VOLGENDE SESSIE (sessie 09)

1. **T1-007** — Route kaartpagina (vereist `js/route.js` v2.4.0 aan te leveren)
2. **T2-004** — Hoogteprofiel (vereist `js/route.js` v2.4.0 aan te leveren)

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
