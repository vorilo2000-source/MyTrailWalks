# MyTrailWalks — AI.md
## Bijgewerkt: 20-09-2026 â€” documentcanonicalisatie
> Versie: v2.2.0 · Project:  MyTrailWalks · Doel: regels voor AI Code bij dit project

---

> **CANONICAL DOCUMENTROL:** AI.md is de actuele bron voor AI-uitvoeringsbeleid, delivery-regels, editregels, stijlregels en Definition of Done. Technische projectarchitectuur en actuele projectstructuur staan canonical in PROJECT.md.
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

Soms wordt een bestand uit een ander project (bv. MyFamTreeCollab) als voorbeeld gedeeld om een patroon te illustreren (zie `develop/standaardpagina.html`, gedeeld 17-06-2026 — bron voor i18next-architectuur en component-injectie). Dit is **inspiratie/referentie**, geen letterlijk te kopiëren code. Patronen worden bewust overgenomen (met motivatie in AI.md/PROJECT.md vastgelegd), niet klakkeloos geplakt — MyTrailWalks heeft een eigen scope (geen auth/analytics in MVP) en eigen vanilla-principes die alleen voor i18next bewust doorbroken worden.


---

# ======================= WERKWIJZE AI CODE =======================

## Computer workflow
1. Open project in VS Code
2. AI Code voert wijzigingen direct uit
3. Test in browser
4. `git add .`
5. `git commit -m "message"`
6. `git push`

## iPad workflow
1. Edit via ....ai
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

De technische i18n-architectuur is canonical vastgelegd in PROJECT.md, sectie I18N & MEERTALIGHEID.
AI Code moet die architectuur volgen; wijzigingen aan de architectuur worden eerst in PROJECT.md vastgelegd.

---

# ======================= COMPONENT-INJECTIE (TopBar/Navbar/Footer) =======================

De component-injectiearchitectuur en verplichte laadvolgorde zijn canonical vastgelegd in PROJECT.md, sectie COMPONENT-INJECTIE (TopBar/Navbar/Footer).
AI Code moet die actuele projectarchitectuur volgen.

---

# ======================= TECHNISCHE STANDAARDEN =======================

De projectspecifieke technische standaarden zijn canonical vastgelegd in PROJECT.md, sectie TECHNISCHE STANDAARDEN.
AI Code gebruikt PROJECT.md als actuele technische bron.

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

# END OF AI.md
