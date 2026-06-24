// =======================================================
// route.js — MyTrailWalks
// Route detail pagina: laadt JSON en rendert route
// v1.0.0: initiële versie
// =======================================================
"use strict";

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
const $ = (id) => document.getElementById(id);

const TRANSPORT_LABELS = {
  walking: "🚶 Wandelen",
  cycling: "🚴 Fietsen",
  motorcycle: "🏍 Motor",
  car: "🚗 Auto",
  train: "🚆 Trein",
  bus: "🚌 Bus",
  boat: "⛵ Boot",
  plane: "✈️ Vliegtuig",
};

const DIFFICULTY_LABELS = {
  T1: "T1 — Wandelen",
  T2: "T2 — Bergwandeling",
  T3: "T3 — Veeleisende bergwandeling",
  T4: "T4 — Alpine wandeling",
  T5: "T5 — Veeleisende alpine wandeling",
  T6: "T6 — Moeilijke alpine wandeling",
  // Achterwaartse compatibiliteit oude waarden
  easy: "Gemakkelijk",
  medium: "Gemiddeld",
  hard: "Zwaar",
};

// -----------------------------------------------------------
// ROUTE ID OPHALEN UIT URL
// -----------------------------------------------------------
function getRouteId() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("id")) return params.get("id");
  // Fallback: bestandsnaam zonder extensie
  const path = window.location.pathname;
  const filename = path.split("/").pop().replace(".html", "");
  if (filename && filename !== "index") return filename;
  return null;
}

// -----------------------------------------------------------
// JSON LADEN
// -----------------------------------------------------------
async function loadRoute(id) {
  try {
    const basePath = window.getBasePath ? getBasePath() : "../";
    const resp = await fetch(`${basePath}data/content/${id}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error("Route laden mislukt:", err);
    return null;
  }
}

// -----------------------------------------------------------
// RENDER FUNCTIES
// -----------------------------------------------------------
function renderHero(route) {
  // Titel
  $("route-title").textContent = route.title?.nl || route.title || "Onbekende route";
  document.title = `${route.title?.nl || "Route"} — MyTrailWalks`;

  // Locatie & regio
  if (route.location) $("route-location").textContent = route.location;
  if (route.region) $("route-region").textContent = route.region;

  // Hero afbeelding
  const heroBg = $("route-hero-bg");
  const heroPhoto = route.photos?.[0]?.url || "";
  if (heroPhoto) {
    heroBg.style.backgroundImage = `url('${heroPhoto}')`;
    heroBg.classList.add("has-photo");
  }

  // Badges
  const badges = $("route-badges");
  if (route.difficulty) {
    const badge = document.createElement("span");
    badge.className = "route-badge route-badge--difficulty";
    badge.textContent = DIFFICULTY_LABELS[route.difficulty] || route.difficulty;
    badges.appendChild(badge);
  }
  if (route.published_date) {
    const badge = document.createElement("span");
    badge.className = "route-badge";
    const date = new Date(route.published_date);
    badge.textContent = date.toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });
    badges.appendChild(badge);
  }
}

function renderStats(route) {
  const g = route.gpx_stats;
  if (!g) return;

  const stats = [
    { value: g.distance_km ? `${g.distance_km} km` : "—", label: "Afstand" },
    { value: g.duration_hours ? `${g.duration_hours} u` : "—", label: "Duur" },
    { value: g.elevation_up_m ? `+${g.elevation_up_m} m` : "—", label: "Stijging" },
    { value: g.elevation_down_m ? `-${g.elevation_down_m} m` : "—", label: "Daling" },
    { value: g.avg_speed_kmh ? `${g.avg_speed_kmh} km/u` : "—", label: "Gem. snelheid" },
    { value: g.highest_point_m ? `${g.highest_point_m} m` : "—", label: "Hoogste punt" },
    { value: g.lowest_point_m ? `${g.lowest_point_m} m` : "—", label: "Laagste punt" },
  ];

  const container = $("route-stats");
  stats.forEach(({ value, label }) => {
    const div = document.createElement("div");
    div.className = "route-stat";
    div.innerHTML = `<span class="route-stat__value">${value}</span><span class="route-stat__label">${label}</span>`;
    container.appendChild(div);
  });
}

function renderWeather(route) {
  const w = route.weather;
  if (!w) return;

  const section = $("section-weather");
  const container = $("route-weather");

  const items = [
    { icon: "🌡", text: `${w.temperature_min ?? "—"}° – ${w.temperature_max ?? "—"}°C` },
    { icon: "💧", text: `${w.precipitation_mm ?? "—"} mm neerslag` },
    { icon: "🍃", text: `${w.wind_kmh ?? "—"} km/u wind` },
  ];

  if (w.condition) {
    items.push({ icon: "☀️", text: w.condition });
  }

  items.forEach(({ icon, text }) => {
    const div = document.createElement("div");
    div.className = "route-weather__item";
    div.innerHTML = `<span class="route-weather__icon">${icon}</span><span>${text}</span>`;
    container.appendChild(div);
  });

  section.hidden = false;
}

function renderStory(route) {
  const blocks = route.story_blocks;
  if (!blocks?.length) return;

  const section = $("section-story");
  const container = $("route-story");

  blocks.forEach((block) => {
    if (block.type === "text" && block.value) {
      const p = document.createElement("p");
      p.className = "route-story__text";
      p.textContent = block.value;
      container.appendChild(p);

    } else if (block.type === "photo" && block.value) {
      const img = document.createElement("img");
      img.className = "route-story__photo";
      img.src = block.value;
      img.alt = "";
      img.loading = "lazy";
      img.onerror = () => img.remove();
      container.appendChild(img);

    } else if (block.type === "photo-grid" && block.photos?.length) {
      const grid = document.createElement("div");
      grid.className = "route-story__grid";
      grid.style.gridTemplateColumns = `repeat(${block.cols || 2}, 1fr)`;
      block.photos.filter(Boolean).forEach((url) => {
        const img = document.createElement("img");
        img.className = "route-story__grid-photo";
        img.src = url;
        img.alt = "";
        img.loading = "lazy";
        img.onerror = () => img.remove();
        grid.appendChild(img);
      });
      container.appendChild(grid);

    } else if (block.type === "link" && block.url) {
      const a = document.createElement("a");
      a.className = "route-story__link";
      a.href = block.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<span class="route-story__link-icon">🔗</span><span>${block.name || block.url}</span>`;
      container.appendChild(a);
    }
  });

  section.hidden = false;
}

function renderTips(route) {
  const tips = route.tips?.nl || route.tips;
  if (!tips) return;

  const section = $("section-tips");
  const container = $("route-tips");
  const p = document.createElement("p");
  p.className = "route-tips__text";
  p.textContent = tips;
  container.appendChild(p);
  section.hidden = false;
}

function renderMap(route) {
  const g = route.gpx_stats;
  if (!g?.start_lat || !g?.start_lon) return;

  const section = $("section-map");
  section.hidden = false;

  setTimeout(() => {
    const map = L.map("route-map", { zoomControl: true, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    // Open kaart knop
    const btnMap = $("btn-open-map");
    if (btnMap) {
      btnMap.hidden = false;
      const osmUrl = `https://www.openstreetmap.org/#map=13/${g.start_lat}/${g.start_lon}`;
      btnMap.addEventListener("click", () => window.open(osmUrl, "_blank"));
    }

    L.circleMarker([g.start_lat, g.start_lon], {
      radius: 7,
      fillColor: "#2C4A3B",
      color: "#fff",
      weight: 2,
      fillOpacity: 1,
    }).addTo(map).bindPopup("Startpunt");

    map.setView([g.start_lat, g.start_lon], 13);
  }, 50);
}

function renderTransport(route) {
  if (!route.transport?.length) return;
  const section = $("section-transport");
  const container = $("route-transport");
  route.transport.forEach((t) => {
    const span = document.createElement("span");
    span.className = "route-transport__tag";
    span.textContent = TRANSPORT_LABELS[t] || t;
    container.appendChild(span);
  });
  section.hidden = false;
}

function renderGallery(route) {
  if (!route.gallery?.length) return;
  const section = $("section-gallery");
  const container = $("route-gallery");
  route.gallery.forEach((photo) => {
    if (!photo.url) return;
    const img = document.createElement("img");
    img.className = "route-gallery__photo";
    img.src = photo.url;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => img.remove();
    container.appendChild(img);
  });
  section.hidden = false;
}

// -----------------------------------------------------------
// DELEN
// -----------------------------------------------------------
$("btn-share").addEventListener("click", async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } catch (_) {}
  } else {
    await navigator.clipboard.writeText(window.location.href);
    $("btn-share").textContent = "✓ Gekopieerd!";
    setTimeout(() => { $("btn-share").innerHTML = "<span>🔗</span> Delen"; }, 2000);
  }
});

// -----------------------------------------------------------
// INIT
// -----------------------------------------------------------
window.appReady.then(async () => {
  const id = getRouteId();
  if (!id) {
    $("route-title").textContent = "Route niet gevonden";
    return;
  }

  const route = await loadRoute(id);
  if (!route) {
    $("route-title").textContent = "Route kon niet worden geladen";
    return;
  }

  renderHero(route);
  renderStats(route);
  renderWeather(route);
  renderStory(route);
  renderTips(route);
  renderMap(route);
  renderTransport(route);
  renderGallery(route);
});
