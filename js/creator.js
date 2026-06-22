// =======================================================
// creator.js — MyTrailWalks
// Route creator: GPX parse, weer, locatie, AI, JSON export
// Wijziging v1.1.0: i18nModule.init() toegevoegd in INIT
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
  photos: [],
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
  photoList: $("photo-list"),
  btnAddPhoto: $("btn-add-photo"),
  inputKeywords: $("input-keywords"),
  inputIntro: $("input-intro"),
  introCount: $("intro-count"),
  inputStory: $("input-story"),
  inputTips: $("input-tips"),
  inputRouteId: $("input-route-id"),
  inputStatus: $("input-status"),
  btnExport: $("btn-export"),
  previewJson: $("preview-json"),
  btnCopyJson: $("btn-copy-json"),
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
  els.inputApiKey.value = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  els.btnKeyConfirm.textContent = "\u2713 Bevestigd";
  els.btnKeyConfirm.disabled = true;
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
  els.statDistance.textContent = gpx.distance_km ? `${gpx.distance_km} km` : "\u2014";
  els.statDuration.textContent = gpx.duration_hours ? `${gpx.duration_hours} u` : "\u2014";
  els.statEleUp.textContent = gpx.elevation_up_m ? `+${gpx.elevation_up_m} m` : "\u2014";
  els.statEleDown.textContent = gpx.elevation_down_m ? `-${gpx.elevation_down_m} m` : "\u2014";
  els.statHighest.textContent = gpx.highest_point_m ? `${gpx.highest_point_m} m` : "\u2014";
  els.statLowest.textContent = gpx.lowest_point_m ? `${gpx.lowest_point_m} m` : "\u2014";
  els.statAvgSpeed.textContent = gpx.avg_speed_kmh ? `${gpx.avg_speed_kmh} km/u` : "\u2014";
  els.statMaxSpeed.textContent = gpx.max_speed_kmh ? `${gpx.max_speed_kmh} km/u` : "\u2014";
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
  if (!lat || !lon) { alert("Laad eerst een GPX-bestand (voor co\u00f6rdinaten)."); return; }

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

    els.wTempMin.textContent = state.weather.temperature_min !== null ? `${state.weather.temperature_min}\u00b0C` : "\u2014";
    els.wTempMax.textContent = state.weather.temperature_max !== null ? `${state.weather.temperature_max}\u00b0C` : "\u2014";
    els.wPrecip.textContent = state.weather.precipitation_mm !== null ? `${state.weather.precipitation_mm} mm` : "\u2014";
    els.wWind.textContent = state.weather.wind_kmh !== null ? `${state.weather.wind_kmh} km/u` : "\u2014";
    els.weatherBlock.hidden = false;
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
// FOTO'S
// -----------------------------------------------------------
els.btnAddPhoto.addEventListener("click", () => {
  const idx = state.photos.length;
  state.photos.push("");
  const entry = document.createElement("div");
  entry.className = "photo-entry";
  entry.dataset.idx = idx;
  entry.innerHTML = `
    <input type="url" class="input photo-url-input" placeholder="https://res.cloudinary.com/\u2026" data-idx="${idx}">
    <button class="photo-entry__remove" title="Verwijder foto" data-idx="${idx}">\u2715</button>
  `;
  els.photoList.appendChild(entry);
  entry.querySelector(".photo-url-input").addEventListener("input", (e) => {
    state.photos[parseInt(e.target.dataset.idx)] = e.target.value;
    updatePreview();
  });
  entry.querySelector(".photo-entry__remove").addEventListener("click", (e) => {
    const i = parseInt(e.target.dataset.idx);
    state.photos.splice(i, 1);
    entry.remove();
    document.querySelectorAll(".photo-entry").forEach((el, newIdx) => {
      el.dataset.idx = newIdx;
      el.querySelector(".photo-url-input").dataset.idx = newIdx;
      el.querySelector(".photo-entry__remove").dataset.idx = newIdx;
    });
    updatePreview();
  });
});

// -----------------------------------------------------------
// KARAKTER TELLER INTRO
// -----------------------------------------------------------
els.inputIntro.addEventListener("input", () => {
  els.introCount.textContent = `${els.inputIntro.value.length}/160`;
  updatePreview();
});

// -----------------------------------------------------------
// LIVE PREVIEW
// -----------------------------------------------------------
function buildRouteJson() {
  const id = els.inputRouteId.value.trim() || "nieuwe-route";
  const allPhotos = [];
  if (els.inputHeroPhoto.value.trim()) {
    allPhotos.push({ url: els.inputHeroPhoto.value.trim(), caption: "" });
  }
  state.photos.forEach((url) => {
    if (url.trim()) allPhotos.push({ url: url.trim(), caption: "" });
  });

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
    story: { nl: els.inputStory.value.trim(), en: "" },
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

function updatePreview() {
  const json = buildRouteJson();
  els.previewJson.querySelector("code").textContent = JSON.stringify(json, null, 2);
}

document.querySelectorAll(".input").forEach((el) => {
  el.addEventListener("input", updatePreview);
  el.addEventListener("change", updatePreview);
});

// -----------------------------------------------------------
// KOPIEER JSON
// -----------------------------------------------------------
els.btnCopyJson.addEventListener("click", () => {
  const text = els.previewJson.querySelector("code").textContent;
  navigator.clipboard.writeText(text).then(() => {
    els.btnCopyJson.textContent = "Gekopieerd!";
    setTimeout(() => (els.btnCopyJson.textContent = "Kopieer"), 1500);
  });
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
${weather ? `- Weer: min ${weather.temperature_min}\u00b0C, max ${weather.temperature_max}\u00b0C, neerslag ${weather.precipitation_mm} mm, wind ${weather.wind_kmh} km/u` : ""}

Genereer ALLEEN een JSON-object (geen uitleg, geen markdown) met deze velden:
{
  "summary": "E\u00e9n zin samenvatting van max 160 tekens voor de grid-weergave.",
  "story": "Volledig wandelverhaal in 3-5 alinea's. Persoonlijk, beschrijvend, no clickbait.",
  "tips": "2-4 praktische tips voor wandelaars, als doorlopende tekst."
}`;

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
    const clean = text.replace(/\`\`\`json|\`\`\`/g, "").trim();
    const parsed = JSON.parse(clean);

    if (parsed.summary) els.inputIntro.value = parsed.summary;
    if (parsed.story) els.inputStory.value = parsed.story;
    if (parsed.tips) els.inputTips.value = parsed.tips;

    els.introCount.textContent = `${els.inputIntro.value.length}/160`;
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
// JSON EXPORT
// -----------------------------------------------------------
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
// INIT — v1.2.0: i18n init verwijderd — app.js doet dit centraal
// -----------------------------------------------------------
window.appReady.then(() => {
  updatePreview();
});
