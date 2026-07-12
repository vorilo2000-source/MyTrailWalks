// ======================= CREATOR DIFFICULTY =======================
"use strict";
// -----------------------------------------------------------
// MOEILIJKHEIDSBEREKENING
// Leest uit het unified segment model (seg.gpx.stats)
// -----------------------------------------------------------
function calculateSegmentDifficulty(seg) {
  // Statistieken zitten in seg.gpx.stats (na normalisatie)
  const stats = seg.gpx?.stats || null;
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
  const stats = seg.gpx?.stats || null;
  if (!stats || !stats.distance_km) return null;
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

window.calculateSegmentDifficulty = calculateSegmentDifficulty;
window._calculateRoadDifficulty = _calculateRoadDifficulty;
window._countSharpTurnsPerKm = _countSharpTurnsPerKm;
