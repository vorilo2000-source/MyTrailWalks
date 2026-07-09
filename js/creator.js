// =======================================================
// creator.js — MyTrailWalks
// Route creator: GPX parse, weer, locatie, AI, JSON export
// lat, lon, ele, time, name, cmt, desc, src, links, sym, type, fix, sat, hdop, vdop, pdop, ageofdgpsdata, dgpsid, extensions
// v3.0.2: herstel updatePreview() centrale coördinator-functie
// v3.0.1: syntax herstel in elevation preview renderer
// v3.0.0: één unified segment.gpx model
//         - GPX volledig uitgelezen naar segment.gpx.tracks[].segments[].points[]
//         - segment.gpx.stats bevat alle berekende statistieken
//         - Geen gpx_raw / gpx_stats / gpx_data meer in export
//         - renderElevationPreview leest uit segment.gpx.tracks[].segments[].points[]
//         - Import converteert oud formaat (gpx_raw / gpx_stats) naar nieuw model
// v2.4.3: hoogteprofiel preview toegevoegd (renderElevationPreview)
// v2.4.2: datum-validatie bij weerdata ophalen (toekomstige datum)
// v2.4.1: track_points toegevoegd aan segments[].gpx_stats export
// v2.4.0: hike/trail vervoersmiddel + moeilijkheidsschaal per vervoersmiddel
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

// -----------------------------------------------------------
// MOEILIJKHEIDSBEREKENING
// Leest uit het unified segment model (seg.gpx_stats)
// -----------------------------------------------------------
function calculateSegmentDifficulty(seg) {
  // Statistieken zitten in seg.gpx_stats (na normalisatie)
  const stats = seg.gpx_stats;
  if (!stats || !stats.distance_km) return null;

  if (seg.transport === "walking") {
    const climbPerKm = (stats.elevation_up_m || 0) / stats.distance_km;
    if (climbPerKm < 5)  return "W1";
    if (climbPerKm < 15) return "W2";
    return "W3";
  }

  if (seg.transport === "hike") {
    let score = 0;
    score += stats.distance_km;
    if (stats.elevation_up_m) score += stats.elevation_up_m / 100;
    if (seg.weather) {
      if (seg.weather.temperature_max >= 25) score += 2;
      if (seg.weather.precipitation_mm >= 5)  score += 2;
      if (seg.weather.wind_kmh >= 30)          score += 1;
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
  const stats = seg.gpx_stats;
  const prefix = { cycling: "C", motorcycle: "M", car: "A" }[seg.transport];

  // trackPoints voor bochtenberekening zitten in stats
  const climbPerKm       = (stats.elevation_up_m || 0) / stats.distance_km;
  const sharpTurnsPerKm  = _countSharpTurnsPerKm(stats.track_points, stats.distance_km);

  let level;
  if (seg.transport === "cycling") {
    if (climbPerKm < 8  && sharpTurnsPerKm < 3)  level = 1;
    else if (climbPerKm < 20 || sharpTurnsPerKm < 8)  level = 2;
    else if (climbPerKm < 40 || sharpTurnsPerKm < 15) level = 3;
    else level = 4;
  } else {
    if (climbPerKm < 15 && sharpTurnsPerKm < 2)  level = 1;
    else if (climbPerKm < 40 || sharpTurnsPerKm < 6)  level = 2;
    else if (climbPerKm < 80 || sharpTurnsPerKm < 15) level = 3;
    else level = 4;
  }

  // Kasseien/onverhard tilt niveau minstens naar 2
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
  const phi1    = (lat1 * Math.PI) / 180;
  const phi2    = (lat2 * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

// -----------------------------------------------------------
// STATE
// Elk segment heeft enkel nog seg.gpx (unified model).
// gpxRaw en gpx_stats worden niet meer bewaard in state.
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
      gpx: null,       // unified GPX model: { version, creator, metadata, waypoints, routes, tracks, stats }
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
  // Convenience getters voor backward compat in updatePreview / buildRouteJson
  get gpx()     { return this.segments[0]?.gpx || null; },
  get weather() { return this.segments[0]?.weather || null; },
  storyBlocks: [],
  galleryPhotos: [],
};

let segmentCounter = 1;

const $ = (id) => document.getElementById(id);

const els = {
  btnModeToggle:        $("btn-mode-toggle"),
  modeLabel:            $("mode-label"),
  apiKeyBar:            $("api-key-bar"),
  inputApiKey:          $("input-api-key"),
  btnKeyConfirm:        $("btn-key-confirm"),
  aiActions:            $("ai-actions"),
  aiStoryHint:          $("ai-story-hint"),
  btnAiGenerate:        $("btn-ai-generate"),
  segmentList:          $("segment-list"),
  btnAddSegment:        $("btn-add-segment"),
  inputTitle:           $("input-title"),
  inputDifficulty:      $("input-difficulty"),
  inputSource:          $("input-source"),
  inputHeroPhoto:       $("input-hero-photo"),
  inputKeywords:        $("input-keywords"),
  inputIntro:           $("input-intro"),
  introCount:           $("intro-count"),
  inputTips:            $("input-tips"),
  inputRouteId:         $("input-route-id"),
  inputStatus:          $("input-status"),
  btnExport:            $("btn-export"),
  jsonImportInput:      $("json-import-input"),
  blockList:            $("block-list"),
  btnAddTextBlock:      $("btn-add-text-block"),
  btnAddPhotoBlock:     $("btn-add-photo-block"),
  btnAddPhotoGridBlock: $("btn-add-photo-grid-block"),
  btnAddLinkBlock:      $("btn-add-link-block"),
  galleryList:          $("gallery-list"),
  btnAddGalleryPhoto:   $("btn-add-gallery-photo"),
};

// -----------------------------------------------------------
// AI MODUS TOGGLE
// -----------------------------------------------------------
els.btnModeToggle.addEventListener("click", () => {
  state.aiMode = !state.aiMode;
  els.modeLabel.textContent = state.aiMode ? "AI-modus uitschakelen" : "AI-modus inschakelen";
  els.apiKeyBar.hidden   = !state.aiMode;
  els.aiActions.hidden   = !state.aiMode;
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
  state.apiKey          = key;
  state.apiKeyConfirmed = true;
  els.inputApiKey.value        = "\u2022".repeat(20);
  els.btnKeyConfirm.textContent = "\u2713 Bevestigd";
  els.btnKeyConfirm.disabled    = true;
});

// -----------------------------------------------------------
// SEGMENTEN — render + events
// -----------------------------------------------------------
function renderSegments() {
  els.segmentList.innerHTML = "";

  state.segments.forEach((seg, idx) => {
    const isOnly = state.segments.length === 1;
    const color  = TRANSPORT_COLORS[seg.transport] || "#2C4A3B";
    const sid    = seg.id;
    // Statistieken staan in seg.gpx_stats (unified model na normalisatie)
    const stats  = seg.gpx_stats || null;

    const div = document.createElement("div");
    div.className          = "segment-block";
    div.dataset.sid        = sid;
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
        <input type="text" class="input input--sm segment-label"
          placeholder="Label (optioneel, bv. Naar startpunt)"
          value="${seg.label || ""}" data-sid="${sid}">
        ${!isOnly ? `<button class="segment-remove-btn" data-sid="${sid}" title="Segment verwijderen">✕</button>` : ""}
      </div>

      <div class="segment-gpx">
        <div class="drop-zone segment-drop-zone ${stats ? "drop-zone--has-file" : ""}" id="gpx-drop-zone-${sid}">
          <input type="file" id="gpx-file-input-${sid}" accept=".gpx" hidden>
          <div class="drop-zone__inner" id="gpx-drop-inner-${sid}" ${stats ? "hidden" : ""}>
            <span class="drop-zone__icon">↑</span>
            <p class="drop-zone__text">Sleep je GPX-bestand hierheen</p>
            <p class="drop-zone__sub">of <button class="link-btn" id="gpx-browse-btn-${sid}">kies een bestand</button></p>
          </div>
        </div>
        <div class="gpx-stats" id="gpx-stats-${sid}" ${stats ? "" : "hidden"}>
          <div class="stat-grid">
            <div class="stat-item"><span class="stat-value" id="stat-distance-${sid}">${stats?.distance_km ? stats.distance_km + " km" : "—"}</span><span class="stat-label">Afstand</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-duration-${sid}">${stats?.duration_hours ? stats.duration_hours + " u" : "—"}</span><span class="stat-label">Duur</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-ele-up-${sid}">${stats?.elevation_up_m ? "+" + stats.elevation_up_m + " m" : "—"}</span><span class="stat-label">Stijging</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-ele-down-${sid}">${stats?.elevation_down_m ? "-" + stats.elevation_down_m + " m" : "—"}</span><span class="stat-label">Daling</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-highest-${sid}">${stats?.highest_point_m ? stats.highest_point_m + " m" : "—"}</span><span class="stat-label">Hoogste punt</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-lowest-${sid}">${stats?.lowest_point_m ? stats.lowest_point_m + " m" : "—"}</span><span class="stat-label">Laagste punt</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-avg-speed-${sid}">${stats?.avg_speed_kmh ? stats.avg_speed_kmh + " km/u" : "—"}</span><span class="stat-label">Gem. snelheid</span></div>
            <div class="stat-item"><span class="stat-value" id="stat-max-speed-${sid}">${stats?.max_speed_kmh ? stats.max_speed_kmh + " km/u" : "—"}</span><span class="stat-label">Max. snelheid</span></div>
          </div>
          <span class="gpx-status" id="gpx-status-${sid}">${stats ? "✓ Geladen uit JSON" : ""}</span>
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
              <input type="text" class="input segment-location"
                placeholder="Automatisch via GPX of handmatig"
                value="${seg.location || ""}" data-sid="${sid}">
              <button class="btn btn--ghost btn--sm segment-fetch-location"
                data-sid="${sid}" title="Locatie ophalen via GPX-coördinaten">↺</button>
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
            <input type="text" class="input segment-weather-condition"
              placeholder="zonnig, bewolkt…" value="${seg.weather?.condition || ""}" data-sid="${sid}">
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
  const sid   = seg.id;
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
      seg.difficulty     = "";
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

  const dropZone  = $(`gpx-drop-zone-${sid}`);
  const fileInput = $(`gpx-file-input-${sid}`);
  const browseBtn = $(`gpx-browse-btn-${sid}`);
  const resetBtn  = $(`gpx-reset-btn-${sid}`);

  if (dropZone) {
    dropZone.addEventListener("click",     () => fileInput.click());
    dropZone.addEventListener("dragover",  (e) => { e.preventDefault(); dropZone.classList.add("drop-zone--active"); });
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
      // Reset naar leeg — geen raw bewaren
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
      seg.difficulty     = e.target.value;
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
      // Startcoördinaten zitten in seg.gpx_stats
      if (seg.gpx_stats?.start_lat && seg.gpx_stats?.start_lon) {
        fetchLocationName(seg.gpx_stats.start_lat, seg.gpx_stats.start_lon, sid);
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
  const seg       = _getSeg(sid);
  const container = $(`segment-difficulty-${sid}`);
  if (!seg || !container) return;
  container.innerHTML = _renderDifficultyBlock(seg);

  const difficultySel = container.querySelector(`.segment-difficulty-select[data-sid="${sid}"]`);
  if (difficultySel) {
    difficultySel.addEventListener("change", (e) => {
      seg.difficulty     = e.target.value;
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
// Ondersteunt nieuw formaat (seg.gpx) én oud formaat (gpx_raw / gpx_stats).
// Export is altijd het nieuwe formaat.
// -----------------------------------------------------------
els.jsonImportInput.addEventListener("change", () => {
  const file = els.jsonImportInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    console.info('[creator] JSON import gestart');
    try {
      const parsed = JSON.parse(e.target.result);
      console.info('[creator] JSON parsed, type:', typeof parsed);
      const data = (typeof normalizeRouteJson === 'function') ? normalizeRouteJson(parsed) : parsed;
      console.info('[creator] JSON genormaliseerd (normalizeRouteJson toegepast)');
      loadJsonIntoForm(data);
    } catch (err) {
      alert("Ongeldig JSON-bestand. Controleer het bestand en probeer opnieuw.");
      console.error("[creator] JSON import fout:", err);
    }
  };
  reader.readAsText(file);
  els.jsonImportInput.value = "";
});

function loadJsonIntoForm(data) {
  console.info('[creator] loadJsonIntoForm aangeroepen');
  if (data.id)               els.inputRouteId.value   = data.id;
  if (data.status)           els.inputStatus.value    = data.status;
  if (data.title?.nl)        els.inputTitle.value     = data.title.nl;
  if (data.difficulty)       els.inputDifficulty.value = data.difficulty;
  if (data.source_reference) els.inputSource.value    = data.source_reference;
  if (data.tags?.length)     els.inputKeywords.value  = data.tags.join(", ");
  if (data.summary?.nl) {
    els.inputIntro.value     = data.summary.nl;
    els.introCount.textContent = `${data.summary.nl.length}/160`;
  }
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

  if (data.gallery?.length) {
    state.galleryPhotos = data.gallery.map((p) => ({ url: p.url || "" }));
    renderGallery();
  }

  if (data.segments?.length) {
    segmentCounter = 0;
    state.segments = data.segments.map((s) => {
      segmentCounter++;
      const seg = {
        id: segmentCounter, transport: s.transport || "walking", label: s.label || "",
        gpx: null, gpx_stats: null, gpx_raw: null, date: s.date || "", location: s.location || "",
        country: s.country || "", region: s.region || "", place: s.place || "",
        weather: s.weather || null, difficulty: s.difficulty || "",
        difficultyAuto: s.difficulty_auto !== false, roughSurface: s.rough_surface || false,
      };

      // Import both old and new format:
      // - seg.gpx (unified model met tracks)
      // - seg.gpx_stats (statistieken)
      // - seg.gpx_raw (raw XML, fallback)
      if (s.gpx) seg.gpx = s.gpx;
      if (s.gpx_stats) seg.gpx_stats = s.gpx_stats;
      if (s.gpx_raw) seg.gpx_raw = s.gpx_raw;

      // Moeilijkheid auto-berekenen als niet ingesteld en stats beschikbaar
      if (!seg.difficulty && seg.gpx_stats) {
        const auto = calculateSegmentDifficulty(seg);
        if (auto) seg.difficulty = auto;
      }
      return seg;
    });
  } else {
    // Strict import: segments array is required.
    console.error('[creator] Geïmporteerde JSON bevat geen `segments` array — import geannuleerd.');
    alert('Import mislukt: dit JSON-bestand heeft niet het vereiste moderne formaat (missing segments).');
    return;
  }

  renderSegments();
  renderBlockEditor();
  updatePreview();
  
  // Transport-array heropbouwen vanuit segmenten
  // (zorgt ervoor dat als oud JSON alleen "walking" had, maar nu ook "car" heeft, dit correct wordt gesyndied)
  if (state.segments?.length) {
    const uniqueTransports = [...new Set(state.segments.map(s => s.transport))];
    console.info('[creator] Transport array gesync:', uniqueTransports);
  }
  
  // Zorg dat de preview rechts ook bijgewerkt wordt: titel, locatie, hero-foto
  const titleEl = document.getElementById('rp-title');
  if (titleEl) titleEl.textContent = data.title?.nl || 'Wandeling zonder titel';
  
  const locationEl = document.getElementById('rp-location');
  if (locationEl) locationEl.textContent = data.location || data.segments?.[0]?.location || 'Locatie onbekend';
  
  const heroEl = document.querySelector('.rp-hero img');
  if (heroEl && data.photos?.[0]?.url) {
    let heroUrl = data.photos[0].url;
    if (heroUrl.includes("res.cloudinary.com") && !heroUrl.includes("w_1200")) {
      heroUrl = heroUrl.replace("/upload/", "/upload/w_1200,f_auto/");
    }
    heroEl.src = heroUrl;
  }
}

// -----------------------------------------------------------
// EXPORT: bouw en download gestandaardiseerde JSON vanuit state
// -----------------------------------------------------------
function _buildExportFromState() {
  const out = {};
  out.id = els.inputRouteId.value.trim() || state.segments[0]?.label?.toLowerCase().replace(/\s+/g, '-') || null;
  out.status = els.inputStatus.value || 'draft';
  out.title = { nl: els.inputTitle.value || '' };
  out.summary = { nl: els.inputIntro.value || '' };
  out.tips = { nl: els.inputTips.value || '' };
  out.source_reference = els.inputSource.value || '';
  out.tags = els.inputKeywords.value ? els.inputKeywords.value.split(/\s*,\s*/).filter(Boolean) : [];
  out.photos = [];
  const hero = els.inputHeroPhoto.value.trim();
  if (hero) out.photos.push({ role: 'hero', url: hero });
  // Additional photos from story blocks (photo blocks)
  state.storyBlocks.forEach((b) => { if (b.type === 'photo' && b.value) out.photos.push({ url: b.value }); });
  out.gallery = state.galleryPhotos.map((p) => ({ url: p.url || '' }));
  out.story_blocks = state.storyBlocks.map((b) => ({ ...b }));

  out.segments = state.segments.map((s) => {
    return {
      transport: s.transport || 'walking',
      label: s.label || '',
      date: s.date || null,
      location: s.location || '',
      country: s.country || '',
      region: s.region || '',
      place: s.place || '',
      weather: s.weather || null,
      difficulty: s.difficulty || '',
      difficulty_auto: s.difficultyAuto !== false,
      rough_surface: s.roughSurface || false,
      // Preserve beide gpx model en gpx_stats
      gpx: s.gpx || null,
      gpx_stats: s.gpx_stats || null,
      gpx_raw: s.gpx_raw || null,
    };
  });

  // Backward compat: root-level gpx_stats and gpx_raw copied from first segment
  out.gpx_stats = out.segments[0]?.gpx_stats || null;
  out.gpx_raw = out.segments[0]?.gpx_raw || null;
  return out;
}

function _downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || (obj.id ? `${obj.id}.json` : 'route.json');
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

if (els.btnExport) {
  els.btnExport.addEventListener('click', (e) => {
    e.preventDefault();
    console.info('[creator] Export gestart');
    try {
      const out = _buildExportFromState();
      console.info('[creator] Export JSON gebouwd, velden:', Object.keys(out).join(', '));
      _downloadJson(out, `${out.id || 'route'}.json`);
      console.info('[creator] Export downloaden gestart');
    } catch (err) {
      console.error('[creator] Export mislukt:', err);
      alert('Export mislukt — zie console voor details.');
    }
  });
}

// -----------------------------------------------------------
// EXPORT: routes.json entry downloaden
// -----------------------------------------------------------
const btnExportRoutesEntry = $("btn-export-routes-entry"); // Haalt de knop op uit creator.html.

if (btnExportRoutesEntry) { // Controleert of de knop bestaat voordat we een listener toevoegen.
  btnExportRoutesEntry.addEventListener("click", (e) => { // Start export wanneer op de knop wordt geklikt.
    e.preventDefault(); // Voorkomt standaard browsergedrag.

    const route = _buildExportFromState(); // Gebruikt dezelfde route-data als de gewone JSON-export.

    const firstSegment = route.segments?.[0] || {}; // Neemt het eerste segment als basis voor overzichtsdata.
    const firstStats = firstSegment.gpx_stats || firstSegment.gpx?.stats || null; // Haalt GPX-statistieken op.

    const entry = { // Bouwt één compacte entry voor data/routes.json.
      id: route.id, // Route-id / bestandsnaam.
      title: route.title, // Titelobject, bijvoorbeeld { nl: "..." }.
      location: firstSegment.location || "", // Locatie uit eerste segment.
      region: firstSegment.region || "", // Regio uit eerste segment.
      country: firstSegment.country || "", // Land uit eerste segment.
      status: route.status || "draft", // Draft of published.
      difficulty: firstSegment.difficulty || route.difficulty || "", // Moeilijkheidsgraad.
      distance_km: firstStats?.distance_km || null, // Afstand uit GPX-statistieken.
      duration_hours: firstStats?.duration_hours || null, // Duur uit GPX-statistieken.
      elevation_up_m: firstStats?.elevation_up_m || null, // Hoogtemeters stijging.
      transport: firstSegment.transport || "walking", // Vervoersmiddel.
      hero: route.photos?.find((p) => p.role === "hero")?.url || route.photos?.[0]?.url || "", // Hero-afbeelding.
      file: `${route.id}.json`, // Bestandsnaam van de route JSON.
      tags: route.tags || [] // Tags / keywords.
    };

    _downloadJson(entry, `${route.id || "route"}-routes-entry.json`); // Downloadt de routes.json entry.
  });
}

/**
 * Converteert oud gpx_stats object (zonder tracks) naar het unified gpx model.
 * Wordt enkel gebruikt bij import van pre-v3.0.0 JSON bestanden.
 * tracks en points blijven leeg — hoogteprofiel zal niet beschikbaar zijn.
 * @param {Object} g - oud gpx_stats object
 * @returns {Object} unified gpx model
 */
// Legacy conversion removed per user request — no backward compatibility handling here.

// -----------------------------------------------------------
// BLOKKEN-EDITOR
// -----------------------------------------------------------
function renderBlockEditor() {
  els.blockList.innerHTML = "";
  state.storyBlocks.forEach((block, i) => {
    const item = document.createElement("div");
    item.className  = `block-item block-item--${block.type}`;
    item.dataset.idx = i;
    const isFirst = i === 0;
    const isLast  = i === state.storyBlocks.length - 1;

    let bodyHtml = "";
    if (block.type === "text") {
      const escaped = (block.value || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      bodyHtml = `<div class="block-item__label">Tekst</div><textarea class="block-textarea input input--textarea" rows="4" placeholder="Schrijf een alinea\u2026" data-idx="${i}">${escaped}</textarea>`;
    } else if (block.type === "photo") {
      bodyHtml = `<div class="block-item__label">Foto (volledig breed)</div><input type="url" class="block-url-input input" placeholder="https://res.cloudinary.com/…" value="${block.value || ""}" data-idx="${i}"><div class="block-photo-preview" data-idx="${i}">${block.value ? `<img src="${block.value}" alt="" class="block-photo-preview__img" onerror="this.parentElement.hidden=true">` : ""}</div>`;
    } else if (block.type === "photo-grid") {
      const cols   = block.cols   || 2;
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
  const idx    = parseInt(e.currentTarget.dataset.idx);
  if (action === "up"     && idx > 0)                         [state.storyBlocks[idx - 1], state.storyBlocks[idx]] = [state.storyBlocks[idx], state.storyBlocks[idx - 1]];
  else if (action === "down" && idx < state.storyBlocks.length - 1) [state.storyBlocks[idx], state.storyBlocks[idx + 1]] = [state.storyBlocks[idx + 1], state.storyBlocks[idx]];
  else if (action === "remove") state.storyBlocks.splice(idx, 1);
  renderBlockEditor();
  updatePreview();
}

els.btnAddTextBlock.addEventListener("click",      () => { state.storyBlocks.push({ type: "text",       value: "" });               renderBlockEditor(); updatePreview(); });
els.btnAddPhotoBlock.addEventListener("click",     () => { state.storyBlocks.push({ type: "photo",      value: "" });               renderBlockEditor(); updatePreview(); });
els.btnAddPhotoGridBlock.addEventListener("click", () => { state.storyBlocks.push({ type: "photo-grid", cols: 2, photos: ["", ""] }); renderBlockEditor(); updatePreview(); });
els.btnAddLinkBlock.addEventListener("click",      () => { state.storyBlocks.push({ type: "link",       name: "", url: "" });       renderBlockEditor(); updatePreview(); });

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
    entry.querySelector(".gallery-url-input").addEventListener("blur",  (e) => { const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); e.target.value = fixed; state.galleryPhotos[i].url = fixed; updatePreview(); });
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
    // parseGpx retourneert nu het volledige unified model
    const gpxData = parseGpx(e.target.result, sid);
    if (!gpxData) { alert("GPX-bestand kon niet worden gelezen. Controleer het bestand."); return; }
    seg.gpx = gpxData;
    seg.gpx_stats = gpxData.stats;

    // Statistieken tonen vanuit seg.gpx.stats
    displayGpxStats(gpxData.stats, sid);

    // Datum uit stats invullen als het veld nog leeg is
    const dateInp = document.querySelector(`.segment-date[data-sid="${sid}"]`);
    if (dateInp && !dateInp.value && gpxData.stats?.start) {
      const dateStr = gpxData.stats.start.split("T")[0];
      dateInp.value = dateStr;
      seg.date = dateStr;
    }

    // Locatie ophalen via startcoördinaten uit stats
    if (gpxData.stats?.start_lat && gpxData.stats?.start_lon) {
      fetchLocationName(gpxData.stats.start_lat, gpxData.stats.start_lon, sid);
    }

    if (seg.difficultyAuto) {
      const auto = calculateSegmentDifficulty(seg);
      if (auto) { seg.difficulty = auto; _refreshDifficultyBlock(sid); }
    }
    if (sid === state.segments[0].id) applyCalculatedDifficulty();
    updatePreview();
  };
  reader.readAsText(file);
}

function displayGpxStats(stats, sid) {
  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  set(`stat-distance-${sid}`,  stats.distance_km      ? `${stats.distance_km} km`      : "—");
  set(`stat-duration-${sid}`,  stats.duration_hours   ? `${stats.duration_hours} u`    : "—");
  set(`stat-ele-up-${sid}`,    stats.elevation_up_m   ? `+${stats.elevation_up_m} m`   : "—");
  set(`stat-ele-down-${sid}`,  stats.elevation_down_m ? `-${stats.elevation_down_m} m` : "—");
  set(`stat-highest-${sid}`,   stats.highest_point_m  ? `${stats.highest_point_m} m`   : "—");
  set(`stat-lowest-${sid}`,    stats.lowest_point_m   ? `${stats.lowest_point_m} m`    : "—");
  set(`stat-avg-speed-${sid}`, stats.avg_speed_kmh    ? `${stats.avg_speed_kmh} km/u`  : "—");
  set(`stat-max-speed-${sid}`, stats.max_speed_kmh    ? `${stats.max_speed_kmh} km/u`  : "—");

  const dropZone = $(`gpx-drop-zone-${sid}`);
  const inner    = $(`gpx-drop-inner-${sid}`);
  const statsEl  = $(`gpx-stats-${sid}`);
  const statusEl = $(`gpx-status-${sid}`);
  if (inner)    inner.hidden = true;
  if (dropZone) dropZone.classList.add("drop-zone--has-file");
  if (statsEl)  statsEl.hidden = false;
  if (statusEl) statusEl.textContent = "✓ Geladen";
}

// -----------------------------------------------------------
// GPX PARSER — unified model
// Retourneert: { version, creator, metadata, waypoints, routes, tracks, stats }
// tracks[].segments[].points[] bevat { lat, lon, ele, time, extensions }
// stats bevat alle berekende statistieken voor weergave en export
// -----------------------------------------------------------
function parseGpx(xmlText, sid) {
  try {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(xmlText, "application/xml");

    // Parseerfouten opvangen
    const parseErr = doc.querySelector("parsererror");
    if (parseErr) { console.error("[creator.js] GPX XML parsefout"); return null; }

    const gpxEl = doc.querySelector("gpx");

    // --- Metadata ---
    const metaEl = doc.querySelector("metadata");
    const metadata = metaEl ? {
      name:        metaEl.querySelector("name")?.textContent        || null,
      description: metaEl.querySelector("desc")?.textContent        || null,
      author:      metaEl.querySelector("author name")?.textContent || null,
      time:        metaEl.querySelector("time")?.textContent        || null,
    } : null;

    // --- Waypoints ---
    const waypoints = Array.from(doc.querySelectorAll("wpt")).map((wpt) => ({
      lat:  parseFloat(wpt.getAttribute("lat")),
      lon:  parseFloat(wpt.getAttribute("lon")),
      ele:  wpt.querySelector("ele")  ? parseFloat(wpt.querySelector("ele").textContent)  : null,
      name: wpt.querySelector("name") ? wpt.querySelector("name").textContent             : null,
      time: wpt.querySelector("time") ? wpt.querySelector("time").textContent             : null,
    }));

    // --- Routes (rte/rtept) ---
    const routes = Array.from(doc.querySelectorAll("rte")).map((rte) => ({
      name:   rte.querySelector("name")?.textContent || null,
      points: Array.from(rte.querySelectorAll("rtept")).map((pt) => ({
        lat:  parseFloat(pt.getAttribute("lat")),
        lon:  parseFloat(pt.getAttribute("lon")),
        ele:  pt.querySelector("ele")  ? parseFloat(pt.querySelector("ele").textContent)  : null,
        name: pt.querySelector("name") ? pt.querySelector("name").textContent             : null,
        time: pt.querySelector("time") ? pt.querySelector("time").textContent             : null,
      })),
    }));

// --- Tracks (trk/trkseg/trkpt) ---
const tracks = Array.from(doc.querySelectorAll("trk")).map((trk) => ({
  name: trk.querySelector("name")?.textContent || null,

  segments: Array.from(trk.querySelectorAll("trkseg")).map((seg) => ({

    points: Array.from(seg.querySelectorAll("trkpt")).map((pt) => ({

      lat: parseFloat(pt.getAttribute("lat")),
      lon: parseFloat(pt.getAttribute("lon")),

      ele: pt.querySelector("ele")
        ? parseFloat(pt.querySelector("ele").textContent)
        : null,

      time: pt.querySelector("time")
        ? pt.querySelector("time").textContent
        : null,

      name: pt.querySelector("name")
        ? pt.querySelector("name").textContent
        : null,

      cmt: pt.querySelector("cmt")
        ? pt.querySelector("cmt").textContent
        : null,

      desc: pt.querySelector("desc")
        ? pt.querySelector("desc").textContent
        : null,

      src: pt.querySelector("src")
        ? pt.querySelector("src").textContent
        : null,

      links: Array.from(pt.querySelectorAll("link")).map((link) => ({
        href: link.getAttribute("href") || null,
        text: link.querySelector("text")
          ? link.querySelector("text").textContent
          : null,
        type: link.querySelector("type")
          ? link.querySelector("type").textContent
          : null,
      })),

      sym: pt.querySelector("sym")
        ? pt.querySelector("sym").textContent
        : null,

      type: pt.querySelector("type")
        ? pt.querySelector("type").textContent
        : null,

      fix: pt.querySelector("fix")
        ? pt.querySelector("fix").textContent
        : null,

      sat: pt.querySelector("sat")
        ? Number(pt.querySelector("sat").textContent)
        : null,

      hdop: pt.querySelector("hdop")
        ? Number(pt.querySelector("hdop").textContent)
        : null,

      vdop: pt.querySelector("vdop")
        ? Number(pt.querySelector("vdop").textContent)
        : null,

      pdop: pt.querySelector("pdop")
        ? Number(pt.querySelector("pdop").textContent)
        : null,

      ageofdgpsdata: pt.querySelector("ageofdgpsdata")
        ? Number(pt.querySelector("ageofdgpsdata").textContent)
        : null,

      dgpsid: pt.querySelector("dgpsid")
        ? Number(pt.querySelector("dgpsid").textContent)
        : null,

      extensions: pt.querySelector("extensions")
        ? pt.querySelector("extensions").innerHTML
        : null,

    })),

  })),

}));

    // Alle trackpunten samengevoegd voor statistiekenberekening
    const allPoints = tracks.flatMap((t) => t.segments.flatMap((s) => s.points));
    if (allPoints.length < 2) return null;

    // --- Statistieken berekenen ---
    const stats = _computeStats(allPoints, sid);

    return {
      version:   gpxEl?.getAttribute("version")            || null,
      creator:   gpxEl?.getAttribute("creator")            || null,
      metadata,
      waypoints,
      routes,
      tracks,
      stats,
    };

  } catch (err) {
    console.error("[creator.js] GPX parse fout:", err);
    return null;
  }
}

/**
 * Berekent alle statistieken uit een geflattende array van trkpt punten.
 * GPS-ruis filtering op snelheid: pieken boven 3× het gemiddelde worden gefilterd.
 * @param {Array<{lat,lon,ele,time}>} points - alle trackpunten
 * @param {number|undefined} sid             - segment id (voor waarschuwing UI)
 * @returns {Object} stats object voor seg.gpx.stats
 */
function _computeStats(points, sid) {
  let totalDistance  = 0;
  let elevationUp    = 0;
  let elevationDown  = 0;
  let highestPoint   = -Infinity;
  let lowestPoint    = Infinity;
  const speeds       = [];
  const speedPeaks   = [];
  let startTime      = null;
  let endTime        = null;
  const WARMUP_SKIP  = 10;   // eerste punten overslaan voor snelheidsberekening

  // Subsampled trackpoints voor kaart + bochtenberekening (max 500 punten)
  const step        = Math.max(1, Math.floor(points.length / 500));
  const trackPoints = [];

  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    // Hoogte globaal bijhouden
    if (curr.ele !== null && !isNaN(curr.ele)) {
      if (curr.ele > highestPoint) highestPoint = curr.ele;
      if (curr.ele < lowestPoint)  lowestPoint  = curr.ele;
    }
    // Subsampled punt voor kaart
    if (i % step === 0) trackPoints.push([curr.lat, curr.lon]);

    if (i === 0) continue; // eerste punt heeft geen voorganger

    const prev = points[i - 1];
    const dist = haversine(prev.lat, prev.lon, curr.lat, curr.lon);
    totalDistance += dist;

    // Hoogteverschil — drempel 2m om GPS-ruis te filteren
    const ele1 = prev.ele, ele2 = curr.ele;
    if (ele1 !== null && ele2 !== null && !isNaN(ele1) && !isNaN(ele2)) {
      const eleDiff = ele2 - ele1;
      if (eleDiff > 2)  elevationUp   += eleDiff;
      if (eleDiff < -2) elevationDown += Math.abs(eleDiff);
    }

    // Snelheid berekenen indien timestamps beschikbaar
    if (prev.time && curr.time) {
      const t1 = new Date(prev.time), t2 = new Date(curr.time);
      if (!startTime) startTime = t1;
      endTime = t2;
      const timeDiff = (t2 - t1) / 3600000; // uren
      if (timeDiff > 0 && i >= WARMUP_SKIP) {
        speeds.push((dist / 1000) / timeDiff); // km/u
      }
    }
  }

  // Snelheidspiek-filter: alles boven 3× gemiddelde terzijde stellen
  const avgRaw       = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null;
  const peakThreshold = avgRaw ? avgRaw * 3 : null;
  const filteredSpeeds = [];
  speeds.forEach((s) => {
    if (peakThreshold && s >= peakThreshold) speedPeaks.push(Math.round(s * 10) / 10);
    else filteredSpeeds.push(s);
  });

  const firstPt      = points[0];
  const durationHours = startTime && endTime ? (endTime - startTime) / 3600000 : null;
  const avgSpeed      = filteredSpeeds.length ? filteredSpeeds.reduce((a, b) => a + b, 0) / filteredSpeeds.length : null;
  const maxSpeedFiltered = filteredSpeeds.length ? Math.max(...filteredSpeeds) : 0;
  const maxSpeedRaw      = speeds.length        ? Math.max(...speeds)          : 0;

  const stats = {
    distance_km:      Math.round(totalDistance / 10) / 100,
    duration_hours:   durationHours ? Math.round(durationHours * 10) / 10 : null,
    elevation_up_m:   Math.round(elevationUp),
    elevation_down_m: Math.round(elevationDown),
    highest_point_m:  highestPoint > -Infinity ? Math.round(highestPoint) : null,
    lowest_point_m:   lowestPoint  <  Infinity ? Math.round(lowestPoint)  : null,
    avg_speed_kmh:    avgSpeed ? Math.round(avgSpeed * 10) / 10 : null,
    max_speed_kmh:    Math.round(maxSpeedFiltered * 10) / 10,
    start_lat:        firstPt.lat,
    start_lon:        firstPt.lon,
    start:            points[0].time             || null,
    end:              points[points.length - 1].time || null,
    // track_points voor kaart + bochtenberekening (niet in hoogteprofiel)
    track_points:     trackPoints,
  };

  // Snelheidspieken rapporteren aan de UI
  if (speedPeaks.length > 0) {
    stats._max_speed_raw   = Math.round(maxSpeedRaw * 10) / 10;
    stats._speed_peaks     = speedPeaks;
    showSpeedWarning(stats, sid);
  }

  return stats;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R      = 6371000;
  const phi1   = (lat1 * Math.PI) / 180;
  const phi2   = (lat2 * Math.PI) / 180;
  const dPhi   = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function showSpeedWarning(stats, sid) {
  const containerId = sid ? `gpx-stats-${sid}` : "gpx-stats-1";
  const container   = $(containerId);
  if (!container) return;
  const existingWarn = container.querySelector(".gpx-warning");
  if (existingWarn) existingWarn.remove();

  const maxRaw      = stats._max_speed_raw;
  const maxFiltered = stats.max_speed_kmh;
  const warning     = document.createElement("div");
  warning.className = "gpx-warning";
  warning.innerHTML = `<p class="gpx-warning__text">⚠️ Verdachte snelheidspiek: <strong>${maxRaw} km/u</strong> (gem. ${stats.avg_speed_kmh} km/u). Waarschijnlijk GPS-ruis. Gefilterd maximum: <strong>${maxFiltered} km/u</strong>.</p><div class="gpx-warning__actions"><button class="btn btn--primary btn--sm gpx-warn-ignore">Negeren (${maxFiltered} km/u)</button><button class="btn btn--ghost btn--sm gpx-warn-keep" data-raw="${maxRaw}" data-sid="${sid || 1}">Toch bewaren (${maxRaw} km/u)</button></div>`;
  container.appendChild(warning);

  warning.querySelector(".gpx-warn-ignore").addEventListener("click", () => warning.remove());
  warning.querySelector(".gpx-warn-keep").addEventListener("click", (e) => {
    const segId = parseInt(e.target.dataset.sid);
    const s     = _getSeg(segId);
    if (s?.gpx?.stats) {
      s.gpx.stats.max_speed_kmh = maxRaw;
      const el = $(`stat-max-speed-${segId}`);
      if (el) el.textContent = `${maxRaw} km/u`;
    }
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
    const url  = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const resp = await fetch(url, { headers: { "Accept-Language": "nl" } });
    const data = await resp.json();
    const addr = data.address || {};
    const country  = addr.country  || "";
    const region   = addr.state || addr.province || addr.county || addr.state_district || "";
    const place    = addr.village || addr.town || addr.city || addr.municipality || "";
    const location = [place, region, country].filter(Boolean).join(", ");

    const seg = _getSeg(sid);
    if (seg) { seg.location = location; seg.country = country; seg.region = region; seg.place = place; }

    const locInp     = document.querySelector(`.segment-location[data-sid="${sid}"]`);
    const countryInp = document.querySelector(`.segment-country[data-sid="${sid}"]`);
    const regionInp  = document.querySelector(`.segment-region[data-sid="${sid}"]`);
    const placeInp   = document.querySelector(`.segment-place[data-sid="${sid}"]`);
    if (locInp     && location) locInp.value     = location;
    if (countryInp && country)  countryInp.value = country;
    if (regionInp  && region)   regionInp.value  = region;
    if (placeInp   && place)    placeInp.value   = place;
  } catch (err) {
    console.warn("[creator.js] Nominatim fout:", err);
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
  // Coördinaten komen nu uit seg.gpx.stats
  const date = seg.date;
  const lat  = seg.gpx?.stats?.start_lat;
  const lon  = seg.gpx?.stats?.start_lon;

  if (!date) { alert("Kies eerst een datum voor dit segment."); return; }
  if (!lat || !lon) { alert("Laad eerst een GPX-bestand voor dit segment."); return; }

  const fetchBtn = document.querySelector(`.segment-fetch-weather[data-sid="${sid}"]`);
  if (fetchBtn) { fetchBtn.textContent = "Ophalen…"; fetchBtn.disabled = true; }

  try {
    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(date);
    if (chosenDate >= today) { alert("Weerdata is enkel beschikbaar voor datums in het verleden. Kies een datum vóór vandaag."); return; }

    const url  = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe/Brussels`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      const reason  = errData?.reason || `HTTP ${resp.status}`;
      console.error("[creator.js] Open-Meteo fout:", reason);
      alert(`Weerdata kon niet worden opgehaald: ${reason}`);
      return;
    }

    const data = await resp.json();
    const d    = data.daily;
    if (!d) { alert("Weerdata kon niet worden opgehaald. Open-Meteo gaf geen dagdata terug."); return; }

    const condInp = document.querySelector(`.segment-weather-condition[data-sid="${sid}"]`);
    seg.weather = {
      date,
      temperature_min:  d.temperature_2m_min?.[0]   ?? null,
      temperature_max:  d.temperature_2m_max?.[0]   ?? null,
      precipitation_mm: d.precipitation_sum?.[0]    ?? null,
      wind_kmh:         d.wind_speed_10m_max?.[0]   ?? null,
      condition:        condInp?.value || "",
      source:           "Open-Meteo",
    };

    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set(`w-temp-min-${sid}`, seg.weather.temperature_min  != null ? `${seg.weather.temperature_min}°C`  : "—");
    set(`w-temp-max-${sid}`, seg.weather.temperature_max  != null ? `${seg.weather.temperature_max}°C`  : "—");
    set(`w-precip-${sid}`,   seg.weather.precipitation_mm != null ? `${seg.weather.precipitation_mm} mm` : "—");
    set(`w-wind-${sid}`,     seg.weather.wind_kmh         != null ? `${seg.weather.wind_kmh} km/u`       : "—");

    const weatherBlock = $(`weather-block-${sid}`);
    if (weatherBlock) weatherBlock.hidden = false;

    if (seg.difficultyAuto && seg.gpx) {
      const auto = calculateSegmentDifficulty(seg);
      if (auto) { seg.difficulty = auto; _refreshDifficultyBlock(sid); }
    }
    if (sid === state.segments[0].id) applyCalculatedDifficulty();
    updatePreview();
  } catch (err) {
    console.error("[creator.js] Weerdata fout:", err);
    alert("Weerdata kon niet worden opgehaald. Controleer datum en verbinding.");
  } finally {
    if (fetchBtn) { fetchBtn.textContent = "Weerdata ophalen"; fetchBtn.disabled = false; }
  }
}

function calculateDifficulty() {
  // Leest uit seg.gpx.stats van het eerste segment
  const stats   = state.segments[0]?.gpx?.stats;
  const weather = state.segments[0]?.weather;
  if (!stats) return null;
  let score = 0;
  if (stats.distance_km)    score += stats.distance_km;
  if (stats.elevation_up_m) score += stats.elevation_up_m / 100;
  if (weather) {
    if (weather.temperature_max >= 25)  score += 2;
    if (weather.precipitation_mm >= 5)  score += 2;
    if (weather.wind_kmh >= 30)         score += 1;
  }
  if (score <= 5)  return "T1";
  if (score <= 10) return "T2";
  if (score <= 16) return "T3";
  if (score <= 22) return "T4";
  if (score <= 28) return "T5";
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

els.inputHeroPhoto.addEventListener("blur",  () => { const fixed = fixCloudinaryUrl(els.inputHeroPhoto.value.trim()); if (fixed !== els.inputHeroPhoto.value.trim()) els.inputHeroPhoto.value = fixed; updatePreview(); });
els.inputHeroPhoto.addEventListener("input", updatePreview);
els.inputIntro.addEventListener("input",     () => { els.introCount.textContent = `${els.inputIntro.value.length}/160`; updatePreview(); });

// -----------------------------------------------------------
// HOOGTEPROFIEL PREVIEW — v3.0.0
// Leest punten uit seg.gpx.tracks[].segments[].points[]
// elk punt heeft { lat, lon, ele, time }
// Geen gpxRaw meer nodig — data zit volledig in het unified model
// -----------------------------------------------------------

/**
 * Verzamelt alle {lat, lon, ele} punten uit het unified gpx model.
 * Fall-back: als seg.gpx ontbreekt maar gpx_stats.track_points aanwezig is (bijv. na JSON import),
 * zet track_points om naar het verwachte formaat.
 * @param {Object} gpx - seg.gpx unified model (optioneel)
 * @param {Object} gpxStats - seg.gpx_stats met track_points (fallback)
 * @returns {Array<{lat,lon,ele}>|null}
 */
function _collectElevationPoints(gpx, gpxStats) {
  // Poging 1: volle GPX model (normal flow met GPX upload)
  if (gpx?.tracks?.length) {
    const points = [];
    for (const track of gpx.tracks) {
      for (const segment of track.segments) {
        for (const pt of segment.points) {
          if (
            !isNaN(pt.lat) && !isNaN(pt.lon) &&
            pt.ele !== null && !isNaN(pt.ele)
          ) {
            points.push({ lat: pt.lat, lon: pt.lon, ele: pt.ele });
          }
        }
      }
    }
    if (points.length >= 2) return points;
  }

  // Fallback: track_points uit gpx_stats (JSON import scenario)
  if (gpxStats?.track_points?.length) {
    const points = gpxStats.track_points
      .filter((pt) => Array.isArray(pt) && pt.length >= 2)
      .map((pt) => ({ lat: pt[0], lon: pt[1], ele: pt[2] || null }))
      .filter((pt) => !isNaN(pt.lat) && !isNaN(pt.lon) && pt.ele !== null && !isNaN(pt.ele));
    if (points.length >= 2) return points;
  }

  return null;
}

/**
 * Bereken cumulatieve afstand in km tussen opeenvolgende punten (haversine).
 * Aparte naam om conflict met route.js te vermijden als dat ook geladen is.
 * @param {Array<{lat,lon,ele}>} points
 * @returns {Array<number>} cumulatieve afstand per index (index 0 = 0 km)
 */
function _cumulativeDistancesEle(points) {
  const R    = 6371;
  const dist = [0];
  for (let i = 1; i < points.length; i++) {
    const p1   = points[i - 1], p2 = points[i];
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lon - p1.lon) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) ** 2 +
      Math.cos(p1.lat * Math.PI / 180) *
      Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    dist.push(dist[i - 1] + 2 * R * Math.asin(Math.sqrt(a)));
  }
  return dist;
}

// -----------------------------------------------------------
// CENTRALE PREVIEW UPDATE — coördinatie van alle render-functies
// -----------------------------------------------------------

/**
 * Centrale updatePreview() - coördineert alle visualisatie-renders:
 * - renderSegments() → tekent segment-blokken UI
 * - renderElevationPreview() → tekent hoogteprofiel SVG
 * Wordt aangeroepen bij elke wijziging van state (GPX, metadata, blokken, etc.)
 */
function updatePreview() {
  renderSegments();
  renderElevationPreview(state.segments);
}

/**
 * Rendert een SVG hoogteprofiel in #rp-elevation-chart.
 * Elk segment krijgt zijn eigen kleur (TRANSPORT_COLORS).
 * Meerdere segmenten naast elkaar, gescheiden door streepjeslijn.
 * Hover tooltip toont hoogte in m + afstand in km.
 * Sectie blijft verborgen als geen enkel segment gpx.tracks heeft met punten.
 * @param {Array} segments - state.segments array
 */
function renderElevationPreview(segments) {
  const wrapper   = $("rp-elevation");
  const container = $("rp-elevation-chart");
  if (!wrapper || !container) return;

  // Bouw segmentdata op uit seg.gpx.tracks[].segments[].points[] (of fallback track_points)
  const segmentData = [];
  for (const seg of segments) {
    const points = _collectElevationPoints(seg.gpx, seg.gpx_stats);
    if (!points) continue;
    segmentData.push({
      points,
      distances: _cumulativeDistancesEle(points),
      color:     TRANSPORT_COLORS[seg.transport] || "#2C4A3B",
      label:     TRANSPORT_LABELS[seg.transport] || seg.transport || "Segment",
    });
  }

  // Geen data — sectie verbergen
  if (segmentData.length === 0) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;

  // SVG dimensies
  const W = 700, H = 180, ML = 44, MR = 10, MT = 12, MB = 28;
  const plotW = W - ML - MR, plotH = H - MT - MB;

  // Globale hoogte min/max + totale afstand over alle segmenten
  let globalMin = Infinity, globalMax = -Infinity, totalDist = 0;
  for (const seg of segmentData) {
    for (const pt of seg.points) {
      if (pt.ele < globalMin) globalMin = pt.ele;
      if (pt.ele > globalMax) globalMax = pt.ele;
    }
    totalDist += seg.distances[seg.distances.length - 1];
  }

  // Padding zodat profiel niet tegen de rand kleeft
  const range  = globalMax - globalMin || 1;
  const pad    = range * 0.1;
  const eleMin = globalMin - pad;
  const eleMax = globalMax + pad;

  // Schaalfuncties: data-coördinaat → SVG-pixel
  const xScale = (d) => ML + (d / totalDist) * plotW;
  const yScale = (e) => MT + plotH - ((e - eleMin) / (eleMax - eleMin)) * plotH;

  // SVG opbouwen als string
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Hoogteprofiel"
    style="width:100%;height:auto;display:block;overflow:visible;">`;

  // Achtergrond plotgebied
  svg += `<rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}"
    fill="var(--color-surface-alt,#f8f9fa)" rx="3"/>`;

  // Horizontale gridlijnen (4 stappen) met hoogte-labels
  for (let i = 0; i <= 4; i++) {
    const ele = eleMin + (i / 4) * (eleMax - eleMin);
    const y   = yScale(ele);
    svg += `<line x1="${ML}" y1="${y}" x2="${W - MR}" y2="${y}"
      stroke="var(--color-border,#e5e7eb)" stroke-width="1"/>`;
    svg += `<text x="${ML - 4}" y="${y + 4}" text-anchor="end"
      font-size="9" fill="var(--color-text-muted,#6b7280)">${Math.round(ele)} m</text>`;
  }

  // X-as labels (5 stappen)
  for (let i = 0; i <= 5; i++) {
    const d = (i / 5) * totalDist;
    const x = xScale(d);
    svg += `<text x="${x}" y="${H - 6}" text-anchor="middle"
      font-size="10" fill="var(--color-text-muted,#6b7280)">${d.toFixed(1)} km</text>`;
  }

  // Segmenten tekenen + scheidingslijnen
  let cumDist = 0;
  const separators = [];
  for (let si = 0; si < segmentData.length; si++) {
    const seg = segmentData[si];
    const segTotalDist = seg.distances[seg.distances.length - 1];
    const pts = seg.points.map((pt, idx) => {
      const x = xScale(cumDist + seg.distances[idx]);
      const y = yScale(pt.ele);
      return `${x},${y}`;
    }).join(" ");

    const firstX = xScale(cumDist + seg.distances[0]);
    const lastX = xScale(cumDist + segTotalDist);
    const baseY = MT + plotH;
    const polyPts = `${firstX},${baseY} ${pts} ${lastX},${baseY}`;

    svg += `<polygon points="${polyPts}"
      fill="${seg.color}" fill-opacity="0.12" stroke="none"/>`;
    svg += `<polyline points="${pts}"
      fill="none" stroke="${seg.color}" stroke-width="2"
      stroke-linejoin="round" stroke-linecap="round"/>`;

    cumDist += segTotalDist;
    if (si < segmentData.length - 1) separators.push(xScale(cumDist));
  }

  for (const x of separators) {
    svg += `<line x1="${x}" y1="${MT}" x2="${x}" y2="${MT + plotH}"
      stroke="var(--color-border,#e5e7eb)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  }

  svg += `</svg>`;
  container.innerHTML = svg;
}
// -----------------------------------------------------------
// INIT
// -----------------------------------------------------------
window.appReady.then(() => {
  renderSegments();
  renderBlockEditor();
  renderGallery();
  updatePreview();
});
