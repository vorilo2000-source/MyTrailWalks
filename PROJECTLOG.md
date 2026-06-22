# MyTrailWalks — PROJECTLOG.md
## Bijgewerkt: 22-06-2026
> Versie: v1.3.0 · Projectlog — chronologisch overzicht van sessies en wijzigingen

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

### Uitgevoerde taken

**Supabase setup:**
- `profiles` tabel aangemaakt met `role` kolom (gast/creator/admin) i.p.v. `is_admin boolean`
- Trigger aangemaakt voor automatisch profiel bij registratie
- `page_views` tabel aangemaakt voor analytics
- RLS policies correct ingesteld op beide tabellen
- Supabase URL Configuration ingesteld op GitHub Pages URL
- Account Vorilo geregistreerd + role admin gezet via SQL

**Auth:**
- `auth.js` v1.1.0: `getProfile()` haalt nu `role` op i.p.v. `is_admin`. `window._supabase` geëxporteerd. `redirectTo` correct ingesteld op `https://vorilo2000-source.github.io/MyTrailWalks/reset.html`

**i18n auth:**
- `data/i18n/nl/auth.json` v1.0.0: auth modal teksten NL
- `data/i18n/en/auth.json` v1.0.0: auth modal teksten EN
- `topbar-auth.js` v2.1.0: i18n via `_updateModalTexts()` zonder structuur te breken. Wacht op `window.appReady` voor render.

**Analytics:**
- `js/analytics.js` v1.1.0: pageviews, sessieduur, terugkerende bezoekers. Retry loop voor `window._supabase`.

**Centrale init:**
- `js/app.js` v3.0.0: i18next centraal geïnitialiseerd vóór component injectie. `window.i18nReady` + `window.appReady` geëxporteerd.
- `js/home.js` v2.2.0: geen eigen `i18nModule.init()` meer.
- `js/creator.js` v1.2.0: geen eigen `i18nModule.init()` meer.

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

### Architectuurbeslissingen sessie 04

| Onderwerp | Beslissing |
|-----------|-----------|
| **Rollen** | gast / creator / admin via `role` kolom in profiles tabel |
| **i18n init** | Centraal in app.js — paginascripts roepen geen init() meer aan |
| **window.i18nReady** | Nieuwe Promise — topbar-auth.js wacht hierop voor teksten |
| **Cache busting** | Versienummer in script tags: `?v=x.x.x` bij elke deploy |
| **Analytics** | Supabase page_views tabel — RLS permissive voor public |
| **Script volgorde** | Eruda → Supabase SDK → i18next CDN → i18n.js → auth.js → topbar-auth.js → analytics.js → app.js → [pagina].js |

### Openstaande punten na sessie 04
- Cloudinary account aanmaken (T0-007)
- Eerste route aanmaken via creator.html (T1-005)
- Route detail pagina (T1-002)
- Analytics dashboard voor admin (T6-005)

---

# END OF PROJECTLOG.md
