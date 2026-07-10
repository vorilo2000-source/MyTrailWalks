// ======================= ROUTE MAP RENDERER =======================
// Rendert de Leaflet routekaart voor route.html en later creator-preview.
// -----------------------------------------------------------
"use strict";
let routeMapInstance = null;

function renderMap(route) {
  const segments = route.segments?.filter((s) => s.gpx_stats?.start_lat) || [];
  const hasSegments = segments.length > 0;
  const legacy = route.gpx_stats;

  if (!hasSegments && !legacy?.start_lat) return;

  $("section-map").hidden = false;

  // Bouw lijst van te tekenen items op — elk item heeft start_lat/lon,
  // optionele track_points, optionele gpx_raw als fallback, transport en label
  const items = hasSegments
    ? segments.map((seg) => ({
        lat: seg.gpx_stats.start_lat,
        lon: seg.gpx_stats.start_lon,
        trackPoints: seg.gpx_stats.track_points || null,
        gpxRaw: seg.gpx_raw || null,
        color: window.TRANSPORT_COLORS?.[seg.transport] || "#2C4A3B",
        label: seg.label || window.TRANSPORT_LABELS?.[seg.transport] || seg.transport || "Segment",
      }))
    : [{
        lat: legacy.start_lat,
        lon: legacy.start_lon,
        trackPoints: legacy.track_points || null,
        gpxRaw: route.gpx_raw || null,
        color: "#2C4A3B",
        label: "Startpunt",
      }];

  setTimeout(async () => {
 if (routeMapInstance) {
  routeMapInstance.remove();
  routeMapInstance = null;
}

routeMapInstance = L.map("route-map", {
  zoomControl: true,
  scrollWheelZoom: false,
});

const map = routeMapInstance;
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    const allBounds = [];
    let firstLat = null;
    let firstLon = null;

    for (const item of items) {
      if (firstLat === null) { firstLat = item.lat; firstLon = item.lon; }

      // track_points ophalen — ofwel direct aanwezig, ofwel herparsed uit gpx_raw
      let trackPoints = item.trackPoints;
      if (!trackPoints && item.gpxRaw) {
        trackPoints = _parseTrackPointsFromGpx(item.gpxRaw);
      }

      if (trackPoints?.length > 1) {
        L.polyline(trackPoints, { color: item.color, weight: 3, opacity: 0.85 }).addTo(map);
        allBounds.push(...trackPoints);
      } else {
        allBounds.push([item.lat, item.lon]);
      }

      L.circleMarker([item.lat, item.lon], {
        radius: 7, fillColor: item.color, color: "#fff", weight: 2, fillOpacity: 1,
      }).addTo(map).bindPopup(item.label);
    }

    // Kaart fitten op alle segmenten
    if (allBounds.length > 1) {
      map.fitBounds(allBounds, { padding: [16, 16] });
    } else if (firstLat !== null) {
      map.setView([firstLat, firstLon], 13);
    }

    // "Route openen" knop — eerste startpunt
    const btnMap = $("btn-open-map");
    if (btnMap && firstLat !== null) {
      btnMap.hidden = false;
      btnMap.innerHTML = `<span>🗺</span> Route openen`;
      btnMap.addEventListener("click", () => {
  const id = window.getRouteId ? window.getRouteId() : null;
  window.location.href = `/MyTrailWalks/routes/route-map.html?id=${id}`;
});
    }
  }, 50);
}

/**
 * Herpars trackpunten uit een GPX-string.
 * Fallback voor JSON-bestanden geëxporteerd door creator.js < v2.4.1
 * waarbij track_points ontbrak in segments[].gpx_stats.
 * Samplet tot max 500 punten, identiek aan de creator-logica.
 * @param {string} gpxRaw - Volledige GPX XML als string
 * @returns {Array<[number,number]>|null} Array van [lat,lon] paren of null
 */
function _parseTrackPointsFromGpx(gpxRaw) {
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
window.renderMap = renderMap;
window._parseTrackPointsFromGpx = _parseTrackPointsFromGpx;
