// ======================= ROUTE MAP RENDERER =======================
// Rendert de Leaflet-routekaart voor route.html en creator-preview.
// Gebruikt uitsluitend het nieuwe model: segments[].gpx.
"use strict";

// ======================= KAARTINSTANCE =======================
// Bewaart de actieve Leaflet-kaart zodat her-renderen mogelijk blijft.
let routeMapInstance = null;

// ======================= TRACKPUNTEN OPHALEN =======================
// Gebruikt eerst gpx.stats.track_points.
// Bouwt anders trackpunten uit gpx.tracks[].segments[].points[].
function collectRouteTrackPoints(gpx) {
  const statsPoints = gpx?.stats?.track_points;

  if (Array.isArray(statsPoints) && statsPoints.length > 1) {
    return statsPoints;
  }

  const points = (gpx?.tracks || [])
    .flatMap((track) => track.segments || [])
    .flatMap((segment) => segment.points || [])
    .filter((point) =>
      point &&
      typeof point.lat === "number" &&
      typeof point.lon === "number"
    )
    .map((point) => [point.lat, point.lon]);

  if (points.length < 2) {
    return null;
  }

  const step = Math.max(1, Math.floor(points.length / 500));

  return points.filter((_, index) => index % step === 0);
}

// ======================= KAART RENDEREN =======================
// Rendert alle segmenten met een geldig gpx-object en startpunt.
function renderMap(route) {
  const segments = (route.segments || []).filter((segment) => {
    const stats = segment.gpx?.stats;

    return (
      stats &&
      typeof stats.start_lat === "number" &&
      typeof stats.start_lon === "number"
    );
  });

  if (segments.length === 0) {
    return;
  }

  const section = document.getElementById("section-map");

  if (section) {
    section.hidden = false;
  }

  const items = segments.map((segment) => {
    const stats = segment.gpx.stats;

    return {
      lat: stats.start_lat,
      lon: stats.start_lon,
      trackPoints: collectRouteTrackPoints(segment.gpx),
      color:
        window.TRANSPORT_COLORS?.[segment.transport] ||
        "#2C4A3B",
      label:
        segment.label ||
        window.TRANSPORT_LABELS?.[segment.transport] ||
        segment.transport ||
        "Segment",
    };
  });

  window.setTimeout(() => {
    if (routeMapInstance) {
      routeMapInstance.remove();
      routeMapInstance = null;
    }

    routeMapInstance = L.map("route-map", {
      zoomControl: true,
      scrollWheelZoom: false,
    });

    const map = routeMapInstance;

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }
    ).addTo(map);

    const allBounds = [];
    let firstLat = null;
    let firstLon = null;

    items.forEach((item) => {
      if (firstLat === null) {
        firstLat = item.lat;
        firstLon = item.lon;
      }

      if (item.trackPoints?.length > 1) {
        L.polyline(item.trackPoints, {
          color: item.color,
          weight: 3,
          opacity: 0.85,
        }).addTo(map);

        allBounds.push(...item.trackPoints);
      } else {
        allBounds.push([item.lat, item.lon]);
      }

      L.circleMarker([item.lat, item.lon], {
        radius: 7,
        fillColor: item.color,
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup(item.label);
    });

    if (allBounds.length > 1) {
      map.fitBounds(allBounds, {
        padding: [16, 16],
      });
    } else if (firstLat !== null) {
      map.setView([firstLat, firstLon], 13);
    }

    const btnMap = document.getElementById("btn-open-map");

    if (btnMap && firstLat !== null) {
      btnMap.hidden = false;
      btnMap.innerHTML = "<span>🗺</span> Route openen";

      btnMap.onclick = () => {
        const id = window.getRouteId
          ? window.getRouteId()
          : null;

        window.location.href =
          `/MyTrailWalks/routes/route-map.html?id=${id}`;
      };
    }
  }, 50);
}

// ======================= GLOBAL EXPORT =======================
// Maakt de kaartfuncties beschikbaar voor route.js en creator.js.
window.collectRouteTrackPoints = collectRouteTrackPoints;
window.renderMap = renderMap;
