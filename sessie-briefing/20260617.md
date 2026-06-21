# Sessie-briefing — T1-001: Homepage Grid

Plak deze briefing in Claude Code om deze sessie te starten.

---

## CONTEXT

Project: **MyTrailWalks** (voorheen TrailStories — naam is gewijzigd, zie laatste PROJECTLOG.md entry voor reden: domeinconflict met bestaande sites).

Lees vóór je begint deze bestanden in de repo-root, in deze volgorde:
1. `CLAUDE.md` — werkwijze, codeprincipes, i18n-architectuur, delivery-regels
2. `PROJECT.md` — projectvisie, datastructuur, UI/UX-principes, design system
3. `BACKLOG.md` — voor de exacte taakomschrijving van T1-001 en aangrenzende taken

## OPDRACHT — T1-001: Homepage Grid

Bouw `index.html`: een route-overzicht met tiles (foto + stats + titel) conform de "Routesysteem" sectie in PROJECT.md.

### Functionele eisen

- Route-tiles in een grid-layout (mobile-first: 1 kolom op smal scherm, meerdere kolommen op breder scherm)
- Elke tile toont: hero-foto, routenaam, regio, afstand, duur, hoogtemeters, moeilijkheids-badge
- Data komt uit `data/routes.json` (het taal-onafhankelijke overzicht-schema, zie PROJECT.md sectie DATA STRUCTUUR) — **niet hardcoded in HTML**
- Een tile is klikbaar en linkt naar de bijbehorende routepagina (bv. `routes/ninglinspo.html`)
- Vaste UI-tekst (bv. een paginatitel/intro-zin) moet via het i18n-systeem lopen (`data-i18n` attributen + i18next), conform CLAUDE.md sectie I18N & MEERTALIGHEID — **geen hardcoded NL-tekst in de HTML**

### Belangrijke architectuur-afhankelijkheden (lees dit goed)

- T0-002, T0-003 en T0-005 staan in BACKLOG.md op **🔄 Heropend** — de i18n-architectuur is recent herzien naar i18next met een UI/content-splitsing (`data/i18n/` vs `data/content/`). Check de actuele staat van `js/app.js`, `js/i18n.js` en `data/routes.json` in de repo vóórdat je aannames doet over wat al werkt.
- T0-006 (component-systeem: topbar/navbar/footer + `loadScript()` helper) staat nog op **📋 Open** — er is op het moment van schrijven dus nog géén gedeelde navigatie. Vraag de gebruiker of T0-006 eerst gedaan moet worden, of of de homepage voorlopig zonder topbar/navbar/footer-componenten gebouwd wordt (met lege placeholders die later ingevuld worden, conform het patroon in CLAUDE.md sectie COMPONENT-INJECTIE).
- Gebruik **geen frameworks**. i18next is de enige toegestane externe library (zie CLAUDE.md CODE PRINCIPES).
- Volg de design tokens uit `css/main.css` (kleuren, typografie, spacing) — voeg geen nieuwe kleuren/fonts toe zonder overleg.

### Wat NIET te doen

- Geen aannames maken over routes die nog niet in `data/routes.json` staan — als er nu alleen Ninglinspo bestaat (mogelijk nog met placeholder-data), bouw de grid dan generiek zodat hij met 1 of meerdere routes werkt, niet specifiek voor één route hardcoded.
- Geen filter/zoek-functionaliteit toevoegen — dat is Fase 4 (T4-001/T4-002), niet in scope voor T1-001.
- Geen styling-beslissingen buiten het bestaande design system nemen zonder dit eerst voor te leggen.

## WERKWIJZE (verplicht, zie CLAUDE.md)

1. Vraag expliciete toestemming vóór je begint met bouwen.
2. Lever bestanden **één voor één** aan (niet alles in één keer dumpen) — wacht op akkoord per bestand voordat je verdergaat.
3. Elk aangepast/nieuw bestand krijgt een **versie-header** (zie CLAUDE.md Definition of Done voor het exacte format).
4. Inline code-commentaar per logisch blok, ook wáarom als dat niet evident is.
5. Stop bij ambiguïteit — vraag verduidelijking in plaats van zelf te beslissen.
6. Sluit de sessie af met: gewijzigde bestanden overzicht, een nieuwe `PROJECTLOG.md`-entry, en een bijgewerkte `BACKLOG.md` (T1-001 → status bijwerken).

## EERSTE STAP

Begin met het stellen van de openstaande vraag over T0-006 (zie hierboven) vóórdat je code schrijft. Wacht op antwoord, en vraag dan pas toestemming om te starten met de daadwerkelijke implementatie.
