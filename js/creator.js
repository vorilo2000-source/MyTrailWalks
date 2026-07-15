// =======================================================
// creator.js — MyTrailWalks
// Route creator: GPX parse, weer, locatie, AI, JSON export
// lat, lon, ele, time, name, cmt, desc, src, links, sym, type, fix, sat, hdop, vdop, pdop, ageofdgpsdata, dgpsid, extensions
// v3.0.8: applicable code moved to creato-segments.js 
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
// v2.4.0: hike/trl vervoersmiddel + moeilijkheidsschaal per vervoersmiddel
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
  trn:      "#F39C12",  // geel-oranje
  bus:        "#8E44AD",  // violet
  boat:       "#1ABC9C",  // turquoise
  plane:      "#2C3E50",  // donkerblauw
};

const TRANSPORT_LABELS = {
  walking:    "🚶 Wandelen",
  hike:       "🥾 Hike / Trl",
  cycling:    "🚴 Fietsen",
  motorcycle: "🏍 Motor",
  car:        "🚗 Auto",
  trn:      "🚆 Trein",
  bus:        "🚌 Bus",
  boat:       "⛵ Boot",
  plane:      "✈️ Vliegtuig",
};



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
  window.CreatorContentBlocks?.setBlocks?.(data.content_blocks || []); // Laadt de Content Blocks uit de route-JSON.
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

renderCreatorSegments();
renderBlockEditor();
updatePreview();
  
  // Transport-array heropbouwen vanuit segmenten
  // (zorgt ervoor dat als oud JSON alleen "walking" had, maar nu ook "car" heeft, dit correct wordt gesyndied)
  if (state.segments?.length) {
    const uniqueTransports = [...new Set(state.segments.map(s => s.transport))];
    console.info('[creator] Transport array gesync:', uniqueTransports);
  }
}

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
// CREATOR PREVIEW — ROUTE VERSTUREN
// -----------------------------------------------------------
function sendRouteToPreview(route) {
  const iframe = document.getElementById("creator-route-preview");

  if (!iframe?.contentWindow || !route) {
    return;
  }

  iframe.contentWindow.postMessage(
    {
      type: "mytrailwalks-preview-route",
      route: route,
    },
    window.location.origin
  );
}

// -----------------------------------------------------------
// CENTRALE PREVIEW UPDATE — iframe
// -----------------------------------------------------------
function updatePreview() {
  const route = buildPreviewRoute();

  sendRouteToPreview(route);
}
 
// -----------------------------------------------------------
// INIT
// -----------------------------------------------------------
window.appReady.then(() => {
  renderCreatorSegments();
  renderBlockEditor();
  renderGalleryEditor();

  const previewIframe = document.getElementById("creator-route-preview");

  if (previewIframe) {
    previewIframe.addEventListener("load", () => {
      updatePreview();
    });
  }

  updatePreview();
});
