// =======================================================
// wandelingen.js — MyTrailWalks
// Wandelingen overzicht pagina
// Laadt data/routes.json en rendert alle wandelingen als
// preview kaartjes. Klik → routes/route.html?id=[id]
// v1.0.0: initiële versie
// =======================================================
"use strict";

const ROUTES_JSON_PATH = "data/routes.json";

// -----------------------------------------------------------
// MOEILIJKHEID LABELS (SAC-schaal + achterwaartse compat.)
// -----------------------------------------------------------
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

// -----------------------------------------------------------
// ROUTES LADEN
// -----------------------------------------------------------
async function loadRoutes() {
  try {
    const resp = await fetch(ROUTES_JSON_PATH);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    // Filter alleen wandelingen (geen hikes, ritten, etc. later)
    return data.filter((r) => !r._meta_version || true);
  } catch (err) {
    console.error("wandelingen.js: routes laden mislukt", err);
    return null;
  }
}

// -----------------------------------------------------------
// ROUTE KAARTJE AANMAKEN
// -----------------------------------------------------------
function createRouteTile(route) {
  const a = document.createElement("a");
  a.className = "route-tile";
  a.href = `routes/route.html?id=${route.id}`;
  a.setAttribute("role", "listitem");
  a.setAttribute("aria-label", route.name);

  // Hero foto
  const hero = document.createElement("div");
  hero.className = "route-tile__hero";
  if (route.hero) {
    const img = document.createElement("img");
    img.src = route.hero;
    img.alt = route.name;
    img.loading = "lazy";
    img.onerror = () => img.remove();
    hero.appendChild(img);
  }

  // Moeilijkheid badge
  if (route.difficulty) {
    const badge = document.createElement("span");
    badge.className = "route-tile__difficulty-badge";
    badge.textContent = DIFFICULTY_LABELS[route.difficulty] || route.difficulty;
    hero.appendChild(badge);
  }

  a.appendChild(hero);

  // Inhoud
  const content = document.createElement("div");
  content.className = "route-tile__content";

  // Naam
  const name = document.createElement("h2");
  name.className = "route-tile__name";
  name.textContent = route.name;
  content.appendChild(name);

  // Regio
  if (route.region) {
    const region = document.createElement("p");
    region.className = "route-tile__region";
    region.textContent = route.region;
    content.appendChild(region);
  }

  // Stats
  const stats = document.createElement("div");
  stats.className = "route-tile__stats";

  const statItems = [
    { value: route.distance_km, unit: " km", label: "afstand" },
    { value: route.duration_hours, unit: " u", label: "duur" },
    { value: route.elevation_m, unit: " m", label: "stijging" },
  ];

  statItems.forEach(({ value, unit, label }) => {
    const stat = document.createElement("div");
    stat.className = "route-tile__stat";
    stat.innerHTML = `
      <span class="stat-value">${value > 0 ? `${value}${unit}` : "—"}</span>
      <span class="stat-label">${label}</span>
    `;
    stats.appendChild(stat);
  });

  content.appendChild(stats);

  // Tags
  if (route.tags?.length) {
    const tags = document.createElement("div");
    tags.className = "route-tile__tags";
    route.tags.slice(0, 3).forEach((tag) => {
      const span = document.createElement("span");
      span.className = "route-tile__tag";
      span.textContent = tag;
      tags.appendChild(span);
    });
    content.appendChild(tags);
  }

  a.appendChild(content);
  return a;
}

// -----------------------------------------------------------
// GRID RENDEREN
// -----------------------------------------------------------
function renderGrid(routes, gridEl) {
  gridEl.innerHTML = "";

  if (!routes?.length) {
    const p = document.createElement("p");
    p.className = "routes-grid__status";
    p.textContent = "Nog geen wandelingen beschikbaar.";
    gridEl.appendChild(p);
    return;
  }

  const fragment = document.createDocumentFragment();
  routes.forEach((route) => fragment.appendChild(createRouteTile(route)));
  gridEl.appendChild(fragment);

  // Aantal tonen
  const countEl = document.getElementById("wandelingen-count");
  if (countEl) {
    countEl.textContent = `${routes.length} wandeling${routes.length !== 1 ? "en" : ""}`;
  }
}

// -----------------------------------------------------------
// INIT
// -----------------------------------------------------------
async function initWandelingen() {
  const gridEl = document.getElementById("routes-grid");
  if (!gridEl) return;

  // Laad indicator
  gridEl.innerHTML = `<p class="routes-grid__status">Laden\u2026</p>`;

  await window.appReady;

  const routes = await loadRoutes();
  if (!routes) {
    gridEl.innerHTML = `<p class="routes-grid__status routes-grid__status--error">Wandelingen konden niet worden geladen.</p>`;
    return;
  }

  renderGrid(routes, gridEl);
}

document.addEventListener("DOMContentLoaded", initWandelingen);
