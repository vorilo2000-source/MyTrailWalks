# TrailStories — CLAUDE.md
## Bijgewerkt: 17-06-2026
> Versie: v1.0.0 · Project: TrailStories · Doel: regels voor Claude Code bij dit project

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

- UI content: Nederlands
- Code: Engels
- Commentaar: technisch, minimaal maar expliciet — verplicht per logische blokken
- Clean structure > micro-optimalisatie
- Geen overbodige uitleg

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

- [ ] Code werkt zonder console errors
- [ ] Werkt op desktop én mobile
- [ ] Inline commentaar aanwezig per logisch blok
- [ ] JSON data correct geïntegreerd
- [ ] UI consistent met route template
- [ ] GPX/Map correct werkt indien relevant
- [ ] Performance getest (load time < 2s target)
- [ ] PROJECT.md geüpdatet (indien van toepassing)
- [ ] PROJECTLOG.md entry toegevoegd
- [ ] BACKLOG.md status aangepast

---

# END OF CLAUDE.md
