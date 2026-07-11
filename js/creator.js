// =======================================================
// creator.js — MyTrailWalks
// Route creator: GPX parse, weer, locatie, AI, JSON export
// lat, lon, ele, time, name, cmt, desc, src, links, sym, type, fix, sat, hdop, vdop, pdop, ageofdgpsdata, dgpsid, extensions
// v3.0.2: herstel updatePreview() centrale coördinator-functie
// v3.0.1: syntax herstel in elevation preview renderer
// v3.0.0: één unified segment.gpx model
//         - GPX volledig uitgelezen naar segment.gpx.tracks[].segments[].points[]
//         - segment.gpx.stats bevat alle berekende statistieken
//         - Export gebruikt uitsluitend segment.gpx
//         - Preview gebruikt uitsluitend segment.gpx
//         - JSON import verwacht uitsluitend het nieuwe unified model
// v2.4.2: datum-validatie bij weerdata ophalen (toekomstige datum)
// v2.4.1: track_points toegevoegd aan segment.gpx.stats
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
  renderSegments();
  const newBlock = document.querySelector(`.segment-block[data-sid="${segmentCounter}"]`);
  if (newBlock) newBlock.scrollIntoView({ behavior: "smooth", block: "start" });
});

// JSON IMPORT
// Ondersteunt nieuw formaat (seg.gpx) én oud formaat (gpx_raw / gpx.stats).
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
    renderGalleryEditor();
  }

  if (data.segments?.length) {
    segmentCounter = 0;
    state.segments = data.segments.map((s) => {
      segmentCounter++;
     const seg = {
        id: segmentCounter,
        transport: s.transport || "walking",
        label: s.label || "",
        gpx: null,
        date: s.date || "",
        location: s.location || "",
        country: s.country || "",
        region: s.region || "",
        place: s.place || "",
        weather: s.weather || null,
        difficulty: s.difficulty || "",
        difficultyAuto: s.difficulty_auto !== false,
        roughSurface: s.rough_surface || false,
};
      
   // Importeert uitsluitend het nieuwe unified GPX-model.
if (s.gpx) {
  seg.gpx = s.gpx;
}

// Moeilijkheid automatisch berekenen als deze niet is ingesteld.
if (!seg.difficulty && seg.gpx?.stats) {
  const auto = calculateSegmentDifficulty(seg);

  if (auto) {
    seg.difficulty = auto;
  }
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
}

// -----------------------------------------------------------
// GALERIJ
// -----------------------------------------------------------
function renderGalleryEditor() {
  if (!els.galleryList) return;
  els.galleryList.innerHTML = "";
  state.galleryPhotos.forEach((photo, i) => {
    const entry = document.createElement("div");
    entry.className = "photo-entry";
    entry.innerHTML = `<input type="url" class="input gallery-url-input" placeholder="https://res.cloudinary.com/…" value="${photo.url || ""}" data-idx="${i}"><button class="photo-entry__remove" data-idx="${i}" title="Verwijder">✕</button>`;
    entry.querySelector(".gallery-url-input").addEventListener("blur",  (e) => { const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); e.target.value = fixed; state.galleryPhotos[i].url = fixed; updatePreview(); });
    entry.querySelector(".gallery-url-input").addEventListener("input", (e) => { state.galleryPhotos[i].url = e.target.value; updatePreview(); });
    entry.querySelector(".photo-entry__remove").addEventListener("click", () => { state.galleryPhotos.splice(i, 1); renderGalleryEditor(); updatePreview(); });
    els.galleryList.appendChild(entry);
  });
}

if (els.btnAddGalleryPhoto) els.btnAddGalleryPhoto.addEventListener("click", () => { state.galleryPhotos.push({ url: "" }); renderGalleryEditor(); });

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

/**
 * Verzamelt alle {lat, lon, ele} punten uit het unified GPX-model.
 * @param {Object} gpx - seg.gpx
 * @returns {Array<{lat, lon, ele}>|null}
 */
function _collectElevationPoints(gpx, gpxStats) {

// Unified GPX-model:
// seg.gpx.tracks[].segments[].points[]
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

// Leest trackpunten uit het unified GPX-model.
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
function refreshRoutePreview(route) {
  window.renderHero(route);
  window.renderSegments(route);
  window.renderSource(route);
  window.renderMap(route);
  window.renderElevation(route);
  window.renderStory(route);
  window.renderTips(route);
  window.renderPhotoGrid(route);
  window.renderGallery(route);
}
function updatePreview() {
  const route = buildPreviewRoute();
    refreshRoutePreview(route);
}
 
// -----------------------------------------------------------
// INIT
// -----------------------------------------------------------
window.appReady.then(() => {
  renderSegments();
  renderBlockEditor();
  renderGalleryEditor();
  updatePreview();
});
