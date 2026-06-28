// =======================================================
// route.js — MyTrailWalks
// Route detail pagina: laadt JSON en rendert route
// v2.0.0: nieuwe lay-out — 2-koloms, slideshow galerij, status badge
// v1.2.0: dubbele code verwijderd, schone versie
// =======================================================
"use strict";

const $ = (id) => document.getElementById(id);

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
// RENDER STATS
// -----------------------------------------------------------
function renderStats(route) {
  const g = route.gpx_stats;
  if (!g) return;

  const stats = [
    { value: g.distance_km ? `${g.distance_km} km` : "—", label: t("stats.distance") },
    { value: g.duration_hours ? `${g.duration_hours} u` : "—", label: t("stats.duration") },
    { value: g.elevation_up_m ? `+${g.elevation_up_m} m` : "—", label: t("stats.elevationUp") },
    { value: g.elevation_down_m ? `-${g.elevation_down_m} m` : "—", label: t("stats.elevationDown") },
    { value: g.avg_speed_kmh ? `${g.avg_speed_kmh} km/u` : "—", label: t("stats.avgSpeed") },
    { value: g.highest_point_m ? `${g.highest_point_m} m` : "—", label: t("stats.highestPoint") },
    { value: g.lowest_point_m ? `${g.lowest_point_m} m` : "—", label: t("stats.lowestPoint") },
    { value: g.max_speed_kmh ? `${g.max_speed_kmh} km/u` : "—", label: t("stats.maxSpeed") },
  ];

  const container = $("route-stats");
  stats.forEach(({ value, label }) => {
    const div = document.createElement("div");
    div.className = "route-stat";
    div.innerHTML = `<span class="route-stat__value">${value}</span><span class="route-stat__label">${label}</span>`;
    container.appendChild(div);
  });
}

// -----------------------------------------------------------
// RENDER WEER
// -----------------------------------------------------------
function renderWeather(route) {
  const w = route.weather;
  if (!w) return;

  const items = [
    { icon: "🌡", text: `${w.temperature_min ?? "—"}° – ${w.temperature_max ?? "—"}°C` },
    { icon: "💧", text: `${w.precipitation_mm ?? "—"} mm` },
    { icon: "🍃", text: `${w.wind_kmh ?? "—"} km/u` },
  ];
  if (w.condition) items.push({ icon: "☀️", text: w.condition });

  const container = $("route-weather");
  items.forEach(({ icon, text }) => {
    const div = document.createElement("div");
    div.className = "route-weather__item";
    div.innerHTML = `<span class="route-weather__icon">${icon}</span><span>${text}</span>`;
    container.appendChild(div);
  });

  $("section-weather").hidden = false;
}

// -----------------------------------------------------------
// RENDER VERVOER
// -----------------------------------------------------------
function renderTransport(route) {
  if (!route.transport?.length) return;
  const container = $("route-transport");
  const labels = {
    walking: "🚶 Wandelen", cycling: "🚴 Fietsen", motorcycle: "🏍 Motor",
    car: "🚗 Auto", train: "🚆 Trein", bus: "🚌 Bus", boat: "⛵ Boot", plane: "✈️ Vliegtuig",
  };
  route.transport.forEach((tr) => {
    const span = document.createElement("span");
    span.className = "route-transport__tag";
    span.textContent = labels[tr] || tr;
    container.appendChild(span);
  });
  $("section-transport").hidden = false;
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
// RENDER KAART
// -----------------------------------------------------------
function renderMap(route) {
  const g = route.gpx_stats;
  if (!g?.start_lat || !g?.start_lon) return;

  $("section-map").hidden = false;

  setTimeout(() => {
    const map = L.map("route-map", { zoomControl: true, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    const btnMap = $("btn-open-map");
    if (btnMap) {
      btnMap.hidden = false;
      btnMap.innerHTML = `<span>🗺</span> Route openen`;
      btnMap.addEventListener("click", () =>
        window.open(`https://www.openstreetmap.org/#map=13/${g.start_lat}/${g.start_lon}`, "_blank")
      );
    }

    L.circleMarker([g.start_lat, g.start_lon], {
      radius: 7, fillColor: "#2C4A3B", color: "#fff", weight: 2, fillOpacity: 1,
    }).addTo(map).bindPopup("Startpunt");

    if (g.track_points?.length > 1) {
      const polyline = L.polyline(g.track_points, { color: "#2C4A3B", weight: 3, opacity: 0.85 }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [16, 16] });
    } else {
      map.setView([g.start_lat, g.start_lon], 13);
    }
  }, 50);
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
// -----------------------------------------------------------
window.appReady.then(async () => {
  const id = getRouteId();
  if (!id) { $("route-title").textContent = t("notFound"); return; }

  const route = await loadRoute(id);
  if (!route) { $("route-title").textContent = t("loadError"); return; }

  renderHero(route);
  renderStats(route);
  renderWeather(route);
  renderTransport(route);
  renderSource(route);
  renderMap(route);
  renderStory(route);
  renderTips(route);
  renderPhotoGrid(route);
  renderGallery(route);
});
