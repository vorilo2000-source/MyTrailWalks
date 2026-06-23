// =======================================================
// creator.js — MyTrailWalks
// Route creator: GPX parse, weer, locatie, AI, JSON export
// v2.0.0: visuele preview, blokken-editor, JSON import
// v1.2.0: geen eigen i18n init (app.js doet dit centraal)
// =======================================================
"use strict";

// -----------------------------------------------------------
// STATE
// -----------------------------------------------------------
const state = {
  aiMode: false,
  apiKey: null,
  apiKeyConfirmed: false,
  gpx: null,
  weather: null,
  storyBlocks: [], // [{ type: 'text'|'photo', value: string }]
};

// -----------------------------------------------------------
// DOM REFS
// -----------------------------------------------------------
const $ = (id) => document.getElementById(id);

const els = {
  btnModeToggle: $("btn-mode-toggle"),
  modeLabel: $("mode-label"),
  apiKeyBar: $("api-key-bar"),
  inputApiKey: $("input-api-key"),
  btnKeyConfirm: $("btn-key-confirm"),
  aiActions: $("ai-actions"),
  aiStoryHint: $("ai-story-hint"),
  btnAiGenerate: $("btn-ai-generate"),
  gpxDropZone: $("gpx-drop-zone"),
  gpxFileInput: $("gpx-file-input"),
  gpxBrowseBtn: $("gpx-browse-btn"),
  gpxStats: $("gpx-stats"),
  gpxResetBtn: $("gpx-reset-btn"),
  gpxStatus: $("gpx-status"),
  statDistance: $("stat-distance"),
  statDuration: $("stat-duration"),
  statEleUp: $("stat-ele-up"),
  statEleDown: $("stat-ele-down"),
  statHighest: $("stat-highest"),
  statLowest: $("stat-lowest"),
  statAvgSpeed: $("stat-avg-speed"),
  statMaxSpeed: $("stat-max-speed"),
  inputDate: $("input-date"),
  inputLocation: $("input-location"),
  btnFetchLocation: $("btn-fetch-location"),
  btnFetchWeather: $("btn-fetch-weather"),
  btnRefetchWeather: $("btn-refetch-weather"),
  weatherBlock: $("weather-block"),
  wTempMin: $("w-temp-min"),
  wTempMax: $("w-temp-max"),
  wPrecip: $("w-precip"),
  wWind: $("w-wind"),
  inputWeatherCondition: $("input-weather-condition"),
  inputTitle: $("input-title"),
  inputDifficulty: $("input-difficulty"),
  inputRegion: $("input-region"),
  inputSource: $("input-source"),
  inputHeroPhoto: $("input-hero-photo"),
  inputKeywords: $("input-keywords"),
  inputIntro: $("input-intro"),
  introCount: $("intro-count"),
  inputTips: $("input-tips"),
  inputRouteId: $("input-route-id"),
  inputStatus: $("input-status"),
  btnExport: $("btn-export"),
  jsonImportInput: $("json-import-input"),
  blockList: $("block-list"),
  btnAddTextBlock: $("btn-add-text-block"),
  btnAddPhotoBlock: $("btn-add-photo-block"),
};

// -----------------------------------------------------------
// AI MODUS TOGGLE
// -----------------------------------------------------------
els.btnModeToggle.addEventListener("click", () => {
  state.aiMode = !state.aiMode;
  els.modeLabel.textContent = state.aiMode ? "AI-modus uitschakelen" : "AI-modus inschakelen";
  els.apiKeyBar.hidden = !state.aiMode;
  els.aiActions.hidden = !state.aiMode;
  els.aiStoryHint.hidden = !state.aiMode;
  els.btnModeToggle.classList.toggle("btn--ai", state.aiMode);
  updatePreview();
});

els.btnKeyConfirm.addEventListener("click", () => {
  const key = els.inputApiKey.value.trim();
  if (!key.startsWith("sk-ant-")) {
    showInlineError(els.inputApiKey, "Sleutel moet beginnen met sk-ant-");
    return;
  }
  state.apiKey = key;
  state.apiKeyConfirmed = true;
  els.inputApiKey.value = "\u2022".repeat(20);
  els.btnKeyConfirm.textContent = "\u2713 Bevestigd";
  els.btnKeyConfirm.disabled = true;
});

// -----------------------------------------------------------
// JSON IMPORT
// -----------------------------------------------------------
els.jsonImportInput.addEventListener("change", () => {
  const file = els.jsonImportInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      loadJsonIntoForm(data);
    } catch (err) {
      alert("Ongeldig JSON-bestand. Controleer het bestand en probeer opnieuw.");
      console.error("JSON import fout:", err);
    }
  };
  reader.readAsText(file);
  // Reset input zodat hetzelfde bestand opnieuw geladen kan worden
  els.jsonImportInput.value = "";
});

function loadJsonIntoForm(data) {
  // Route ID & status
  if (data.id) els.inputRouteId.value = data.id;
  if (data.status) els.inputStatus.value = data.status;

  // Datum & locatie
  if (data.published_date) els.inputDate.value = data.published_date;
  if (data.location) els.inputLocation.value = data.location;
  if (data.region) els.inputRegion.value = data.region;

  // Route info
  if (data.title?.nl) els.inputTitle.value = data.title.nl;
  if (data.difficulty) els.inputDifficulty.value = data.difficulty;
  if (data.source_reference) els.inputSource.value = data.source_reference;

  // Tags / keywords
  if (data.tags?.length) els.inputKeywords.value = data.tags.join(", ");

  // Samenvatting
  if (data.summary?.nl) {
    els.inputIntro.value = data.summary.nl;
    els.introCount.textContent = `${data.summary.nl.length}/160`;
  }

  // Tips
  if (data.tips?.nl) els.inputTips.value = data.tips.nl;

  // Hero foto
  if (data.photos?.length) {
    els.inputHeroPhoto.value = data.photos[0].url || "";
  }

  // Verhaal → blokken
  // Bestaande JSON heeft story als string; we zetten dat om naar één tekstblok
  // Nieuwe JSON heeft story als blocks array
  state.storyBlocks = [];
  if (data.story_blocks?.length) {
    state.storyBlocks = data.story_blocks.map((b) => ({ type: b.type, value: b.value || "" }));
  } else if (data.story?.nl) {
    state.storyBlocks = [{ type: "text", value: data.story.nl }];
  }

  // Extra foto's (index 1+) als fotoblokken toevoegen indien geen story_blocks
  if (!data.story_blocks && data.photos?.length > 1) {
    data.photos.slice(1).forEach((p) => {
      if (p.url) state.storyBlocks.push({ type: "photo", value: p.url });
    });
  }

  // Weerdata
  if (data.weather) {
    state.weather = { ...data.weather };
    els.wTempMin.textContent = data.weather.temperature_min !== null ? `${data.weather.temperature_min}°C` : "—";
    els.wTempMax.textContent = data.weather.temperature_max !== null ? `${data.weather.temperature_max}°C` : "—";
    els.wPrecip.textContent = data.weather.precipitation_mm !== null ? `${data.weather.precipitation_mm} mm` : "—";
    els.wWind.textContent = data.weather.wind_kmh !== null ? `${data.weather.wind_kmh} km/u` : "—";
    if (data.weather.condition) els.inputWeatherCondition.value = data.weather.condition;
    els.weatherBlock.hidden = false;
  }

  // GPX stats (read-only invullen als er geen GPX geladen wordt)
  if (data.gpx_stats && !state.gpx) {
    const g = data.gpx_stats;
    els.statDistance.textContent = g.distance_km ? `${g.distance_km} km` : "—";
    els.statDuration.textContent = g.duration_hours ? `${g.duration_hours} u` : "—";
    els.statEleUp.textContent = g.elevation_up_m ? `+${g.elevation_up_m} m` : "—";
    els.statEleDown.textContent = g.elevation_down_m ? `-${g.elevation_down_m} m` : "—";
    els.statHighest.textContent = g.highest_point_m ? `${g.highest_point_m} m` : "—";
    els.statLowest.textContent = g.lowest_point_m ? `${g.lowest_point_m} m` : "—";
    els.statAvgSpeed.textContent = g.avg_speed_kmh ? `${g.avg_speed_kmh} km/u` : "—";
    els.statMaxSpeed.textContent = g.max_speed_kmh ? `${g.max_speed_kmh} km/u` : "—";
    els.gpxDropZone.hidden = true;
    els.gpxStats.hidden = false;
    els.gpxStatus.textContent = "✓ Uit JSON";
    // Sla stats op in state zodat export werkt
    state.gpx = { ...g };
  }

  renderBlockEditor();
  updatePreview();
}

// -----------------------------------------------------------
// BLOKKEN-EDITOR
// -----------------------------------------------------------
function renderBlockEditor() {
  els.blockList.innerHTML = "";
  state.storyBlocks.forEach((block, i) => {
    const item = document.createElement("div");
    item.className = `block-item block-item--${block.type}`;
    item.dataset.idx = i;

    const isFirst = i === 0;
    const isLast = i === state.storyBlocks.length - 1;

    let bodyHtml = "";
    if (block.type === "text") {
      const escaped = block.value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      bodyHtml = `
        <div class="block-item__label">Tekst</div>
        <textarea class="block-textarea input input--textarea" rows="4" placeholder="Schrijf een alinea\u2026" data-idx="${i}">${escaped}</textarea>
      `;
    } else {
      bodyHtml = `
        <div class="block-item__label">Foto — Cloudinary URL</div>
        <input type="url" class="block-url-input input" placeholder="https://res.cloudinary.com/dgzlcqdcc/image/upload/w_800,f_auto/\u2026" value="${block.value}" data-idx="${i}">
        <div class="block-photo-preview" data-idx="${i}">
          ${block.value ? `<img src="${block.value}" alt="Foto preview" class="block-photo-preview__img" onerror="this.parentElement.hidden=true">` : ""}
        </div>
      `;
    }

    item.innerHTML = `
      <div class="block-controls">
        <button class="block-ctrl-btn" data-action="up" data-idx="${i}" title="Omhoog" ${isFirst ? "disabled" : ""}>↑</button>
        <button class="block-ctrl-btn" data-action="down" data-idx="${i}" title="Omlaag" ${isLast ? "disabled" : ""}>↓</button>
      </div>
      <div class="block-body">${bodyHtml}</div>
      <button class="block-remove-btn" data-action="remove" data-idx="${i}" title="Verwijder blok">✕</button>
    `;

    els.blockList.appendChild(item);
  });

  // Events delegeren
  els.blockList.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", handleBlockAction);
  });

  els.blockList.querySelectorAll(".block-textarea").forEach((ta) => {
    ta.addEventListener("input", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      state.storyBlocks[idx].value = e.target.value;
      updatePreview();
    });
  });

  els.blockList.querySelectorAll(".block-url-input").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      state.storyBlocks[idx].value = e.target.value;
      // Foto preview bijwerken
      const preview = els.blockList.querySelector(`.block-photo-preview[data-idx="${idx}"]`);
      if (preview) {
        const url = e.target.value.trim();
        if (url) {
          preview.hidden = false;
          preview.innerHTML = `<img src="${url}" alt="Foto preview" class="block-photo-preview__img" onerror="this.parentElement.hidden=true">`;
        } else {
          preview.hidden = true;
          preview.innerHTML = "";
        }
      }
      updatePreview();
    });
  });
}

function handleBlockAction(e) {
  const action = e.currentTarget.dataset.action;
  const idx = parseInt(e.currentTarget.dataset.idx);

  if (action === "up" && idx > 0) {
    [state.storyBlocks[idx - 1], state.storyBlocks[idx]] = [state.storyBlocks[idx], state.storyBlocks[idx - 1]];
  } else if (action === "down" && idx < state.storyBlocks.length - 1) {
    [state.storyBlocks[idx], state.storyBlocks[idx + 1]] = [state.storyBlocks[idx + 1], state.storyBlocks[idx]];
  } else if (action === "remove") {
    state.storyBlocks.splice(idx, 1);
  }

  renderBlockEditor();
  updatePreview();
}

els.btnAddTextBlock.addEventListener("click", () => {
  state.storyBlocks.push({ type: "text", value: "" });
  renderBlockEditor();
  updatePreview();
  // Scroll naar nieuw blok
  const items = els.blockList.querySelectorAll(".block-item");
  if (items.length) items[items.length - 1].scrollIntoView({ behavior: "smooth", block: "nearest" });
});

els.btnAddPhotoBlock.addEventListener("click", () => {
  state.storyBlocks.push({ type: "photo", value: "" });
  renderBlockEditor();
  updatePreview();
  const items = els.blockList.querySelectorAll(".block-item");
  if (items.length) items[items.length - 1].scrollIntoView({ behavior: "smooth", block: "nearest" });
});

// -----------------------------------------------------------
// GPX DROP ZONE
// -----------------------------------------------------------
els.gpxDropZone.addEventListener("click", () => els.gpxFileInput.click());
els.gpxBrowseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  els.gpxFileInput.click();
});

els.gpxDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  els.gpxDropZone.classList.add("drop-zone--active");
});

els.gpxDropZone.addEventListener("dragleave", () => {
  els.gpxDropZone.classList.remove("drop-zone--active");
});

els.gpxDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  els.gpxDropZone.classList.remove("drop-zone--active");
  const file = e.dataTransfer.files[0];
  if (file) handleGpxFile(file);
});

els.gpxFileInput.addEventListener("change", () => {
  const file = els.gpxFileInput.files[0];
  if (file) handleGpxFile(file);
});

els.gpxResetBtn.addEventListener("click", () => {
  state.gpx = null;
  els.gpxStats.hidden = true;
  els.gpxDropZone.hidden = false;
  els.gpxStatus.textContent = "";
  els.gpxFileInput.value = "";
  updatePreview();
});

function handleGpxFile(file) {
  if (!file.name.endsWith(".gpx")) {
    alert("Enkel .gpx bestanden worden ondersteund.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const gpxData = parseGpx(e.target.result);
    if (!gpxData) {
      alert("GPX-bestand kon niet worden gelezen. Controleer het bestand.");
      return;
    }
    state.gpx = gpxData;
    displayGpxStats(gpxData);
    if (!els.inputDate.value && gpxData.date) {
      els.inputDate.value = gpxData.date;
    }
    if (gpxData.startLat && gpxData.startLon) {
      fetchLocationName(gpxData.startLat, gpxData.startLon);
    }
    applyCalculatedDifficulty();
    updatePreview();
  };
  reader.readAsText(file);
}

// -----------------------------------------------------------
// GPX PARSER
// -----------------------------------------------------------
function parseGpx(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));
    if (trkpts.length < 2) return null;

    let totalDistance = 0;
    let elevationUp = 0;
    let elevationDown = 0;
    let highestPoint = -Infinity;
    let lowestPoint = Infinity;
    let maxSpeed = 0;
    const speeds = [];
    let startTime = null;
    let endTime = null;

    for (let i = 1; i < trkpts.length; i++) {
      const prev = trkpts[i - 1];
      const curr = trkpts[i];
      const lat1 = parseFloat(prev.getAttribute("lat"));
      const lon1 = parseFloat(prev.getAttribute("lon"));
      const lat2 = parseFloat(curr.getAttribute("lat"));
      const lon2 = parseFloat(curr.getAttribute("lon"));
      const ele1 = parseFloat(prev.querySelector("ele")?.textContent || 0);
      const ele2 = parseFloat(curr.querySelector("ele")?.textContent || 0);
      const dist = haversine(lat1, lon1, lat2, lon2);
      totalDistance += dist;
      const eleDiff = ele2 - ele1;
      if (eleDiff > 0) elevationUp += eleDiff;
      else elevationDown += Math.abs(eleDiff);
      highestPoint = Math.max(highestPoint, ele1, ele2);
      lowestPoint = Math.min(lowestPoint, ele1, ele2);
      const timeEl1 = prev.querySelector("time");
      const timeEl2 = curr.querySelector("time");
      if (timeEl1 && timeEl2) {
        const t1 = new Date(timeEl1.textContent);
        const t2 = new Date(timeEl2.textContent);
        if (!startTime) startTime = t1;
        endTime = t2;
        const timeDiff = (t2 - t1) / 3600000;
        if (timeDiff > 0) {
          const speed = (dist / 1000) / timeDiff;
          speeds.push(speed);
          maxSpeed = Math.max(maxSpeed, speed);
        }
      }
    }

    const firstPt = trkpts[0];
    const startLat = parseFloat(firstPt.getAttribute("lat"));
    const startLon = parseFloat(firstPt.getAttribute("lon"));
    const durationHours = startTime && endTime ? ((endTime - startTime) / 3600000) : null;
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null;
    let date = null;
    const firstTime = trkpts[0].querySelector("time");
    if (firstTime) date = firstTime.textContent.split("T")[0];

    return {
      distance_km: Math.round(totalDistance / 10) / 100,
      duration_hours: durationHours ? Math.round(durationHours * 10) / 10 : null,
      elevation_up_m: Math.round(elevationUp),
      elevation_down_m: Math.round(elevationDown),
      highest_point_m: Math.round(highestPoint),
      lowest_point_m: Math.round(lowestPoint),
      avg_speed_kmh: avgSpeed ? Math.round(avgSpeed * 10) / 10 : null,
      max_speed_kmh: Math.round(maxSpeed * 10) / 10,
      startLat,
      startLon,
      date,
    };
  } catch (err) {
    console.error("GPX parse fout:", err);
    return null;
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function displayGpxStats(gpx) {
  els.statDistance.textContent = gpx.distance_km ? `${gpx.distance_km} km` : "—";
  els.statDuration.textContent = gpx.duration_hours ? `${gpx.duration_hours} u` : "—";
  els.statEleUp.textContent = gpx.elevation_up_m ? `+${gpx.elevation_up_m} m` : "—";
  els.statEleDown.textContent = gpx.elevation_down_m ? `-${gpx.elevation_down_m} m` : "—";
  els.statHighest.textContent = gpx.highest_point_m ? `${gpx.highest_point_m} m` : "—";
  els.statLowest.textContent = gpx.lowest_point_m ? `${gpx.lowest_point_m} m` : "—";
  els.statAvgSpeed.textContent = gpx.avg_speed_kmh ? `${gpx.avg_speed_kmh} km/u` : "—";
  els.statMaxSpeed.textContent = gpx.max_speed_kmh ? `${gpx.max_speed_kmh} km/u` : "—";
  els.gpxDropZone.hidden = true;
  els.gpxStats.hidden = false;
  els.gpxStatus.textContent = "\u2713 Geladen";
}

// -----------------------------------------------------------
// LOCATIE VIA NOMINATIM
// -----------------------------------------------------------
async function fetchLocationName(lat, lon) {
  try {
    els.btnFetchLocation.textContent = "\u2026";
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const resp = await fetch(url, { headers: { "Accept-Language": "nl" } });
    const data = await resp.json();
    const addr = data.address || {};
    const location = [
      addr.village || addr.town || addr.city || addr.municipality,
      addr.county || addr.state_district,
      addr.country,
    ].filter(Boolean).join(", ");
    if (location) els.inputLocation.value = location;
  } catch (err) {
    console.warn("Nominatim fout:", err);
  } finally {
    els.btnFetchLocation.textContent = "\u21BA";
    updatePreview();
  }
}

els.btnFetchLocation.addEventListener("click", () => {
  if (state.gpx?.startLat && state.gpx?.startLon) {
    fetchLocationName(state.gpx.startLat, state.gpx.startLon);
  }
});

// -----------------------------------------------------------
// WEERDATA VIA OPEN-METEO
// -----------------------------------------------------------
async function fetchWeather() {
  const date = els.inputDate.value;
  const lat = state.gpx?.startLat;
  const lon = state.gpx?.startLon;
  if (!date) { alert("Kies eerst een wandeldatum."); return; }
  if (!lat || !lon) { alert("Laad eerst een GPX-bestand (voor coördinaten)."); return; }

  els.btnFetchWeather.textContent = "Ophalen\u2026";
  els.btnFetchWeather.disabled = true;

  try {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe/Brussels`;
    const resp = await fetch(url);
    const data = await resp.json();
    const d = data.daily;

    state.weather = {
      date,
      temperature_min: d.temperature_2m_min?.[0] ?? null,
      temperature_max: d.temperature_2m_max?.[0] ?? null,
      precipitation_mm: d.precipitation_sum?.[0] ?? null,
      wind_kmh: d.wind_speed_10m_max?.[0] ?? null,
      condition: els.inputWeatherCondition.value || "",
      source: "Open-Meteo",
    };

    els.wTempMin.textContent = state.weather.temperature_min !== null ? `${state.weather.temperature_min}°C` : "—";
    els.wTempMax.textContent = state.weather.temperature_max !== null ? `${state.weather.temperature_max}°C` : "—";
    els.wPrecip.textContent = state.weather.precipitation_mm !== null ? `${state.weather.precipitation_mm} mm` : "—";
    els.wWind.textContent = state.weather.wind_kmh !== null ? `${state.weather.wind_kmh} km/u` : "—";
    els.weatherBlock.hidden = false;
    applyCalculatedDifficulty();
    updatePreview();
  } catch (err) {
    console.error("Weerdata fout:", err);
    alert("Weerdata kon niet worden opgehaald. Controleer datum en verbinding.");
  } finally {
    els.btnFetchWeather.textContent = "Weerdata ophalen";
    els.btnFetchWeather.disabled = false;
  }
}

els.btnFetchWeather.addEventListener("click", fetchWeather);
els.btnRefetchWeather.addEventListener("click", fetchWeather);

// -----------------------------------------------------------
// MOEILIJKHEID BEREKENEN
// -----------------------------------------------------------
function calculateDifficulty() {
  const gpx = state.gpx;
  const weather = state.weather;
  if (!gpx) return null;

  let score = 0;

  // Afstand: 1 punt per km
  if (gpx.distance_km) score += gpx.distance_km;

  // Stijging: 1 punt per 100m
  if (gpx.elevation_up_m) score += gpx.elevation_up_m / 100;

  // Weer
  if (weather) {
    if (weather.temperature_max >= 25) score += 2;
    if (weather.precipitation_mm >= 5) score += 2;
    if (weather.wind_kmh >= 30) score += 1;
  }

  if (score <= 7) return "easy";
  if (score <= 14) return "medium";
  return "hard";
}

function applyCalculatedDifficulty() {
  const difficulty = calculateDifficulty();
  if (!difficulty) return;
  // Alleen invullen als gebruiker nog niets gekozen heeft
  if (!els.inputDifficulty.value) {
    els.inputDifficulty.value = difficulty;
    updatePreview();
  }
}

// -----------------------------------------------------------
// KARAKTER TELLER INTRO
// -----------------------------------------------------------
els.inputIntro.addEventListener("input", () => {
  els.introCount.textContent = `${els.inputIntro.value.length}/160`;
  updatePreview();
});

// -----------------------------------------------------------
// VISUELE PREVIEW
// -----------------------------------------------------------
function updatePreview() {
  const title = els.inputTitle.value.trim();
  const location = els.inputLocation.value.trim();
  const summary = els.inputIntro.value.trim();
  const heroUrl = els.inputHeroPhoto.value.trim();
  const status = els.inputStatus.value;
  const difficulty = els.inputDifficulty.value;
  const gpx = state.gpx;
  const weather = state.weather;

  // Titel
  $("rp-title").textContent = title || "Wandeling zonder titel";

  // Locatie
  $("rp-location").textContent = location || "Locatie onbekend";

  // Samenvatting
  $("rp-summary").textContent = summary;
  $("rp-summary").hidden = !summary;

  // Status badge
  $("rp-status-badge").textContent = status || "draft";

  // Hero foto
  const heroImg = $("rp-hero-img");
  const heroPlaceholder = $("rp-hero-placeholder");
  if (heroUrl) {
    heroImg.src = heroUrl;
    heroImg.hidden = false;
    heroPlaceholder.hidden = true;
  } else {
    heroImg.hidden = true;
    heroPlaceholder.hidden = false;
  }

  // Stats
  $("rp-distance").textContent = gpx?.distance_km ? `${gpx.distance_km} km` : "—";
  $("rp-duration").textContent = gpx?.duration_hours ? `${gpx.duration_hours} u` : "—";
  $("rp-elevation").textContent = gpx?.elevation_up_m ? `+${gpx.elevation_up_m} m` : "—";

  const diffLabels = { easy: "Gemakkelijk", medium: "Gemiddeld", hard: "Zwaar" };
  $("rp-difficulty").textContent = diffLabels[difficulty] || "—";

  // Weer
  const weatherEl = $("rp-weather");
  if (weather) {
    $("rp-w-temp").innerHTML = `<span class="rp-weather__icon">🌡</span> ${weather.temperature_min ?? "—"}° – ${weather.temperature_max ?? "—"}°C`;
    $("rp-w-precip").innerHTML = `<span class="rp-weather__icon">💧</span> ${weather.precipitation_mm ?? "—"} mm`;
    $("rp-w-wind").innerHTML = `<span class="rp-weather__icon">💨</span> ${weather.wind_kmh ?? "—"} km/u`;
    const dateStr = weather.date ? new Date(weather.date).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" }) : "—";
    $("rp-w-date").innerHTML = `<span class="rp-weather__icon">📅</span> ${dateStr}`;
    weatherEl.hidden = false;
  } else {
    weatherEl.hidden = true;
  }

  // Verhaal blokken preview
  const storyEl = $("rp-story");
  storyEl.innerHTML = "";
  state.storyBlocks.forEach((block) => {
    if (block.type === "text" && block.value.trim()) {
      const p = document.createElement("p");
      p.className = "rp-story__text";
      p.textContent = block.value;
      storyEl.appendChild(p);
    } else if (block.type === "photo" && block.value.trim()) {
      const img = document.createElement("img");
      img.className = "rp-story__photo";
      img.src = block.value;
      img.alt = "";
      img.onerror = () => img.remove();
      storyEl.appendChild(img);
    }
  });

  // Kaart via GPX startpunt — OSM iframe embed
  const mapEl = $("rp-map");
  if (gpx?.startLat && gpx?.startLon) {
    const lat = gpx.startLat;
    const lon = gpx.startLon;
    const mapFrame = $("rp-map-frame");
    // Alleen herladen als coördinaten veranderd zijn
    const currentSrc = mapFrame.querySelector("iframe")?.src || "";
    const newSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.03},${lat - 0.02},${lon + 0.03},${lat + 0.02}&layer=mapnik&marker=${lat},${lon}`;
    if (!currentSrc.includes(lat.toString())) {
      mapFrame.innerHTML = `<iframe
        src="${newSrc}"
        title="Kaart van ${location || "startpunt"}"
        style="width:100%;height:200px;border:none;display:block;"
        loading="lazy"
        allowfullscreen
      ></iframe>
      <span class="rp-map__credit">© OpenStreetMap contributors</span>`;
    }
    mapEl.hidden = false;
  } else {
    mapEl.hidden = true;
  }
}

// Live preview bijwerken bij alle inputs
document.querySelectorAll(".input").forEach((el) => {
  el.addEventListener("input", updatePreview);
  el.addEventListener("change", updatePreview);
});

// -----------------------------------------------------------
// JSON EXPORT
// -----------------------------------------------------------
function buildRouteJson() {
  const id = els.inputRouteId.value.trim() || "nieuwe-route";

  // Foto's: hero altijd eerste
  const allPhotos = [];
  if (els.inputHeroPhoto.value.trim()) {
    allPhotos.push({ url: els.inputHeroPhoto.value.trim(), caption: "" });
  }

  // Verhaal als blokken + tekst samengevoegd voor achterwaartse compatibiliteit
  const storyText = state.storyBlocks
    .filter((b) => b.type === "text" && b.value.trim())
    .map((b) => b.value.trim())
    .join("\n\n");

  // Foto's uit blokken toevoegen aan photos array
  state.storyBlocks
    .filter((b) => b.type === "photo" && b.value.trim())
    .forEach((b) => allPhotos.push({ url: b.value.trim(), caption: "" }));

  return {
    id,
    status: els.inputStatus.value,
    published_date: els.inputDate.value || null,
    title: { nl: els.inputTitle.value.trim(), en: "" },
    location: els.inputLocation.value.trim(),
    region: els.inputRegion.value.trim(),
    difficulty: els.inputDifficulty.value || null,
    source_reference: els.inputSource.value.trim() || null,
    tags: els.inputKeywords.value.split(",").map((k) => k.trim()).filter(Boolean),
    summary: { nl: els.inputIntro.value.trim(), en: "" },
    story: { nl: storyText, en: "" },
    story_blocks: state.storyBlocks.filter((b) => b.value.trim()).map((b) => ({ type: b.type, value: b.value.trim() })),
    tips: { nl: els.inputTips.value.trim(), en: "" },
    photos: allPhotos,
    gpx_stats: state.gpx ? {
      distance_km: state.gpx.distance_km,
      duration_hours: state.gpx.duration_hours,
      elevation_up_m: state.gpx.elevation_up_m,
      elevation_down_m: state.gpx.elevation_down_m,
      avg_speed_kmh: state.gpx.avg_speed_kmh,
      max_speed_kmh: state.gpx.max_speed_kmh,
      highest_point_m: state.gpx.highest_point_m,
      lowest_point_m: state.gpx.lowest_point_m,
    } : null,
    weather: state.weather ? {
      date: state.weather.date,
      temperature_min: state.weather.temperature_min,
      temperature_max: state.weather.temperature_max,
      precipitation_mm: state.weather.precipitation_mm,
      wind_kmh: state.weather.wind_kmh,
      condition: els.inputWeatherCondition.value.trim(),
      source: "Open-Meteo",
    } : null,
  };
}

els.btnExport.addEventListener("click", () => {
  const id = els.inputRouteId.value.trim();
  if (!id) {
    showInlineError(els.inputRouteId, "Geef de route een ID (bestandsnaam).");
    els.inputRouteId.focus();
    return;
  }
  const json = buildRouteJson();
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${id}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// -----------------------------------------------------------
// AI GENEREREN
// -----------------------------------------------------------
els.btnAiGenerate.addEventListener("click", async () => {
  if (!state.apiKeyConfirmed || !state.apiKey) {
    alert("Voer eerst een geldige Anthropic API-sleutel in en bevestig.");
    return;
  }

  const keywords = els.inputKeywords.value.trim();
  const title = els.inputTitle.value.trim();
  const location = els.inputLocation.value.trim();
  const difficulty = els.inputDifficulty.value;
  const gpx = state.gpx;
  const weather = state.weather;

  if (!title && !location && !keywords) {
    alert("Vul minstens een titel, locatie of steekwoorden in.");
    return;
  }

  els.btnAiGenerate.classList.add("is-loading");
  els.btnAiGenerate.textContent = "\u2746 Genereren\u2026";

  const prompt = `Je schrijft Nederlandse wandelverhalen voor MyTrailWalks, een persoonlijk outdoor storytelling platform.

Gegevens van de wandeling:
- Titel: ${title || "onbekend"}
- Locatie: ${location || "onbekend"}
- Moeilijkheid: ${difficulty || "onbekend"}
- Steekwoorden / ervaringen: ${keywords || "geen"}
${gpx ? `- Afstand: ${gpx.distance_km} km, Duur: ${gpx.duration_hours} uur, Stijging: ${gpx.elevation_up_m} m` : ""}
${weather ? `- Weer: min ${weather.temperature_min}°C, max ${weather.temperature_max}°C, neerslag ${weather.precipitation_mm} mm, wind ${weather.wind_kmh} km/u` : ""}

Genereer ALLEEN een JSON-object (geen uitleg, geen markdown) met deze velden:
{
  "summary": "Één zin samenvatting van max 160 tekens voor de grid-weergave.",
  "story_blocks": [
    { "type": "text", "value": "Eerste alinea van het verhaal." },
    { "type": "text", "value": "Tweede alinea van het verhaal." }
  ],
  "tips": "2-4 praktische tips voor wandelaars, als doorlopende tekst."
}

Schrijf het verhaal in 3-5 alinea's. Persoonlijk, beschrijvend, no clickbait.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": state.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map((c) => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (parsed.summary) {
      els.inputIntro.value = parsed.summary;
      els.introCount.textContent = `${parsed.summary.length}/160`;
    }
    if (parsed.story_blocks?.length) {
      state.storyBlocks = parsed.story_blocks;
      renderBlockEditor();
    }
    if (parsed.tips) els.inputTips.value = parsed.tips;

    updatePreview();
  } catch (err) {
    console.error("AI generatie fout:", err);
    alert("AI-generatie mislukt. Controleer je API-sleutel en verbinding.");
  } finally {
    els.btnAiGenerate.classList.remove("is-loading");
    els.btnAiGenerate.innerHTML = '<span class="btn-icon">\u2746</span> Genereer met AI';
  }
});

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
function showInlineError(inputEl, message) {
  inputEl.style.borderColor = "var(--color-hard)";
  const existing = inputEl.parentElement.querySelector(".inline-error");
  if (existing) existing.remove();
  const span = document.createElement("span");
  span.className = "inline-error field__help";
  span.style.color = "var(--color-hard)";
  span.textContent = message;
  inputEl.parentElement.appendChild(span);
  setTimeout(() => {
    inputEl.style.borderColor = "";
    span.remove();
  }, 3000);
}

// -----------------------------------------------------------
// INIT — v2.0.0
// -----------------------------------------------------------
window.appReady.then(() => {
  renderBlockEditor();
  updatePreview();
});
