// ======================= CREATOR STATE =======================
"use strict";
// -----------------------------------------------------------
// STATE
// Elk segment heeft enkel nog seg.gpx (unified model).
// gpxRaw en gpx.stats worden niet meer bewaard in state.
// -----------------------------------------------------------
const state = {
  aiMode: false,
  apiKey: null,
  apiKeyConfirmed: false,
  segments: [
    {
      id: 1,
      transport: "walking",
      label: "",
      gpx: null,       // unified GPX model: { version, creator, metadata, waypoints, routes, tracks, stats }
      date: "",
      location: "",
      country: "",
      region: "",
      place: "",
      weather: null,
      difficulty: "",
      difficultyAuto: true,
      roughSurface: false,
    },
  ],
  // Convenience getters voor backward compat in updatePreview / buildRouteJson
  get gpx()     { return this.segments[0]?.gpx || null; },
  get weather() { return this.segments[0]?.weather || null; },
  storyBlocks: [],
  galleryPhotos: [],
};

let segmentCounter = 1;

window.state = state;
window.segmentCounter = segmentCounter;
