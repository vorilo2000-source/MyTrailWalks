// ======================= CREATOR EXPORT =======================
"use strict";
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
  out.content_blocks = window.CreatorContentBlocks?.getBlocks?.() || []; // Voegt de nieuwe Content Blocks toe aan de export toe.

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
     gpx: s.gpx || null,
    };
  });
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
    const firstStats = firstSegment.gpx?.stats || null; // Haalt GPX-statistieken uit het nieuwe model.
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

window._buildExportFromState = _buildExportFromState;
window._downloadJson = _downloadJson;
