# MyTrailWalks — PROJECT.md
## Bijgewerkt: 20-09-2026 â€” documentcanonicalisatie
> Versie: v2.1.0 · Project: MyTrailWalks · Stack: Vanilla HTML/CSS/JS + i18next (MVP, JSON-based)

---

> **CANONICAL DOCUMENTROL:** PROJECT.md is de actuele bron voor projectvisie, scope, architectuur, stack, datastructuur, projectstructuur en technische projectstandaarden. Historische wijzigingen staan in PROJECTLOG.md; actuele werkzaamheden in BACKLOG.md; AI-uitvoeringsbeleid in AI.md.
# ======================= PROJECTVISIE =======================

MyTrailWalks is een **persoonlijk visueel outdoor storytelling platform** waarin eigen wandelingen worden vastgelegd met GPS-data, foto's en een persoonlijk verhaal.

Elke wandeling wordt een digitale "trail story" met:
- GPS track (GPX)
- interactieve kaart
- foto's
- praktische info (afstand, duur, hoogtemeters, moeilijkheid)
- persoonlijk verhaal / inzichten / tips

Het systeem is **frontend-first (static web app)** en draait zonder backend in de MVP-fase. Cloud sync, accounts en community-features zijn post-MVP (zie BACKLOG.md fase 6+).

## Kernprincipes

- 🗺️ **Route-first architectuur** — alles draait rond de GPS trail
- 📸 **Visual storytelling boven tekst** — grote foto's, minimale tekst
- ⚡ **Lightweight vanilla stack** — geen frameworks (React/Vue/etc.)
- 📍 **JSON als single source of truth** — geen hardcoded routedata in JS
- 📱 **Mobile-first UX**
- 💾 **Offline-first** — basisfunctionaliteit werkt zonder internet/backend
- 🌍 **Open data** — eigen export mogelijk (JSON/GPX), geen lock-in
- 🌐 **Meertalig vanaf de basis** — UI-onderdelen vertaald via i18next (NL nu, uitbreidbaar). **Toekomstvisie (Fase 6+)**: mensen maken zelf wandelverhalen aan in hun eigen taal — dit is user-generated content, los van de ondersteunde UI-talen. Wanneer de taal van een verhaal niet voorkomt in de ondersteunde UI-talen, valt alleen de UI-laag terug op Engels; de content zelf wordt nooit vertaald of aangepast. Zie PROJECT.md, sectie I18N & MEERTALIGHEID, voor de volledige technische uitwerking.

## Databronnen (workflow van de gebruiker)

| Bron | Gebruik |
|------|---------|
| **GPX Viewer** | Registratie van de wandeling onderweg (tracking) |
| **AllTrails** ([voorbeeld: Aywaille](https://www.alltrails.com/belgium/liege/aywaille)) | Verkenning van routes, download van GPX-kaarten |
| **OpenStreetMap** ([voorbeeld](https://www.openstreetmap.org/way/581386904)) | Kaartlaag / referentie voor route-tracé |

Eerste route die wordt toegevoegd: **Ninglinspo** (data volgt later — GPX, foto's, afstand/duur/hoogtemeters nog aan te leveren, voorlopig met placeholders).

## Story-content workflow

Het schrijven van de `story`-tekst en `tips` per route gebeurt in samenwerking met AI (Claude), in de chat: de gebruiker levert ruwe input (GPX, foto's, steekwoorden/ervaringen over de wandeling) en samen wordt dit omgezet naar het juiste JSON-formaat. Dit is geen geautomatiseerde site-feature in de MVP — een AI-gedreven generatie-feature binnen de site zelf staat als mogelijke latere uitbreiding in BACKLOG.md (Fase 8, "AI route suggestions").

## Meertaligheid (i18n) — korte samenvatting

Volledige architectuur: zie DATA STRUCTUUR-sectie hieronder en PROJECT.md, sectie I18N & MEERTALIGHEID. Kern: UI-onderdelen via i18next (`data/i18n/<taal>/`), route-verhalen als user-generated content met eigen `language`-veld (`data/content/`), fallback van de UI naar Engels wanneer een verhaal-taal niet ondersteund wordt.

## Toekomstige uitbreidingen (post-MVP)

- 🤖 AI route-samenvattingen
- 📊 Analytics per route (afstand, tijd, hoogte, trends over tijd)
- ☁️ Cloud sync + accounts (post-MVP; backend/provider nog te bepalen)
- 👥 Gedeelde routes / community trails

---

# ======================= MVP FUNCTIONALITEIT =======================

## Routesysteem
- Route-overzicht (grid/tile layout)
- Individuele routepagina's (story format)
- JSON-based route data
- Dynamische rendering via JavaScript

## Route features
- GPX map visualisatie (Leaflet + OpenStreetMap tiles)
- Hoogteprofiel
- Fotogalerij (masonry layout)
- Praktische info sectie
- Persoonlijk verhaal (story blocks: tekst/foto afwisselend)
- Tips & learnings

---

# ======================= DATA STRUCTUUR =======================

## Twee gescheiden lagen: UI-vertalingen vs. route-content

- **`data/i18n/<taal>/`** — i18next-beheerde UI-vertalingen (sectiekoppen, labels, knoppen). Beperkt tot ondersteunde "standaardtalen" (nu: NL). Fallback naar Engels wanneer een route-taal niet matcht (zie de sectie I18N & MEERTALIGHEID in dit document voor de volledige regel).
- **`data/content/`** — route-verhalen zelf, user-generated, in willekeurige taal. Elk route-bestand heeft een eigen `language`-veld. Dit is **niet** i18next-beheerd en wordt nooit automatisch vertaald.

Volledige technische i18n-regels: zie PROJECT.md, sectie I18N & MEERTALIGHEID.

## Schema: `data/content/<route-id>.json` (bv. `data/content/ninglinspo.json`)

```json
{
  "id": "ninglinspo",
  "language": "nl",
  "name": "Ninglinspo",
  "region": "Aywaille, Liège, België",
  "date_walked": "",
  "distance_km": 0,
  "duration_hours": 0,
  "elevation_m": 0,
  "difficulty": "easy|medium|hard",
  "tags": ["string"],
  "source": {
    "gpx_tool": "GPX Viewer",
    "exploration": "AllTrails",
    "map_reference": "OpenStreetMap"
  },
  "media": {
    "hero": "",
    "images": [],
    "gpx": ""
  },
  "story": [
    { "type": "text", "content": "" },
    { "type": "image", "src": "", "caption": "" }
  ],
  "tips": [],
  "rating": {
    "nature": 0,
    "difficulty": 0,
    "accessibility": 0
  }
}
```

Het `language`-veld is verplicht en bepaalt — onafhankelijk van de browser- of UI-taal van de bezoeker — in welke taal dit specifieke verhaal getoond wordt (altijd ongewijzigd) en of de omringende UI terugvalt op Engels.

---

# ======================= UI STRUCTUUR ROUTEPAGINA =======================

1. Hero banner (full width foto)
2. Stats dashboard (afstand, tijd, hoogtemeters, moeilijkheid)
3. Interactive map (GPX overlay, Leaflet + OSM)
4. Story sections (tekst + foto's afwisselend)
5. Photo gallery (masonry grid)
6. Praktische info
7. Tips & waarschuwingen
8. Rating samenvatting

---

# ======================= TECH STACK =======================

- HTML5 / CSS3 / Vanilla JavaScript
- Leaflet.js (kaarten)
- OpenStreetMap (tiles)
- GPX parser (client-side)
- JSON data layer (single source of truth)
- **i18next** (+ i18next-http-backend, i18next-browser-languagedetector) — enige toegestane externe library, uitsluitend voor het i18n-systeem. Zie AI.md, sectie CODE PRINCIPES, voor de motivatie van deze uitzondering op de vanilla-aanpak.

**Hosting:** GitHub Pages (primair), later uitbreidbaar naar Netlify/Vercel

---

# ======================= PROJECT STRUCTUUR =======================

```
/MyTrailWalks
│
├── index.html
├── routes.html
├── about.html
│
├── routes/
│   ├── ninglinspo.html
│
├── data/
│   ├── routes.json
│   ├── i18n/
│   │   ├── nl/
│   │   │   ├── ninglinspo.json        (UI-namespace voor deze route-pagina)
│   │   │   └── common.json            (gedeelde UI-teksten: nav, footer, knoppen)
│   │   └── en/                        (fallback-taal)
│   │       ├── ninglinspo.json
│   │       └── common.json
│   ├── content/
│   │   ├── ninglinspo.json            (route-verhaal, user-generated, eigen taal)
│
├── components/
│   ├── topbar.html
│   ├── navbar.html
│   ├── footer.html
│
├── assets/
│   ├── images/
│   ├── videos/
│   ├── gpx/
│
├── css/
│   ├── main.css
│   ├── routes.css
│
├── js/
│   ├── app.js
│   ├── i18n.js
│   ├── routes.js
│   ├── map.js
│   ├── gpx.js
```

---

# ======================= UI/UX PRINCIPES =======================

- Mobile-first design
- Visual-first storytelling
- Grote fotografie dominant
- Scroll-based narrative (magazine feel)
- Minimale tekst per sectie
- Consistente route layout
- Snelle laadtijd (target < 2s)

---

# ======================= DESIGN DIRECTION =======================

- Outdoor magazine aesthetic
- Grote beelden, minimale UI chrome
- Natuurlijke kleuren (groen, aarde tinten, waterblauw)
- Geen clutter, geen dashboard-overload
- Focus op immersive ervaring

---

# ======================= TECHNISCHE INFORMATIE =======================

**Status:** productie-hardening uitgevoerd op 13-09-2026; actuele voortgang en deploymentstatus: zie `BACKLOG.md`.
**Broncode:** github.com/vorilo2000-source/MyTrailWalks
**Stack:** Vanilla HTML + CSS + JavaScript + i18next (enige externe dependency, zie CODE PRINCIPES in AI.md)

---

# ======================= CANONICAL TECHNISCHE ARCHITECTUUR =======================

> Deze sectie bevat technische projectarchitectuur die voorheen in AI.md stond. PROJECT.md is vanaf deze canonicalisatie de authoritative bron; AI.md verwijst hiernaar.

# ======================= I18N & MEERTALIGHEID =======================

## Architectuurkeuzes (vastgelegd 17-06-2026, herzien naar i18next op 17-06-2026)

MyTrailWalks gebruikt **i18next** voor het vertalen van vaste UI-onderdelen (navigatie, knoppen, sectiekoppen, labels). Dit is de enige toegestane externe library in het project (zie CODE PRINCIPES). Reden: de visie van MyTrailWalks omvat user-generated content waarbij mensen wandelverhalen aanmaken in hun eigen taal — dit vereist een volwaardig namespace/fallback-systeem dat een handgeschreven loader niet duurzaam kan bieden.

## Twee gescheiden lagen — UI-taal vs. content-taal

Dit onderscheid is fundamenteel en mag niet vermengd worden:

1. **UI-laag (vaste onderdelen)** — vertaald via i18next, beperkt tot de talen die het systeem actief ondersteunt ("standaardtalen"). Nu: alleen NL. Uitbreidbaar zonder herontwerp.
2. **Content-laag (route-verhalen)** — user-generated, geschreven in willekeurig welke taal de auteur gebruikt. Wordt **nooit vertaald of aangepast**. Elke route-JSON heeft een eigen `language`-veld dat vastlegt in welke taal het verhaal geschreven is (bv. `"language": "pl"`), onafhankelijk van welke UI-talen bestaan.

## Fallback-regel (kernregel, niet wijzigen zonder expliciet overleg)

Wanneer de taal van een route-verhaal (`language`-veld) **niet** voorkomt in de lijst ondersteunde UI-talen, valt **alleen de UI-laag** terug op Engels (`en`) als universele fallback. De content zelf blijft ongewijzigd getoond in de taal waarin hij geschreven is.

Voorbeeld: een route-verhaal met `"language": "it"` (Italiaans), terwijl het systeem alleen NL en EN als UI-talen kent → UI-onderdelen (menu, knoppen, sectiekoppen) tonen Engels; de Italiaanse verhaaltekst wordt onveranderd getoond.

## Namespace-conventie (i18next)

Elke pagina heeft een eigen namespace, genoemd naar de pagina/template. Keys binnen een namespace gebruiken dot-notatie voor groepering.

```
<namespace>:<key.pad>

Voorbeeld: "ninglinspo:section.story"
```

Vertaalbestanden volgen i18next's standaard structuur, per taal een eigen JSON:

```
data/
├── routes.json                        # overzicht (taal-onafhankelijke velden)
├── i18n/
│   ├── nl/
│   │   ├── ninglinspo.json             # UI-namespace voor deze route-pagina (NL)
│   │   └── common.json                 # gedeelde UI-teksten (navigatie, footer, knoppen)
│   ├── en/
│   │   ├── ninglinspo.json             # UI-namespace fallback (EN)
│   │   └── common.json
│   └── <taal>/                         # later, structuur al klaar
├── content/
│   └── ninglinspo.json                 # route-verhaal zelf — los van i18next, eigen `language`-veld
```

**Let op het onderscheid**: `data/i18n/` bevat UI-vertalingen (i18next-beheerd), `data/content/` bevat de route-verhalen (ons eigen schema, user-generated, niet door i18next aangeraakt).

## HTML conventie

```html
<!-- data-i18n attribuut met namespace:key notatie -->
<h2 data-i18n="ninglinspo:section.story"></h2>
```

## Attribuut-conventie: zichtbare tekst vs. toegankelijkheid

- **`data-i18n="namespace:key"`** — zichtbare tekst, i18next vult dit als `element.textContent` (of via `i18next.t()` + handmatige toewijzing in onze wrapper).
- **`data-i18n-aria="namespace:key"`** — toegankelijkheidstekst (aria-label), niet zichtbaar maar voorgelezen door screenreaders.

## Implementatie: js/i18n.js (wrapper) + js/app.js (init)

- **`js/i18n.js`** — wrapper-module rond i18next (vergelijkbaar met `i18nModule` uit het referentievoorbeeld `develop/standaardpagina.html`). Verantwoordelijk voor: i18next initialiseren (met `i18next-http-backend` voor het laden van JSON, `i18next-browser-languagedetector` voor taaldetectie), `loadNamespace(naam)`, `t(key)` vertaalhelper, en het toepassen van vertalingen op `[data-i18n]`/`[data-i18n-aria]` elementen.
- **`js/app.js`** — pagina-init: roept `i18nModule.init()` aan, laadt de paginaspecifieke namespace, en regelt de **fallback-regel** (checkt `language`-veld van de geladen route-content tegen ondersteunde UI-talen; stelt UI-taal op `en` indien geen match).
- **`loadScript(src)` helper** — Promise-gebaseerde scriptloader (overgenomen patroon uit het referentievoorbeeld), gebruikt om externe scripts (zoals component-fragmenten, zie volgende sectie) gegarandeerd ná elkaar te laden en race conditions te voorkomen. Verplicht voor elk script dat afhankelijkheden heeft van een eerder script.

## CDN-scripts (toegestaan, alleen voor i18next)

```html
<script src="https://cdn.jsdelivr.net/npm/i18next@23/i18next.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/i18next-http-backend@2/i18nextHttpBackend.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@7/i18nextBrowserLanguageDetector.min.js"></script>
<script src="../js/i18n.js"></script>
```

---

# ======================= COMPONENT-INJECTIE (TopBar/Navbar/Footer) =======================

Vastgelegd 17-06-2026, geïnspireerd op referentievoorbeeld `develop/standaardpagina.html` (extern project MyFamTreeCollab).

## Principe

Navigatie-onderdelen (topbar, navbar, footer) worden **niet** gedupliceerd in elke route-pagina. In plaats daarvan: een los HTML-fragment per component, dat via `fetch()` wordt opgehaald en in een placeholder-element geïnjecteerd.

```
/components/
├── topbar.html
├── navbar.html
└── footer.html
```

```html
<!-- In elke pagina: lege placeholders -->
<div id="topbar-placeholder"></div>
<div id="navbar-placeholder"></div>
<!-- ... pagina-inhoud ... -->
<div id="footer-placeholder"></div>
```

## Laadvolgorde (verplicht, voorkomt race conditions)

1. i18next + plugins (CDN) + `js/i18n.js`
2. Pagina-init start: `i18nModule.init()` → namespace laden → titel zetten
3. TopBar fragment ophalen (`fetch`) → injecteren → vertalingen toepassen op geïnjecteerde inhoud
4. `loadScript('js/topbar.js')` — wacht via Promise tot dit script volledig geladen is, vóór de volgende stap
5. Navbar fragment ophalen → injecteren
6. Footer fragment ophalen → injecteren

Deze volgorde is een aanpassing van AI.md's eerdere algemene script-laadvolgorde-regel; voor pagina's met componenten geldt deze specifiekere keten via Promises (`.then()`), niet losse `<script>`-tags zonder samenhang.

---

# ======================= TECHNISCHE STANDAARDEN =======================

## localStorage prefixes (indien lokale opslag nodig is)

| Prefix | Module |
|--------|--------|
| `ts_route_*` | routes |
| `ts_media_*` | media |
| `ts_story_*` | story blocks |
| `ts_user_*` | user data (post-MVP) |

## Story rendering pipeline (concept, vanaf Fase 3)

```js
// load route → fetch JSON → render story blocks → attach media → bind map
StoryEngine.render(routeId);
```

---

# END OF PROJECT.md
