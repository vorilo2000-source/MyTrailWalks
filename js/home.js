// =======================================================
// home.js — v2.2.0
// MyTrailWalks — homepage init
// Wijziging v2.2.0: i18nModule.init() verwijderd — app.js initialiseert nu centraal
//   zodat topbar-auth.js vertalingen correct laadt.
// Volgorde: wacht op app.js (component injectie) via
// window.appReady Promise, dan i18n init, dan grid renderen.
// =======================================================
"use strict";

const ROUTES_JSON_PATH = "data/routes.json";
const ROUTES_BASE_PATH = "routes/";

function showStatus(gridEl, i18nKey, isError = false) {
  gridEl.innerHTML = "";
  const statusEl = document.createElement("p");
  statusEl.className = "routes-grid__status" + (isError ? " routes-grid__status--error" : "");
  statusEl.textContent = i18nModule.t(i18nKey);
  gridEl.appendChild(statusEl);
}

function createBadge(difficulty) {
  const badge = document.createElement("span");
  const validDifficulties = ["easy", "medium", "hard"];
  const safeLevel = validDifficulties.includes(difficulty) ? difficulty : "medium";
  badge.className = `badge-difficulty badge-difficulty--${safeLevel} route-tile__badge`;
  badge.textContent = i18nModule.t(`common:route.difficulty_${safeLevel}`);
  return badge;
}

function createStat(value, unit, labelKey) {
  const stat = document.createElement("div");
  stat.className = "route-tile__stat";

  const valueEl = document.createElement("span");
  valueEl.className = "stat-value";
  valueEl.textContent = value > 0 ? `${value}${unit}` : "—";

  const labelEl = document.createElement("span");
  labelEl.className = "stat-label";
  labelEl.textContent = i18nModule.t(labelKey);

  stat.appendChild(valueEl);
  stat.appendChild(labelEl);
  return stat;
}

function createRouteTile(route) {
  const tile = document.createElement("a");
  tile.className = "route-tile";
  tile.href = `${ROUTES_BASE_PATH}${route.id}.html`;
  tile.setAttribute("role", "listitem");
  tile.setAttribute("aria-label", route.name);

  const hero = document.createElement("img");
  hero.className = "route-tile__hero";
  hero.alt = route.name;
  hero.loading = "lazy";
  if (route.hero) {
    hero.src = route.hero;
    hero.onerror = () => { hero.removeAttribute("src"); };
  }
  tile.appendChild(hero);

  const content = document.createElement("div");
  content.className = "route-tile__content";

  const name = document.createElement("h3");
  name.className = "route-tile__name";
  name.textContent = route.name;
  content.appendChild(name);

  const region = document.createElement("p");
  region.className = "route-tile__region";
  region.textContent = route.region;
  content.appendChild(region);

  const statsRow = document.createElement("div");
  statsRow.className = "route-tile__stats";
  statsRow.appendChild(createStat(route.distance_km, i18nModule.t("common:route.distance_unit"), "common:route.distance"));
  statsRow.appendChild(createStat(route.duration_hours, i18nModule.t("common:route.duration_unit"), "common:route.duration"));
  statsRow.appendChild(createStat(route.elevation_m, i18nModule.t("common:route.elevation_unit"), "common:route.elevation"));
  content.appendChild(statsRow);

  content.appendChild(createBadge(route.difficulty));
  tile.appendChild(content);
  return tile;
}

function renderGrid(routes, gridEl) {
  gridEl.innerHTML = "";
  if (!routes || routes.length === 0) {
    showStatus(gridEl, "home:grid.empty");
    return;
  }
  const fragment = document.createDocumentFragment();
  routes.forEach((route) => { fragment.appendChild(createRouteTile(route)); });
  gridEl.appendChild(fragment);
}

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

async function initHomePage() {
  const gridEl = document.getElementById("routes-grid");

  // Wacht op app.js component-injectie als die nog loopt
  if (window.appReady) {
    await window.appReady;
  }

  // i18n is al geïnitialiseerd door app.js — alleen title instellen
  try {
    document.title = i18nModule.t("home:page.title");
  } catch (error) {
    console.warn("home.js: title vertaling mislukt", error);
  }

  if (!gridEl) {
    console.error("home.js: #routes-grid niet gevonden in DOM");
    return;
  }

  showStatus(gridEl, "home:grid.loading");

  const routes = await loadRoutes();
  if (routes === null) {
    showStatus(gridEl, "home:grid.error", true);
    return;
  }

  renderGrid(routes, gridEl);
}

document.addEventListener("DOMContentLoaded", initHomePage);
