"use strict";

// -----------------------------------------------------------
// Parse hoogtepunten uit nieuw GPX-model of oude gpx_raw fallback
// -----------------------------------------------------------
function _parseElevationPoints(source) {
  try {
    if (source?.gpx?.tracks?.length) {
      const points = source.gpx.tracks
        .flatMap((track) => track.segments || [])
        .flatMap((segment) => segment.points || [])
        .filter((pt) =>
          pt &&
          typeof pt.lat === "number" &&
          typeof pt.lon === "number" &&
          pt.ele !== null &&
          pt.ele !== undefined &&
          !Number.isNaN(Number(pt.ele))
        )
        .map((pt) => ({
          lat: pt.lat,
          lon: pt.lon,
          ele: Number(pt.ele),
        }));

      return points.length >= 2 ? points : null;
    }

    const gpxRaw = typeof source === "string" ? source : source?.gpx_raw;
    if (!gpxRaw) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxRaw, "application/xml");
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));

    const points = trkpts
      .map((pt) => {
        const eleEl = pt.querySelector("ele");

        return {
          lat: parseFloat(pt.getAttribute("lat")),
          lon: parseFloat(pt.getAttribute("lon")),
          ele: eleEl ? parseFloat(eleEl.textContent) : null,
        };
      })
      .filter((pt) =>
        !Number.isNaN(pt.lat) &&
        !Number.isNaN(pt.lon) &&
        pt.ele !== null &&
        !Number.isNaN(pt.ele)
      );

    return points.length >= 2 ? points : null;
  } catch (err) {
    console.warn("[route-elevation.js] Elevatiepunten parsen mislukt:", err);
    return null;
  }
}

// -----------------------------------------------------------
// Cumulatieve afstand in km
// -----------------------------------------------------------
function _cumulativeDistances(points) {
  const R = 6371;
  const dist = [0];

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

    const d = 2 * R * Math.asin(Math.sqrt(a));
    dist.push(dist[i - 1] + d);
  }

  return dist;
}

// -----------------------------------------------------------
// Render hoogteprofiel
// -----------------------------------------------------------
function renderElevation(route) {
  const container = document.getElementById("route-elevation");
  const section = document.getElementById("section-elevation");

  if (!container || !section) return;

  const segmentData = [];
  const segments = route.segments || [];

  for (const seg of segments) {
    const points = _parseElevationPoints(seg);
    if (!points) continue;

    segmentData.push({
      points,
      distances: _cumulativeDistances(points),
      color: window.TRANSPORT_COLORS?.[seg.transport] || "#2C4A3B",
      label: window.TRANSPORT_LABELS?.[seg.transport] || seg.transport || "Segment",
    });
  }

  if (segmentData.length === 0 && route.gpx_raw) {
    const points = _parseElevationPoints(route.gpx_raw);

    if (points) {
      segmentData.push({
        points,
        distances: _cumulativeDistances(points),
        color: "#2C4A3B",
        label: "Route",
      });
    }
  }

  if (segmentData.length === 0) return;

  section.hidden = false;

  const W = 800;
  const H = 220;
  const ML = 48;
  const MR = 12;
  const MT = 16;
  const MB = 32;
  const plotW = W - ML - MR;
  const plotH = H - MT - MB;

  let minEle = Infinity;
  let maxEle = -Infinity;
  let totalDist = 0;

  for (const seg of segmentData) {
    for (const pt of seg.points) {
      minEle = Math.min(minEle, pt.ele);
      maxEle = Math.max(maxEle, pt.ele);
    }

    totalDist += seg.distances[seg.distances.length - 1];
  }

  const range = maxEle - minEle || 1;
  const pad = range * 0.1;
  const eleMin = minEle - pad;
  const eleMax = maxEle + pad;

  const xScale = (dist) => ML + (dist / totalDist) * plotW;
  const yScale = (ele) => MT + plotH - ((ele - eleMin) / (eleMax - eleMin)) * plotH;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hoogteprofiel" style="width:100%;height:auto;display:block;">`;

  svg += `<rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}" fill="var(--color-surface-alt, #f8f9fa)" rx="4"/>`;

  for (let i = 0; i <= 4; i++) {
    const ele = eleMin + (i / 4) * (eleMax - eleMin);
    const y = yScale(ele);

    svg += `<line x1="${ML}" y1="${y}" x2="${W - MR}" y2="${y}" stroke="var(--color-border, #e5e7eb)" stroke-width="1"/>`;
    svg += `<text x="${ML - 4}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--color-text-muted, #6b7280)">${Math.round(ele)} m</text>`;
  }

  for (let i = 0; i <= 5; i++) {
    const dist = (i / 5) * totalDist;
    const x = xScale(dist);

    svg += `<text x="${x}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--color-text-muted, #6b7280)">${dist.toFixed(1)} km</text>`;
  }

  let cumDist = 0;
  const separators = [];

  for (let i = 0; i < segmentData.length; i++) {
    const seg = segmentData[i];
    const segTotal = seg.distances[seg.distances.length - 1];

    const pts = seg.points.map((pt, idx) => {
      return `${xScale(cumDist + seg.distances[idx])},${yScale(pt.ele)}`;
    }).join(" ");

    const firstX = xScale(cumDist);
    const lastX = xScale(cumDist + segTotal);
    const baseY = MT + plotH;

    svg += `<polygon points="${firstX},${baseY} ${pts} ${lastX},${baseY}" fill="${seg.color}" fill-opacity="0.12"/>`;
    svg += `<polyline points="${pts}" fill="none" stroke="${seg.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;

    cumDist += segTotal;

    if (i < segmentData.length - 1) {
      separators.push(xScale(cumDist));
    }
  }

  for (const x of separators) {
    svg += `<line x1="${x}" y1="${MT}" x2="${x}" y2="${MT + plotH}" stroke="var(--color-border, #e5e7eb)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  }

  svg += `</svg>`;
  container.innerHTML = svg;
}

window.renderElevation = renderElevation;
