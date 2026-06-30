# MyTrailWalks — PROJECTLOG.md
## Bijgewerkt: 29-06-2026 (patch-sessie)
> Versie: v1.7.0 · Projectlog — chronologisch overzicht van sessies en wijzigingen

---

# ======================= ENTRIES =======================

---

## Sessie 01 — 18-06-2026
**Onderwerp:** T0-005 (i18next systeem) + T0-002 (routes.json schema) + T1-001 (homepage grid) + component-fragmenten (topbar/navbar/footer)
**Status aan einde sessie:** T0-005 ✅ Done · T0-002 ✅ Done · T1-001 🔄 Gedeeltelijk

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/i18n.js` | v1.1.0 | Nieuwe wrapper rond i18next. |
| `data/i18n/nl/common.json` | v1.0.0 | Gedeelde NL UI-teksten. |
| `data/i18n/nl/home.json` | v1.0.0 | Homepage-specifieke NL UI-teksten. |
| `data/i18n/en/common.json` | v1.0.0 | Engelse fallback voor common namespace. |
| `data/i18n/en/home.json` | v1.0.0 | Engelse fallback voor home namespace. |
| `data/routes.json` | v2.0.0 | Schema bijgewerkt. |
| `index.html` | v1.1.0 | Homepage grid. |
| `css/home.css` | v1.0.0 | Grid-layout. |
| `js/home.js` | v1.0.0 | Homepage init. |
| `components/topbar.html` | v1.0.0 | Topbar fragment. |
| `css/topbar.css` | v1.0.0 | Topbar stijlen. |
| `components/footer.html` | v1.0.0 | Footer fragment. |
| `css/footer.css` | v1.0.0 | Footer stijlen. |

---

## Sessie 02 — 20-06-2026
**Onderwerp:** UI/UX redesign homepage — hero sectie, component-injectie, topbar zichtbaar, i18n keys, favicon, logo
**Status aan einde sessie:** T0-006 ✅ Done · T0-005 ✅ Done (v1.2.0) · T1-001 ✅ Done · TD-004 ✅ Done · TD-005 ✅ Done

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `index.html` | v2.1.0 | Hero sectie toegevoegd. |
| `css/home.css` | v2.1.0 | Hero styling. |
| `js/app.js` | v2.1.0 | fetch+injectie topbar + footer via `window.appReady`. |
| `js/home.js` | v2.0.0 | Wacht op `window.appReady`. |
| `js/i18n.js` | v1.2.0 | `loadPath` dynamisch via `getBasePath()`. |
| `data/i18n/nl/home.json` | v2.0.0 | Hero keys toegevoegd. |
| `data/i18n/en/home.json` | v2.0.0 | Hero keys toegevoegd. |
| `components/topbar.html` | v1.1.0 | Logo toegevoegd. |
| `css/topbar.css` | v1.1.0 | Logo stijlen. |

---

## Sessie 02b/c/d — 20-06-2026
**Onderwerp:** Architectuurbeslissingen route creator, print, foto-opslag, login, AI, GPX, draft/published workflow
**Status:** Beslissingen vastgelegd, taken toegevoegd aan backlog. Geen code gebouwd.

---

## Sessie 03 — 21-06-2026
**Onderwerp:** Route creator + Supabase auth + topbar login + getBasePath fix
**Status aan einde sessie:** T1-006 ✅ Done · T6-001 ✅ Done · T0-008 ✅ Done · T2-002 ✅ Done · T0-005 ✅ Done (v1.3.0) · T0-006 ✅ Done (v2.2.0)

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `creator.html` | v1.0.1 | Route creator pagina. 6 stappen. Live JSON preview. AI-modus toggle. |
| `css/creator.css` | v1.0.0 | Creator styling. |
| `js/creator.js` | v1.0.0 | GPX parser, Nominatim, Open-Meteo, AI, JSON export. |
| `js/auth.js` | v1.0.0 | Supabase auth module. |
| `js/topbar-auth.js` | v1.0.0 | Login modal + admin dropdown. |
| `components/topbar.html` | v2.0.0 | 3-koloms layout: auth + logo + taal. |
| `css/topbar.css` | v2.0.0 | 3-koloms grid. |
| `js/app.js` | v2.2.0 | getBasePath() fix voor .html segmenten. |
| `index.html` | v2.4.0 | Scripts onderaan body. Supabase SDK toegevoegd. |

---

## Sessie 04 — 22-06-2026
**Onderwerp:** Supabase live testen + auth i18n + analytics + rollen + robuuste init-volgorde
**Status aan einde sessie:** T6-001 ✅ Volledig live · T0-009 ✅ Done · TD-007 ✅ Done · TD-008 ✅ Done

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/auth.js` | v1.1.0 | role i.p.v. is_admin, window._supabase, redirectTo fix |
| `js/analytics.js` | v1.1.0 | Supabase pageview tracking met retry loop |
| `js/topbar-auth.js` | v2.1.0 | i18n via _updateModalTexts(), wacht op appReady |
| `js/app.js` | v3.0.0 | Centrale i18n init, window.i18nReady + window.appReady |
| `js/home.js` | v2.2.0 | Geen eigen i18n init meer |
| `js/creator.js` | v1.2.0 | Geen eigen i18n init meer |
| `components/topbar.html` | v2.2.0 | Fallback inlogknop terug voor laadmoment |
| `css/topbar.css` | v2.1.0 | position: relative op topbar__auth |
| `data/i18n/nl/auth.json` | v1.0.0 | Auth modal teksten NL |
| `data/i18n/en/auth.json` | v1.0.0 | Auth modal teksten EN |

---

## Sessie 05 — 25-06-2026
**Onderwerp:** Cloudinary opzetten + creator uitbreiden + route detail pagina + wandelingen overzicht + bestandsstructuur
**Status aan einde sessie:** T0-007 ✅ Done · T1-002 ✅ Done · T1-004 ✅ Done · T1-005 ✅ Done · T1-009 ✅ Done · T2-001 ✅ Done · T2-003 🔄 Gedeeltelijk

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `creator.html` | v2.0.0 | Visuele preview, blokken-editor, JSON import, vervoersmiddel, galerij |
| `css/creator.css` | v2.0.0 | Blokken-editor, visuele preview, transport checkboxes |
| `js/creator.js` | v2.1.0 | Alle uitbreidingen, Leaflet, SAC-schaal, auto Cloudinary fix |
| `routes/route.html` | v1.0.0 | Route detail pagina |
| `css/route.css` | v1.0.0 | Route detail styling |
| `js/route.js` | v1.1.0 | Route detail logica + i18n |
| `wandelingen.html` | v1.0.0 | Wandelingen overzicht |
| `css/wandelingen.css` | v1.0.0 | Wandelingen overzicht styling |
| `js/wandelingen.js` | v1.1.0 | Wandelingen overzicht logica + i18n |
| `index.html` | v2.5.0 | Top 3 routes + "Alle wandelingen →" link |
| `css/home.css` | v2.2.0 | routes-section__header |
| `js/home.js` | v2.3.0 | Max 3 routes, sortering op datum, route detail links |
| `routes/routes.json` | v2.1.0 | Gecorrigeerde route entries |
| `data/docs/cloudinary-workflow.md` | v1.0.0 | Cloudinary upload workflow documentatie |
| `data/i18n/nl/creator.json` | v1.0.0 | Creator i18n NL |
| `data/i18n/en/creator.json` | v1.0.0 | Creator i18n EN |
| `data/i18n/nl/route.json` | v1.0.0 | Route i18n NL |
| `data/i18n/en/route.json` | v1.0.0 | Route i18n EN |
| `data/i18n/nl/wandelingen.json` | v1.0.0 | Wandelingen i18n NL |
| `data/i18n/en/wandelingen.json` | v1.0.0 | Wandelingen i18n EN |

---

## Sessie 06 — 28-06-2026
**Onderwerp:** Routes index systeem · Route detail lay-out redesign · Filters wandelingen · Creator uitbreidingen · Standaard template · Footer i18n bug

**Status aan einde sessie:**
- T1-001 ✅ Done (v2.4.0) — draft/final badge, alle tiles klikbaar
- T1-002 ✅ Done (v2.0.0) — nieuwe 2-koloms lay-out
- T1-003 ✅ Done — routes-index.json systeem
- T1-008 ✅ Done — draft management
- T1-009 ✅ Done (v1.3.0) — filters toegevoegd
- T2-003 ✅ Done — track_points in route detail kaart
- T3-002 ✅ Done — foto's rechts, tekst links in route detail
- T3-003 ✅ Done — slideshow galerij
- T3-007 ✅ Done — bronvermelding
- T4-001 ✅ Done — filters moeilijkheid/land/regio/plaats
- T7-001 🔄 Gedeeltelijk — galerij verborgen bij print
- T0-010 ✅ Done — construction.html standaard template
- TD-011 ✅ Done — absolute paden in alle HTML
- TD-012 🔴 Open — footer i18n bug onopgelost

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/app.js` | v3.3.0 | common namespace + getPageNamespace uitgebreid + applyTranslations per component + setTimeout fallback |
| `js/home.js` | v2.4.0 | routes-index.json + draft/final badge + alle tiles klikbaar |
| `js/wandelingen.js` | v1.3.0 | routes-index.json + filters (moeilijkheid, land, regio, plaats) |
| `js/route.js` | v2.0.0 | 2-koloms lay-out + slideshow + bronvermelding + status badge + track_points polyline |
| `js/creator.js` | v2.2.0 | country/region/place via Nominatim + track_points bij JSON import |
| `css/route.css` | v2.0.0 | 2-koloms lay-out + slideshow + print CSS |
| `css/wandelingen.css` | v1.1.0 | Filter balk CSS |
| `routes/route.html` | v2.0.0 | Nieuwe lay-out + absolute paden |
| `wandelingen.html` | v1.1.0 | Filter balk toegevoegd + absolute paden |
| `components/topbar.html` | v2.3.0 | Absolute paden voor logo en home link |
| `components/footer.html` | v1.1.0 | Absolute paden voor logo en links |
| `construction.html` | v1.1.0 | Standaard template + i18n data-attributen |
| `data/i18n/nl/common.json` | v1.1.0 | construction vertalingen toegevoegd |
| `data/i18n/en/common.json` | v1.1.0 | construction vertalingen toegevoegd |
| `routes/routes-index.json` | v1.0.0 | Vervangt routes.json als index |
| `creator.html` (snippet) | — | Stap 2: land/regio/plaats velden. Stap 3: regio veld verwijderd |

### Architectuurbeslissingen sessie 06

| Onderwerp | Beslissing |
|-----------|-----------|
| **Routes index** | `routes-index.json` vervangt `routes.json`. Array van IDs. Manueel beheerd. |
| **Paden** | Alle HTML bestanden gebruiken absolute paden `/MyTrailWalks/...` |
| **Categorieën** | Dagtrips + Trails als nieuwe categorieën. Zelfde JSON structuur als wandelingen. |
| **Meerdere GPX** | `segments` array in JSON voor meerdere vervoerstypes. Toekomstige implementatie. |
| **Foto verdeling** | Tekst/link blokken links, foto blokken altijd rechts in route detail |
| **country/region/place** | Aparte velden in JSON via Nominatim. Basis voor filters. |
| **Standaard template** | `construction.html` als basis voor nieuwe pagina's |

### Openstaande punten na sessie 06
- Footer i18n bug (TD-012) — onopgelost
- Route kaartpagina (T1-007)
- Hoogteprofiel (T2-004)
- Meerdere GPX segmenten (T2-007)
- Dagtrips categorie (T1-010)
- Trails categorie (T1-011)
- Print CSS volledig (T7-001)

---

## Patch 29-06-2026 (tussensessie)
**Onderwerp:** creator.js GPX verbeteringen — raw export/import + GPS-ruis filtering

**Status:**
- T1-006 ✅ Uitgebreid — gpx_raw embed + GPS-ruis filtering
- T2-002 ✅ Uitgebreid — GPS-ruis filtering in parseGpx()
- T2-005 ✅ Uitgebreid — gpx_raw opgeslagen bij upload

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/creator.js` | v2.2.0 | GPX raw embed in JSON export + herstel bij import + GPS-ruis filtering |

### Wijzigingen in detail

**gpx_raw export/import:**
- JSON export bevat nu `gpx_raw`: volledige GPX-tekst als string
- JSON import: `gpx_raw` aanwezig → GPX volledig hersteld via `parseGpx()`, trackpunten en kaart actief
- Zonder `gpx_raw` (oudere exports): fallback naar `gpx_stats` read-only — achterwaarts compatibel
- Status toont `✓ Uit JSON (GPX aanwezig)` vs `✓ Uit JSON`

**GPS-ruis filtering in parseGpx() (stille filters):**
- Hoogte: eleDiff < ±2m genegeerd → Kalmthout: was +423m/-432m, correct ~46m/~41m
- Snelheid: eerste 10 trackpunten overgeslagen (GPS koude-start) → was 37.8 km/u, correct ~8 km/u max

**Snelheidswaarschuwing (bij twijfel):**
- Pieken ≥ 3× gemiddelde gedetecteerd na koude-start skip
- Gele niet-blokkerende waarschuwing onder GPX-stats
- Knoppen: "Negeren" (gefilterde waarde) of "Toch bewaren" (ruwe waarde)
- Puur statistisch — geen koppeling aan vervoersmiddel

### Architectuurbeslissingen patch 29-06-2026

| Onderwerp | Beslissing |
|-----------|-----------|
| **gpx_raw** | Volledige GPX-tekst als string in JSON export. Veld `gpx_raw` in route JSON. |
| **GPS filtering** | Drempel 2m voor hoogte. Koude-start skip 10 punten. Pieken ≥ 3× gemiddelde → waarschuwing. |
| **Vervoersmiddel** | Geen drempelwaarden per vervoersmiddel — puur statistisch filteren. |

---

## Patch 29-06-2026 (vervolg) — Meerdere segmenten + moeilijkheidsschaal per vervoersmiddel

**Onderwerp:** creator.js segmenten-systeem (T2-007) + hike/trail vervoersmiddel + moeilijkheidsschaal per vervoersmiddel (T2-008) + route.js kaart-uitbreiding

**Status:**
- T2-007 ✅ Done — meerdere GPX segmenten, vervroegd afgerond t.o.v. sessie 07 planning
- T2-008 ✅ Done (nieuw item) — moeilijkheidsschaal per vervoersmiddel
- T1-002 ✅ Uitgebreid — route.js kaart toont alle segmenten met kleurcode
- T1-006 ✅ Uitgebreid — creator.js volledig herbouwd rond segmenten

### Aangeleverde bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/creator.js` | v2.3.0 → v2.4.0 | Segmenten-systeem + hike/trail + moeilijkheidsschaal per vervoersmiddel |
| `creator.html` | v2.1.0 | Segmenten-sectie vervangt GPX/datum-stappen, stappen hernummerd |
| `js/route.js` | v2.1.0 | Kaart toont alle segmenten met kleurcode per vervoersmiddel |
| `routes/route.html` | v2.0.0 | Cache-busting bijgewerkt naar route.js v2.1.0 |

### Wijzigingen in detail

**Segmenten-systeem (creator.js v2.3.0):**
- `state.segments` array vervangt de enkelvoudige GPX/datum/weer state
- Elk segment: eigen vervoersmiddel (dropdown, één keuze), GPX upload, datum, locatie/land/regio/plaats, weerdata
- "+ Segment toevoegen" knop voegt identiek blok toe; vanaf segment 2 verwijderbaar
- Export: nieuw veld `segments`, root-level velden (`gpx_stats`, `gpx_raw`, `weather`, `location`, `transport`) blijven gevuld vanuit eerste segment — achterwaartse compatibiliteit met route.js
- Import: herkent zowel `segments` array (nieuw) als losse root-velden (legacy, wordt als één segment ingeladen)

**Hike/Trail vervoersmiddel + moeilijkheidsschaal per vervoersmiddel (creator.js v2.4.0):**
- Nieuw vervoersmiddel "Hike / Trail" naast "Wandelen", met eigen kleur
- SAC T1-T6 schaal verschoven van algemeen "Walking" naar specifiek "Hike/Trail" (bergwandelen)
- Walking krijgt eigen vlakke schaal W1-W3 (stijging per km, geen SAC)
- Cycling (C1-C4), Motorcycle (M1-M4), Car (A1-A4): automatisch berekend uit klimintensiteit (m/km) + bochtigheid (scherpe bochten/km, via bearing-berekening op trackpunten)
- Handmatige "kasseien/onverhard" checkbox voor motorcycle/car — tilt resultaat minimaal naar niveau 2
- Train/Bus/Boat/Plane: geen schaal
- Per-segment dropdown, automatische berekening overschrijfbaar; bij vervoerswissel of nieuwe GPX wordt herberekend tenzij gebruiker al handmatig koos

**Route detail kaart (route.js v2.1.0):**
- `renderMap()` herschreven: checkt eerst op `route.segments`, tekent per segment een polyline in de vervoersmiddel-kleur met popup-label
- Fallback op oude enkelvoudige `gpx_stats`-tekening voor routes zonder `segments` array
- `TRANSPORT_COLORS`/`TRANSPORT_LABELS` gedupliceerd in route.js, identiek aan creator.js, voor consistente kleuren tussen creator-preview en gepubliceerde pagina

**Bijgevangen fout:** `hike` ontbrak aanvankelijk in `TRANSPORT_COLORS` (wel in labels/schalen) — gecorrigeerd in beide bestanden.

### Architectuurbeslissingen patch 29-06-2026 (vervolg)

| Onderwerp | Beslissing |
|-----------|-----------|
| **Segmenten** | Eén vervoersmiddel per segment, geen checkboxlijst meer. Herhaalbaar via "+ Segment toevoegen". |
| **Achterwaartse compatibiliteit** | Root-level GPX/weer/locatie-velden blijven bestaan, gevuld vanuit eerste segment — route.js hoeft niet alles tegelijk aangepast te worden. |
| **SAC-schaal scope** | SAC T1-T6 is specifiek voor bergwandelen (Hike/Trail), niet voor vlakke wandelingen (Walking, eigen W1-W3 schaal). |
| **Wegvoertuig-moeilijkheid** | Klimintensiteit + bochtigheid uit GPX, geen afstand. Wegdektype (kasseien) niet uit GPX afleidbaar — handmatige checkbox als override. |
| **Kaart-kleurcode** | Vaste kleur per vervoersmiddel, gedeeld tussen creator en route detail pagina voor consistentie. |

---

# END OF PROJECTLOG.md
