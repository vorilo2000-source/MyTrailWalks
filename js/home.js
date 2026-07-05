// =======================================================
// home.js — v2.7.0
// MyTrailWalks — homepage init
// v2.7.0: alle JSON bestanden gecentraliseerd in routes/ map.
//         Index bestanden hernoemd met underscore prefix (_) zodat
//         ze bovenaan staan in de folder.
//         _routes-index.json, _dagtrips-index.json, _adventure-index.json
//         staan allemaal in routes/.
// v2.6.0: adventure-grid (#adventure-grid) toegevoegd
// v2.5.0: loadRoutes() veralgemeend tot loadItems(indexPath, folder)
// v2.4.0: laadt routes via routes-index.json + individuele [id].json
// v2.3.0: max 3 routes tonen, link naar routes/route.html?id=
// v2.2.0: i18nModule.init() verwijderd — app.js initialiseert centraal
// =======================================================
"use strict";

// Alle categorieen laden vanuit routes/ map
const ROUTES_INDEX_PATH = "routes/_routes-index.json";
const ROUTES_FOLDER = "routes";

const DAGTRIPS_INDEX_PATH = "routes/_dagtrips-index.json";
const DAGTRIPS_FOLDER = "routes";

const ADVENTURE_INDEX_PATH = "routes/_adventure-index.json";
const ADVENTURE_FOLDER = "routes";

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
  const lang = (i18nModule?.language || "nl").substring(0, 2);

  const title =
    typeof route.title === "object"
      ? route.title[lang] || route.title.nl || route.title.en || ""
      : route.title || route.name || "";

  const hero =
    route.photos?.find((p) => p.role === "hero")?.url ||
    route.photos?.[0]?.url ||
    route.hero ||
    null;

  const stats = route.gpx_stats || {};
  const isDraft = route.status === "draft";

  const tile = document.createElement("a");
  tile.className = "route-tile" + (isDraft ? " route-tile--draft" : "");
  tile.href = "routes/route.html?id=" + route.id;
  tile.setAttribute("role", "listitem");
  tile.setAttribute("aria-label", title);

  // Hero foto
  const heroWrap = document.createElement("div");
  heroWrap.className = "route-tile__hero-wrap";
  if (hero) {
    const img = document.createElement("img");
    img.className = "route-tile__hero";
    img.src = hero;
    img.alt = title;
    img.loading = "lazy";
    img.onerror = () => img.removeAttribute("src");
    heroWrap.appendChild(img);
  }

  // Moeilijkheid badge
  if (route.difficulty) {
    const badge = document.createElement("span");
    badge.className = "route-tile__difficulty-badge";
    badge.textContent = DIFFICULTY_LABELS[route.difficulty] || route.difficulty;
    heroWrap.appendChild(badge);
  }

  const statusBadge = document.createElement("span");
  statusBadge.className = isDraft
    ? "route-tile__status-badge route-tile__status-badge--draft"
    : "route-tile__status-badge route-tile__status-badge--final";
  statusBadge.textContent = isDraft ? "Draft" : "Final";
  heroWrap.appendChild(statusBadge);
  tile.appendChild(heroWrap);

  // Inhoud
  const content = document.createElement("div");
  content.className = "route-tile__content";

  const name = document.createElement("h3");
  name.className = "route-tile__name";
  name.textContent = title;
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
    { value: stats.distance_km, unit: " km", label: "afstand" },
    { value: stats.duration_hours, unit: " u", label: "duur" },
    { value: stats.elevation_up_m, unit: " m", label: "stijging" },
  ].forEach(function(s) {
    const stat = document.createElement("div");
    stat.className = "route-tile__stat";
    const val = s.value > 0 ? s.value + s.unit : "—";
    stat.innerHTML = "<span class=\"stat-value\">" + val + "</span><span class=\"stat-label\">" + s.label + "</span>";
    statsRow.appendChild(stat);
  });

  content.appendChild(statsRow);
  tile.appendChild(content);
  return tile;
}

// emptyMessage laat toe om per categorie een eigen lege-staat tekst te tonen
function renderGrid(routes, gridEl, emptyMessage) {
  emptyMessage = emptyMessage || "Nog geen items beschikbaar.";
  gridEl.innerHTML = "";

  if (!routes || !routes.length) {
    showStatus(gridEl, emptyMessage);
    return;
  }

  // Max 3 items — gesorteerd op datum (meest recent eerst)
  const top3 = routes.slice().sort(function(a, b) {
    return new Date(b.published_date || 0) - new Date(a.published_date || 0);
  }).slice(0, 3);

  const fragment = document.createDocumentFragment();
  top3.forEach(function(route) {
    fragment.appendChild(createRouteTile(route));
  });
  gridEl.appendChild(fragment);
}

// Generieke laadfunctie voor elke categorie
async function loadItems(indexPath, folder) {
  try {
    // Stap 1: laad de index
    const indexResp = await fetch(indexPath);
    if (!indexResp.ok) throw new Error("Index HTTP " + indexResp.status);
    const ids = await indexResp.json();

    // Stap 2: laad elk item parallel
    const results = await Promise.allSettled(
      ids.map(function(id) {
        return fetch(folder + "/" + id + ".json").then(function(r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        });
      })
    );

    return results
      .filter(function(r) { return r.status === "fulfilled"; })
      .map(function(r) { return r.value; });

  } catch (err) {
    console.error("home.js: laden mislukt voor " + indexPath, err);
    return null;
  }
}

async function initHomePage() {
  const routesGridEl = document.getElementById("routes-grid");
  const dagtripsGridEl = document.getElementById("dagtrips-grid");
  const adventureGridEl = document.getElementById("adventure-grid");

  if (!routesGridEl && !dagtripsGridEl && !adventureGridEl) return;

  if (routesGridEl) showStatus(routesGridEl, "Laden...");
  if (dagtripsGridEl) showStatus(dagtripsGridEl, "Laden...");
  if (adventureGridEl) showStatus(adventureGridEl, "Laden...");

  if (window.appReady) await window.appReady;

  try { document.title = i18nModule.t("home:page.title"); } catch (_) {}

  // Elke categorie onafhankelijk laden
  if (routesGridEl) {
    const routes = await loadItems(ROUTES_INDEX_PATH, ROUTES_FOLDER);
    if (!routes) {
      showStatus(routesGridEl, "Wandelingen konden niet worden geladen.", true);
    } else {
      renderGrid(routes, routesGridEl, "Nog geen wandelingen beschikbaar.");
    }
  }

  if (dagtripsGridEl) {
    const dagtrips = await loadItems(DAGTRIPS_INDEX_PATH, DAGTRIPS_FOLDER);
    if (!dagtrips) {
      showStatus(dagtripsGridEl, "Dagtrips konden niet worden geladen.", true);
    } else {
      renderGrid(dagtrips, dagtripsGridEl, "Nog geen dagtrips beschikbaar.");
    }
  }

  if (adventureGridEl) {
    const adventure = await loadItems(ADVENTURE_INDEX_PATH, ADVENTURE_FOLDER);
    if (!adventure) {
      showStatus(adventureGridEl, "Adventure items konden niet worden geladen.", true);
    } else {
      renderGrid(adventure, adventureGridEl, "Nog geen adventure beschikbaar.");
    }
  }
}

document.addEventListener("DOMContentLoaded", initHomePage);
