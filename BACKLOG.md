# TrailStories — CLAUDE.md
## Bijgewerkt: 17-06-2026
> Versie: v1.1.0 · Project: TrailStories · Doel: regels voor Claude Code bij dit project

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

- Geen frameworks (NO React/Vue/etc.)
- Geen backend in MVP
- Alles client-side
- JSON is single source of truth
- Geen inline HTML data logic
- Geen hardcoded routes in JS
- Geen hardcoded UI-tekst in HTML — alle user-facing tekst via i18n-systeem (zie sectie I18N & MEERTALIGHEID)

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

## Architectuurkeuzes (vastgelegd 17-06-2026)

- **Talen**: alleen NL actief nu; structuur is klaar voor uitbreiding naar een volgende taal (nog te bepalen) zonder herontwerp.
- **Content per taal**: apart JSON-bestand per taal en per route, naamconventie `<route-id>.<taal>.json` (bv. `ninglinspo.nl.json`, later bv. `ninglinspo.en.json` — taal nog te bepalen).
- **Vaste UI-teksten** (sectiekoppen, labels, knoppen): apart van route-content, in `ui-strings.<taal>.json` (bv. `ui-strings.nl.json`).
- **Taalkeuze-mechanisme**: JS taal-switcher, geen aparte URL per taal. Zelfde HTML-bestand voor alle talen; JS bepaalt actieve taal en laadt het juiste JSON-bestand.
- **HTML bevat geen hardcoded tekst**: alle user-facing tekst-elementen krijgen een `data-i18n="key"` attribuut; JS vult de tekst na het laden van de juiste taalbestanden.
- **Geen automatische taalherkenning verplicht in MVP** — standaardtaal NL, latere uitbreiding kan browser-taal of een keuze-knop toevoegen.

## Bestandsconventie

```
data/
├── routes.json                    # overzicht (taal-onafhankelijke velden: id, distance_km, etc.)
├── ninglinspo.nl.json              # route content NL
├── ninglinspo.<taal>.json          # route content volgende taal (later, taal nog te bepalen)
├── ui-strings.nl.json              # vaste UI-teksten NL
├── ui-strings.<taal>.json          # vaste UI-teksten volgende taal (later)
```

## HTML conventie

```html
<!-- Vóór i18n: hardcoded tekst -->
<h2>Het verhaal</h2>

<!-- Na i18n: data-i18n attribuut, tekst wordt door JS ingevuld -->
<h2 data-i18n="section.story"></h2>
```

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
// TrailStories — i18n loader + app init
// =======================================================
```

```css
/* =======================================================
   main.css — v1.1.0
   TrailStories — design system
   ======================================================= */
```

```html
<!-- =======================================================
     ninglinspo.html — v1.1.0
     TrailStories — route detail template
     ======================================================= -->
```

---

# END OF CLAUDE.md
