
# TrailStories — PROJECTLOG.md
## Bijgewerkt: 17-06-2026
> Versie: v1.2.0 · Project: TrailStories

---

# [PROJECT LOG]

---

## 2026-06-17

- Project documentatie opgezet: PROJECT.md, CLAUDE.md, BACKLOG.md, PROJECTLOG.md aangemaakt
- Projectvisie vastgelegd: persoonlijk outdoor storytelling platform (wandelingen registreren met data + verhaal + foto's)
- Databronnen workflow vastgelegd: GPX Viewer (registratie), AllTrails (verkenning + GPX download), OpenStreetMap (kaartlaag)
- Tech stack bevestigd: vanilla HTML/CSS/JS, JSON als single source of truth, geen backend in MVP
- Eerste route gedefinieerd: **Ninglinspo** — toegevoegd aan backlog (T1-005), data (GPX/foto's/stats) volgt later
- Post-MVP richting vastgelegd: Supabase cloud sync, accounts en community features verplaatst naar Fase 6+
- Repo aangemaakt: github.com/vorilo2000-source/trailstories — mapstructuur + PROJECT.md/CLAUDE.md/BACKLOG.md/PROJECTLOG.md/README.md/.gitignore gepusht naar main
- **T0-002 (JSON data model) — Done**: definitief schema uitgewerkt — `data/routes.json` als licht overzicht-schema voor de homepage grid, `data/ninglinspo.json` als volledig detail-schema (incl. bronverwijzingen GPX Viewer/AllTrails/OpenStreetMap en `practical_info` blok)
- **T0-004 (Design system) — Done**: `css/main.css` opgezet met CSS-variabelen — kleurenpalet (bosgroen/aarde/gedempt waterblauw op warm crème), typografie (Fraunces display, Inter body, JetBrains Mono voor stats), spacing-schaal en basis componenten (difficulty badges, stat-labels)

## 2026-06-17 — Architectuurwijziging: i18n / meertaligheid

- Beslissing: meertaligheid wordt vanaf de basis-architectuur meegenomen (niet pas post-MVP toegevoegd)
- Gekozen aanpak: alleen NL actief nu, volgende taal nog te bepalen; apart JSON-bestand per taal en per route (`<route-id>.<taal>.json`); vaste UI-teksten apart in `ui-strings.<taal>.json`; taalkeuze via JS-switcher (geen aparte URL per taal)
- **CLAUDE.md → v1.1.0**: nieuwe sectie I18N & MEERTALIGHEID toegevoegd; Taal & Stijl sectie aangepast; Code principes uitgebreid met "geen hardcoded UI-tekst in HTML"; daarnaast nieuwe Delivery-regels toegevoegd (bestanden één voor één aanleveren met check, verplichte versie-update per bestand, blok-stijl, inline code uitleg) — deze regels gelden voortaan voor alle volgende sessies
- **PROJECT.md → v1.1.0**: i18n-principe toegevoegd aan kernprincipes; datastructuur-sectie aangepast om taal-specifieke bestandsnaam-conventie te reflecteren; mapstructuur bijgewerkt (`ninglinspo.nl.json`, `ui-strings.nl.json`); nieuwe paragraaf "Story-content workflow" toegevoegd (story/tips worden samen met AI in de chat geschreven, geen geautomatiseerde site-feature in MVP)
- **BACKLOG.md → v1.1.0**: T0-002 en T0-003 heropend (i18n-aanpassingen nodig in schema en route-template); nieuwe taak **T0-005** toegevoegd (i18n-loader bouwen in app.js + ui-strings.nl.json); T1-005 bijgewerkt met correcte bestandsnaam
- Gevolg: `data/ninglinspo.json` (eerder als concept opgeleverd) moet herzien worden naar `data/ninglinspo.nl.json`; `routes/ninglinspo.html` moet hardcoded NL-tekst vervangen door `data-i18n` attributen — wordt opgepakt bij uitvoering van T0-002/T0-003/T0-005

## 2026-06-17 — Correctie: i18n bestandsstructuur naar map-per-taal

- Aanpassing: in plaats van bestandsnaam-suffix (`<route-id>.<taal>.json`) wordt gekozen voor een map-per-taal structuur: `data/i18n/<taal>/<route-id>.json` en `data/i18n/<taal>/ui-strings.json`. Schaalt beter bij meerdere talen/routes, bestandsnamen blijven kort.
- **CLAUDE.md → v1.2.0**: bestandsconventie in sectie I18N & MEERTALIGHEID aangepast naar `data/i18n/<taal>/...`
- **PROJECT.md → v1.2.0**: taal-conventie paragraaf, schema-titel en mapstructuur-boom aangepast naar `data/i18n/<taal>/...`
- **BACKLOG.md → v1.2.0**: T0-002, T0-005 en T1-005 omschrijvingen bijgewerkt met de juiste paden
- Vervolgstap: daadwerkelijke bestanden aanmaken — `data/i18n/nl/ninglinspo.json`, `data/i18n/nl/ui-strings.json`, `routes/ninglinspo.html` (data-i18n attributen), `js/app.js` (i18n-loader) — één voor één conform delivery-regels

---

# END OF PROJECTLOG.md
