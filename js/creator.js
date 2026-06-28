// =======================================================
// creator.js — MyTrailWalks
// v2.0.1: GPX raw included fix
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
  gpxRaw: null,
  weather: null,
  storyBlocks: [],
  galleryPhotos: []
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
  inputCountry: $("input-country"),
  inputRegion: $("input-region"),
  inputPlace: $("input-place"),
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
  galleryList: $("gallery-list"),
  btnAddGalleryPhoto: $("btn-add-gallery-photo")
};

// -----------------------------------------------------------
// GPX UPLOAD
// -----------------------------------------------------------
els.gpxDropZone.addEventListener("click", () => els.gpxFileInput.click());

els.gpxFileInput.addEventListener("change", () => {
  const file = els.gpxFileInput.files[0];
  if (file) handleGpxFile(file);
});

els.gpxBrowseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  els.gpxFileInput.click();
});

function handleGpxFile(file) {
  if (!file.name.endsWith(".gpx")) {
    alert("Enkel .gpx bestanden worden ondersteund.");
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    state.gpxRaw = e.target.result;

    const gpxData = parseGpx(e.target.result);
    if (!gpxData) {
      alert("GPX-bestand kon niet worden gelezen.");
      return;
    }

    state.gpx = gpxData;

    displayGpxStats(gpxData);
    updatePreview();
  };

  reader.readAsText(file);
}

// -----------------------------------------------------------
// GPX PARSER
// -----------------------------------------------------------
function parseGpx(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const trkpts = [...doc.querySelectorAll("trkpt")];

  if (trkpts.length < 2) return null;

  let totalDistance = 0;
  let elevationUp = 0;
  let elevationDown = 0;
  let highest = -Infinity;
  let lowest = Infinity;
  let maxSpeed = 0;
  const speeds = [];

  let startTime = null;
  let endTime = null;

  for (let i = 1; i < trkpts.length; i++) {
    const a = trkpts[i - 1];
    const b = trkpts[i];

    const lat1 = +a.getAttribute("lat");
    const lon1 = +a.getAttribute("lon");
    const lat2 = +b.getAttribute("lat");
    const lon2 = +b.getAttribute("lon");

    const ele1 = +a.querySelector("ele")?.textContent || 0;
    const ele2 = +b.querySelector("ele")?.textContent || 0;

    const dist = haversine(lat1, lon1, lat2, lon2);
    totalDistance += dist;

    const diff = ele2 - ele1;
    if (diff > 0) elevationUp += diff;
    else elevationDown += Math.abs(diff);

    highest = Math.max(highest, ele1, ele2);
    lowest = Math.min(lowest, ele1, ele2);
  }

  const first = trkpts[0];
  const startLat = +first.getAttribute("lat");
  const startLon = +first.getAttribute("lon");

  return {
    distance_km: Math.round(totalDistance / 10) / 100,
    duration_hours: null,
    elevation_up_m: Math.round(elevationUp),
    elevation_down_m: Math.round(elevationDown),
    highest_point_m: Math.round(highest),
    lowest_point_m: Math.round(lowest),
    avg_speed_kmh: null,
    max_speed_kmh: null,
    startLat,
    startLon
  };
}

// -----------------------------------------------------------
// EXPORT
// -----------------------------------------------------------
function buildRouteJson() {
  const id = els.inputRouteId.value.trim() || "route";

  return {
    id,
    status: els.inputStatus.value || "draft",

    gpx: state.gpxRaw || null,

    gpx_stats: state.gpx || null
  };
}

els.btnExport.addEventListener("click", () => {
  const json = buildRouteJson();

  const blob = new Blob(
    [JSON.stringify(json, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${json.id}.json`;
  a.click();

  URL.revokeObjectURL(url);
});

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
