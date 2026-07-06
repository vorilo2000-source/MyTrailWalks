// =======================================================
// creator.js — MyTrailWalks
// Route creator: GPX parse, weer, locatie, AI, JSON export
// v3.0.0: GPX data model redesign — export gebruikt nu één gpx-object
//         met metadata, waypoints, routes, tracks, trackpunten, extensions
//         en stats; legacy gpx_raw/gpx_stats blijven alleen importfallback
// v2.4.3: hoogteprofiel preview toegevoegd (renderElevationPreview)
//         in de visuele preview rechterkolom — toont SVG profiel
//         per segment in segmentkleur zodra GPX-hoogtepunten beschikbaar zijn
// v2.4.2: datum-validatie bij weerdata ophalen (toekomstige datum)
//         resp.ok check + betere foutmeldingen Open-Meteo
// v2.4.1: track_points toegevoegd aan segments[].gpx_stats export
//         track_points toegevoegd aan root-level gpx_stats export (bug fix)
// v2.4.0: hike/trail vervoersmiddel + moeilijkheidsschaal per vervoersmiddel
//         (walking W1-W3, hike SAC T1-T6, cycling/motorcycle/car
//          klim+bochtigheid uit GPX + kasseien-override)
// v2.3.0: meerdere segmenten (GPX + datum/locatie per segment)
// v2.2.0: GPX raw embed in JSON export + GPS-ruis filtering
// v2.1.0: GPX raw embed in JSON export + herstel bij import
// v2.0.0: visuele preview, blokken-editor, JSON import
// v1.2.0: geen eigen i18n init (app.js doet dit centraal)
// =======================================================
"use strict";

// -----------------------------------------------------------
// KLEURCODE PER VERVOERSMIDDEL — kaart + segment header
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
  walking:    "🚶 Wandelen",
  hike:       "🥾 Hike / Trail",
  cycling:    "🚴 Fietsen",
  motorcycle: "🏍 Motor",
  car:        "🚗 Auto",
  train:      "🚆 Trein",
  bus:        "🚌 Bus",
  boat:       "⛵ Boot",
  plane:      "✈️ Vliegtuig",
};

// -----------------------------------------------------------
// MOEILIJKHEIDSSCHALEN PER VERVOERSMIDDEL
// -----------------------------------------------------------
const DIFFICULTY_SCALES = {
  walking: [
    { value: "W1", label: "W1 — Vlak (wandelpad, park, heide)" },
    { value: "W2", label: "W2 — Glooiend (bos, polders)" },
    { value: "W3", label: "W3 — Heuvelachtig (onverhard, hellingen)" },
  ],
  hike: [
    { value: "T1", label: "T1 — Wandelen (vlak, gymschoenen volstaan)" },
    { value: "T2", label: "T2 — Bergwandeling (gedeeltelijk steil)" },
    { value: "T3", label: "T3 — Veeleisende bergwandeling (steil terrein)" },
    { value: "T4", label: "T4 — Alpine wandeling (soms handen nodig)" },
    { value: "T5", label: "T5 — Veeleisende alpine wandeling (bergschoenen)" },
    { value: "T6", label: "T6 — Moeilijke alpine wandeling (klimgedeeltes)" },
  ],
  cycling: [
    { value: "C1", label: "C1 — Ontspannen (fietspad, rivierdal)" },
    { value: "C2", label: "C2 — Gemiddeld (landweg, lichte bochten)" },
    { value: "C3", label: "C3 — Pittig (heuvelweg, col met bochten)" },
    { value: "C4", label: "C4 — Zwaar (bergpas, haarspeldbochten)" },
  ],
  motorcycle: [
    { value: "M1", label: "M1 — Verharde weg (lokaal, snelweg, asfalt/beton/klinkers)" },
    { value: "M2", label: "M2 — Toeren / kasseien (landweg of kinderkopjes)" },
    { value: "M3", label: "M3 — Sportief (bergweg met bochten)" },
    { value: "M4", label: "M4 — Uitdagend (alpenpas, haarspeldbochten)" },
  ],
  car: [
    { value: "A1", label: "A1 — Verharde weg (lokaal, snelweg, asfalt/beton/klinkers)" },
    { value: "A2", label: "A2 — Landweg / kasseien (secundaire weg of kinderkopjes)" },
    { value: "A3", label: "A3 — Bergweg (heuvelachtig, col met bochten)" },
    { value: "A4", label: "A4 — Pas (alpenpas, serpentines)" },
  ],
};

function calculateSegmentDifficulty(seg) {
  const gpx = _gpxStats(seg.gpx);
  if (!gpx || !gpx.distance_km) return null;

  if (seg.transport === "walking") {
    const climbPerKm = (gpx.elevation_up_m || 0) / gpx.distance_km;
    if (climbPerKm < 5) return "W1";
    if (climbPerKm < 15) return "W2";
    return "W3";
  }

  if (seg.transport === "hike") {
    let score = 0;
    score += gpx.distance_km;
    if (gpx.elevation_up_m) score += gpx.elevation_up_m / 100;
    if (seg.weather) {
      if (seg.weather.temperature_max >= 25) score += 2;
      if (seg.weather.precipitation_mm >= 5) score += 2;
      if (seg.weather.wind_kmh >= 30) score += 1;
    }
    if (score <= 5)  return "T1";
    if (score <= 10) return "T2";
    if (score <= 16) return "T3";
    if (score <= 22) return "T4";
    if (score <= 28) return "T5";
    return "T6";
  }

  if (["cycling", "motorcycle", "car"].includes(seg.transport)) {
    return _calculateRoadDifficulty(seg);
  }

  return null;
}

function _calculateRoadDifficulty(seg) {
  const gpx = _gpxStats(seg.gpx);
  const prefix = { cycling: "C", motorcycle: "M", car: "A" }[seg.transport];

  const climbPerKm = (gpx.elevation_up_m || 0) / gpx.distance_km;
  const sharpTurnsPerKm = _countSharpTurnsPerKm(_trackPointsFromGpxModel(seg.gpx), gpx.distance_km);

  let level;
  if (seg.transport === "cycling") {
    if (climbPerKm < 8 && sharpTurnsPerKm < 3) level = 1;
    else if (climbPerKm < 20 || sharpTurnsPerKm < 8) level = 2;
    else if (climbPerKm < 40 || sharpTurnsPerKm < 15) level = 3;
    else level = 4;
  } else {
    if (climbPerKm < 15 && sharpTurnsPerKm < 2) level = 1;
    else if (climbPerKm < 40 || sharpTurnsPerKm < 6) level = 2;
    else if (climbPerKm < 80 || sharpTurnsPerKm < 15) level = 3;
    else level = 4;
  }

  if (seg.roughSurface && (seg.transport === "motorcycle" || seg.transport === "car") && level < 2) {
    level = 2;
  }

  return `${prefix}${level}`;
}

function _countSharpTurnsPerKm(trackPoints, distanceKm) {
  if (!trackPoints || trackPoints.length < 3 || !distanceKm) return 0;
  let sharpTurns = 0;
  for (let i = 1; i < trackPoints.length - 1; i++) {
    const [lat1, lon1] = trackPoints[i - 1];
    const [lat2, lon2] = trackPoints[i];
    const [lat3, lon3] = trackPoints[i + 1];
    const bearing1 = _bearing(lat1, lon1, lat2, lon2);
    const bearing2 = _bearing(lat2, lon2, lat3, lon3);
    let diff = Math.abs(bearing2 - bearing1);
    if (diff > 180) diff = 360 - diff;
    if (diff > 30) sharpTurns++;
  }
  return sharpTurns / distanceKm;
}

function _bearing(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

// -----------------------------------------------------------
// STATE
// -----------------------------------------------------------
const state = {
  aiMode: false,
  apiKey: null,
  apiKeyConfirmed: false,
  segments: [
    {
      id: 1,
      transport: "walking",
      label: "",
      gpx: null,
      date: "",
      location: "",
      country: "",
      region: "",
      place: "",
      weather: null,
      difficulty: "",
      difficultyAuto: true,
      roughSurface: false,
    },
  ],
  get gpx() { return this.segments[0]?.gpx || null; },
  get weather() { return this.segments[0]?.weather || null; },
  storyBlocks: [],
  galleryPhotos: [],
};

let segmentCounter = 1;

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
  segmentList: $("segment-list"),
  btnAddSegment: $("btn-add-segment"),
  inputTitle: $("input-title"),
  inputDifficulty: $("input-difficulty"),
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
  btnAddPhotoGridBlock: $("btn-add-photo-grid-block"),
  btnAddLinkBlock: $("btn-add-link-block"),
  galleryList: $("gallery-list"),
  btnAddGalleryPhoto: $("btn-add-gallery-photo"),
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
// SEGMENTEN
// -----------------------------------------------------------
function renderSegments() {
  els.segmentList.innerHTML = "";

  state.segments.forEach((seg, idx) => {
    const isOnly = state.segments.length === 1;
    const color = TRANSPORT_COLORS[seg.transport] || "#2C4A3B";
    const sid = seg.id;

    const div = document.createElement("div");
    div.className = "segment-block";
    div.dataset.sid = sid;
    div.style.borderLeftColor = color;

    div.innerHTML = `
      <div class="segment-block__header">
        <span class="segment-block__num">${idx + 1}</span>
        <div class="segment-block__transport">
          <select class="input input--sm segment-transport" data-sid="${sid}">
            ${Object.entries(TRANSPORT_LABELS).map(([val, label]) =>
              `<option value="${val}" ${seg.transport === val ? "selected" : ""}>${label}</option>`
            ).join("")}
          </select>
        </div>
        <input type="text" class="input input--sm segment-label" placeholder="Label (optioneel, bv. Naar startpunt)" value="${seg.label || ""}" data-sid="${sid}">
        ${!isOnly ? `<button class="segment-remove-btn" data-sid="${sid}" title="Segment verwijderen">✕</button>` : ""}
      </div>

      <div class="segment-gpx">
        <div class="drop-zone segment-drop-zone ${seg.gpx ? "drop-zone--has-file" : ""}" id="gpx-drop-zone-${sid}">
          <input type="file" id="gpx-file-input-${sid}" accept=".gpx" hidden>
          <div class="drop-zone__inner" id="gpx-drop-inner-${sid}" ${seg.gpx ? 'hidden' : ''}>
            <span class="drop-zone__icon">↑</span>
            <p class="drop-zone__text">Sleep je GPX-bestand hierheen</p>
            <p class="drop-zone__sub">of <button class="link-btn" id="gpx-browse-btn-${sid}">kies een bestand</button></p>
          </div>
        </div>
        <div class="gpx-stats" id="gpx-stats-${sid}" ${seg.gpx ? "" : "hidden"}>
          <div class="stat-grid">
            <div class="stat-item"><span class="stat-value" id="stat-distance-${sid}">${seg.gpx?.distance_km ? seg.gpx.distance_km + " km" : "—"}</span><span class="stat-label">Afstand</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-duration-${sid}">${seg.gpx?.duration_hours ? seg.gpx.duration_hours + " u" : "—"}</span><span class="stat-label">Duur</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-ele-up-${sid}">${seg.gpx?.elevation_up_m ? "+" + seg.gpx.elevation_up_m + " m" : "—"}</span><span class="stat-label">Stijging</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-ele-down-${sid}">${seg.gpx?.elevation_down_m ? "-" + seg.gpx.elevation_down_m + " m" : "—"}</span><span class="stat-label">Daling</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-highest-${sid}">${seg.gpx?.highest_point_m ? seg.gpx.highest_point_m + " m" : "—"}</span><span class="stat-label">Hoogste punt</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-lowest-${sid}">${seg.gpx?.lowest_point_m ? seg.gpx.lowest_point_m + " m" : "—"}</span><span class="stat-label">Laagste punt</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-avg-speed-${sid}">${seg.gpx?.avg_speed_kmh ? seg.gpx.avg_speed_kmh + " km/u" : "—"}</span><span class="stat-label">Gem. snelheid</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-max-speed-${sid}">${seg.gpx?.max_speed_kmh ? seg.gpx.max_speed_kmh + " km/u" : "—"}</span><span class="stat-label">Max. snelheid</span></div>
          </div>
          <span class="gpx-status" id="gpx-status-${sid}">${seg.gpx ? "✓ Geladen" : ""}</span>
          <button class="link-btn link-btn--small" id="gpx-reset-btn-${sid}">Ander bestand kiezen</button>
        </div>
      </div>

      <div class="segment-difficulty" id="segment-difficulty-${sid}">
        ${_renderDifficultyBlock(seg)}
      </div>

      <div class="segment-meta">
        <div class="field-row">
          <div class="field">
            <label class="field__label">Datum</label>
            <input type="date" class="input segment-date" value="${seg.date || ""}" data-sid="${sid}">
          </div>
          <div class="field field--grow">
            <label class="field__label">Locatie</label>
            <div class="input-with-action">
              <input type="text" class="input segment-location" placeholder="Automatisch via GPX of handmatig" value="${seg.location || ""}" data-sid="${sid}">
              <button class="btn btn--ghost btn--sm segment-fetch-location" data-sid="${sid}" title="Locatie ophalen via GPX-coördinaten">↺</button>
            </div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field__label">Land</label>
            <input type="text" class="input segment-country" placeholder="Automatisch via GPX" value="${seg.country || ""}" data-sid="${sid}">
          </div>
          <div class="field">
            <label class="field__label">Regio / Provincie</label>
            <input type="text" class="input segment-region" placeholder="Automatisch via GPX" value="${seg.region || ""}" data-sid="${sid}">
          </div>
          <div class="field">
            <label class="field__label">Plaats</label>
            <input type="text" class="input segment-place" placeholder="Automatisch via GPX" value="${seg.place || ""}" data-sid="${sid}">
          </div>
        </div>
        <div class="weather-block" id="weather-block-${sid}" ${seg.weather ? "" : "hidden"}>
          <div class="weather-block__header">
            <span class="weather-block__label">Weerdata — Open-Meteo</span>
            <button class="link-btn link-btn--small segment-refetch-weather" data-sid="${sid}">Opnieuw ophalen</button>
          </div>
          <div class="weather-grid">
            <div class="weather-item"><span class="stat-value" id="w-temp-min-${sid}">${seg.weather?.temperature_min != null ? seg.weather.temperature_min + "°C" : "—"}</span><span class="stat-label">Min. temp</span></div>
            <div class="weather-item"><span class="stat-value" id="w-temp-max-${sid}">${seg.weather?.temperature_max != null ? seg.weather.temperature_max + "°C" : "—"}</span><span class="stat-label">Max. temp</span></div>
            <div class="weather-item"><span class="stat-value" id="w-precip-${sid}">${seg.weather?.precipitation_mm != null ? seg.weather.precipitation_mm + " mm" : "—"}</span><span class="stat-label">Neerslag</span></div>
            <div class="weather-item"><span class="stat-value" id="w-wind-${sid}">${seg.weather?.wind_kmh != null ? seg.weather.wind_kmh + " km/u" : "—"}</span><span class="stat-label">Wind</span></div>
          </div>
          <div class="field field--inline">
            <label class="field__label">Omschrijving</label>
            <input type="text" class="input segment-weather-condition" placeholder="zonnig, bewolkt…" value="${seg.weather?.condition || ""}" data-sid="${sid}">
          </div>
        </div>
        <button class="btn btn--secondary btn--sm segment-fetch-weather" data-sid="${sid}">Weerdata ophalen</button>
      </div>
    `;

    els.segmentList.appendChild(div);
    _bindSegmentEvents(sid);
  });
}

function _renderDifficultyBlock(seg) {
  const sid = seg.id;
  const scale = DIFFICULTY_SCALES[seg.transport];

  if (!scale) {
    return `<p class="field__help segment-difficulty__none">Geen moeilijkheidsschaal van toepassing voor dit vervoersmiddel.</p>`;
  }

  const showRoughSurface = seg.transport === "motorcycle" || seg.transport === "car";
  const autoLabel = seg.gpx
    ? (seg.difficultyAuto ? "✓ Automatisch berekend" : "Handmatig ingesteld")
    : "Laad een GPX-bestand voor automatische berekening";

  var optionsHtml = scale.map(function(opt) {
    return "<option value=\"" + opt.value + "\" " + (seg.difficulty === opt.value ? "selected" : "") + ">" + opt.label + "</option>";
  }).join("");

  var roughHtml = "";
  if (showRoughSurface) {
    roughHtml = "<div class=\"field field--inline\">" +
      "<label class=\"checkbox-label\">" +
      "<input type=\"checkbox\" class=\"segment-rough-surface\" data-sid=\"" + sid + "\" " + (seg.roughSurface ? "checked" : "") + ">" +
      " Kasseien / kinderkopjes / onverhard wegdek" +
      "</label>" +
      "<span class=\"field__help\">Tilt het niveau minstens naar niveau 2 (wegdektype is niet uit GPX af te leiden)</span>" +
      "</div>";
  }

  return "<div class=\"field\">" +
    "<label class=\"field__label\">Moeilijkheidsgraad</label>" +
    "<select class=\"input segment-difficulty-select\" data-sid=\"" + sid + "\">" +
    "<option value=\"\">— Kies —</option>" +
    optionsHtml +
    "</select>" +
    "<span class=\"field__help segment-difficulty__status\" id=\"difficulty-status-" + sid + "\">" + autoLabel + "</span>" +
    "</div>" +
    roughHtml;
}

function _bindSegmentEvents(sid) {
  const seg = _getSeg(sid);
  if (!seg) return;

  const transportSel = document.querySelector(`.segment-transport[data-sid="${sid}"]`);
  if (transportSel) {
    transportSel.addEventListener("change", (e) => {
      seg.transport = e.target.value;
      const block = document.querySelector(`.segment-block[data-sid="${sid}"]`);
      if (block) block.style.borderLeftColor = TRANSPORT_COLORS[seg.transport] || "#2C4A3B";
      seg.difficulty = "";
      seg.difficultyAuto = true;
      if (seg.gpx) {
        const auto = calculateSegmentDifficulty(seg);
        if (auto) seg.difficulty = auto;
      }
      _refreshDifficultyBlock(sid);
      updatePreview();
    });
  }

  const labelInp = document.querySelector(`.segment-label[data-sid="${sid}"]`);
  if (labelInp) labelInp.addEventListener("input", (e) => { seg.label = e.target.value; });

  const removeBtn = document.querySelector(`.segment-remove-btn[data-sid="${sid}"]`);
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      state.segments = state.segments.filter((s) => s.id !== sid);
      renderSegments();
      updatePreview();
    });
  }

  const dropZone = $(`gpx-drop-zone-${sid}`);
  const fileInput = $(`gpx-file-input-${sid}`);
  const browseBtn = $(`gpx-browse-btn-${sid}`);
  const resetBtn = $(`gpx-reset-btn-${sid}`);

  if (dropZone) {
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drop-zone--active"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drop-zone--active"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drop-zone--active");
      const file = e.dataTransfer.files[0];
      if (file) handleGpxFile(file, sid);
    });
  }

  if (browseBtn) browseBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
  if (fileInput) fileInput.addEventListener("change", () => { const file = fileInput.files[0]; if (file) handleGpxFile(file, sid); });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      seg.gpx = null;
      $(`gpx-stats-${sid}`).hidden = true;
      const inner = $(`gpx-drop-inner-${sid}`);
      if (inner) inner.hidden = false;
      dropZone.classList.remove("drop-zone--has-file");
      fileInput.value = "";
      updatePreview();
    });
  }

  const dateInp = document.querySelector(`.segment-date[data-sid="${sid}"]`);
  if (dateInp) dateInp.addEventListener("change", (e) => { seg.date = e.target.value; updatePreview(); });

  const difficultySel = document.querySelector(`.segment-difficulty-select[data-sid="${sid}"]`);
  if (difficultySel) {
    difficultySel.addEventListener("change", (e) => {
      seg.difficulty = e.target.value;
      seg.difficultyAuto = false;
      const statusEl = $(`difficulty-status-${sid}`);
      if (statusEl) statusEl.textContent = seg.difficulty ? "Handmatig ingesteld" : "Nog niet gekozen";
      updatePreview();
    });
  }

  const roughInp = document.querySelector(`.segment-rough-surface[data-sid="${sid}"]`);
  if (roughInp) {
    roughInp.addEventListener("change", (e) => {
      seg.roughSurface = e.target.checked;
      if (seg.difficultyAuto && seg.gpx) {
        const auto = calculateSegmentDifficulty(seg);
        if (auto) {
          seg.difficulty = auto;
          const sel = document.querySelector(`.segment-difficulty-select[data-sid="${sid}"]`);
          if (sel) sel.value = auto;
        }
      }
      updatePreview();
    });
  }

  const locInp = document.querySelector(`.segment-location[data-sid="${sid}"]`);
  if (locInp) locInp.addEventListener("input", (e) => { seg.location = e.target.value; updatePreview(); });

  const countryInp = document.querySelector(`.segment-country[data-sid="${sid}"]`);
  if (countryInp) countryInp.addEventListener("input", (e) => { seg.country = e.target.value; });

  const regionInp = document.querySelector(`.segment-region[data-sid="${sid}"]`);
  if (regionInp) regionInp.addEventListener("input", (e) => { seg.region = e.target.value; });

  const placeInp = document.querySelector(`.segment-place[data-sid="${sid}"]`);
  if (placeInp) placeInp.addEventListener("input", (e) => { seg.place = e.target.value; });

  const fetchLocBtn = document.querySelector(`.segment-fetch-location[data-sid="${sid}"]`);
  if (fetchLocBtn) {
    fetchLocBtn.addEventListener("click", () => {
      const start = _gpxStart(seg.gpx);
      if (start?.lat && start?.lon) {
        fetchLocationName(start.lat, start.lon, sid);
      } else {
        alert("Laad eerst een GPX-bestand voor dit segment.");
      }
    });
  }

  const fetchWeatherBtn = document.querySelector(`.segment-fetch-weather[data-sid="${sid}"]`);
  if (fetchWeatherBtn) fetchWeatherBtn.addEventListener("click", () => fetchWeather(sid));

  const refetchWeatherBtn = document.querySelector(`.segment-refetch-weather[data-sid="${sid}"]`);
  if (refetchWeatherBtn) refetchWeatherBtn.addEventListener("click", () => fetchWeather(sid));

  const condInp = document.querySelector(`.segment-weather-condition[data-sid="${sid}"]`);
  if (condInp) condInp.addEventListener("input", (e) => { if (seg.weather) seg.weather.condition = e.target.value; });
}

function _refreshDifficultyBlock(sid) {
  const seg = _getSeg(sid);
  const container = $(`segment-difficulty-${sid}`);
  if (!seg || !container) return;
  container.innerHTML = _renderDifficultyBlock(seg);

  const difficultySel = container.querySelector(`.segment-difficulty-select[data-sid="${sid}"]`);
  if (difficultySel) {
    difficultySel.addEventListener("change", (e) => {
      seg.difficulty = e.target.value;
      seg.difficultyAuto = false;
      const statusEl = $(`difficulty-status-${sid}`);
      if (statusEl) statusEl.textContent = seg.difficulty ? "Handmatig ingesteld" : "Nog niet gekozen";
      updatePreview();
    });
  }
  const roughInp = container.querySelector(`.segment-rough-surface[data-sid="${sid}"]`);
  if (roughInp) {
    roughInp.addEventListener("change", (e) => {
      seg.roughSurface = e.target.checked;
      if (seg.difficultyAuto && seg.gpx) {
        const auto = calculateSegmentDifficulty(seg);
        if (auto) { seg.difficulty = auto; difficultySel.value = auto; }
      }
      updatePreview();
    });
  }
}

function _getSeg(sid) {
  return state.segments.find((s) => s.id === sid) || null;
}

els.btnAddSegment.addEventListener("click", () => {
  segmentCounter++;
  state.segments.push({
    id: segmentCounter, transport: "walking", label: "", gpx: null,
    date: "", location: "", country: "", region: "", place: "",
    weather: null, difficulty: "", difficultyAuto: true, roughSurface: false,
  });
  renderSegments();
  const newBlock = document.querySelector(`.segment-block[data-sid="${segmentCounter}"]`);
  if (newBlock) newBlock.scrollIntoView({ behavior: "smooth", block: "start" });
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
  els.jsonImportInput.value = "";
});

function loadJsonIntoForm(data) {
  if (data.id) els.inputRouteId.value = data.id;
  if (data.status) els.inputStatus.value = data.status;
  if (data.title?.nl) els.inputTitle.value = data.title.nl;
  if (data.difficulty) els.inputDifficulty.value = data.difficulty;
  if (data.source_reference) els.inputSource.value = data.source_reference;
  if (data.tags?.length) els.inputKeywords.value = data.tags.join(", ");
  if (data.summary?.nl) { els.inputIntro.value = data.summary.nl; els.introCount.textContent = `${data.summary.nl.length}/160`; }
  if (data.tips?.nl) els.inputTips.value = data.tips.nl;

  if (data.photos?.length) {
    let heroUrl = data.photos[0].url || "";
    if (heroUrl && heroUrl.includes("res.cloudinary.com") && !heroUrl.includes("w_1200")) {
      heroUrl = heroUrl.replace("/upload/", "/upload/w_1200,f_auto/");
    }
    els.inputHeroPhoto.value = heroUrl;
  }

  state.storyBlocks = [];
  if (data.story_blocks?.length) {
    state.storyBlocks = data.story_blocks.map((b) => ({ ...b, value: b.value || "" }));
  } else if (data.story?.nl) {
    state.storyBlocks = [{ type: "text", value: data.story.nl }];
  }
  if (!data.story_blocks && data.photos?.length > 1) {
    data.photos.slice(1).forEach((p) => { if (p.url) state.storyBlocks.push({ type: "photo", value: p.url }); });
  }

  if (data.gallery?.length) { state.galleryPhotos = data.gallery.map((p) => ({ url: p.url || "" })); renderGallery(); }

  if (data.segments?.length) {
    segmentCounter = 0;
    state.segments = data.segments.map((s) => {
      segmentCounter++;
      const seg = {
        id: segmentCounter, transport: s.transport || "walking", label: s.label || "",
        gpx: null, date: s.date || "",
        location: s.location || "", country: s.country || "", region: s.region || "",
        place: s.place || "", weather: s.weather || null, difficulty: s.difficulty || "",
        difficultyAuto: s.difficulty_auto !== false, roughSurface: s.rough_surface || false,
      };
      if (s.gpx) { seg.gpx = _gpxModelToRuntime(s.gpx); } // v3.0.0 import: gebruik het nieuwe gpx-hoofdmodel rechtstreeks.
      else if (s.gpx_raw) { const parsed = parseGpx(s.gpx_raw); if (parsed) seg.gpx = parsed; } // Legacy import: oude JSON met gpx_raw opnieuw parsen.
      else if (s.gpx_stats) { seg.gpx = _gpxStatsToGpx(s.gpx_stats); } // Legacy import: oude JSON zonder raw fallback.
      if (!seg.difficulty && seg.gpx) { const auto = calculateSegmentDifficulty(seg); if (auto) seg.difficulty = auto; }
      return seg;
    });
  } else {
    segmentCounter = 1;
    const seg = state.segments[0];
    seg.transport = data.transport?.[0] || "walking";
    seg.date = data.published_date || "";
    seg.location = data.location || "";
    seg.country = data.country || "";
    seg.region = data.region || "";
    seg.place = data.place || "";
    seg.weather = data.weather || null;
    seg.difficulty = data.difficulty || "";
    seg.difficultyAuto = !data.difficulty;
    seg.roughSurface = false;
    if (data.gpx) { seg.gpx = _gpxModelToRuntime(data.gpx); } // v3.0.0 root-level GPX import.
    else if (data.gpx_raw) { const parsed = parseGpx(data.gpx_raw); if (parsed) seg.gpx = parsed; } // Legacy root-level raw import.
    else if (data.gpx_stats) { seg.gpx = _gpxStatsToGpx(data.gpx_stats); } // Legacy root-level stats import.
    if (!seg.difficulty && seg.gpx) { const auto = calculateSegmentDifficulty(seg); if (auto) seg.difficulty = auto; }
    state.segments = [seg];
  }

  renderSegments();
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
      const escaped = (block.value || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      bodyHtml = `<div class="block-item__label">Tekst</div><textarea class="block-textarea input input--textarea" rows="4" placeholder="Schrijf een alinea\u2026" data-idx="${i}">${escaped}</textarea>`;
    } else if (block.type === "photo") {
      bodyHtml = `<div class="block-item__label">Foto (volledig breed)</div><input type="url" class="block-url-input input" placeholder="https://res.cloudinary.com/…" value="${block.value || ""}" data-idx="${i}"><div class="block-photo-preview" data-idx="${i}">${block.value ? `<img src="${block.value}" alt="" class="block-photo-preview__img" onerror="this.parentElement.hidden=true">` : ""}</div>`;
    } else if (block.type === "photo-grid") {
      const cols = block.cols || 2;
      const photos = block.photos || ["", ""];
      const photosHtml = photos.map((url, pi) => `<div class="photo-grid-entry"><input type="url" class="block-url-input input block-grid-url" placeholder="Cloudinary URL…" value="${url}" data-idx="${i}" data-pi="${pi}">${url ? `<img src="${url}" alt="" class="block-photo-preview__img" style="margin-top:4px;" onerror="this.remove()">` : ""}</div>`).join("");
      bodyHtml = `<div class="block-item__label">Foto grid</div><div class="block-grid-controls"><span style="font-size:var(--text-xs);color:var(--color-charcoal-soft);">Kolommen:</span><label class="block-grid-col-opt"><input type="radio" name="grid-cols-${i}" value="2" ${cols === 2 ? "checked" : ""} data-idx="${i}"> 2</label><label class="block-grid-col-opt"><input type="radio" name="grid-cols-${i}" value="3" ${cols === 3 ? "checked" : ""} data-idx="${i}"> 3</label></div><div class="photo-grid-inputs" data-idx="${i}" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;">${photosHtml}</div><button class="link-btn link-btn--small block-grid-add-photo" data-idx="${i}" style="margin-top:6px;">+ Foto toevoegen</button>`;
    } else if (block.type === "link") {
      bodyHtml = `<div class="block-item__label">Link</div><input type="text" class="block-link-name input" placeholder="Naam (bv. Route op AllTrails)" value="${block.name || ""}" data-idx="${i}" style="margin-bottom:6px;"><input type="url" class="block-link-url input" placeholder="https://…" value="${block.url || ""}" data-idx="${i}">`;
    }

    item.innerHTML = `<div class="block-controls"><button class="block-ctrl-btn" data-action="up" data-idx="${i}" title="Omhoog" ${isFirst ? "disabled" : ""}>↑</button><button class="block-ctrl-btn" data-action="down" data-idx="${i}" title="Omlaag" ${isLast ? "disabled" : ""}>↓</button></div><div class="block-body">${bodyHtml}</div><button class="block-remove-btn" data-action="remove" data-idx="${i}" title="Verwijder blok">✕</button>`;
    els.blockList.appendChild(item);
  });

  els.blockList.querySelectorAll("[data-action]").forEach((btn) => btn.addEventListener("click", handleBlockAction));
  els.blockList.querySelectorAll(".block-textarea").forEach((ta) => ta.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].value = e.target.value; updatePreview(); }));
  els.blockList.querySelectorAll(".block-url-input:not(.block-grid-url)").forEach((inp) => {
    inp.addEventListener("blur", (e) => { const idx = parseInt(e.target.dataset.idx); const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); if (fixed !== e.target.value.trim()) { e.target.value = fixed; state.storyBlocks[idx].value = fixed; } updatePreview(); });
    inp.addEventListener("input", (e) => { const idx = parseInt(e.target.dataset.idx); state.storyBlocks[idx].value = e.target.value; const preview = els.blockList.querySelector(`.block-photo-preview[data-idx="${idx}"]`); if (preview) { const url = e.target.value.trim(); preview.hidden = !url; preview.innerHTML = url ? `<img src="${url}" alt="" class="block-photo-preview__img" onerror="this.parentElement.hidden=true">` : ""; } updatePreview(); });
  });
  els.blockList.querySelectorAll(".block-grid-url").forEach((inp) => {
    inp.addEventListener("blur", (e) => { const idx = parseInt(e.target.dataset.idx); const pi = parseInt(e.target.dataset.pi); const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); e.target.value = fixed; state.storyBlocks[idx].photos[pi] = fixed; updatePreview(); });
    inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].photos[parseInt(e.target.dataset.pi)] = e.target.value; updatePreview(); });
  });
  els.blockList.querySelectorAll(".block-grid-col-opt input").forEach((radio) => radio.addEventListener("change", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].cols = parseInt(e.target.value); renderBlockEditor(); updatePreview(); }));
  els.blockList.querySelectorAll(".block-grid-add-photo").forEach((btn) => btn.addEventListener("click", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].photos.push(""); renderBlockEditor(); }));
  els.blockList.querySelectorAll(".block-link-name").forEach((inp) => inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].name = e.target.value; updatePreview(); }));
  els.blockList.querySelectorAll(".block-link-url").forEach((inp) => inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].url = e.target.value; updatePreview(); }));
}

function handleBlockAction(e) {
  const action = e.currentTarget.dataset.action;
  const idx = parseInt(e.currentTarget.dataset.idx);
  if (action === "up" && idx > 0) [state.storyBlocks[idx - 1], state.storyBlocks[idx]] = [state.storyBlocks[idx], state.storyBlocks[idx - 1]];
  else if (action === "down" && idx < state.storyBlocks.length - 1) [state.storyBlocks[idx], state.storyBlocks[idx + 1]] = [state.storyBlocks[idx + 1], state.storyBlocks[idx]];
  else if (action === "remove") state.storyBlocks.splice(idx, 1);
  renderBlockEditor();
  updatePreview();
}

els.btnAddTextBlock.addEventListener("click", () => { state.storyBlocks.push({ type: "text", value: "" }); renderBlockEditor(); updatePreview(); });
els.btnAddPhotoBlock.addEventListener("click", () => { state.storyBlocks.push({ type: "photo", value: "" }); renderBlockEditor(); updatePreview(); });
els.btnAddPhotoGridBlock.addEventListener("click", () => { state.storyBlocks.push({ type: "photo-grid", cols: 2, photos: ["", ""] }); renderBlockEditor(); updatePreview(); });
els.btnAddLinkBlock.addEventListener("click", () => { state.storyBlocks.push({ type: "link", name: "", url: "" }); renderBlockEditor(); updatePreview(); });

// -----------------------------------------------------------
// GALERIJ
// -----------------------------------------------------------
function renderGallery() {
  if (!els.galleryList) return;
  els.galleryList.innerHTML = "";
  state.galleryPhotos.forEach((photo, i) => {
    const entry = document.createElement("div");
    entry.className = "photo-entry";
    entry.innerHTML = `<input type="url" class="input gallery-url-input" placeholder="https://res.cloudinary.com/…" value="${photo.url || ""}" data-idx="${i}"><button class="photo-entry__remove" data-idx="${i}" title="Verwijder">✕</button>`;
    entry.querySelector(".gallery-url-input").addEventListener("blur", (e) => { const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); e.target.value = fixed; state.galleryPhotos[i].url = fixed; updatePreview(); });
    entry.querySelector(".gallery-url-input").addEventListener("input", (e) => { state.galleryPhotos[i].url = e.target.value; updatePreview(); });
    entry.querySelector(".photo-entry__remove").addEventListener("click", () => { state.galleryPhotos.splice(i, 1); renderGallery(); updatePreview(); });
    els.galleryList.appendChild(entry);
  });
}

if (els.btnAddGalleryPhoto) els.btnAddGalleryPhoto.addEventListener("click", () => { state.galleryPhotos.push({ url: "" }); renderGallery(); });

// -----------------------------------------------------------
// GPX VERWERKING
// -----------------------------------------------------------
function handleGpxFile(file, sid) {
  if (!file.name.endsWith(".gpx")) { alert("Enkel .gpx bestanden worden ondersteund."); return; }
  const seg = _getSeg(sid);
  if (!seg) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const gpxData = parseGpx(e.target.result, sid);
    if (!gpxData) { alert("GPX-bestand kon niet worden gelezen. Controleer het bestand."); return; }
    seg.gpx = gpxData;
    displayGpxStats(gpxData, sid);
    const dateInp = document.querySelector(`.segment-date[data-sid="${sid}"]`);
    if (dateInp && !dateInp.value && gpxData.date) { dateInp.value = gpxData.date; seg.date = gpxData.date; }
    const start = _gpxStart(gpxData);
    if (start?.lat && start?.lon) fetchLocationName(start.lat, start.lon, sid);
    if (seg.difficultyAuto) { const auto = calculateSegmentDifficulty(seg); if (auto) { seg.difficulty = auto; _refreshDifficultyBlock(sid); } }
    if (sid === state.segments[0].id) applyCalculatedDifficulty();
    updatePreview();
  };
  reader.readAsText(file);
}

function displayGpxStats(gpx, sid) {
  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  set(`stat-distance-${sid}`, gpx.distance_km ? `${gpx.distance_km} km` : "—");
  set(`stat-duration-${sid}`, gpx.duration_hours ? `${gpx.duration_hours} u` : "—");
  set(`stat-ele-up-${sid}`, gpx.elevation_up_m ? `+${gpx.elevation_up_m} m` : "—");
  set(`stat-ele-down-${sid}`, gpx.elevation_down_m ? `-${gpx.elevation_down_m} m` : "—");
  set(`stat-highest-${sid}`, gpx.highest_point_m ? `${gpx.highest_point_m} m` : "—");
  set(`stat-lowest-${sid}`, gpx.lowest_point_m ? `${gpx.lowest_point_m} m` : "—");
  set(`stat-avg-speed-${sid}`, gpx.avg_speed_kmh ? `${gpx.avg_speed_kmh} km/u` : "—");
  set(`stat-max-speed-${sid}`, gpx.max_speed_kmh ? `${gpx.max_speed_kmh} km/u` : "—");
  const dropZone = $(`gpx-drop-zone-${sid}`);
  const inner = $(`gpx-drop-inner-${sid}`);
  const statsEl = $(`gpx-stats-${sid}`);
  const statusEl = $(`gpx-status-${sid}`);
  if (inner) inner.hidden = true;
  if (dropZone) dropZone.classList.add("drop-zone--has-file");
  if (statsEl) statsEl.hidden = false;
  if (statusEl) statusEl.textContent = "✓ Geladen";
}

// -----------------------------------------------------------
// GPX PARSER
// -----------------------------------------------------------
function parseGpx(xmlText, sid) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));
    if (trkpts.length < 2) return null;

    let totalDistance = 0, elevationUp = 0, elevationDown = 0;
    let highestPoint = -Infinity, lowestPoint = Infinity;
    const speeds = [], speedPeaks = [];
    let startTime = null, endTime = null;
    const WARMUP_SKIP = 10;

    for (let i = 1; i < trkpts.length; i++) {
      const prev = trkpts[i - 1], curr = trkpts[i];
      const lat1 = parseFloat(prev.getAttribute("lat")), lon1 = parseFloat(prev.getAttribute("lon"));
      const lat2 = parseFloat(curr.getAttribute("lat")), lon2 = parseFloat(curr.getAttribute("lon"));
      const ele1 = parseFloat(prev.querySelector("ele")?.textContent || 0);
      const ele2 = parseFloat(curr.querySelector("ele")?.textContent || 0);
      const dist = haversine(lat1, lon1, lat2, lon2);
      totalDistance += dist;
      const eleDiff = ele2 - ele1;
      if (eleDiff > 2) elevationUp += eleDiff;
      else if (eleDiff < -2) elevationDown += Math.abs(eleDiff);
      highestPoint = Math.max(highestPoint, ele1, ele2);
      lowestPoint = Math.min(lowestPoint, ele1, ele2);
      const timeEl1 = prev.querySelector("time"), timeEl2 = curr.querySelector("time");
      if (timeEl1 && timeEl2) {
        const t1 = new Date(timeEl1.textContent), t2 = new Date(timeEl2.textContent);
        if (!startTime) startTime = t1;
        endTime = t2;
        const timeDiff = (t2 - t1) / 3600000;
        if (timeDiff > 0 && i >= WARMUP_SKIP) speeds.push((dist / 1000) / timeDiff);
      }
    }

    const avgRaw = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null;
    const peakThreshold = avgRaw ? avgRaw * 3 : null;
    const filteredSpeeds = [];
    speeds.forEach((s) => { if (peakThreshold && s >= peakThreshold) speedPeaks.push(Math.round(s * 10) / 10); else filteredSpeeds.push(s); });

    const firstPt = trkpts[0];
    const startLat = parseFloat(firstPt.getAttribute("lat"));
    const startLon = parseFloat(firstPt.getAttribute("lon"));
    const durationHours = startTime && endTime ? (endTime - startTime) / 3600000 : null;
    const avgSpeed = filteredSpeeds.length ? filteredSpeeds.reduce((a, b) => a + b, 0) / filteredSpeeds.length : null;
    const maxSpeedFiltered = filteredSpeeds.length ? Math.max(...filteredSpeeds) : 0;
    const maxSpeedRaw = speeds.length ? Math.max(...speeds) : 0;

    let date = null;
    const firstTime = trkpts[0].querySelector("time");
    if (firstTime) date = firstTime.textContent.split("T")[0];

    const step = Math.max(1, Math.floor(trkpts.length / 500)); // Beperk kaartpunten voor snelle preview/kaartweergave.
    const trackPoints = []; // Bewaart kaartpunten inclusief hoogte: [lat, lon, ele].
    for (let i = 0; i < trkpts.length; i += step) { // Neem gesamplede punten over uit de GPX-track.
      const pt = trkpts[i]; // Huidig GPX-trackpunt.
      const lat = parseFloat(pt.getAttribute("lat")); // Latitude uit GPX-attribuut.
      const lon = parseFloat(pt.getAttribute("lon")); // Longitude uit GPX-attribuut.
      const eleText = pt.querySelector("ele")?.textContent; // Hoogtewaarde uit <ele>, indien aanwezig.
      const ele = eleText != null ? parseFloat(eleText) : null; // Zet hoogte om naar getal of null.
      trackPoints.push([lat, lon, !isNaN(ele) ? ele : null]); // Bewaar hoogte mee in JSON-ready trackpunten.
    }

    const lastPt = trkpts[trkpts.length - 1];
    const endLat = parseFloat(lastPt.getAttribute("lat"));
    const endLon = parseFloat(lastPt.getAttribute("lon"));
    const endEleText = lastPt.querySelector("ele")?.textContent;
    const endTimeText = lastPt.querySelector("time")?.textContent || null;
    const startEleText = firstPt.querySelector("ele")?.textContent;
    const startTimeText = firstPt.querySelector("time")?.textContent || null;

    const full = parseGpxToJson(xmlText); // Volledige GPX als gestructureerde JSON voor export/import zonder XML-herparse.
    const result = _withRuntimeGpxAliases({
      ...full,
      stats: {
        distance_km: Math.round(totalDistance / 10) / 100,
        duration_hours: durationHours ? Math.round(durationHours * 10) / 10 : null,
        elevation_up_m: Math.round(elevationUp),
        elevation_down_m: Math.round(elevationDown),
        highest_point_m: Math.round(highestPoint),
        lowest_point_m: Math.round(lowestPoint),
        avg_speed_kmh: avgSpeed ? Math.round(avgSpeed * 10) / 10 : null,
        max_speed_kmh: Math.round(maxSpeedFiltered * 10) / 10,
        start: {
          lat: startLat,
          lon: startLon,
          ele: startEleText != null && !isNaN(parseFloat(startEleText)) ? parseFloat(startEleText) : null,
          time: startTimeText,
        },
        end: {
          lat: endLat,
          lon: endLon,
          ele: endEleText != null && !isNaN(parseFloat(endEleText)) ? parseFloat(endEleText) : null,
          time: endTimeText,
        },
      },
    });

    if (speedPeaks.length > 0) {
      result._maxSpeedRaw = Math.round(maxSpeedRaw * 10) / 10;
      result._speedPeaks = speedPeaks;
      showSpeedWarning(result, sid);
    }

    return result;
  } catch (err) {
    console.error("GPX parse fout:", err);
    return null;
  }
}


// ======================= GPX VOLLEDIG OMZETTEN NAAR JSON =======================
// Zet metadata, waypoints, routes, tracks, tracksegmenten, trackpunten en extensions
// om naar één gestructureerd JSON-model. Dit is vanaf v3.0.0 het hoofdmodel.
function parseGpxToJson(xmlText) {
  const parser = new DOMParser(); // Maakt van de GPX-tekst een XML-document.
  const doc = parser.parseFromString(xmlText, "application/xml"); // Parse GPX als XML.
  const metadataEl = doc.querySelector("metadata"); // Metadata-blok indien aanwezig.

  const readText = (parent, selector) => parent?.querySelector(selector)?.textContent?.trim() || null; // Leest tekst veilig uit.
  const readInnerXml = (parent, selector) => parent?.querySelector(selector)?.innerHTML?.trim() || null; // Bewaart child-XML exact als tekst.
  const readLinks = (parent) => Array.from(parent?.querySelectorAll(":scope > link") || []).map((link) => ({ // Leest directe GPX-links.
    href: link.getAttribute("href") || null, // Linkdoel uit href-attribuut.
    text: readText(link, "text"), // Linktekst indien aanwezig.
    type: readText(link, "type"), // Linktype indien aanwezig.
  }));
  const numOrNull = (value) => { // Zet tekst naar getal of null.
    const n = parseFloat(value); // Parse als floating point.
    return !isNaN(n) ? n : null; // Geef null terug bij ongeldige waarde.
  };
  const readPoint = (pt) => ({ // Maakt één waypoint, routepunt of trackpunt.
    lat: numOrNull(pt.getAttribute("lat")), // Latitude uit GPX-attribuut.
    lon: numOrNull(pt.getAttribute("lon")), // Longitude uit GPX-attribuut.
    ele: numOrNull(readText(pt, "ele")), // Hoogte uit <ele> indien aanwezig.
    time: readText(pt, "time"), // Tijdstip uit <time> indien aanwezig.
    name: readText(pt, "name"), // Naam uit <name> indien aanwezig.
    cmt: readText(pt, "cmt"), // Commentaar uit <cmt> indien aanwezig.
    desc: readText(pt, "desc"), // Beschrijving uit <desc> indien aanwezig.
    src: readText(pt, "src"), // Bron uit <src> indien aanwezig.
    links: readLinks(pt), // Directe links bij dit punt.
    sym: readText(pt, "sym"), // Symbool uit <sym> indien aanwezig.
    type: readText(pt, "type"), // Type uit <type> indien aanwezig.
    fix: readText(pt, "fix"), // GPS-fix indien aanwezig.
    sat: numOrNull(readText(pt, "sat")), // Aantal satellieten indien aanwezig.
    hdop: numOrNull(readText(pt, "hdop")), // Horizontale nauwkeurigheid indien aanwezig.
    vdop: numOrNull(readText(pt, "vdop")), // Verticale nauwkeurigheid indien aanwezig.
    pdop: numOrNull(readText(pt, "pdop")), // Positienauwkeurigheid indien aanwezig.
    ageofdgpsdata: numOrNull(readText(pt, "ageofdgpsdata")), // DGPS-leeftijd indien aanwezig.
    dgpsid: numOrNull(readText(pt, "dgpsid")), // DGPS-station indien aanwezig.
    extensions: readInnerXml(pt, "extensions"), // App-specifieke extensies ongewijzigd bewaren.
  });

  return {
    version: doc.documentElement?.getAttribute("version") || null, // GPX-versie uit root-attribuut.
    creator: doc.documentElement?.getAttribute("creator") || null, // Maker/app uit root-attribuut.
    metadata: {
      name: readText(metadataEl, "name"), // Metadata-naam.
      desc: readText(metadataEl, "desc"), // Metadata-beschrijving.
      author: metadataEl?.querySelector("author") ? { // Auteur indien aanwezig.
        name: readText(metadataEl, "author > name"), // Auteursnaam.
        email: metadataEl.querySelector("author > email") ? { // E-mail indien GPX dit bevat.
          id: metadataEl.querySelector("author > email")?.getAttribute("id") || null, // E-mail id-deel.
          domain: metadataEl.querySelector("author > email")?.getAttribute("domain") || null, // E-mail domein.
        } : null,
        links: readLinks(metadataEl.querySelector("author")), // Links bij auteur.
      } : null,
      copyright: metadataEl?.querySelector("copyright") ? { // Copyright indien aanwezig.
        author: metadataEl.querySelector("copyright")?.getAttribute("author") || null, // Copyright-auteur.
        year: readText(metadataEl, "copyright > year"), // Copyright-jaar.
        license: readText(metadataEl, "copyright > license"), // Licentie.
      } : null,
      links: readLinks(metadataEl), // Links op metadataniveau.
      time: readText(metadataEl, "time"), // Metadata-tijdstip.
      keywords: readText(metadataEl, "keywords"), // GPX-keywords indien aanwezig.
      bounds: metadataEl?.querySelector("bounds") ? { // Bounds indien aanwezig.
        minlat: numOrNull(metadataEl.querySelector("bounds")?.getAttribute("minlat")), // Minimum latitude.
        minlon: numOrNull(metadataEl.querySelector("bounds")?.getAttribute("minlon")), // Minimum longitude.
        maxlat: numOrNull(metadataEl.querySelector("bounds")?.getAttribute("maxlat")), // Maximum latitude.
        maxlon: numOrNull(metadataEl.querySelector("bounds")?.getAttribute("maxlon")), // Maximum longitude.
      } : null,
      extensions: readInnerXml(metadataEl, "extensions"), // Metadata-extensies ongewijzigd bewaren.
    },
    waypoints: Array.from(doc.querySelectorAll("gpx > wpt")).map(readPoint), // Alle losse waypoints/POI's.
    routes: Array.from(doc.querySelectorAll("gpx > rte")).map((rte) => ({ // Alle geplande routes.
      name: readText(rte, "name"), // Routenaam.
      cmt: readText(rte, "cmt"), // Routecommentaar.
      desc: readText(rte, "desc"), // Routebeschrijving.
      src: readText(rte, "src"), // Routebron.
      links: readLinks(rte), // Routelinks.
      number: numOrNull(readText(rte, "number")), // Routenummercodering indien aanwezig.
      type: readText(rte, "type"), // Routetype.
      extensions: readInnerXml(rte, "extensions"), // Route-extensies.
      points: Array.from(rte.querySelectorAll(":scope > rtept")).map(readPoint), // Routepunten.
    })),
    tracks: Array.from(doc.querySelectorAll("gpx > trk")).map((trk) => ({ // Alle opgenomen tracks.
      name: readText(trk, "name"), // Tracknaam.
      cmt: readText(trk, "cmt"), // Trackcommentaar.
      desc: readText(trk, "desc"), // Trackbeschrijving.
      src: readText(trk, "src"), // Trackbron.
      links: readLinks(trk), // Tracklinks.
      number: numOrNull(readText(trk, "number")), // Tracknummer indien aanwezig.
      type: readText(trk, "type"), // Tracktype.
      extensions: readInnerXml(trk, "extensions"), // Track-extensies.
      segments: Array.from(trk.querySelectorAll(":scope > trkseg")).map((trkseg) => ({ // Tracksegmenten.
        points: Array.from(trkseg.querySelectorAll(":scope > trkpt")).map(readPoint), // Trackpunten met lat/lon/ele/time.
      })),
    })),
  };
}

// ======================= GPX RUNTIME/EXPORT HELPERS =======================
// Houdt segment.gpx als v3-hoofdmodel, met runtime-aliases die niet exporteren.
function _withRuntimeGpxAliases(gpxModel) {
  if (!gpxModel) return null;
  const define = (name, getter) => {
    Object.defineProperty(gpxModel, name, { get: getter, enumerable: false, configurable: true });
  };
  define("distance_km", function() { return _gpxStats(this)?.distance_km ?? null; });
  define("duration_hours", function() { return _gpxStats(this)?.duration_hours ?? null; });
  define("elevation_up_m", function() { return _gpxStats(this)?.elevation_up_m ?? null; });
  define("elevation_down_m", function() { return _gpxStats(this)?.elevation_down_m ?? null; });
  define("highest_point_m", function() { return _gpxStats(this)?.highest_point_m ?? null; });
  define("lowest_point_m", function() { return _gpxStats(this)?.lowest_point_m ?? null; });
  define("avg_speed_kmh", function() { return _gpxStats(this)?.avg_speed_kmh ?? null; });
  define("max_speed_kmh", function() { return _gpxStats(this)?.max_speed_kmh ?? null; });
  define("startLat", function() { return _gpxStart(this)?.lat ?? null; });
  define("startLon", function() { return _gpxStart(this)?.lon ?? null; });
  define("trackPoints", function() { return _trackPointsFromGpxModel(this); });
  define("date", function() { return _firstPointFromGpxModel(this)?.time?.split("T")?.[0] || null; });
  return gpxModel;
}

function _gpxStats(gpx) {
  return gpx?.stats || null;
}

function _gpxStart(gpx) {
  const stats = _gpxStats(gpx);
  return stats?.start || _firstPointFromGpxModel(gpx) || null;
}

function _gpxEnd(gpx) {
  const stats = _gpxStats(gpx);
  if (stats?.end) return stats.end;
  const points = _pointsFromGpxModel(gpx);
  return points.length ? points[points.length - 1] : null;
}

function _cleanPointForStats(point) {
  if (!point) return null;
  return {
    lat: point.lat ?? null,
    lon: point.lon ?? null,
    ele: point.ele ?? null,
    time: point.time || null,
  };
}

// Bouw alleen het stats-blok uit het v3 GPX-object.
function _gpxRuntimeToStats(gpx) {
  const stats = _gpxStats(gpx);
  if (!stats) return null;
  return {
    distance_km: stats.distance_km ?? null,
    duration_hours: stats.duration_hours ?? null,
    elevation_up_m: stats.elevation_up_m ?? null,
    elevation_down_m: stats.elevation_down_m ?? null,
    highest_point_m: stats.highest_point_m ?? null,
    lowest_point_m: stats.lowest_point_m ?? null,
    avg_speed_kmh: stats.avg_speed_kmh ?? null,
    max_speed_kmh: stats.max_speed_kmh ?? null,
    start: _cleanPointForStats(_gpxStart(gpx)),
    end: _cleanPointForStats(_gpxEnd(gpx)),
  };
}

// Bouw het v3.0.0 GPX-exportmodel: volledige GPX-inhoud + berekende stats.
function _buildGpxExport(seg) {
  if (!seg?.gpx) return null;
  const source = seg.gpx.full || seg.gpx;
  const { stats: _oldStats, gpx_stats: _legacyStats, ...full } = source;
  return {
    ...full,
    stats: _gpxRuntimeToStats(seg.gpx),
  };
}

// Zet een v3.0.0 GPX-model uit JSON terug om naar het runtime object voor de creator.
function _gpxModelToRuntime(gpxModel) {
  if (!gpxModel) return null;
  const { gpx_stats: _legacyStats, ...cleanModel } = gpxModel;
  const model = {
    version: cleanModel.version ?? null,
    creator: cleanModel.creator ?? null,
    metadata: cleanModel.metadata ?? null,
    waypoints: cleanModel.waypoints || [],
    routes: cleanModel.routes || [],
    tracks: cleanModel.tracks || [],
    stats: _normalizeGpxStats(cleanModel.stats || gpxModel.gpx_stats || {}, cleanModel),
  };
  return _withRuntimeGpxAliases(model);
}

function _normalizeGpxStats(stats, gpxModel) {
  const first = _firstPointFromGpxModel(gpxModel);
  const points = _pointsFromGpxModel(gpxModel);
  const last = points.length ? points[points.length - 1] : null;
  const legacyStart = stats.start || (stats.start_lat != null || stats.start_lon != null ? {
    lat: stats.start_lat ?? null,
    lon: stats.start_lon ?? null,
    ele: first?.ele ?? null,
    time: first?.time || null,
  } : null);
  const legacyEnd = stats.end || (last ? {
    lat: last.lat ?? null,
    lon: last.lon ?? null,
    ele: last.ele ?? null,
    time: last.time || null,
  } : null);
  return {
    distance_km: stats.distance_km ?? null,
    duration_hours: stats.duration_hours ?? null,
    elevation_up_m: stats.elevation_up_m ?? null,
    elevation_down_m: stats.elevation_down_m ?? null,
    highest_point_m: stats.highest_point_m ?? null,
    lowest_point_m: stats.lowest_point_m ?? null,
    avg_speed_kmh: stats.avg_speed_kmh ?? null,
    max_speed_kmh: stats.max_speed_kmh ?? null,
    start: _cleanPointForStats(legacyStart || first),
    end: _cleanPointForStats(legacyEnd || last),
  };
}

function _gpxStatsToGpx(g) {
  const points = (g.track_points || []).map((pt) => ({
    lat: Array.isArray(pt) ? pt[0] : pt.lat,
    lon: Array.isArray(pt) ? pt[1] : pt.lon,
    ele: Array.isArray(pt) ? (pt[2] ?? null) : (pt.ele ?? null),
    time: Array.isArray(pt) ? null : (pt.time || null),
  }));
  const model = {
    version: null,
    creator: null,
    metadata: null,
    waypoints: [],
    routes: [],
    tracks: points.length ? [{ name: null, segments: [{ points }] }] : [],
    stats: _normalizeGpxStats(g, { tracks: points.length ? [{ segments: [{ points }] }] : [] }),
  };
  return _withRuntimeGpxAliases(model);
}

// Haal het eerste trackpunt uit het v3 GPX-model.
function _firstPointFromGpxModel(gpxModel) {
  return gpxModel?.tracks?.[0]?.segments?.[0]?.points?.[0] || null;
}

// Maak gesamplede kaartpunten uit het volledige v3 GPX-model.
function _sampleTrackPointsFromGpxModel(gpxModel) {
  const points = _pointsFromGpxModel(gpxModel);
  if (!points || points.length < 2) return null;
  const step = Math.max(1, Math.floor(points.length / 500));
  const sampled = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push([points[i].lat, points[i].lon, points[i].ele ?? null]);
  }
  return sampled;
}

function _trackPointsFromGpxModel(gpxModel) {
  return _sampleTrackPointsFromGpxModel(gpxModel) || [];
}

// Lees alle trackpunten uit het v3 GPX-model als platte array.
function _pointsFromGpxModel(gpxModel) {
  const points = [];
  (gpxModel?.tracks || []).forEach((trk) => {
    (trk.segments || []).forEach((seg) => {
      (seg.points || []).forEach((pt) => points.push(pt));
    });
  });
  return points;
}

// Leest hoogtepunten rechtstreeks uit segment.gpx.tracks[].segments[].points[].
function _getElevationPointsFromSegment(seg) {
  const modelPoints = _pointsFromGpxModel(seg?.gpx);
  const validModelPoints = modelPoints.filter((pt) => !isNaN(pt.lat) && !isNaN(pt.lon) && pt.ele !== null && !isNaN(pt.ele));
  return validModelPoints.length >= 2 ? validModelPoints : null;
}
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180, phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180, dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function showSpeedWarning(gpxData, sid) {
  const containerId = sid ? `gpx-stats-${sid}` : "gpx-stats-1";
  const container = $(containerId);
  if (!container) return;
  const existingWarn = container.querySelector(".gpx-warning");
  if (existingWarn) existingWarn.remove();
  const maxRaw = gpxData._maxSpeedRaw, maxFiltered = gpxData.max_speed_kmh;
  const warning = document.createElement("div");
  warning.className = "gpx-warning";
  warning.innerHTML = `<p class="gpx-warning__text">⚠️ Verdachte snelheidspiek: <strong>${maxRaw} km/u</strong> (gem. ${gpxData.avg_speed_kmh} km/u). Waarschijnlijk GPS-ruis. Gefilterd maximum: <strong>${maxFiltered} km/u</strong>.</p><div class="gpx-warning__actions"><button class="btn btn--primary btn--sm gpx-warn-ignore">Negeren (${maxFiltered} km/u)</button><button class="btn btn--ghost btn--sm gpx-warn-keep" data-raw="${maxRaw}" data-sid="${sid || 1}">Toch bewaren (${maxRaw} km/u)</button></div>`;
  container.appendChild(warning);
  warning.querySelector(".gpx-warn-ignore").addEventListener("click", () => warning.remove());
  warning.querySelector(".gpx-warn-keep").addEventListener("click", (e) => {
    const segId = parseInt(e.target.dataset.sid);
    const s = _getSeg(segId);
    if (s?.gpx) { s.gpx.max_speed_kmh = maxRaw; const el = $(`stat-max-speed-${segId}`); if (el) el.textContent = `${maxRaw} km/u`; }
    warning.remove();
    updatePreview();
  });
}

// -----------------------------------------------------------
// LOCATIE VIA NOMINATIM
// -----------------------------------------------------------
async function fetchLocationName(lat, lon, sid) {
  const fetchBtn = document.querySelector(`.segment-fetch-location[data-sid="${sid}"]`);
  if (fetchBtn) fetchBtn.textContent = "…";
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const resp = await fetch(url, { headers: { "Accept-Language": "nl" } });
    const data = await resp.json();
    const addr = data.address || {};
    const country = addr.country || "";
    const region = addr.state || addr.province || addr.county || addr.state_district || "";
    const place = addr.village || addr.town || addr.city || addr.municipality || "";
    const location = [place, region, country].filter(Boolean).join(", ");
    const seg = _getSeg(sid);
    if (seg) { seg.location = location; seg.country = country; seg.region = region; seg.place = place; }
    const locInp = document.querySelector(`.segment-location[data-sid="${sid}"]`);
    const countryInp = document.querySelector(`.segment-country[data-sid="${sid}"]`);
    const regionInp = document.querySelector(`.segment-region[data-sid="${sid}"]`);
    const placeInp = document.querySelector(`.segment-place[data-sid="${sid}"]`);
    if (locInp && location) locInp.value = location;
    if (countryInp && country) countryInp.value = country;
    if (regionInp && region) regionInp.value = region;
    if (placeInp && place) placeInp.value = place;
  } catch (err) {
    console.warn("Nominatim fout:", err);
  } finally {
    if (fetchBtn) fetchBtn.textContent = "↺";
    updatePreview();
  }
}

// -----------------------------------------------------------
// WEERDATA VIA OPEN-METEO
// -----------------------------------------------------------
async function fetchWeather(sid) {
  const seg = _getSeg(sid);
  if (!seg) return;
  const start = _gpxStart(seg.gpx);
  const date = seg.date, lat = start?.lat, lon = start?.lon;
  if (!date) { alert("Kies eerst een datum voor dit segment."); return; }
  if (!lat || !lon) { alert("Laad eerst een GPX-bestand voor dit segment."); return; }
  const fetchBtn = document.querySelector(`.segment-fetch-weather[data-sid="${sid}"]`);
  if (fetchBtn) { fetchBtn.textContent = "Ophalen…"; fetchBtn.disabled = true; }
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(date);
    if (chosenDate >= today) { alert("Weerdata is enkel beschikbaar voor datums in het verleden. Kies een datum vóór vandaag."); return; }
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe/Brussels`;
    const resp = await fetch(url);
    if (!resp.ok) { const errData = await resp.json().catch(() => ({})); const reason = errData?.reason || `HTTP ${resp.status}`; console.error("Open-Meteo fout:", reason); alert(`Weerdata kon niet worden opgehaald: ${reason}`); return; }
    const data = await resp.json();
    const d = data.daily;
    if (!d) { alert("Weerdata kon niet worden opgehaald. Open-Meteo gaf geen dagdata terug."); return; }
    const condInp = document.querySelector(`.segment-weather-condition[data-sid="${sid}"]`);
    seg.weather = { date, temperature_min: d.temperature_2m_min?.[0] ?? null, temperature_max: d.temperature_2m_max?.[0] ?? null, precipitation_mm: d.precipitation_sum?.[0] ?? null, wind_kmh: d.wind_speed_10m_max?.[0] ?? null, condition: condInp?.value || "", source: "Open-Meteo" };
    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set(`w-temp-min-${sid}`, seg.weather.temperature_min != null ? `${seg.weather.temperature_min}°C` : "—");
    set(`w-temp-max-${sid}`, seg.weather.temperature_max != null ? `${seg.weather.temperature_max}°C` : "—");
    set(`w-precip-${sid}`, seg.weather.precipitation_mm != null ? `${seg.weather.precipitation_mm} mm` : "—");
    set(`w-wind-${sid}`, seg.weather.wind_kmh != null ? `${seg.weather.wind_kmh} km/u` : "—");
    const weatherBlock = $(`weather-block-${sid}`);
    if (weatherBlock) weatherBlock.hidden = false;
    if (seg.difficultyAuto && seg.gpx) { const auto = calculateSegmentDifficulty(seg); if (auto) { seg.difficulty = auto; _refreshDifficultyBlock(sid); } }
    if (sid === state.segments[0].id) applyCalculatedDifficulty();
    updatePreview();
  } catch (err) {
    console.error("Weerdata fout:", err);
    alert("Weerdata kon niet worden opgehaald. Controleer datum en verbinding.");
  } finally {
    if (fetchBtn) { fetchBtn.textContent = "Weerdata ophalen"; fetchBtn.disabled = false; }
  }
}

function calculateDifficulty() {
  const gpx = _gpxStats(state.segments[0]?.gpx), weather = state.segments[0]?.weather;
  if (!gpx) return null;
  let score = 0;
  if (gpx.distance_km) score += gpx.distance_km;
  if (gpx.elevation_up_m) score += gpx.elevation_up_m / 100;
  if (weather) { if (weather.temperature_max >= 25) score += 2; if (weather.precipitation_mm >= 5) score += 2; if (weather.wind_kmh >= 30) score += 1; }
  if (score <= 5) return "T1"; if (score <= 10) return "T2"; if (score <= 16) return "T3"; if (score <= 22) return "T4"; if (score <= 28) return "T5";
  return "T6";
}

function applyCalculatedDifficulty() {
  const difficulty = calculateDifficulty();
  if (difficulty && !els.inputDifficulty.value) { els.inputDifficulty.value = difficulty; updatePreview(); }
}

// -----------------------------------------------------------
// CLOUDINARY URL AUTO-FIX
// -----------------------------------------------------------
function fixCloudinaryUrl(url, transform = "w_1200,f_auto") {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  if (url.includes(transform)) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

els.inputHeroPhoto.addEventListener("blur", () => { const fixed = fixCloudinaryUrl(els.inputHeroPhoto.value.trim()); if (fixed !== els.inputHeroPhoto.value.trim()) els.inputHeroPhoto.value = fixed; updatePreview(); });
els.inputHeroPhoto.addEventListener("input", updatePreview);
els.inputIntro.addEventListener("input", () => { els.introCount.textContent = `${els.inputIntro.value.length}/160`; updatePreview(); });

// -----------------------------------------------------------
// HOOGTEPROFIEL PREVIEW — T2-004 creator variant
// -----------------------------------------------------------

/**
 * Bereken cumulatieve afstand in km tussen opeenvolgende punten.
 * Haversine formule. Aparte naam (_cumulativeDistancesEle) om
 * conflict te vermijden als route.js ook geladen zou worden.
 * @param {Array<{lat,lon,ele}>} points
 * @returns {Array<number>} afstand per index (index 0 = 0 km)
 */
function _cumulativeDistancesEle(points) {
  const R = 6371;
  const dist = [0];
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1], p2 = points[i];
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lon - p1.lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(p1.lat * Math.PI / 180) *
      Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    dist.push(dist[i - 1] + 2 * R * Math.asin(Math.sqrt(a)));
  }
  return dist;
}

/**
 * Rendert een SVG hoogteprofiel in #rp-elevation-chart.
 * Elk segment krijgt zijn eigen kleur (TRANSPORT_COLORS).
 * Meerdere segmenten naast elkaar, gescheiden door streepjeslijn.
 * Hover tooltip toont hoogte in m + afstand in km.
 * Sectie blijft verborgen als geen enkel segment bruikbare hoogtepunten heeft.
 * @param {Array} segments - state.segments array
 */
function renderElevationPreview(segments) {
  const wrapper = $("rp-elevation");
  const container = $("rp-elevation-chart");
  if (!wrapper || !container) return;

  // Bouw segmentdata op uit segment.gpx.tracks[].segments[].points[].
  const segmentData = [];
  for (const seg of segments) {
    const points = _getElevationPointsFromSegment(seg); // Lees hoogtepunten uit het v3 GPX-model.
    if (!points) continue;
    segmentData.push({
      points,
      distances: _cumulativeDistancesEle(points),
      color: TRANSPORT_COLORS[seg.transport] || "#2C4A3B",
      label: TRANSPORT_LABELS[seg.transport] || seg.transport || "Segment",
    });
  }

  // Geen data — sectie verbergen en stoppen
  if (segmentData.length === 0) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;

  // SVG dimensies
  const W = 700, H = 180, ML = 44, MR = 10, MT = 12, MB = 28;
  const plotW = W - ML - MR, plotH = H - MT - MB;

  // Globale hoogte min/max + totale afstand
  let globalMin = Infinity, globalMax = -Infinity, totalDist = 0;
  for (const seg of segmentData) {
    for (const pt of seg.points) {
      if (pt.ele < globalMin) globalMin = pt.ele;
      if (pt.ele > globalMax) globalMax = pt.ele;
    }
    totalDist += seg.distances[seg.distances.length - 1];
  }

  // Padding zodat lijn niet tegen rand kleeft
  const range = globalMax - globalMin || 1;
  const pad = range * 0.1;
  const eleMin = globalMin - pad, eleMax = globalMax + pad;

  // Schaalfuncties
  const xScale = (d) => ML + (d / totalDist) * plotW;
  const yScale = (e) => MT + plotH - ((e - eleMin) / (eleMax - eleMin)) * plotH;

  // SVG opbouwen
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Hoogteprofiel"
    style="width:100%;height:auto;display:block;overflow:visible;">`;

  // Achtergrond plotgebied
  svg += `<rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}"
    fill="var(--color-surface-alt,#f8f9fa)" rx="3"/>`;

  // Horizontale gridlijnen (4 stappen)
  for (let i = 0; i <= 4; i++) {
    const ele = eleMin + (i / 4) * (eleMax - eleMin);
    const y = yScale(ele);
    svg += `<line x1="${ML}" y1="${y}" x2="${W - MR}" y2="${y}"
      stroke="var(--color-border,#e5e7eb)" stroke-width="1"/>`;
    svg += `<text x="${ML - 4}" y="${y + 4}" text-anchor="end"
      font-size="9" fill="var(--color-text-muted,#6b7280)">${Math.round(ele)} m</text>`;
  }

  // X-as labels (5 stappen)
  for (let i = 0; i <= 5; i++) {
    const d = (i / 5) * totalDist;
    const x = xScale(d);
    svg += `<text x="${x}" y="${H - 5}" text-anchor="middle"
      font-size="9" fill="var(--color-text-muted,#6b7280)">${d.toFixed(1)} km</text>`;
  }

  // Segmenten tekenen
  let cumDist = 0;
  const separators = [];

  for (let si = 0; si < segmentData.length; si++) {
    const seg = segmentData[si];
    const segDist = seg.distances[seg.distances.length - 1];

    // Polyline punten voor dit segment
    const pts = seg.points.map((pt, idx) => {
      const x = xScale(cumDist + seg.distances[idx]);
      const y = yScale(pt.ele);
      return `${x},${y}`;
    }).join(" ");

    // Gevuld gebied onder de lijn
    const firstX = xScale(cumDist + seg.distances[0]);
    const lastX = xScale(cumDist + segDist);
    const baseY = MT + plotH;
    svg += `<polygon points="${firstX},${baseY} ${pts} ${lastX},${baseY}"
      fill="${seg.color}" fill-opacity="0.12" stroke="none"/>`;

    // Profiel lijn
    svg += `<polyline points="${pts}"
      fill="none" stroke="${seg.color}" stroke-width="2"
      stroke-linejoin="round" stroke-linecap="round"/>`;

    cumDist += segDist;
    if (si < segmentData.length - 1) separators.push(xScale(cumDist));
  }

  // Verticale scheidingslijnen tussen segmenten
  for (const x of separators) {
    svg += `<line x1="${x}" y1="${MT}" x2="${x}" y2="${MT + plotH}"
      stroke="var(--color-border,#e5e7eb)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  }

  // Interactieve hover overlay — transparante rect vangt muisevents op
  svg += `<rect id="elev-prev-overlay" x="${ML}" y="${MT}" width="${plotW}" height="${plotH}"
    fill="transparent" style="cursor:crosshair;"/>`;

  // Tooltip elementen (beginnen verborgen)
  svg += `<line id="elev-prev-cursor" x1="0" y1="${MT}" x2="0" y2="${MT + plotH}"
    stroke="var(--color-text,#111)" stroke-width="1" stroke-dasharray="3 2" opacity="0"/>`;
  svg += `<circle id="elev-prev-dot" cx="0" cy="0" r="4"
    fill="var(--color-text,#111)" opacity="0"/>`;
  svg += `<rect id="elev-prev-tip-bg" x="0" y="0" width="88" height="36" rx="4"
    fill="var(--color-surface,#fff)"
    stroke="var(--color-border,#e5e7eb)" stroke-width="1" opacity="0"/>`;
  svg += `<text id="elev-prev-tip1" x="0" y="0" font-size="10"
    fill="var(--color-text,#111)" opacity="0"></text>`;
  svg += `<text id="elev-prev-tip2" x="0" y="0" font-size="10"
    fill="var(--color-text-muted,#6b7280)" opacity="0"></text>`;

  svg += `</svg>`;
  container.innerHTML = svg;

  // Hover interactie — platte lookup array voor snel dichtstbijzijnd punt
  const svgEl = container.querySelector("svg");
  const overlay  = container.querySelector("#elev-prev-overlay");
  const cursor   = container.querySelector("#elev-prev-cursor");
  const dot      = container.querySelector("#elev-prev-dot");
  const tipBg    = container.querySelector("#elev-prev-tip-bg");
  const tip1     = container.querySelector("#elev-prev-tip1");
  const tip2     = container.querySelector("#elev-prev-tip2");

  // Bouw lookup: {d, ele, color} voor elk punt over alle segmenten
  const lookup = [];
  let cumD = 0;
  for (const seg of segmentData) {
    for (let i = 0; i < seg.points.length; i++) {
      lookup.push({ d: cumD + seg.distances[i], ele: seg.points[i].ele, color: seg.color });
    }
    cumD += seg.distances[seg.distances.length - 1];
  }

  function onHover(evt) {
    const rect = svgEl.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const svgX = (clientX - rect.left) / rect.width * W;
    if (svgX < ML || svgX > W - MR) { hideElevTip(); return; }

    // Dichtstbijzijnd punt zoeken
    const hoverDist = ((svgX - ML) / plotW) * totalDist;
    let best = lookup[0], bestDiff = Math.abs(lookup[0].d - hoverDist);
    for (const pt of lookup) {
      const diff = Math.abs(pt.d - hoverDist);
      if (diff < bestDiff) { best = pt; bestDiff = diff; }
    }

    const cx = xScale(best.d), cy = yScale(best.ele);
    cursor.setAttribute("x1", cx); cursor.setAttribute("x2", cx); cursor.setAttribute("opacity", "0.6");
    dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.setAttribute("fill", best.color); dot.setAttribute("opacity", "1");

    tip1.textContent = `↑ ${Math.round(best.ele)} m`;
    tip2.textContent = `⇌ ${best.d.toFixed(2)} km`;

    // Tooltip positie — rechts van cursor, tenzij te dicht bij rand
    const tipW = 88, tipPad = 6;
    let tipX = cx + tipPad;
    if (tipX + tipW > W - MR) tipX = cx - tipW - tipPad;
    const tipY = MT + 6;

    tipBg.setAttribute("x", tipX); tipBg.setAttribute("y", tipY); tipBg.setAttribute("opacity", "0.95");
    tip1.setAttribute("x", tipX + 5); tip1.setAttribute("y", tipY + 13); tip1.setAttribute("opacity", "1");
    tip2.setAttribute("x", tipX + 5); tip2.setAttribute("y", tipY + 27); tip2.setAttribute("opacity", "1");
  }

  function hideElevTip() {
    cursor.setAttribute("opacity", "0");
    dot.setAttribute("opacity", "0");
    tipBg.setAttribute("opacity", "0");
    tip1.setAttribute("opacity", "0");
    tip2.setAttribute("opacity", "0");
  }

  // Desktop + mobile touch
  overlay.addEventListener("mousemove", onHover);
  overlay.addEventListener("mouseleave", hideElevTip);
  overlay.addEventListener("touchmove", (e) => { e.preventDefault(); onHover(e); }, { passive: false });
  overlay.addEventListener("touchend", hideElevTip);
}

// -----------------------------------------------------------
// VISUELE PREVIEW
// -----------------------------------------------------------
function updatePreview() {
  const title = els.inputTitle.value.trim();
  const seg0 = state.segments[0];
  const location = seg0?.location || "";
  const summary = els.inputIntro.value.trim();
  const heroUrl = els.inputHeroPhoto.value.trim();
  const status = els.inputStatus.value;
  const difficulty = els.inputDifficulty.value;
  const gpx = _gpxStats(seg0?.gpx);
  const weather = seg0?.weather;

  $("rp-title").textContent = title || "Wandeling zonder titel";
  $("rp-location").textContent = location || "Locatie onbekend";
  $("rp-summary").textContent = summary;
  $("rp-summary").hidden = !summary;
  $("rp-status-badge").textContent = status || "draft";

  const heroImg = $("rp-hero-img"), heroPlaceholder = $("rp-hero-placeholder");
  if (heroUrl) { heroImg.src = heroUrl; heroImg.hidden = false; heroPlaceholder.hidden = true; }
  else { heroImg.hidden = true; heroPlaceholder.hidden = false; }

  $("rp-distance").textContent = gpx?.distance_km ? `${gpx.distance_km} km` : "—";
  $("rp-duration").textContent = gpx?.duration_hours ? `${gpx.duration_hours} u` : "—";
  $("rp-elevation").textContent = gpx?.elevation_up_m ? `+${gpx.elevation_up_m} m` : "—";
  $("rp-avg-speed").textContent = gpx?.avg_speed_kmh ? `${gpx.avg_speed_kmh} km/u` : "—";

  const diffLabels = { T1: "T1 — Wandelen", T2: "T2 — Bergwandeling", T3: "T3 — Veeleisend", T4: "T4 — Alpien", T5: "T5 — Veeleisend alpien", T6: "T6 — Moeilijk alpien" };
  $("rp-difficulty").textContent = diffLabels[difficulty] || "—";

  const weatherEl = $("rp-weather");
  if (weather) {
    $("rp-w-temp").innerHTML = `<span class="rp-weather__icon">🌡</span> ${weather.temperature_min ?? "—"}° – ${weather.temperature_max ?? "—"}°C`;
    $("rp-w-precip").innerHTML = `<span class="rp-weather__icon">💧</span> ${weather.precipitation_mm ?? "—"} mm`;
    $("rp-w-wind").innerHTML = `<span class="rp-weather__icon">🍃</span> ${weather.wind_kmh ?? "—"} km/u`;
    const dateStr = weather.date ? new Date(weather.date).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" }) : "—";
    $("rp-w-date").innerHTML = `<span class="rp-weather__icon">📅</span> ${dateStr}`;
    weatherEl.hidden = false;
  } else {
    weatherEl.hidden = true;
  }

  const storyEl = $("rp-story");
  storyEl.innerHTML = "";
  state.storyBlocks.forEach((block) => {
    if (block.type === "text" && block.value.trim()) {
      const p = document.createElement("p"); p.className = "rp-story__text"; p.textContent = block.value; storyEl.appendChild(p);
    } else if (block.type === "photo" && block.value.trim()) {
      const img = document.createElement("img"); img.className = "rp-story__photo"; img.src = block.value; img.alt = ""; img.onerror = () => img.remove(); storyEl.appendChild(img);
    }
  });

  // Kaart: teken alle segmenten met kleurcode
  const mapEl = $("rp-map");
  const segmentsWithGpx = state.segments.filter((s) => _gpxStart(s.gpx)?.lat);
  if (segmentsWithGpx.length > 0) {
    mapEl.hidden = false;
    const mapFrame = $("rp-map-frame");
    if (!mapFrame.querySelector("#leaflet-preview-map")) {
      mapFrame.innerHTML = `<div id="leaflet-preview-map" style="width:100%;height:200px;"></div>`;
    }
    setTimeout(() => { if (window.L) initLeafletMap(state.segments); }, 50);
  } else {
    mapEl.hidden = true;
  }

  // Hoogteprofiel preview — toont zodra minstens één segment GPX-hoogtedata heeft
  renderElevationPreview(state.segments);
}

document.querySelectorAll(".input").forEach((el) => { el.addEventListener("input", updatePreview); el.addEventListener("change", updatePreview); });

// -----------------------------------------------------------
// JSON EXPORT
// -----------------------------------------------------------
function buildRouteJson() {
  const id = els.inputRouteId.value.trim() || "nieuwe-route";
  const allPhotos = [];
  if (els.inputHeroPhoto.value.trim()) allPhotos.push({ url: els.inputHeroPhoto.value.trim(), caption: "" });
  state.storyBlocks.filter((b) => b.type === "photo" && b.value.trim()).forEach((b) => allPhotos.push({ url: b.value.trim(), caption: "" }));
  const storyText = state.storyBlocks.filter((b) => b.type === "text" && b.value.trim()).map((b) => b.value.trim()).join("\n\n");
  const seg0 = state.segments[0];

  const segmentsExport = state.segments.map((s) => ({
    transport: s.transport, label: s.label || null, date: s.date || null,
    location: s.location || null, country: s.country || null, region: s.region || null,
    place: s.place || null, difficulty: s.difficulty || null,
    difficulty_auto: s.difficultyAuto !== false, rough_surface: s.roughSurface || false,
    gpx: _buildGpxExport(s), // v3.0.0 hoofdmodel: volledige GPX-structuur + stats in één object.
    weather: s.weather ? { date: s.weather.date, temperature_min: s.weather.temperature_min, temperature_max: s.weather.temperature_max, precipitation_mm: s.weather.precipitation_mm, wind_kmh: s.weather.wind_kmh, condition: s.weather.condition || "", source: "Open-Meteo" } : null,
  }));

  return {
    id, status: els.inputStatus.value,
    published_date: seg0?.date || null, transport: seg0?.transport ? [seg0.transport] : null,
    location: seg0?.location || "", country: seg0?.country || "", region: seg0?.region || "", place: seg0?.place || "",
    title: { nl: els.inputTitle.value.trim(), en: "" }, difficulty: els.inputDifficulty.value || null,
    source_reference: els.inputSource.value.trim() || null,
    tags: els.inputKeywords.value.split(",").map((k) => k.trim()).filter(Boolean),
    summary: { nl: els.inputIntro.value.trim(), en: "" }, story: { nl: storyText, en: "" },
    story_blocks: state.storyBlocks.filter((b) => (b.type === "text" ? b.value.trim() : true)).map((b) => {
      if (b.type === "text") return { type: b.type, value: b.value.trim() };
      if (b.type === "photo") return { type: b.type, value: b.value.trim() };
      if (b.type === "photo-grid") return { type: b.type, cols: b.cols, photos: b.photos.filter(Boolean) };
      if (b.type === "link") return { type: b.type, name: b.name.trim(), url: b.url.trim() };
      return b;
    }),
    gallery: state.galleryPhotos.filter((p) => p.url).map((p) => ({ url: p.url })),
    tips: { nl: els.inputTips.value.trim(), en: "" }, photos: allPhotos, segments: segmentsExport,
    weather: seg0?.weather ? { date: seg0.weather.date, temperature_min: seg0.weather.temperature_min, temperature_max: seg0.weather.temperature_max, precipitation_mm: seg0.weather.precipitation_mm, wind_kmh: seg0.weather.wind_kmh, condition: seg0.weather.condition || "", source: "Open-Meteo" } : null,
  };
}

els.btnExport.addEventListener("click", () => {
  const id = els.inputRouteId.value.trim();
  if (!id) { showInlineError(els.inputRouteId, "Geef de route een ID (bestandsnaam)."); els.inputRouteId.focus(); return; }
  const json = buildRouteJson();
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${id}.json`; a.click();
  URL.revokeObjectURL(url);
});

// -----------------------------------------------------------
// AI GENEREREN
// -----------------------------------------------------------
els.btnAiGenerate.addEventListener("click", async () => {
  if (!state.apiKeyConfirmed || !state.apiKey) { alert("Voer eerst een geldige Anthropic API-sleutel in en bevestig."); return; }
  const keywords = els.inputKeywords.value.trim(), title = els.inputTitle.value.trim();
  const seg0 = state.segments[0], location = seg0?.location || "", difficulty = els.inputDifficulty.value;
  const gpx = _gpxStats(seg0?.gpx), weather = seg0?.weather;
  if (!title && !location && !keywords) { alert("Vul minstens een titel, locatie of steekwoorden in."); return; }
  els.btnAiGenerate.classList.add("is-loading"); els.btnAiGenerate.textContent = "\u2746 Genereren\u2026";
  const prompt = `Je schrijft Nederlandse wandelverhalen voor MyTrailWalks, een persoonlijk outdoor storytelling platform.\n\nGegevens van de route:\n- Titel: ${title || "onbekend"}\n- Locatie: ${location || "onbekend"}\n- Moeilijkheid: ${difficulty || "onbekend"}\n- Steekwoorden / ervaringen: ${keywords || "geen"}\n${gpx ? `- Afstand: ${gpx.distance_km} km, Duur: ${gpx.duration_hours} uur, Stijging: ${gpx.elevation_up_m} m` : ""}\n${weather ? `- Weer: min ${weather.temperature_min}°C, max ${weather.temperature_max}°C, neerslag ${weather.precipitation_mm} mm, wind ${weather.wind_kmh} km/u` : ""}\n${state.segments.length > 1 ? `- Vervoersmiddelen: ${state.segments.map((s) => TRANSPORT_LABELS[s.transport] || s.transport).join(", ")}` : ""}\n\nGenereer ALLEEN een JSON-object (geen uitleg, geen markdown) met deze velden:\n{\n  "summary": "Één zin samenvatting van max 160 tekens voor de grid-weergave.",\n  "story_blocks": [\n    { "type": "text", "value": "Eerste alinea van het verhaal." },\n    { "type": "text", "value": "Tweede alinea van het verhaal." }\n  ],\n  "tips": "2-4 praktische tips voor wandelaars, als doorlopende tekst."\n}\n\nSchrijf het verhaal in 3-5 alinea's. Persoonlijk, beschrijvend, no clickbait.`;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": state.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
    const data = await response.json();
    const text = data.content?.map((c) => c.text || "").join("") || "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (parsed.summary) { els.inputIntro.value = parsed.summary; els.introCount.textContent = `${parsed.summary.length}/160`; }
    if (parsed.story_blocks?.length) { state.storyBlocks = parsed.story_blocks; renderBlockEditor(); }
    if (parsed.tips) els.inputTips.value = parsed.tips;
    updatePreview();
  } catch (err) {
    console.error("AI generatie fout:", err); alert("AI-generatie mislukt. Controleer je API-sleutel en verbinding.");
  } finally {
    els.btnAiGenerate.classList.remove("is-loading"); els.btnAiGenerate.innerHTML = '<span class="btn-icon">\u2746</span> Genereer met AI';
  }
});

// -----------------------------------------------------------
// LEAFLET KAART
// -----------------------------------------------------------
let leafletMap = null;

function initLeafletMap(segments) {
  const container = document.getElementById("leaflet-preview-map");
  if (!container) return;
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  leafletMap = L.map("leaflet-preview-map", { zoomControl: true, scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(leafletMap);
  const allBounds = [];
  segments.forEach((seg) => {
    const start = _gpxStart(seg.gpx);
    if (!start?.lat) return;
    const color = TRANSPORT_COLORS[seg.transport] || "#2C4A3B";
    const lat = start.lat, lon = start.lon;
    const trackPoints = _trackPointsFromGpxModel(seg.gpx);
    if (trackPoints.length > 1) { L.polyline(trackPoints, { color, weight: 3, opacity: 0.85 }).addTo(leafletMap); allBounds.push(...trackPoints); }
    const label = seg.label || TRANSPORT_LABELS[seg.transport] || seg.transport;
    L.circleMarker([lat, lon], { radius: 6, fillColor: color, color: "#fff", weight: 2, opacity: 1, fillOpacity: 1 }).addTo(leafletMap).bindPopup(label);
  });
  if (allBounds.length > 1) { leafletMap.fitBounds(allBounds, { padding: [16, 16] }); }
  else { const start = _gpxStart(segments[0]?.gpx); if (start?.lat) leafletMap.setView([start.lat, start.lon], 13); }
}

// -----------------------------------------------------------
// ROUTES.JSON ENTRY EXPORT
// -----------------------------------------------------------
document.getElementById("btn-export-routes-entry").addEventListener("click", () => {
  const id = els.inputRouteId.value.trim();
  if (!id) { showInlineError(els.inputRouteId, "Geef de route een ID (bestandsnaam)."); els.inputRouteId.focus(); return; }
  const seg0 = state.segments[0], heroUrl = els.inputHeroPhoto.value.trim();
  const thumbUrl = heroUrl ? heroUrl.replace("w_1200", "w_400") : "";
  const entry = { id, language: "nl", name: els.inputTitle.value.trim() || id, region: seg0?.region || seg0?.location || "", date_walked: seg0?.date || null, distance_km: _gpxStats(seg0?.gpx)?.distance_km || 0, duration_hours: _gpxStats(seg0?.gpx)?.duration_hours || 0, elevation_m: _gpxStats(seg0?.gpx)?.elevation_up_m || 0, difficulty: els.inputDifficulty.value || null, tags: els.inputKeywords.value.split(",").map((k) => k.trim()).filter(Boolean), hero: thumbUrl, content_json: `routes/${id}.json` };
  const blob = new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${id}-routes-entry.json`; a.click(); URL.revokeObjectURL(url);
});

// -----------------------------------------------------------
// HULPFUNCTIES
// -----------------------------------------------------------
function showInlineError(inputEl, message) {
  inputEl.style.borderColor = "var(--color-hard)";
  const existing = inputEl.parentElement.querySelector(".inline-error");
  if (existing) existing.remove();
  const span = document.createElement("span"); span.className = "inline-error field__help"; span.style.color = "var(--color-hard)"; span.textContent = message;
  inputEl.parentElement.appendChild(span);
  setTimeout(() => { inputEl.style.borderColor = ""; span.remove(); }, 3000);
}

// -----------------------------------------------------------
// INIT — v3.0.0
// -----------------------------------------------------------
window.appReady.then(() => {
  const style = document.createElement("style");
  style.textContent = `
    .segment-block { border-left: 4px solid var(--color-forest); padding: 16px; margin-bottom: 16px; background: var(--color-cream, #F6F1E7); border-radius: 0 6px 6px 0; }
    .segment-block__header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
    .segment-block__num { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--color-forest, #2C4A3B); color: #fff; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .segment-block__transport { flex-shrink: 0; }
    .segment-label { flex: 1; min-width: 160px; }
    .segment-remove-btn { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--color-charcoal-soft, #5C5752); font-size: 1rem; padding: 2px 6px; border-radius: 4px; }
    .segment-remove-btn:hover { color: var(--color-hard, #c0392b); background: rgba(192,57,43,0.08); }
    .segment-gpx { margin-bottom: 12px; }
    .segment-meta { padding-top: 8px; }
    .segment-block .drop-zone--has-file { background: var(--color-forest, #2C4A3B); opacity: 0.08; }
    .segment-difficulty { margin-bottom: 12px; padding: 10px 12px; background: rgba(255,255,255,0.5); border-radius: 6px; }
    .segment-difficulty__none { margin: 0; font-style: italic; }
    .segment-difficulty__status { display: block; margin-top: 4px; }
    .checkbox-label { display: flex; align-items: center; gap: 6px; font-size: var(--text-sm, 0.875rem); cursor: pointer; }
    .gpx-warning { margin-top: 12px; padding: 10px 12px; background: var(--color-warning-bg, #fff8e1); border: 1px solid var(--color-warning-border, #f0c040); border-radius: 6px; }
    .gpx-warning__text { margin: 0 0 8px; font-size: var(--text-sm, 0.875rem); color: var(--color-charcoal, #333); line-height: 1.4; }
    .gpx-warning__actions { display: flex; gap: 8px; flex-wrap: wrap; }
    #btn-add-segment { margin-top: 8px; width: 100%; }
    /* Hoogteprofiel preview */
    .rp-elevation { margin-top: 12px; }
    .rp-elevation #rp-elevation-chart { border-radius: 6px; overflow: hidden; }
  `;
  document.head.appendChild(style);

  renderSegments();
  renderBlockEditor();
  updatePreview();
});
