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
  out.source_reference = els.inputSource.value || ""; // Behoudt de bronvermelding.
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
window._buildExportFromState = _buildExportFromState;
window._downloadJson = _downloadJson;
