# TrailStories — PROJECT.md
## Bijgewerkt: 17-06-2026
> Versie: v2.0.0 · Project: TrailStories · Stack: Vanilla HTML/CSS/JS + i18next (MVP, JSON-based)

---

# ======================= PROJECTVISIE =======================

TrailStories is een **persoonlijk visueel outdoor storytelling platform** waarin eigen wandelingen worden vastgelegd met GPS-data, foto's en een persoonlijk verhaal.

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
- 🌐 **Meertalig vanaf de basis** — UI-onderdelen vertaald via i18next (NL nu, uitbreidbaar). **Toekomstvisie (Fase 6+)**: mensen maken zelf wandelverhalen aan in hun eigen taal — dit is user-generated content, los van de ondersteunde UI-talen. Wanneer de taal van een verhaal niet voorkomt in de ondersteunde UI-talen, valt alleen de UI-laag terug op Engels; de content zelf wordt nooit vertaald of aangepast. Zie CLAUDE.md, sectie I18N & MEERTALIGHEID, voor de volledige technische uitwerking.

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

Volledige architectuur: zie DATA STRUCTUUR-sectie hieronder en CLAUDE.md, sectie I18N & MEERTALIGHEID. Kern: UI-onderdelen via i18next (`data/i18n/<taal>/`), route-verhalen als user-generated content met eigen `language`-veld (`data/content/`), fallback van de UI naar Engels wanneer een verhaal-taal niet ondersteund wordt.

## Toekomstige uitbreidingen (post-MVP)

- 🤖 AI route-samenvattingen
- 📊 Analytics per route (afstand, tijd, hoogte, trends over tijd)
- ☁️ Cloud sync (Supabase) + accounts
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

- **`data/i18n/<taal>/`** — i18next-beheerde UI-vertalingen (sectiekoppen, labels, knoppen). Beperkt tot ondersteunde "standaardtalen" (nu: NL). Fallback naar Engels wanneer een route-taal niet matcht (zie CLAUDE.md voor de volledige regel).
- **`data/content/`** — route-verhalen zelf, user-generated, in willekeurige taal. Elk route-bestand heeft een eigen `language`-veld. Dit is **niet** i18next-beheerd en wordt nooit automatisch vertaald.

Volledige technische i18n-regels: zie CLAUDE.md, sectie I18N & MEERTALIGHEID.

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
- **i18next** (+ i18next-http-backend, i18next-browser-languagedetector) — enige toegestane externe library, uitsluitend voor het i18n-systeem. Zie CLAUDE.md, sectie CODE PRINCIPES, voor de motivatie van deze uitzondering op de vanilla-aanpak.

**Hosting:** GitHub Pages (primair), later uitbreidbaar naar Netlify/Vercel
**Cloud (post-MVP):** Supabase — https://supabase.com/dashboard

---

# ======================= PROJECT STRUCTUUR =======================

```
/trailstories
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

**Live:** nog niet live (placeholder)
**Broncode:** github.com/vorilo2000-source/trailstories
**Stack:** Vanilla HTML + CSS + JavaScript + i18next (enige externe dependency, zie CODE PRINCIPES in CLAUDE.md)
**Cloud (post-MVP):** Supabase — https://supabase.com/dashboard

---

# END OF PROJECT.md
