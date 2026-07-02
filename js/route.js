// =======================================================
// route.js — MyTrailWalks
// Route detail pagina: laadt JSON en rendert route
// v2.4.0: rood-omcirkeld stats/weer/vervoer-blok verwijderd (dubbel met
//         segmenten-sectie) — vervoer + label nu altijd samen in de
//         gekleurde segment-header (voorheen ontbrak vervoer soms per
//         segment als er geen apart "label" veld was ingevuld)
// v2.3.0: segmenten-sectie met compacte tabel per segment,
//         heldere kleurenpalet voor vervoersmiddelen
// v2.2.0: gpx_raw fallback voor ontbrekende track_points
// v2.1.0: kaart toont alle segmenten met kleurcode
// v2.0.0: nieuwe lay-out — 2-koloms, slideshow galerij, status badge
// =======================================================
"use strict";

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------------
// KLEURCODE PER VERVOERSMIDDEL — identiek aan creator.js
// zodat segment-kleuren consistent zijn tussen creator en route detail
// -----------------------------------------------------------
const TRANSPORT_COLORS = {
  walking:    "#E8800A",  // oranje
  hike:       "#9B59B6",  // paars
  cycling:    "#2980B9",  // blauw
  motorcycle: "#E74C3C",  // rood
  car:        "#16A085",  // teal
  train:      "#F39C12",  // geel-oranje
  bus:        "#8E44AD",  // violet
  boat:       "#1ABC9C",  // turquoise
  plane:      "#2C3E50",  // donkerblauw
};

const TRANSPORT_LABELS = {
  walking: "🚶 Wandelen", hike: "🥾 Hike / Trail", cycling: "🚴 Fietsen",
  motorcycle: "🏍 Motor", car: "🚗 Auto", train: "🚆 Trein",
  bus: "🚌 Bus", boat: "⛵ Boot", plane: "✈️ Vliegtuig",
};

function t(key) {
  try { return i18nModule.t(`route:${key}`); } catch (_) { return key; }
}

function getRouteId() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("id")) return params.get("id");
  const path = window.location.pathname;
  const filename = path.split("/").pop().replace(".html", "");
  if (filename && filename !== "index") return filename;
  return null;
}

async function loadRoute(id) {
  try {
    const resp = await fetch(`/MyTrailWalks/routes/${id}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error("Route laden mislukt:", err);
    return null;
  }
}

// -----------------------------------------------------------
// RENDER HERO
// -----------------------------------------------------------
function renderHero(route) {
  const lang = i18nModule?.language?.substring(0, 2) || "nl";
  const title = typeof route.title === "object"
    ? route.title[lang] || route.title.nl || ""
    : route.title || "";

  $("route-title").textContent = title;
  document.title = `${title} — MyTrailWalks`;

  if (route.location) $("route-location").textContent = route.location;
  if (route.region) $("route-region").textContent = route.region;

  const heroBg = $("route-hero-bg");
  const heroPhoto = route.photos?.find((p) => p.role === "hero")?.url || route.photos?.[0]?.url || "";
  if (heroPhoto) {
    heroBg.style.backgroundImage = `url('${heroPhoto}')`;
    heroBg.classList.add("has-photo");
  }

  // Status badge
  const statusEl = $("route-status-badge");
  if (statusEl && route.status) {
    const isDraft = route.status === "draft";
    const badge = document.createElement("span");
    badge.className = isDraft ? "route-status-badge route-status-badge--draft" : "route-status-badge route-status-badge--final";
    badge.textContent = isDraft ? "Draft" : "Final";
    statusEl.appendChild(badge);
  }

  // Moeilijkheid + datum badges
  const badges = $("route-badges");
  if (route.difficulty) {
    const badge = document.createElement("span");
    badge.className = "route-badge route-badge--difficulty";
    badge.textContent = route.difficulty;
    badges.appendChild(badge);
  }
  if (route.published_date) {
    const badge = document.createElement("span");
    badge.className = "route-badge";
    const date = new Date(route.published_date);
    badge.textContent = date.toLocaleDateString(lang === "en" ? "en-GB" : "nl-BE", {
      day: "numeric", month: "long", year: "numeric"
    });
    badges.appendChild(badge);
  }
}

// -----------------------------------------------------------
// RENDER BRONVERMELDING
// -----------------------------------------------------------
function renderSource(route) {
  if (!route.source_reference) return;
  const container = $("route-source");
  const a = document.createElement("a");
  a.className = "route-source__link";
  a.href = route.source_reference;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.innerHTML = `<span>🔗</span><span>${route.source_reference.replace(/^https?:\/\//, "")}</span>`;
  container.appendChild(a);
  $("section-source").hidden = false;
}

// -----------------------------------------------------------
// RENDER SEGMENTEN
// Toont alle segmenten als compacte tabellen met vervoer-badge,
// GPX-stats en weerdata. Alleen zichtbaar als er meerdere segmenten
// zijn of als segments array aanwezig is.
// Startpunt van elk segment = referentie voor de weerdata.
//
// v2.4.0: vervoersmiddel staat nu ALTIJD in de gekleurde header, ook
// als het segment geen eigen "label" heeft. Voorheen viel de header
// terug op enkel de transportLabel als tekst wanneer seg.label
// ontbrak — dat werkte, maar zodra seg.label WEL gezet was, toonde
// de header enkel dat label en verdween het vervoersmiddel uit
// beeld (zichtbaar op segment 2 in de screenshot: "Naar Grenspark
// Noord parking" zonder vervoersicoon). Nu wordt vervoer + label
// altijd samen getoond: "🚶 Wandelen — <label>" of enkel
// "🚶 Wandelen" als er geen apart label is.
// -----------------------------------------------------------
function renderSegments(route) {
  const segments = route.segments;
  if (!segments?.length) return;

  const container = $("route-segments");
  if (!container) return;

  segments.forEach((seg, idx) => {
    const color = TRANSPORT_COLORS[seg.transport] || "#2980B9";
    const transportLabel = TRANSPORT_LABELS[seg.transport] || seg.transport || "—";
    const g = seg.gpx_stats;
    const w = seg.weather;
    const diffLabel = seg.difficulty || "—";

    // Vervoer + label combineren i.p.v. label alleen te tonen zodat
    // het vervoersmiddel nooit uit de header verdwijnt.
    const headerText = (seg.label && seg.label !== transportLabel)
      ? `${transportLabel} — ${seg.label}`
      : transportLabel;

    // GPX rijen — alleen tonen als waarde aanwezig
    const gpxRows = [
      g?.distance_km     ? `<tr><td>Afstand</td><td>${g.distance_km} km</td></tr>` : "",
      g?.duration_hours  ? `<tr><td>Duur</td><td>${g.duration_hours} u</td></tr>` : "",
      g?.elevation_up_m  ? `<tr><td>Stijging</td><td>+${g.elevation_up_m} m</td></tr>` : "",
      g?.elevation_down_m ? `<tr><td>Daling</td><td>-${g.elevation_down_m} m</td></tr>` : "",
      g?.avg_speed_kmh   ? `<tr><td>Gem. snelheid</td><td>${g.avg_speed_kmh} km/u</td></tr>` : "",
      g?.max_speed_kmh   ? `<tr><td>Max. snelheid</td><td>${g.max_speed_kmh} km/u</td></tr>` : "",
      g?.highest_point_m ? `<tr><td>Hoogste punt</td><td>${g.highest_point_m} m</td></tr>` : "",
      g?.lowest_point_m  ? `<tr><td>Laagste punt</td><td>${g.lowest_point_m} m</td></tr>` : "",
      seg.difficulty     ? `<tr><td>Moeilijkheid</td><td>${diffLabel}</td></tr>` : "",
    ].filter(Boolean).join("");

    // Weerdata rijen — referentie = startpunt van dit segment
    const weatherRows = w ? [
      `<tr><td>🌡 Temperatuur</td><td>${w.temperature_min ?? "—"}° – ${w.temperature_max ?? "—"}°C</td></tr>`,
      w.precipitation_mm != null ? `<tr><td>💧 Neerslag</td><td>${w.precipitation_mm} mm</td></tr>` : "",
      w.wind_kmh != null ? `<tr><td>🍃 Wind</td><td>${w.wind_kmh} km/u</td></tr>` : "",
      w.condition ? `<tr><td>☀️ Conditie</td><td>${w.condition}</td></tr>` : "",
    ].filter(Boolean).join("") : "";

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
        ${hasGpx ? `
          <div class="route-segment-block__col">
            <table class="route-segment-table">
              <tbody>${gpxRows}</tbody>
            </table>
          </div>
        ` : ""}
        ${hasWeather ? `
          <div class="route-segment-block__col">
            <p class="route-segment-table__title">Weerdata</p>
            <table class="route-segment-table">
              <tbody>${weatherRows}</tbody>
            </table>
          </div>
        ` : ""}
        ${!hasGpx && !hasWeather ? `<p class="route-segment-block__empty">Geen data beschikbaar voor dit segment.</p>` : ""}
      </div>
    `;

    container.appendChild(div);
  });

  $("section-segments").hidden = false;
}

// -----------------------------------------------------------
// RENDER KAART
// -----------------------------------------------------------
// Ondersteunt twee scenario's:
//   A) route.segments aanwezig (v2.3+ creator export) — elk segment
//      wordt getekend als eigen polyline in de kleur van zijn
//      vervoersmiddel, met een popup-label per startmarker.
//   B) route.segments ontbreekt (legacy export) — fallback op het
//      enkelvoudige route.gpx_stats zoals voorheen.
//
// Fallback voor ontbrekende track_points:
//   Als gpx_stats.track_points ontbreekt maar gpx_raw aanwezig is,
//   wordt de GPX client-side herparst om de trackpunten te herstellen.
//   Dit dekt exports van creator.js < v2.4.1 waarbij track_points
//   ontbrak in segments[].gpx_stats.
// -----------------------------------------------------------
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
        color: TRANSPORT_COLORS[seg.transport] || "#2C4A3B",
        label: seg.label || TRANSPORT_LABELS[seg.transport] || seg.transport || "Segment",
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
    const map = L.map("route-map", { zoomControl: true, scrollWheelZoom: false });
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
      btnMap.addEventListener("click", () =>
        window.open(`https://www.openstreetmap.org/#map=13/${firstLat}/${firstLon}`, "_blank")
      );
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
    console.warn("[route.js] GPX herparsing mislukt:", err);
    return null;
  }
}

// -----------------------------------------------------------
// RENDER VERHAAL — alleen tekst en link blokken
// Foto blokken gaan altijd naar de foto grid (rechterkolom)
// -----------------------------------------------------------
function renderStory(route) {
  const blocks = route.story_blocks;
  const container = $("route-story");

  // Altijd tonen, ook als leeg
  $("section-story").hidden = false;

  if (!blocks?.length) return;

  blocks.forEach((block) => {
    if (block.type === "text" && block.value) {
      const p = document.createElement("p");
      p.className = "route-story__text";
      p.textContent = block.value;
      container.appendChild(p);
    } else if (block.type === "link" && block.url) {
      const a = document.createElement("a");
      a.className = "route-story__link";
      a.href = block.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<span>🔗</span><span>${block.name || block.url}</span>`;
      container.appendChild(a);
    }
    // foto en photo-grid blokken worden genegeerd hier — gaan naar renderPhotoGrid
  });
}

// -----------------------------------------------------------
// RENDER TIPS — altijd tonen, ook als leeg
// -----------------------------------------------------------
function renderTips(route) {
  const lang = i18nModule?.language?.substring(0, 2) || "nl";
  const tips = route.tips?.[lang] || route.tips?.nl || route.tips;

  // Altijd tonen
  $("section-tips").hidden = false;

  if (!tips) return;

  const p = document.createElement("p");
  p.className = "route-tips__text";
  p.textContent = tips;
  $("route-tips").appendChild(p);
}

// -----------------------------------------------------------
// RENDER FOTO GRID (rechterkolom verhaal)
// Combineert foto blokken uit story_blocks + photos[1+]
// Altijd tonen
// -----------------------------------------------------------
function renderPhotoGrid(route) {
  const container = $("route-photo-grid");
  $("section-photos").hidden = false;

  const urls = new Set();

  // Foto blokken uit story_blocks
  (route.story_blocks || []).forEach((block) => {
    if (block.type === "photo" && block.value) {
      urls.add(block.value);
    } else if (block.type === "photo-grid" && block.photos?.length) {
      block.photos.filter(Boolean).forEach((url) => urls.add(url));
    }
  });

  // Extra photos (index 1+)
  (route.photos || []).slice(1).forEach((p) => {
    if (p.url) urls.add(p.url);
  });

  urls.forEach((url) => {
    const img = document.createElement("img");
    img.className = "route-photo-grid__img";
    img.src = url;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => img.remove();
    container.appendChild(img);
  });
}

// -----------------------------------------------------------
// RENDER SLIDESHOW GALERIJ
// -----------------------------------------------------------
function renderGallery(route) {
  if (!route.gallery?.length) return;

  const photos = route.gallery.filter((p) => p.url);
  if (!photos.length) return;

  let current = 0;
  const img = $("slideshow-img");
  const dotsEl = $("slideshow-dots");
  const prevBtn = $("slideshow-prev");
  const nextBtn = $("slideshow-next");

  function show(idx) {
    current = idx;
    img.src = photos[idx].url;
    img.alt = photos[idx].caption || "";
    dotsEl.querySelectorAll(".route-slideshow__dot").forEach((d, i) => {
      d.classList.toggle("route-slideshow__dot--active", i === idx);
    });
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === photos.length - 1;
  }

  // Dots aanmaken
  photos.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "route-slideshow__dot";
    dot.setAttribute("aria-label", `Foto ${i + 1}`);
    dot.addEventListener("click", () => show(i));
    dotsEl.appendChild(dot);
  });

  prevBtn.addEventListener("click", () => { if (current > 0) show(current - 1); });
  nextBtn.addEventListener("click", () => { if (current < photos.length - 1) show(current + 1); });

  show(0);
  $("section-gallery").hidden = false;
}

// -----------------------------------------------------------
// DELEN
// -----------------------------------------------------------
$("btn-share").addEventListener("click", async () => {
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url: window.location.href }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(window.location.href);
    $("btn-share").textContent = "✓ Gekopieerd!";
    setTimeout(() => { $("btn-share").innerHTML = `<span>🔗</span> Delen`; }, 2000);
  }
});

// -----------------------------------------------------------
// INIT
// v2.4.0: renderStats / renderWeather / renderTransport verwijderd —
// die vulden het rood-omcirkelde blok bovenaan de pagina, dat dubbel
// op was met de segmenten-sectie (elk segment toont al zijn eigen
// stats + weer + vervoer in de gekleurde header).
// -----------------------------------------------------------
window.appReady.then(async () => {
  const id = getRouteId();
  if (!id) { $("route-title").textContent = t("notFound"); return; }

  const route = await loadRoute(id);
  if (!route) { $("route-title").textContent = t("loadError"); return; }

  renderHero(route);
  renderSegments(route);
  renderSource(route);
  renderMap(route);
  renderStory(route);
  renderTips(route);
  renderPhotoGrid(route);
  renderGallery(route);
});
