// =======================================================
// route.js — MyTrailWalks
// Route detail pagina: laadt JSON en rendert route
// v1.2.0: dubbele code verwijderd, schone versie
// v1.1.0: i18n via i18nModule (nl/en)
// v1.0.0: initiële versie
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
    const resp = await fetch(`../${id}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error("Route laden mislukt:", err);
    return null;
  }
}

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

  const items = [
    { icon: "🌡", text: `${w.temperature_min ?? "—"}° – ${w.temperature_max ?? "—"}°C` },
    { icon: "💧", text: `${w.precipitation_mm ?? "—"} ${t("weather.precipitation")}` },
    { icon: "🍃", text: `${w.wind_kmh ?? "—"} ${t("weather.wind")}` },
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

function renderStory(route) {
  const blocks = route.story_blocks;
  if (!blocks?.length) return;

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

  $("section-story").hidden = false;
}

function renderTips(route) {
  const lang = i18nModule?.language?.substring(0, 2) || "nl";
  const tips = route.tips?.[lang] || route.tips?.nl || route.tips;
  if (!tips) return;

  const p = document.createElement("p");
  p.className = "route-tips__text";
  p.textContent = tips;
  $("route-tips").appendChild(p);
  $("section-tips").hidden = false;
}

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
      btnMap.innerHTML = `<span>🗺</span> ${t("actions.openMap")}`;
      btnMap.addEventListener("click", () =>
        window.open(`https://www.openstreetmap.org/#map=13/${g.start_lat}/${g.start_lon}`, "_blank")
      );
    }

    L.circleMarker([g.start_lat, g.start_lon], {
      radius: 7,
      fillColor: "#2C4A3B",
      color: "#fff",
      weight: 2,
      fillOpacity: 1,
    }).addTo(map).bindPopup(t("map.startPoint"));

    map.setView([g.start_lat, g.start_lon], 13);
  }, 50);
}

function renderTransport(route) {
  if (!route.transport?.length) return;
  const container = $("route-transport");
  route.transport.forEach((tr) => {
    const span = document.createElement("span");
    span.className = "route-transport__tag";
    span.textContent = t(`transport.${tr}`);
    container.appendChild(span);
  });
  $("section-transport").hidden = false;
}

function renderGallery(route) {
  if (!route.gallery?.length) return;
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
  $("section-gallery").hidden = false;
}

$("btn-share").addEventListener("click", async () => {
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url: window.location.href }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(window.location.href);
    $("btn-share").textContent = t("actions.copied");
    setTimeout(() => { $("btn-share").innerHTML = `<span>🔗</span> ${t("actions.share")}`; }, 2000);
  }
});

window.appReady.then(async () => {
  $("btn-share").innerHTML = `<span>🔗</span> ${t("actions.share")}`;
  const printBtn = document.querySelector("[onclick='window.print()']");
  if (printBtn) printBtn.innerHTML = `<span>🖨</span> ${t("actions.print")}`;

  const id = getRouteId();
  if (!id) { $("route-title").textContent = t("notFound"); return; }

  const route = await loadRoute(id);
  if (!route) { $("route-title").textContent = t("loadError"); return; }

  renderHero(route);
  renderStats(route);
  renderWeather(route);
  renderStory(route);
  renderTips(route);
  renderMap(route);
  renderTransport(route);
  renderGallery(route);
});
