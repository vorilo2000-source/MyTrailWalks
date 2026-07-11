// ======================= CREATOR GPX =======================
// GPX inlezen, verwerken en statistieken berekenen.
"use strict";

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
window.handleGpxFile = handleGpxFile;
window.displayGpxStats = displayGpxStats;
