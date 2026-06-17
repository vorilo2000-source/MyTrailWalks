# TrailStories — PROJECT.md
## Bijgewerkt: 17-06-2026
> Versie: v1.0.0 · Project: TrailStories · Stack: Vanilla HTML/CSS/JS (MVP, JSON-based)

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

## Databronnen (workflow van de gebruiker)

| Bron | Gebruik |
|------|---------|
| **GPX Viewer** | Registratie van de wandeling onderweg (tracking) |
| **AllTrails** ([voorbeeld: Aywaille](https://www.alltrails.com/belgium/liege/aywaille)) | Verkenning van routes, download van GPX-kaarten |
| **OpenStreetMap** ([voorbeeld](https://www.openstreetmap.org/way/581386904)) | Kaartlaag / referentie voor route-tracé |

Eerste route die wordt toegevoegd: **Ninglinspo** (data volgt later — GPX, foto's, afstand/duur/hoogtemeters nog aan te leveren, voorlopig met placeholders).

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

```json
{
  "id": "ninglinspo",
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
│   ├── ninglinspo.json
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
**Broncode:** nog niet aangemaakt (placeholder)
**Stack:** Vanilla HTML + CSS + JavaScript (no frameworks)
**Cloud (post-MVP):** Supabase — https://supabase.com/dashboard

---

# END OF PROJECT.md
