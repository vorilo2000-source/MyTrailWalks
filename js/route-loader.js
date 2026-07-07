// ======================= ROUTE LOADER =======================
// Laadt route JSON en normaliseert de data voor route.html en later creator-preview.
"use strict";

// ======================= BASE PATH BEREKENEN =======================
// Bepaalt relatief pad vanaf huidige pagina naar projectroot.
function getBasePath() {
  const segments = window.location.pathname
    .split("/")
    .filter(Boolean)
    .filter((seg) => !seg.endsWith(".html"));

  const depth = Math.max(0, segments.length - 1);

  return depth > 0 ? "../".repeat(depth) : "";
}

// ======================= ROUTE ID OPHALEN =======================
// Leest ?id=... of gebruikt bestandsnaam als fallback.
function getRouteId() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("id")) return params.get("id");

  const path = window.location.pathname;
  const filename = path.split("/").pop().replace(".html", "");

  if (filename && filename !== "index") return filename;

  return null;
}

// ======================= ROUTE JSON LADEN =======================
// Laadt JSON uit /routes/ en past normalizeRouteJson toe indien beschikbaar.
async function loadRoute(id) {
  try {
    const base = getBasePath();

    const normalizedId = id.endsWith(".json") ? id : `${id}.json`;

    const finalUrl = id.includes("/")
      ? id
      : `${base}routes/${normalizedId}`;

    console.info("[route-loader] Route JSON laden van:", finalUrl);

    const resp = await fetch(finalUrl);

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} bij laden van route JSON: ${finalUrl}`);
    }

    const parsed = await resp.json();

    const data = typeof normalizeRouteJson === "function"
      ? normalizeRouteJson(parsed)
      : parsed;

    console.info("[route-loader] Route JSON geladen en genormaliseerd");

    return data;
  } catch (err) {
    console.error("[route-loader] Route laden mislukt:", err);
    return null;
  }
}

// ======================= GLOBAL EXPORT =======================
// Maakt functies beschikbaar voor route.js en later creator.js.
window.getBasePath = getBasePath;
window.getRouteId = getRouteId;
window.loadRoute = loadRoute;
