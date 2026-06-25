// =======================================================
// home.js — v2.3.0
// MyTrailWalks — homepage init
// v2.3.0: max 3 routes tonen, link naar routes/route.html?id=
//         routes-section__meer knop naar wandelingen.html
// v2.2.0: i18nModule.init() verwijderd — app.js initialiseert centraal
// =======================================================
"use strict";

const ROUTES_JSON_PATH = "routes/routes.json";

// SAC-schaal + achterwaartse compatibiliteit
const DIFFICULTY_LABELS = {
  T1: "T1 — Wandelen",
  T2: "T2 — Bergwandeling",
  T3: "T3 — Veeleisend",
  T4: "T4 — Alpien",
  T5: "T5 — Veeleisend alpien",
  T6: "T6 — Moeilijk alpien",
  easy: "Gemakkelijk",
  medium: "Gemiddeld",
  hard: "Zwaar",
};

function showStatus(gridEl, message, isError = false) {
  gridEl.innerHTML = "";
  const statusEl = document.createElement("p");
  statusEl.className = "routes-grid__status" + (isError ? " routes-grid__status--error" : "");
  statusEl.textContent = message;
  gridEl.appendChild(statusEl);
}

function createRouteTile(route) {
  const tile = document.createElement("a");
  tile.className = "route-tile";
  // Link naar route detail pagina via query parameter
  tile.href = `routes/route.html?id=${route.id}`;
  tile.setAttribute("role", "listitem");
  tile.setAttribute("aria-label", route.name);

  // Hero foto
  const heroWrap = document.createElement("div");
  heroWrap.className = "route-tile__hero-wrap";
  if (route.hero) {
    const img = document.createElement("img");
    img.className = "route-tile__hero";
    img.src = route.hero;
    img.alt = route.name;
    img.loading = "lazy";
    img.onerror = () => img.removeAttribute("src");
    heroWrap.appendChild(img);
  }

  // Moeilijkheid badge op foto
  if (route.difficulty) {
    const badge = document.createElement("span");
    badge.className = "route-tile__difficulty-badge";
    badge.textContent = DIFFICULTY_LABELS[route.difficulty] || route.difficulty;
    heroWrap.appendChild(badge);
  }

  tile.appendChild(heroWrap);

  // Inhoud
  const content = document.createElement("div");
  content.className = "route-tile__content";

  const name = document.createElement("h3");
  name.className = "route-tile__name";
  name.textContent = route.name;
  content.appendChild(name);

  if (route.region) {
    const region = document.createElement("p");
    region.className = "route-tile__region";
    region.textContent = route.region;
    content.appendChild(region);
  }

  const statsRow = document.createElement("div");
  statsRow.className = "route-tile__stats";

  [
    { value: route.distance_km, unit: " km", label: "afstand" },
    { value: route.duration_hours, unit: " u", label: "duur" },
    { value: route.elevation_m, unit: " m", label: "stijging" },
  ].forEach(({ value, unit, label }) => {
    const stat = document.createElement("div");
    stat.className = "route-tile__stat";
    stat.innerHTML = `<span class="stat-value">${value > 0 ? `${value}${unit}` : "—"}</span><span class="stat-label">${label}</span>`;
    statsRow.appendChild(stat);
  });

  content.appendChild(statsRow);
  tile.appendChild(content);
  return tile;
}

function renderGrid(routes, gridEl) {
  gridEl.innerHTML = "";
  if (!routes?.length) {
    showStatus(gridEl, "Nog geen wandelingen beschikbaar.");
    return;
  }

  // Max 3 routes op de home pagina — gesorteerd op datum (meest recent eerst)
  const top3 = [...routes]
    .sort((a, b) => new Date(b.date_walked || 0) - new Date(a.date_walked || 0))
    .slice(0, 3);

  const fragment = document.createDocumentFragment();
  top3.forEach((route) => fragment.appendChild(createRouteTile(route)));
  gridEl.appendChild(fragment);
}

async function loadRoutes() {
  try {
    const resp = await fetch(ROUTES_JSON_PATH);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error("home.js: routes laden mislukt", err);
    return null;
  }
}

async function initHomePage() {
  const gridEl = document.getElementById("routes-grid");
  if (!gridEl) return;

  showStatus(gridEl, "Laden…");

  if (window.appReady) await window.appReady;

  try {
    document.title = i18nModule.t("home:page.title");
  } catch (_) {}

  const routes = await loadRoutes();
  if (!routes) {
    showStatus(gridEl, "Wandelingen konden niet worden geladen.", true);
    return;
  }

  renderGrid(routes, gridEl);
}

document.addEventListener("DOMContentLoaded", initHomePage);
