// =======================================================
// creator-segments.js — MyTrailWalks
// Segmenteditor: state, rendering, events en segmentbeheer
// v1.0.1: modulebasis aangemaakt; nog geen functies verplaatst
// =======================================================
"use strict";

// -----------------------------------------------------------
// CREATOR SEGMENTS — HELPERS
// -----------------------------------------------------------
// -----------------------------------------------------------
// SEGMENTEN — render + events
// -----------------------------------------------------------
function renderCreatorSegments() {
  els.segmentList.innerHTML = "";
  state.segments.forEach((seg, idx) => {
  const isOnly = state.segments.length === 1;
  const color  = TRANSPORT_COLORS[seg.transport] || "#2C4A3B";
  const sid    = seg.id;
// Statistieken staan in seg.gpx.stats.
// Een nieuw leeg segment heeft nog geen gpx-object.
    const stats  = seg.gpx?.stats || null;
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
        
      <div class="segment-difficulty" id="segment-difficulty-${sid}">
        ${_renderDifficultyBlock(seg)}
      </div>

<div class="segment-meta">
  <div class="field-row">
    <div class="field">
      <label class="field__label">Datum</label>
      <input
        type="date"
        class="input segment-date"
        value="${seg.date || ""}"
        data-sid="${sid}"
      >
    </div>

    <div class="field field--grow">
      <label class="field__label">Locatie</label>
      <div class="input-with-action">
        <input
          type="text"
          class="input segment-location"
          placeholder="Automatisch via GPX of handmatig"
          value="${seg.location || ""}"
          data-sid="${sid}"
        >
        <button
          class="btn btn--ghost btn--sm segment-fetch-location"
          data-sid="${sid}"
          title="Locatie ophalen via GPX-coördinaten"
        >↺</button>
      </div>
    </div>
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
  const scale = window.DIFFICULTY_SCALES[seg.transport];

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
      renderCreatorSegments();
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
      // Startcoördinaten zitten in seg.gpx.stats
      if (seg.gpx.stats?.start_lat && seg.gpx.stats?.start_lon) {
        fetchLocationName(seg.gpx.stats.start_lat, seg.gpx.stats.start_lon, sid);
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
  renderCreatorSegments();
  const newBlock = document.querySelector(`.segment-block[data-sid="${segmentCounter}"]`);
  if (newBlock) newBlock.scrollIntoView({ behavior: "smooth", block: "start" });
});
// -----------------------------------------------------------
// CREATOR SEGMENTS — DIFFICULTY
// -----------------------------------------------------------

// -----------------------------------------------------------
// CREATOR SEGMENTS — RENDERING
// -----------------------------------------------------------

// -----------------------------------------------------------
// CREATOR SEGMENTS — EVENTS
// -----------------------------------------------------------

// -----------------------------------------------------------
// CREATOR SEGMENTS — ADD SEGMENT
// -----------------------------------------------------------

// -----------------------------------------------------------
// CREATOR SEGMENTS — EXPORTS
// -----------------------------------------------------------


window.renderCreatorSegments = renderCreatorSegments;
