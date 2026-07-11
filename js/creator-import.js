// ======================= CREATOR IMPORT =======================
"use strict";
// -----------------------------------------------------------
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

window.loadJsonIntoForm = loadJsonIntoForm;
