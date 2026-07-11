// ======================= CREATOR PREVIEW =======================
"use strict";
// -----------------------------------------------------------
// PREVIEW ROUTE BOUWEN
// Zet de huidige creator-state om naar hetzelfde route-object als route.html gebruikt.
// -----------------------------------------------------------
function buildPreviewRoute() {
  const heroUrl = els.inputHeroPhoto?.value?.trim() || "";

  return {
    id: els.inputRouteId?.value?.trim() || "preview",
    status: els.inputStatus?.value || "draft",

    title: {
      nl: els.inputTitle?.value || "Wandeling zonder titel",
    },

    summary: {
      nl: els.inputIntro?.value || "",
    },

    tips: {
      nl: els.inputTips?.value || "",
    },

    source_reference: els.inputSource?.value || "",

    tags: els.inputKeywords?.value
      ? els.inputKeywords.value.split(/\s*,\s*/).filter(Boolean)
      : [],

    photos: heroUrl
      ? [{ role: "hero", url: heroUrl }]
      : [],

    gallery: state.galleryPhotos
      .filter((p) => p.url)
      .map((p) => ({ url: p.url })),

    story_blocks: state.storyBlocks.map((block) => ({ ...block })),

    segments: state.segments.map((seg) => ({
      transport: seg.transport || "walking",
      label: seg.label || "",
      date: seg.date || null,
      location: seg.location || "",
      country: seg.country || "",
      region: seg.region || "",
      place: seg.place || "",
      weather: seg.weather || null,
      difficulty: seg.difficulty || "",
      difficulty_auto: seg.difficultyAuto !== false,
      rough_surface: seg.roughSurface || false,
     gpx: seg.gpx || null,
    })),
  };
}

window.buildPreviewRoute = buildPreviewRoute;
