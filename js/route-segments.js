// ======================= ROUTE SEGMENTS RENDERER =======================
// Rendert segmentkaarten voor route.html en later creator-preview.
"use strict";

// ======================= SEGMENTWAARDE FORMATTER =======================
// Toont alleen null/undefined als leeg. 0 kan geldig zijn.
function routeHasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

// ======================= ROUTE SEGMENTEN RENDEREN =======================
// Toont alle segmenten als compacte tabellen met vervoer-badge,
// GPX-stats en weerdata per segment.
function renderSegments(route) {
  console.log("[renderSegments] route.segments =", route.segments);
  const segments = route.segments;

  if (!segments?.length) return;

  const container = document.getElementById("route-segments");

  if (!container) return;

  container.innerHTML = "";

  segments.forEach((seg, idx) => {
    const color = window.TRANSPORT_COLORS?.[seg.transport] || "#2980B9";

    const transportLabel =
      window.TRANSPORT_LABELS?.[seg.transport] ||
      seg.transport ||
      "—";

    const g = seg.gpx?.stats || null;
    const w = seg.weather;
    const diffLabel = seg.difficulty || "—";

    const headerText =
      seg.label && seg.label !== transportLabel
        ? `${transportLabel} — ${seg.label}`
        : transportLabel;

    const gpxRows = [
      routeHasValue(g?.distance_km)
        ? `<tr><td>Afstand</td><td>${g.distance_km} km</td></tr>`
        : "",
      
      routeHasValue(g?.duration_hours)
        ? `<tr><td>Duur</td><td>${g.duration_hours} u</td></tr>`
        : "",

      routeHasValue(g?.elevation_up_m)
        ? `<tr><td>Stijging</td><td>+${g.elevation_up_m} m</td></tr>`
        : "",

      routeHasValue(g?.elevation_down_m)
        ? `<tr><td>Daling</td><td>-${g.elevation_down_m} m</td></tr>`
        : "",

      routeHasValue(g?.avg_speed_kmh)
        ? `<tr><td>Gem. snelheid</td><td>${g.avg_speed_kmh} km/u</td></tr>`
        : "",

      routeHasValue(g?.max_speed_kmh)
        ? `<tr><td>Max. snelheid</td><td>${g.max_speed_kmh} km/u</td></tr>`
        : "",

      routeHasValue(g?.highest_point_m)
        ? `<tr><td>Hoogste punt</td><td>${g.highest_point_m} m</td></tr>`
        : "",

      routeHasValue(g?.lowest_point_m)
        ? `<tr><td>Laagste punt</td><td>${g.lowest_point_m} m</td></tr>`
        : "",

      seg.difficulty
        ? `<tr><td>Moeilijkheid</td><td>${diffLabel}</td></tr>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    const weatherRows = w
      ? [
          `<tr><td>🌡 Temperatuur</td><td>${w.temperature_min ?? "—"}° – ${w.temperature_max ?? "—"}°C</td></tr>`,

          w.precipitation_mm != null
            ? `<tr><td>💧 Neerslag</td><td>${w.precipitation_mm} mm</td></tr>`
            : "",

          w.wind_kmh != null
            ? `<tr><td>🍃 Wind</td><td>${w.wind_kmh} km/u</td></tr>`
            : "",

          w.condition
            ? `<tr><td>☀️ Conditie</td><td>${w.condition}</td></tr>`
            : "",
        ]
          .filter(Boolean)
          .join("")
      : "";

    const hasGpx = gpxRows.length > 0;
    const hasWeather = weatherRows.length > 0;

    const div = document.createElement("div");

    div.className = "route-segment-block";
    div.style.borderLeftColor = color;

 div.innerHTML = `
  <div class="route-segment-block__header" style="background:${color};">
    <span class="route-segment-block__num">${idx + 1}</span>
    <span class="route-segment-block__label">${headerText}</span>
  </div>

  <div class="route-segment-block__tables">

    <!-- Linkerkolom: datum, locatie en weer -->
    <div class="route-segment-block__col route-segment-block__col--context">

      <!-- Datum en locatie worden in de volgende stap toegevoegd -->
      <div class="route-segment-block__meta">
  ${
    routeHasValue(seg.date)
      ? `<p class="route-segment-block__meta-row"><strong>📅 Datum:</strong> ${seg.date}</p>`
      : ""
  }

  ${
    routeHasValue(seg.location)
      ? `<p class="route-segment-block__meta-row"><strong>📍 Locatie:</strong> ${seg.location}</p>`
      : ""
  }

${
  routeHasValue(seg.date) || routeHasValue(seg.location)
    ? `
      <br>
      <hr class="route-segment-block__divider">
      <br>
    `
    : ""
}
</div>

      ${
        hasWeather
          ? `
        <div class="route-segment-block__weather">
          <p class="route-segment-table__title">Weerdata</p>

          <table class="route-segment-table">
            <tbody>${weatherRows}</tbody>
          </table>
        </div>
      `
          : ""
      }
    </div>

    <!-- Rechterkolom: routegegevens -->
    <div class="route-segment-block__col route-segment-block__col--route">
      ${
        hasGpx
          ? `
        <table class="route-segment-table">
          <tbody>${gpxRows}</tbody>
        </table>
      `
          : ""
      }
    </div>

    ${
      !hasGpx && !hasWeather
        ? `<p class="route-segment-block__empty">Geen data beschikbaar voor dit segment.</p>`
        : ""
    }
  </div>
`;

    container.appendChild(div);
  });

  const section = document.getElementById("section-segments");

  if (section) section.hidden = false;
}

// ======================= GLOBAL EXPORT =======================
// Maakt segmentrenderer beschikbaar voor route.js en later creator.js.
window.routeHasValue = routeHasValue;
window.renderSegments = renderSegments;
