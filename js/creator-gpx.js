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

window.handleGpxFile = handleGpxFile;
window.displayGpxStats = displayGpxStats;
