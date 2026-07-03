// =======================================================
// adventure.js — MyTrailWalks
// Adventure overzicht pagina
// v1.0.0: identieke logica aan dagtrips.js v1.0.0 (filters, tiles,
//         sortering), laadt uit adventure/adventure-index.json +
//         adventure/[id].json. Route detail hergebruikt
//         routes/route.html + route.js. Voorheen gepland als
//         "Trails" — hernoemd naar "Adventure".
// =======================================================
"use strict";

// Hergebruikt "wandelingen" i18n-namespace voor stats/units/empty/loading/error
function t(key) {
  try { return i18nModule.t(`wandelingen:${key}`); } catch (_) { return key; }
}

const DIFFICULTY_LABELS = {
  T1: "T1 — Wandelen", T2: "T2 — Bergwandeling", T3: "T3 — Veeleisend",
  T4: "T4 — Alpien", T5: "T5 — Veeleisend alpien", T6: "T6 — Moeilijk alpien",
  easy: "Gemakkelijk", medium: "Gemiddeld", hard: "Zwaar",
};

let allRoutes = [];

async function loadRoutes() {
  const indexUrl = "adventure/adventure-index.json";
  console.log("adventure.js: index laden van", indexUrl);

  try {
    const indexResp = await fetch(indexUrl);
    if (!indexResp.ok) throw new Error(`Index HTTP ${indexResp.status}`);

    const ids = await indexResp.json();
    console.log("adventure.js: index geladen", ids);

    const results = await Promise.allSettled(
      ids.map((id) => {
        const url = `adventure/${id}.json`;
        console.log("adventure.js: item laden van", url);

        return fetch(url).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} voor ${url}`);
          return r.json();
        });
      })
    );

    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn(`adventure.js: item ${ids[i]} mislukt:`, r.reason);
      }
    });

    return results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

  } catch (err) {
    console.error("adventure.js: laden mislukt", err);
    return null;
  }
}

function populateFilters(routes) {
  const countries = [...new Set(routes.map((r) => r.country).filter(Boolean))].sort();
  const regions = [...new Set(routes.map((r) => r.region).filter(Boolean))].sort();
  const places = [...new Set(routes.map((r) => r.place).filter(Boolean))].sort();

  fillSelect("filter-country", countries);
  fillSelect("filter-region", regions);
  fillSelect("filter-place", places);
}

function fillSelect(id, values) {
  const sel = document.getElementById(id);
  if (!sel) return;

  values.forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    sel.appendChild(opt);
  });
}

function getActiveFilters() {
  return {
    difficulty: document.getElementById("filter-difficulty")?.value || "",
    country: document.getElementById("filter-country")?.value || "",
    region: document.getElementById("filter-region")?.value || "",
    place: document.getElementById("filter-place")?.value || "",
  };
}

function applyFilters() {
  const { difficulty, country, region, place } = getActiveFilters();
  const gridEl = document.getElementById("routes-grid");

  const filtered = allRoutes.filter((route) => {
    if (difficulty && route.difficulty !== difficulty) return false;
    if (country && route.country !== country) return false;
    if (region && route.region !== region) return false;
    if (place && route.place !== place) return false;
    return true;
  });

  renderGrid(filtered, gridEl);
}

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

function renderGrid(routes, gridEl) {
  gridEl.innerHTML = "";

  if (!routes?.length) {
    const p = document.createElement("p");
    p.className = "routes-grid__status";
    p.textContent = t("empty");
    gridEl.appendChild(p);
    updateCount([]);
    return;
  }

  const sorted = [...routes].sort((a, b) => {
    if (a.status === "draft" && b.status !== "draft") return 1;
    if (a.status !== "draft" && b.status === "draft") return -1;
    return new Date(b.published_date || 0) - new Date(a.published_date || 0);
  });

  const fragment = document.createDocumentFragment();
  sorted.forEach((route) => {
    fragment.appendChild(createRouteTile(route));
  });
  gridEl.appendChild(fragment);

  updateCount(routes);
}

function updateCount(routes) {
  const draft = routes.filter((route) => route.status === "draft").length;
  const published = routes.filter((route) => route.status === "published").length;
  const total = routes.length;

  const countEl = document.getElementById("wandelingen-count");
  if (countEl) {
    countEl.textContent = `${draft} draft / ${published} published / ${total} adventure`;
  }
}

async function initAdventure() {
  const gridEl = document.getElementById("routes-grid");
  if (!gridEl) return;

  gridEl.innerHTML = `<p class="routes-grid__status">${t("loading")}</p>`;

  await window.appReady;

  try {
    document.title = "Adventure — MyTrailWalks";
  } catch (_) {}

  const heading = document.querySelector(".wandelingen-header__title");
  if (heading) {
    heading.textContent = "Adventure";
  }

  const routes = await loadRoutes();
  if (!routes) {
    gridEl.innerHTML = `<p class="routes-grid__status routes-grid__status--error">${t("error")}</p>`;
    return;
  }

  allRoutes = routes;
  populateFilters(routes);
  renderGrid(routes, gridEl);

  ["filter-difficulty", "filter-country", "filter-region", "filter-place"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", applyFilters);
  });

  document.getElementById("filter-reset")?.addEventListener("click", () => {
    ["filter-difficulty", "filter-country", "filter-region", "filter-place"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    renderGrid(allRoutes, gridEl);
  });
}

document.addEventListener("DOMContentLoaded", initAdventure);
