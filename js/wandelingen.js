// =======================================================
// wandelingen.js — MyTrailWalks
// Wandelingen overzicht pagina
// v1.3.0: filters — moeilijkheid, land, regio, plaats
// v1.2.0: laadt routes via routes-index.json + individuele [id].json
// v1.1.0: i18n via i18nModule (nl/en)
// =======================================================
"use strict";

// -----------------------------------------------------------
// i18n helper
// -----------------------------------------------------------
function t(key) {
  try { return i18nModule.t(`wandelingen:${key}`); } catch (_) { return key; }
}

// -----------------------------------------------------------
// Moeilijkheidslabels
// -----------------------------------------------------------
const DIFFICULTY_LABELS = {
  T1: "T1 — Wandelen", T2: "T2 — Bergwandeling", T3: "T3 — Veeleisend",
  T4: "T4 — Alpien", T5: "T5 — Veeleisend alpien", T6: "T6 — Moeilijk alpien",
  easy: "Gemakkelijk", medium: "Gemiddeld", hard: "Zwaar",
};

// -----------------------------------------------------------
// Alle geladen routes bewaren voor filtering
// -----------------------------------------------------------
let allRoutes = [];

// -----------------------------------------------------------
// ROUTES LADEN
// -----------------------------------------------------------
async function loadRoutes() {
  const indexUrl = "routes/routes-index.json";
  console.log("wandelingen.js: index laden van", indexUrl);

  try {
    const indexResp = await fetch(indexUrl);
    if (!indexResp.ok) throw new Error(`Index HTTP ${indexResp.status}`);

    const ids = await indexResp.json();
    console.log("wandelingen.js: index geladen", ids);

    const results = await Promise.allSettled(
      ids.map((id) => {
        const url = `routes/${id}.json`;
        console.log("wandelingen.js: route laden van", url);

        return fetch(url).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} voor ${url}`);
          return r.json();
        });
      })
    );

    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn(`wandelingen.js: route ${ids[i]} mislukt:`, r.reason);
      }
    });

    return results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

  } catch (err) {
    console.error("wandelingen.js: laden mislukt", err);
    return null;
  }
}

// -----------------------------------------------------------
// FILTERS VULLEN
// -----------------------------------------------------------
function populateFilters(routes) {

  // Unieke landen verzamelen
  const countries = [...new Set(routes.map((r) => r.country).filter(Boolean))].sort();

  // Unieke regio's verzamelen
  const regions = [...new Set(routes.map((r) => r.region).filter(Boolean))].sort();

  // Unieke plaatsen verzamelen
  const places = [...new Set(routes.map((r) => r.place).filter(Boolean))].sort();

  fillSelect("filter-country", countries);
  fillSelect("filter-region", regions);
  fillSelect("filter-place", places);
}

function fillSelect(id, values) {

  // Select element ophalen
  const sel = document.getElementById(id);

  if (!sel) return;

  values.forEach((val) => {

    // Nieuwe optie maken
    const opt = document.createElement("option");

    opt.value = val;
    opt.textContent = val;

    // Toevoegen aan de select
    sel.appendChild(opt);

  });
}

// -----------------------------------------------------------
// FILTER LOGICA
// -----------------------------------------------------------
function getActiveFilters() {
  return {
    difficulty: document.getElementById("filter-difficulty")?.value || "",
    country: document.getElementById("filter-country")?.value || "",
    region: document.getElementById("filter-region")?.value || "",
    place: document.getElementById("filter-place")?.value || "",
  };
}

function applyFilters() {

  // Actieve filters ophalen
  const { difficulty, country, region, place } = getActiveFilters();

  // Grid ophalen
  const gridEl = document.getElementById("routes-grid");

  // Alleen routes behouden die aan alle filters voldoen
  const filtered = allRoutes.filter((route) => {

    if (difficulty && route.difficulty !== difficulty) return false;
    if (country && route.country !== country) return false;
    if (region && route.region !== region) return false;
    if (place && route.place !== place) return false;

    return true;

  });

  // Gefilterde routes tonen
  renderGrid(filtered, gridEl);

}

// -----------------------------------------------------------
// ROUTE KAARTJE
// -----------------------------------------------------------
function createRouteTile(route) {

  const lang = (i18nModule?.language || "nl").substring(0, 2);

  const title = typeof route.title === "object"
    ? route.title[lang] || route.title.nl || route.title.en || ""
    : route.title || route.name || "";

  const hero = route.photos?.find((p) => p.role === "hero")?.url
    || route.photos?.[0]?.url
    || route.hero
    || null;

  const stats = route.gpx_stats || {};

  // Controleren of dit een draft is
  const isDraft = route.status === "draft";

  const el = document.createElement("a");
  el.className = "route-tile" + (isDraft ? " route-tile--draft" : "");
  el.href = `routes/route.html?id=${route.id}`;
  el.setAttribute("role", "listitem");
  el.setAttribute("aria-label", title);

  const heroEl = document.createElement("div");
  heroEl.className = "route-tile__hero";

  if (hero) {

    const img = document.createElement("img");
    img.src = hero;
    img.alt = title;
    img.loading = "lazy";
    img.onerror = () => img.remove();

    heroEl.appendChild(img);

  }

  if (route.difficulty) {

    const badge = document.createElement("span");
    badge.className = "route-tile__difficulty-badge";
    badge.textContent = DIFFICULTY_LABELS[route.difficulty] || route.difficulty;

    heroEl.appendChild(badge);

  }

  const statusBadge = document.createElement("span");
  statusBadge.className = isDraft
    ? "route-tile__status-badge route-tile__status-badge--draft"
    : "route-tile__status-badge route-tile__status-badge--final";

  statusBadge.textContent = isDraft ? "Draft" : "Final";

  heroEl.appendChild(statusBadge);

  el.appendChild(heroEl);

  const content = document.createElement("div");
  content.className = "route-tile__content";

  const name = document.createElement("h2");
  name.className = "route-tile__name";
  name.textContent = title;

  content.appendChild(name);

  if (route.place || route.region) {

    const region = document.createElement("p");
    region.className = "route-tile__region";
    region.textContent = [route.place, route.region].filter(Boolean).join(", ");

    content.appendChild(region);

  }

  const statsEl = document.createElement("div");
  statsEl.className = "route-tile__stats";

  [
    { value: stats.distance_km, unit: t("units.km"), label: t("stats.distance") },
    { value: stats.duration_hours, unit: t("units.hours"), label: t("stats.duration") },
    { value: stats.elevation_up_m, unit: t("units.meters"), label: t("stats.elevation") },
  ].forEach(({ value, unit, label }) => {

    const stat = document.createElement("div");
    stat.className = "route-tile__stat";

    stat.innerHTML = `
      <span class="stat-value">${value > 0 ? `${value}${unit}` : "—"}</span>
      <span class="stat-label">${label}</span>
    `;

    statsEl.appendChild(stat);

  });

  content.appendChild(statsEl);
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
  el.appendChild(content);
  return el;
}

// -----------------------------------------------------------
// GRID RENDEREN
// -----------------------------------------------------------
function renderGrid(routes, gridEl) {

  // Grid leegmaken
  gridEl.innerHTML = "";

  // Geen resultaten gevonden
  if (!routes?.length) {
    const p = document.createElement("p");
    p.className = "routes-grid__status";
    p.textContent = t("empty");
    gridEl.appendChild(p);

    // Teller leegmaken
    updateCount([]);
    return;
  }

  // Published bovenaan, drafts onderaan
  const sorted = [...routes].sort((a, b) => {
    if (a.status === "draft" && b.status !== "draft") return 1;
    if (a.status !== "draft" && b.status === "draft") return -1;
    return new Date(b.published_date || 0) - new Date(a.published_date || 0);
  });

  // Fragment gebruiken voor betere performance
  const fragment = document.createDocumentFragment();
  sorted.forEach((route) => {
    fragment.appendChild(createRouteTile(route));
  });
  gridEl.appendChild(fragment);

  // Teller bijwerken op basis van de zichtbare routes
  updateCount(routes);

}

// -----------------------------------------------------------
// TELLER BIJWERKEN
// -----------------------------------------------------------
function updateCount(routes) {

  // Aantal drafts tellen
  const draft = routes.filter((route) => route.status === "draft").length;

  // Aantal gepubliceerde routes tellen
  const published = routes.filter((route) => route.status === "published").length;

  // Totaal aantal routes bepalen
  const total = routes.length;

  // Element ophalen
  const countEl = document.getElementById("wandelingen-count");

  // Tekst bijwerken
  if (countEl) {
    countEl.textContent = `${draft} draft / ${published} published / ${total} wandelingen`;
  }
}

// -----------------------------------------------------------
// INIT
// -----------------------------------------------------------
async function initWandelingen() {

  // Grid ophalen
  const gridEl = document.getElementById("routes-grid");
  if (!gridEl) return;

  // Tijdelijke laadtekst tonen
  gridEl.innerHTML = `<p class="routes-grid__status">${t("loading")}</p>`;

  // Wachten tot de applicatie volledig is geladen
  await window.appReady;

  // Titel instellen
  try {
    document.title = t("pageTitle");
  } catch (_) {}

  // Paginakop instellen
  const heading = document.querySelector(".wandelingen-header__title");
  if (heading) {
    heading.textContent = t("heading");
  }

  // Routes laden
  const routes = await loadRoutes();
  if (!routes) {
    gridEl.innerHTML = `<p class="routes-grid__status routes-grid__status--error">${t("error")}</p>`;
    return;
  }

  // Routes bewaren voor filtering
  allRoutes = routes;

  // Filters vullen
  populateFilters(routes);

  // Grid tonen
  renderGrid(routes, gridEl);

  // Filters koppelen
  ["filter-difficulty", "filter-country", "filter-region", "filter-place"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", applyFilters);
  });

  // Resetknop koppelen
  document.getElementById("filter-reset")?.addEventListener("click", () => {
    ["filter-difficulty", "filter-country", "filter-region", "filter-place"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = "";
      }
    });
    renderGrid(allRoutes, gridEl);
  });
}

// Applicatie starten zodra de pagina klaar is
document.addEventListener("DOMContentLoaded", initWandelingen);
