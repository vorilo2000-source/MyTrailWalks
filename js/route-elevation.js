// =======================================================
// renderElevation — T2-004
// Toevoegen aan route.js na renderMap()
// Tekent een SVG hoogteprofiel per segment in segmentkleur.
// X-as = cumulatieve afstand (km), Y-as = hoogte (m).
// Meerdere segmenten worden naast elkaar getoond, gescheiden
// door een verticale streepjeslijn. Tooltip bij hover.
// Vereist: gpx_raw per segment (of route.gpx_raw als fallback).
// =======================================================

// -----------------------------------------------------------
// Herpars GPX naar array van {lat, lon, ele} objecten.
// Filtert punten zonder geldige elevatie.
// Samplet NIET — we willen alle hoogtepunten voor nauwkeurigheid.
// -----------------------------------------------------------

// -----------------------------------------------------------
// Haalt hoogtepunten uit nieuw GPX-model of oude gpx_raw fallback.
// Nieuw: seg.gpx.tracks[].segments[].points[]
// Oud:   seg.gpx_raw XML
// -----------------------------------------------------------
function _parseElevationPoints(source) {
  try {
    // Nieuw model: segment-object met seg.gpx.tracks[].segments[].points[]
    if (source?.gpx?.tracks?.length) {
      const points = source.gpx.tracks
        .flatMap((track) => track.segments || [])
        .flatMap((trackSegment) => trackSegment.points || [])
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

    // Oude fallback: gpx_raw string
    const gpxRaw = typeof source === "string" ? source : source?.gpx_raw;

    if (!gpxRaw) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxRaw, "application/xml");
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));
    const points = [];

    for (const pt of trkpts) {
      const lat = parseFloat(pt.getAttribute("lat"));
      const lon = parseFloat(pt.getAttribute("lon"));
      const eleEl = pt.querySelector("ele");
      const ele = eleEl ? parseFloat(eleEl.textContent) : null;

      if (!isNaN(lat) && !isNaN(lon) && ele !== null && !isNaN(ele)) {
        points.push({ lat, lon, ele });
      }
    }

    return points.length >= 2 ? points : null;
  } catch (err) {
    console.warn("[route-elevation.js] Elevatiepunten parsen mislukt:", err);
    return null;
  }
}

// -----------------------------------------------------------
// Bereken cumulatieve afstand in km tussen opeenvolgende punten.
// Gebruikt de Haversine formule.
// Geeft array terug van afstanden op elke index (start = 0).
// -----------------------------------------------------------
function _cumulativeDistances(points) {
  const R = 6371; // aardstraal in km
  const dist = [0];
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lon - p1.lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(p1.lat * Math.PI / 180) *
      Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const d = 2 * R * Math.asin(Math.sqrt(a));
    dist.push(dist[i - 1] + d);
  }
  return dist;
}

// -----------------------------------------------------------
// RENDER HOOGTEPROFIEL
// Vult #route-elevation met een SVG hoogteprofiel.
// Toont elk segment in zijn vervoerskleur naast elkaar.
// -----------------------------------------------------------
function renderElevation(route) {
  const container = $("route-elevation");
  if (!container) return;

  // Bouw segmentdata op — elk segment heeft punten + afstanden + kleur
  const segments = route.segments || [];
  const segmentData = [];

  if (segments.length > 0) {
  // Multi-segment route — per segment eigen GPX
  for (const seg of segments) {
    const points = _parseElevationPoints(seg);

    if (!points) continue;

    segmentData.push({
      points,
      distances: _cumulativeDistances(points),
      color: TRANSPORT_COLORS[seg.transport] || "#2C4A3B",
      label: TRANSPORT_LABELS[seg.transport] || seg.transport || "Segment",
    });
  }
}

  // Legacy fallback — enkelvoudige route zonder segments array
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

  // Geen elevatiadata beschikbaar
  if (segmentData.length === 0) return;

  // Sectie zichtbaar maken
  $("section-elevation").hidden = false;

  // -----------------------------------------------------------
  // SVG dimensies en marges
  // -----------------------------------------------------------
  const W = 800;         // viewBox breedte
  const H = 220;         // viewBox hoogte
  const ML = 48;         // linkermarge (Y-as labels)
  const MR = 12;         // rechtermarge
  const MT = 16;         // bovenmarge
  const MB = 32;         // ondermarge (X-as labels)
  const plotW = W - ML - MR;
  const plotH = H - MT - MB;

  // Globale min/max hoogte over alle segmenten samen
  let globalMinEle = Infinity;
  let globalMaxEle = -Infinity;
  let totalDist = 0;

  for (const seg of segmentData) {
    for (const pt of seg.points) {
      if (pt.ele < globalMinEle) globalMinEle = pt.ele;
      if (pt.ele > globalMaxEle) globalMaxEle = pt.ele;
    }
    totalDist += seg.distances[seg.distances.length - 1];
  }

  // Kleine padding zodat de lijn niet tegen de rand kleeft
  const eleRange = globalMaxEle - globalMinEle || 1;
  const elePad = eleRange * 0.1;
  const eleMin = globalMinEle - elePad;
  const eleMax = globalMaxEle + elePad;

  // Schaalfuncties
  const xScale = (dist) => ML + (dist / totalDist) * plotW;
  const yScale = (ele) => MT + plotH - ((ele - eleMin) / (eleMax - eleMin)) * plotH;

  // -----------------------------------------------------------
  // SVG opbouwen als string
  // -----------------------------------------------------------
  let svg = `<svg
    viewBox="0 0 ${W} ${H}"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Hoogteprofiel"
    style="width:100%;height:auto;display:block;overflow:visible;">`;

  // Achtergrond
  svg += `<rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}"
    fill="var(--color-surface-alt, #f8f9fa)" rx="4"/>`;

  // Horizontale gridlijnen (4 stappen)
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const ele = eleMin + (i / gridSteps) * (eleMax - eleMin);
    const y = yScale(ele);
    const label = Math.round(ele) + " m";
    svg += `<line x1="${ML}" y1="${y}" x2="${W - MR}" y2="${y}"
      stroke="var(--color-border, #e5e7eb)" stroke-width="1"/>`;
    svg += `<text x="${ML - 4}" y="${y + 4}" text-anchor="end"
      font-size="10" fill="var(--color-text-muted, #6b7280)">${label}</text>`;
  }

  // X-as labels (afstand in km, 5 stappen)
  const xSteps = 5;
  for (let i = 0; i <= xSteps; i++) {
    const dist = (i / xSteps) * totalDist;
    const x = xScale(dist);
    const label = dist.toFixed(1) + " km";
    svg += `<text x="${x}" y="${H - 6}" text-anchor="middle"
      font-size="10" fill="var(--color-text-muted, #6b7280)">${label}</text>`;
  }

  // Segmenten tekenen + scheidingslijnen bijhouden
  let cumDist = 0;
  const separators = []; // x-posities voor scheidingslijnen

  for (let si = 0; si < segmentData.length; si++) {
    const seg = segmentData[si];
    const segTotalDist = seg.distances[seg.distances.length - 1];

    // Polyline punten voor dit segment
    const pts = seg.points.map((pt, idx) => {
      const x = xScale(cumDist + seg.distances[idx]);
      const y = yScale(pt.ele);
      return `${x},${y}`;
    }).join(" ");

    // Gevuld gebied onder de lijn (polygon met bodembalk)
    const firstX = xScale(cumDist + seg.distances[0]);
    const lastX = xScale(cumDist + segTotalDist);
    const baseY = MT + plotH;
    const polyPts = `${firstX},${baseY} ${pts} ${lastX},${baseY}`;

    svg += `<polygon points="${polyPts}"
      fill="${seg.color}" fill-opacity="0.12" stroke="none"/>`;

    // Profiel lijn
    svg += `<polyline points="${pts}"
      fill="none" stroke="${seg.color}" stroke-width="2"
      stroke-linejoin="round" stroke-linecap="round"/>`;

    cumDist += segTotalDist;

    // Scheidingslijn na elk segment behalve het laatste
    if (si < segmentData.length - 1) {
      separators.push(xScale(cumDist));
    }
  }

  // Verticale scheidingslijnen tussen segmenten
  for (const x of separators) {
    svg += `<line x1="${x}" y1="${MT}" x2="${x}" y2="${MT + plotH}"
      stroke="var(--color-border, #e5e7eb)" stroke-width="1.5"
      stroke-dasharray="4 3"/>`;
  }

  // Interactieve hover overlay — transparante rechthoek vangt muisevents op
  svg += `<rect id="elev-overlay" x="${ML}" y="${MT}" width="${plotW}" height="${plotH}"
    fill="transparent" style="cursor:crosshair;"
    data-total="${totalDist.toFixed(4)}"/>`;

  // Tooltip elementen (beginnen verborgen)
  svg += `<line id="elev-cursor" x1="0" y1="${MT}" x2="0" y2="${MT + plotH}"
    stroke="var(--color-text, #111)" stroke-width="1" stroke-dasharray="3 2"
    opacity="0"/>`;
  svg += `<circle id="elev-dot" cx="0" cy="0" r="4"
    fill="var(--color-text, #111)" opacity="0"/>`;
  svg += `<rect id="elev-tip-bg" x="0" y="0" width="90" height="36" rx="4"
    fill="var(--color-surface, #fff)"
    stroke="var(--color-border, #e5e7eb)" stroke-width="1" opacity="0"/>`;
  svg += `<text id="elev-tip-line1" x="0" y="0"
    font-size="11" fill="var(--color-text, #111)" opacity="0"></text>`;
  svg += `<text id="elev-tip-line2" x="0" y="0"
    font-size="11" fill="var(--color-text-muted, #6b7280)" opacity="0"></text>`;

  svg += `</svg>`;

  container.innerHTML = svg;

  // -----------------------------------------------------------
  // Interactie: hover tooltip
  // -----------------------------------------------------------
  const overlay   = container.querySelector("#elev-overlay");
  const cursor    = container.querySelector("#elev-cursor");
  const dot       = container.querySelector("#elev-dot");
  const tipBg     = container.querySelector("#elev-tip-bg");
  const tipLine1  = container.querySelector("#elev-tip-line1");
  const tipLine2  = container.querySelector("#elev-tip-line2");

  // Bouw een platte lookup array: [{cumDist, ele, color}] gesorteerd op dist
  const lookup = [];
  let cumD = 0;
  for (const seg of segmentData) {
    for (let i = 0; i < seg.points.length; i++) {
      lookup.push({ d: cumD + seg.distances[i], ele: seg.points[i].ele, color: seg.color });
    }
    cumD += seg.distances[seg.distances.length - 1];
  }

  function onHover(evt) {
    // SVG coördinaten omzetten vanuit clientX
    const svgEl = container.querySelector("svg");
    const rect = svgEl.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const svgX = (clientX - rect.left) / rect.width * W;

    // Buiten plotgebied negeren
    if (svgX < ML || svgX > W - MR) { hideTooltip(); return; }

    // Corresponderende afstand
    const hoverDist = ((svgX - ML) / plotW) * totalDist;

    // Dichtstbijzijnde punt in lookup
    let best = lookup[0];
    let bestDiff = Math.abs(lookup[0].d - hoverDist);
    for (const pt of lookup) {
      const diff = Math.abs(pt.d - hoverDist);
      if (diff < bestDiff) { best = pt; bestDiff = diff; }
    }

    const cx = xScale(best.d);
    const cy = yScale(best.ele);

    // Cursor lijn
    cursor.setAttribute("x1", cx); cursor.setAttribute("x2", cx);
    cursor.setAttribute("opacity", "0.6");

    // Dot
    dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
    dot.setAttribute("fill", best.color);
    dot.setAttribute("opacity", "1");

    // Tooltip tekst
    const eleLabel = Math.round(best.ele) + " m";
    const distLabel = best.d.toFixed(2) + " km";
    tipLine1.textContent = `↑ ${eleLabel}`;
    tipLine2.textContent = `⇌ ${distLabel}`;

    // Tooltip positie — rechts van cursor, tenzij te dicht bij rand
    const tipW = 90;
    const tipH = 38;
    const tipPad = 6;
    let tipX = cx + tipPad;
    if (tipX + tipW > W - MR) tipX = cx - tipW - tipPad;
    const tipY = MT + 8;

    tipBg.setAttribute("x", tipX); tipBg.setAttribute("y", tipY);
    tipBg.setAttribute("width", tipW); tipBg.setAttribute("height", tipH);
    tipBg.setAttribute("opacity", "0.95");

    tipLine1.setAttribute("x", tipX + 6); tipLine1.setAttribute("y", tipY + 14);
    tipLine1.setAttribute("opacity", "1");
    tipLine2.setAttribute("x", tipX + 6); tipLine2.setAttribute("y", tipY + 28);
    tipLine2.setAttribute("opacity", "1");
  }

  function hideTooltip() {
    cursor.setAttribute("opacity", "0");
    dot.setAttribute("opacity", "0");
    tipBg.setAttribute("opacity", "0");
    tipLine1.setAttribute("opacity", "0");
    tipLine2.setAttribute("opacity", "0");
  }

  // Desktop
  overlay.addEventListener("mousemove", onHover);
  overlay.addEventListener("mouseleave", hideTooltip);

  // Mobile touch
  overlay.addEventListener("touchmove", (e) => { e.preventDefault(); onHover(e); }, { passive: false });
  overlay.addEventListener("touchend", hideTooltip);
}
window.renderElevation = renderElevation;
