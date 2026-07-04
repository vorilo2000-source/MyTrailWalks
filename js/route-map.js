// =======================================================
// route-map.js — MyTrailWalks
// Fullscreen kaartpagina per route (route-map.html)
// v1.0.0: laadt route JSON op basis van ?id= parameter,
//         tekent alle segmenten met TRANSPORT_COLORS identiek
//         aan route.js. Valt terug op legacy gpx_stats als
//         segments ontbreekt.
// =======================================================
"use strict";

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------------
// KLEURCODE PER VERVOERSMIDDEL
// Identiek aan route.js en creator.js — niet wijzigen zonder
// ook die bestanden bij te werken.
// -----------------------------------------------------------
const TRANSPORT_COLORS = {
  walking:    "#E8800A",
  hike:       "#9B59B6",
  cycling:    "#2980B9",
  motorcycle: "#E74C3C",
  car:        "#16A085",
  train:      "#F39C12",
  bus:        "#8E44AD",
  boat:       "#1ABC9C",
  plane:      "#2C3E50",
};

const TRANSPORT_LABELS = {
  walking:    "🚶 Wandelen",
  hike:       "🥾 Adventure",
  cycling:    "🚴 Fietsen",
  motorcycle: "🏍 Motor",
  car:        "🚗 Auto",
  train:      "🚆 Trein",
  bus:        "🚌 Bus",
  boat:       "⛵ Boot",
  plane:      "✈️ Vliegtuig",
};

// -----------------------------------------------------------
// Haal route-ID op uit ?id= query parameter
// -----------------------------------------------------------
function getRouteId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || null;
}

// -----------------------------------------------------------
// Laad route JSON
// -----------------------------------------------------------
async function loadRoute(id) {
  try {
    const resp = await fetch(`/MyTrailWalks/routes/${id}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error("[route-map.js] Route laden mislukt:", err);
    return null;
  }
}

// -----------------------------------------------------------
// Herpars trackpunten uit GPX-string
// Identiek aan _parseTrackPointsFromGpx in route.js —
// fallback voor JSON-exports zonder track_points.
// Samplet tot max 500 punten.
// -----------------------------------------------------------
function parseTrackPointsFromGpx(gpxRaw) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxRaw, "application/xml");
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));
    if (trkpts.length < 2) return null;
    const step = Math.max(1, Math.floor(trkpts.length / 500));
    const points = [];
    for (let i = 0; i < trkpts.length; i += step) {
      points.push([
        parseFloat(trkpts[i].getAttribute("lat")),
        parseFloat(trkpts[i].getAttribute("lon")),
      ]);
    }
    return points;
  } catch (err) {
    console.warn("[route-map.js] GPX herparsing mislukt:", err);
    return null;
  }
}

// -----------------------------------------------------------
// Bouw legenda op basis van de vervoersmiddelen in de route
// -----------------------------------------------------------
function renderLegend(items) {
  // Deduplicate op transport-type
  const seen = new Map();
  items.forEach((item) => {
    if (!seen.has(item.transport)) {
      seen.set(item.transport, { color: item.color, label: item.label });
    }
  });

  if (seen.size === 0) return;

  const container = $("map-legend__items");
  seen.forEach(({ color, label }) => {
    const div = document.createElement("div");
    div.className = "map-legend__item";
    div.innerHTML = `
      <span class="map-legend__dot" style="background:${color};"></span>
      <span>${label}</span>
    `;
    container.appendChild(div);
  });

  $("map-legend").hidden = false;
}

// -----------------------------------------------------------
// Initialiseer Leaflet kaart en teken segmenten
// -----------------------------------------------------------
async function initMap(route) {
  const lang = i18nModule?.language?.substring(0, 2) || "nl";

  // Routetitel in de header zetten
  const title = typeof route.title === "object"
    ? route.title[lang] || route.title.nl || ""
    : route.title || "";
  $("map-route-title").textContent = title;
  document.title = `Kaart — ${title} — MyTrailWalks`;

  // Bepaal te tekenen items — segmenten of legacy fallback
  const segments = route.segments?.filter((s) => s.gpx_stats?.start_lat) || [];
  const hasSegments = segments.length > 0;
  const legacy = route.gpx_stats;

  if (!hasSegments && !legacy?.start_lat) {
    // Geen kaartdata beschikbaar
    $("map-loading").textContent = "Geen kaartdata beschikbaar voor deze route.";
    return;
  }

  // Items opbouwen — elk item heeft lat/lon, trackpoints, kleur en label
  const items = hasSegments
    ? segments.map((seg) => ({
        transport: seg.transport || "walking",
        lat: seg.gpx_stats.start_lat,
        lon: seg.gpx_stats.start_lon,
        trackPoints: seg.gpx_stats.track_points || null,
        gpxRaw: seg.gpx_raw || null,
        color: TRANSPORT_COLORS[seg.transport] || "#2C4A3B",
        label: seg.label
          ? `${TRANSPORT_LABELS[seg.transport] || seg.transport} — ${seg.label}`
          : TRANSPORT_LABELS[seg.transport] || seg.transport || "Segment",
      }))
    : [{
        transport: "walking",
        lat: legacy.start_lat,
        lon: legacy.start_lon,
        trackPoints: legacy.track_points || null,
        gpxRaw: route.gpx_raw || null,
        color: "#2C4A3B",
        label: "Startpunt",
      }];

  // Leaflet kaart aanmaken — scrollWheelZoom aan op fullscreen pagina
  const map = L.map("fullscreen-map", {
    zoomControl: true,
    scrollWheelZoom: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  const allBounds = [];
  let firstLat = null;
  let firstLon = null;

  for (const item of items) {
    if (firstLat === null) { firstLat = item.lat; firstLon = item.lon; }

    // Track_points ophalen — direct of herparsed uit gpx_raw
    let trackPoints = item.trackPoints;
    if (!trackPoints && item.gpxRaw) {
      trackPoints = parseTrackPointsFromGpx(item.gpxRaw);
    }

    if (trackPoints?.length > 1) {
      // Teken polyline voor dit segment
      L.polyline(trackPoints, {
        color: item.color,
        weight: 4,        // iets dikker dan preview-kaart voor fullscreen leesbaarheid
        opacity: 0.9,
      }).addTo(map).bindPopup(item.label);
      allBounds.push(...trackPoints);
    } else {
      // Geen trackpunten — toon enkel startmarker
      allBounds.push([item.lat, item.lon]);
    }

    // Startmarker per segment
    L.circleMarker([item.lat, item.lon], {
      radius: 8,
      fillColor: item.color,
      color: "#fff",
      weight: 2,
      fillOpacity: 1,
    }).addTo(map).bindPopup(item.label);
  }

  // Kaart fitten op alle segmenten samen
  if (allBounds.length > 1) {
    map.fitBounds(allBounds, { padding: [24, 24] });
  } else if (firstLat !== null) {
    map.setView([firstLat, firstLon], 13);
  }

  // Legenda opbouwen
  renderLegend(items);

  // Laadindicator verbergen zodra kaart klaar is
  $("map-loading").classList.add("hidden");
}

// -----------------------------------------------------------
// INIT — wacht op appReady (zelfde patroon als route.js)
// -----------------------------------------------------------
window.appReady.then(async () => {
  const id = getRouteId();
  if (!id) {
    $("map-loading").textContent = "Geen route-ID gevonden in de URL.";
    return;
  }

  const route = await loadRoute(id);
  if (!route) {
    $("map-loading").textContent = "Route kon niet worden geladen.";
    return;
  }

  await initMap(route);
});
