// =======================================================
// home.js — v1.0.0
// MyTrailWalks — homepage grid init + route-tile rendering
// T1-001: laadt routes.json, rendert tiles via createElement.
// Afhankelijk van: js/i18n.js (geladen vóór dit script via
// <script> in index.html — i18nModule is beschikbaar als global)
// =======================================================
"use strict";

// ---------------------------------------------------------
// 1. CONFIG
// Pad naar routes.json relatief aan index.html (in repo-root).
// Geen hardcoded routes — JSON is single source of truth
// conform CLAUDE.md CODE PRINCIPES.
// ---------------------------------------------------------
const ROUTES_JSON_PATH = "data/routes.json";

// Pad naar routepagina's — tile-links worden hiermee samengesteld.
// Bv. route met id "ninglinspo" → "routes/ninglinspo.html"
const ROUTES_BASE_PATH = "routes/";

// ---------------------------------------------------------
// 2. STATUS HELPERS
// Toont een statusbericht (laden/leeg/fout) in de grid-container.
// Gebruikt i18nModule.t() zodat de tekst meertalig is en niet
// hardcoded in JS staat (sleutelregel uit CLAUDE.md).
// ---------------------------------------------------------
function showStatus(gridEl, i18nKey, isError = false) {
  gridEl.innerHTML = ""; // vorige inhoud wissen

  const statusEl = document.createElement("p");
  statusEl.className = "routes-grid__status" + (isError ? " routes-grid__status--error" : "");
  statusEl.textContent = i18nModule.t(i18nKey);
  gridEl.appendChild(statusEl);
}

// ---------------------------------------------------------
// 3. DIFFICULTY BADGE
// Maakt een <span> badge op basis van het difficulty-veld
// uit routes.json. Badge-klassen zijn gedefinieerd in main.css.
// De zichtbare tekst komt uit i18n (common:route.difficulty_*)
// zodat "easy/medium/hard" niet hardcoded in het NL of EN
// verschijnt maar altijd via de actieve UI-taal loopt.
// ---------------------------------------------------------
function createBadge(difficulty) {
  const badge = document.createElement("span");

  // Klasse bepaalt kleur (main.css: badge-difficulty--easy/medium/hard)
  const validDifficulties = ["easy", "medium", "hard"];
  const safeLevel = validDifficulties.includes(difficulty) ? difficulty : "medium";
  badge.className = `badge-difficulty badge-difficulty--${safeLevel} route-tile__badge`;

  // Vertaalde tekst via i18n — "easy" → "Gemakkelijk" (NL) / "Easy" (EN)
  badge.textContent = i18nModule.t(`common:route.difficulty_${safeLevel}`);

  return badge;
}

// ---------------------------------------------------------
// 4. STAT BLOKJE
// Maakt één stat-blokje (cijfer + label) conform het design
// system (stat-value mono-font + stat-label uppercase uit main.css).
// value: het getal uit routes.json (bv. 12.3)
// unit: de vertaalde eenheid (bv. "km")
// labelKey: i18n-key voor het label (bv. "common:route.distance")
// ---------------------------------------------------------
function createStat(value, unit, labelKey) {
  const stat = document.createElement("div");
  stat.className = "route-tile__stat";

  // Waarde + eenheid — mono-font via stat-value klasse (main.css)
  const valueEl = document.createElement("span");
  valueEl.className = "stat-value";

  // Placeholder tonen als waarde 0 is (route nog niet aangevuld)
  // "—" is universeeel leesbaar en duidelijker dan "0 km"
  valueEl.textContent = value > 0 ? `${value}${unit}` : "—";

  // Label — uppercase, klein, via stat-label klasse (main.css)
  const labelEl = document.createElement("span");
  labelEl.className = "stat-label";
  labelEl.textContent = i18nModule.t(labelKey);

  stat.appendChild(valueEl);
  stat.appendChild(labelEl);
  return stat;
}

// ---------------------------------------------------------
// 5. ROUTE TILE BOUWEN
// Maakt één tile-element via createElement (geen innerHTML met
// volledige HTML-structuren — verboden patroon, zie CLAUDE.md
// HTML WERKWIJZE). De tile is een <a>-element zodat de hele
// kaart klikbaar is zonder JS-click handler, wat semantisch
// correct is en werkt zonder JavaScript.
// ---------------------------------------------------------
function createRouteTile(route) {
  // Tile = klikbare <a> naar de routepagina
  const tile = document.createElement("a");
  tile.className = "route-tile";
  tile.href = `${ROUTES_BASE_PATH}${route.id}.html`;
  tile.setAttribute("role", "listitem"); // grid heeft role="list" in HTML
  tile.setAttribute("aria-label", route.name); // screenreader: "Ninglinspo, link"

  // --- Hero foto ---
  const hero = document.createElement("img");
  hero.className = "route-tile__hero";
  hero.alt = route.name; // alt = routenaam, beschrijvend genoeg voor context
  hero.loading = "lazy"; // lazy load: afbeeldingen buiten viewport laden pas bij scrollen

  // Fallback als hero-pad ontbreekt of afbeelding niet bestaat:
  // toon een lege placeholder (achtergrondkleur uit home.css).
  // onerror voorkomt een gebroken afbeelding-icoon in de UI.
  if (route.hero) {
    hero.src = route.hero;
    hero.onerror = () => {
      hero.removeAttribute("src"); // leeg src → placeholder achtergrond zichtbaar
    };
  }
  tile.appendChild(hero);

  // --- Content wrapper ---
  const content = document.createElement("div");
  content.className = "route-tile__content";

  // Routenaam
  const name = document.createElement("h3");
  name.className = "route-tile__name";
  name.textContent = route.name;
  content.appendChild(name);

  // Regio
  const region = document.createElement("p");
  region.className = "route-tile__region";
  region.textContent = route.region;
  content.appendChild(region);

  // Stats rij: afstand / duur / hoogtemeters
  const statsRow = document.createElement("div");
  statsRow.className = "route-tile__stats";

  statsRow.appendChild(createStat(
    route.distance_km,
    i18nModule.t("common:route.distance_unit"),
    "common:route.distance"
  ));
  statsRow.appendChild(createStat(
    route.duration_hours,
    i18nModule.t("common:route.duration_unit"),
    "common:route.duration"
  ));
  statsRow.appendChild(createStat(
    route.elevation_m,
    i18nModule.t("common:route.elevation_unit"),
    "common:route.elevation"
  ));
  content.appendChild(statsRow);

  // Difficulty badge (onderaan via margin-top: auto in CSS)
  content.appendChild(createBadge(route.difficulty));

  tile.appendChild(content);
  return tile;
}

// ---------------------------------------------------------
// 6. GRID RENDEREN
// Doorloopt de routes-array en voegt elke tile toe aan de
// grid-container. Lege array → lege-staat bericht tonen.
// ---------------------------------------------------------
function renderGrid(routes, gridEl) {
  gridEl.innerHTML = ""; // reset: verwijder eventueel nog staand laad-bericht

  if (!routes || routes.length === 0) {
    showStatus(gridEl, "home:grid.empty");
    return;
  }

  // Fragment gebruiken: voegt alle tiles in één DOM-operatie toe
  // i.p.v. één voor één (betere performance bij meerdere routes)
  const fragment = document.createDocumentFragment();
  routes.forEach((route) => {
    fragment.appendChild(createRouteTile(route));
  });
  gridEl.appendChild(fragment);
}

// ---------------------------------------------------------
// 7. ROUTES JSON LADEN
// Fetch met foutafhandeling. Geeft null terug bij netwerk-
// of parse-fouten zodat de caller zelf de UI-foutmelding
// kan tonen (scheiding van data-laden en UI-feedback).
// ---------------------------------------------------------
async function loadRoutes() {
  try {
    const response = await fetch(ROUTES_JSON_PATH);
    if (!response.ok) {
      console.error(`home.js: kon ${ROUTES_JSON_PATH} niet laden (status ${response.status})`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("home.js: fout bij laden van routes.json", error);
    return null;
  }
}

// ---------------------------------------------------------
// 8. PAGINA INIT
// Volgorde (conform CLAUDE.md COMPONENT-INJECTIE):
// 1. i18nModule.init() met namespaces ["common", "home"]
// 2. Vertalingen toepassen op [data-i18n] in de HTML
// 3. Paginatitel zetten via i18n
// 4. routes.json laden
// 5. Grid renderen (of foutmelding tonen)
// Component-injectie (topbar/navbar/footer) volgt in T0-006
// en wordt hier nog niet aangeroepen.
// ---------------------------------------------------------
async function initHomePage() {
  const gridEl = document.getElementById("routes-grid");

  // Laad-bericht tonen vóór i18next klaar is: plain tekst,
  // want i18nModule.t() werkt pas ná init(). Wordt direct
  // overschreven zodra de grid rendert of een fout optreedt.
  if (gridEl) {
    const loadingEl = document.createElement("p");
    loadingEl.className = "routes-grid__status";
    loadingEl.textContent = "…"; // minimale placeholder, i18n-tekst volgt snel
    gridEl.appendChild(loadingEl);
  }

  // Stap 1+2: i18next initialiseren + vertalingen toepassen
  try {
    await i18nModule.init(["home"]);
    i18nModule.applyTranslations();

    // Paginatitel zetten (tab + bookmarks)
    document.title = i18nModule.t("home:page.title");
  } catch (error) {
    console.error("home.js: i18n init mislukt", error);
    // Pagina werkt nog steeds, maar zonder vertalingen —
    // data-i18n attributen blijven leeg (geen crash)
  }

  // Stap 3: grid vullen
  if (!gridEl) {
    console.error("home.js: #routes-grid niet gevonden in DOM");
    return;
  }

  // Laad-bericht tonen via i18n (nu beschikbaar)
  showStatus(gridEl, "home:grid.loading");

  // Stap 4: routes laden
  const routes = await loadRoutes();

  // Stap 5: renderen of fout tonen
  if (routes === null) {
    showStatus(gridEl, "home:grid.error", true);
    return;
  }

  renderGrid(routes, gridEl);
}

// Start zodra de DOM klaar is. Script staat onderaan <body>
// dus DOM is al beschikbaar, maar DOMContentLoaded is veiliger
// voor het geval het script ooit naar <head> verplaatst wordt.
document.addEventListener("DOMContentLoaded", initHomePage);
