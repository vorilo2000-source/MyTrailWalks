# MyTrailWalks — CLAUDE.md
## Bijgewerkt: 17-06-2026
> Versie: v2.1.0 · Project:  MyTrailWalks · Doel: regels voor Claude Code bij dit project

---

# ======================= WERKWIJZE PER SESSIE =======================

1. Analyseer user request + context
2. Check BACKLOG.md + huidige module status
3. Vraag expliciete toestemming vóór uitvoering
4. Voer exact uit wat gevraagd is (geen extra scope)
5. Stop bij ambiguïteit → vraag verduidelijking
6. Einde sessie output:
   - gewijzigde bestanden
   - PROJECTLOG.md entry
   - BACKLOG.md update
   - PROJECT.md update (indien van toepassing)

## Delivery-regels (per bestand)

- **Eén voor één leveren**: bij een taak die meerdere bestanden raakt, lever je elk bestand afzonderlijk aan. Stop na elk bestand en wacht op expliciete check/akkoord van de gebruiker vóór je doorgaat naar het volgende bestand.
- **Versie-update verplicht**: elk aangepast bestand krijgt een opgehoogd versienummer in de bestandsheader (bv. v1.0.0 → v1.1.0 bij wijzigingen, v1.0.0 → v2.0.0 bij breaking/structurele wijzigingen).
- **Blok benamingen**: gebruik consistent de sectie-stijl `# ======================= NAAM =======================` in markdown-bestanden, en duidelijke genummerde commentaarblokken in code-bestanden (zie voorbeeld in DEFINITION OF DONE).
- **Inline code uitleg verplicht**: in HTML/CSS/JS-bestanden krijgt elk logisch blok een commentaarregel die uitlegt wat het doet — niet alleen wát de code doet, maar ook waaróm (indien niet evident).

## Referentievoorbeelden uit andere projecten

Soms wordt een bestand uit een ander project (bv. MyFamTreeCollab) als voorbeeld gedeeld om een patroon te illustreren (zie `develop/standaardpagina.html`, gedeeld 17-06-2026 — bron voor i18next-architectuur en component-injectie). Dit is **inspiratie/referentie**, geen letterlijk te kopiëren code. Patronen worden bewust overgenomen (met motivatie in CLAUDE.md/PROJECT.md vastgelegd), niet klakkeloos geplakt — MyTrailWalks heeft een eigen scope (geen auth/analytics in MVP) en eigen vanilla-principes die alleen voor i18next bewust doorbroken worden.


---

# ======================= WERKWIJZE CLAUDE CODE =======================

## Computer workflow
1. Open project in VS Code
2. Claude Code voert wijzigingen direct uit
3. Test in browser
4. `git add .`
5. `git commit -m "message"`
6. `git push`

## iPad workflow
1. Edit via claude.ai
2. Download bestand
3. Replace in local repo
4. Git commit + push

---

# ======================= CODE PRINCIPES =======================

- Geen frameworks voor UI-rendering (NO React/Vue/etc.)
- **Bewuste uitzondering (vastgelegd 17-06-2026)**: i18next is toegestaan als enige externe dependency, specifiek voor het i18n-systeem. Motivatie: MyTrailWalks' visie omvat user-generated content in meerdere talen (zie PROJECT.md, Fase 6+) — een handgeschreven i18n-loader schaalt niet naar namespace-beheer, fallback-talen en taal-detectie die dit vereist. Dit is de enige toegestane library-uitzondering; alle overige UI/logica blijft vanilla.
- Geen backend in MVP
- Alles client-side
- JSON is single source of truth
- Geen inline HTML data logic
- Geen hardcoded routes in JS
- Geen hardcoded UI-tekst in HTML — alle vaste UI-tekst via i18next (zie sectie I18N & MEERTALIGHEID)

## HTML werkwijze

**Regel 1 — grote bestanden**
Alles > ±10 regels HTML-in-JS → altijd downloadbestand

**Regel 2 — verboden patterns in edits**
- geen innerHTML templates met volledige HTML structuren
- geen render-functies die markup genereren
- geen volledige page rewrites

**Regel 3 — toegelaten fixes**
- versie updates
- kleine CSS tweaks
- script imports
- één regel text change

## GPX + Maps

- GPX altijd client-side parsed
- Leaflet map altijd async load ready
- OpenStreetMap tiles only

---

# ======================= EMOJI SYSTEM (JS SAFE) =======================

Gebruik HTML entities in JS-rendered HTML:

| Emoji | Entity |
|-------|--------|
| 📍 | `&#x1F4CD;` |
| 🗺️ | `&#x1F5FA;&#xFE0F;` |
| 📸 | `&#x1F4F8;` |
| 🧭 | `&#x1F9ED;` |
| 🏕️ | `&#x1F3D5;&#xFE0F;` |
| 📊 | `&#x1F4CA;` |

---

# ======================= TAAL & STIJL =======================

- UI content: meertalig via i18n-systeem — NL is de eerste/standaardtaal, structuur is talen-uitbreidbaar
- Code: Engels
- Commentaar: technisch, minimaal maar expliciet — verplicht per logische blokken
- Clean structure > micro-optimalisatie
- Geen overbodige uitleg

---

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

Deze volgorde is een aanpassing van CLAUDE.md's eerdere algemene script-laadvolgorde-regel; voor pagina's met componenten geldt deze specifiekere keten via Promises (`.then()`), niet losse `<script>`-tags zonder samenhang.

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

## Supabase structuur (concept, post-MVP — zie BACKLOG.md Fase 6+)

```
routes
story_blocks
media
gps_tracks
users
```

---

# ======================= DEFINITION OF DONE =======================

Een taak is klaar als:

- [ ] Bestand afzonderlijk aangeleverd en akkoord ontvangen vóór het volgende bestand
- [ ] Versienummer in bestandsheader opgehoogd
- [ ] Code werkt zonder console errors
- [ ] Werkt op desktop én mobile
- [ ] Inline commentaar aanwezig per logisch blok (wat + waarom indien niet evident)
- [ ] JSON data correct geïntegreerd
- [ ] UI consistent met route template
- [ ] GPX/Map correct werkt indien relevant
- [ ] Performance getest (load time < 2s target)
- [ ] PROJECT.md geüpdatet (indien van toepassing)
- [ ] PROJECTLOG.md entry toegevoegd
- [ ] BACKLOG.md status aangepast

## Voorbeeld versie-header (code-bestanden)

```js
// =======================================================
// app.js — v1.1.0
// MyTrailWalks — i18n loader + app init
// =======================================================
```

```css
/* =======================================================
   main.css — v1.1.0
   MyTrailWalks — design system
   ======================================================= */
```

```html
<!-- =======================================================
     ninglinspo.html — v1.1.0
     MyTrailWalks — route detail template
     ======================================================= -->
```

---

# END OF CLAUDE.md
