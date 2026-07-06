// =======================================================
// creator.js — MyTrailWalks
// Route creator: GPX parse, weer, locatie, AI, JSON export
// v3.0.0: GPX data model redesign — export gebruikt nu één gpx-object
//         met metadata, waypoints, routes, tracks, trackpunten, extensions
//         en stats; legacy gpx_raw/gpx_stats blijven alleen importfallback
// v2.4.3: hoogteprofiel preview toegevoegd (renderElevationPreview)
//         in de visuele preview rechterkolom — toont SVG profiel
//         per segment in segmentkleur zodra gpxRaw beschikbaar is
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
  const gpx = seg.gpx;
  if (!gpx || !gpx.distance_km) return null;

  if (seg.transport === "walking") {
    const climbPerKm = (gpx.elevation_up_m || 0) / gpx.distance_km;
    if (climbPerKm < 5) return "W1";
    if (climbPerKm < 15) return "W2";
    return "W3";
  }

  if (seg.transport === "hike") {
