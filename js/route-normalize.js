// ======================= ROUTE JSON NORMALIZATION =======================
// Ondersteunt uitsluitend het nieuwe routeformaat met segments[].gpx.
// Behoudt alle aanwezige GPX-data zonder velden te verwijderen of te wijzigen.
"use strict";

// ======================= OBJECTCONTROLE =======================
// Geeft alleen geldige objecten terug.
function _ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

// ======================= TAALVELD NORMALISEREN =======================
// Zet een string om naar { nl: "..." } en behoudt bestaande taalobjecten.
function _normalizeLanguageField(value, fallback = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {
    nl: typeof value === "string" ? value : fallback,
  };
}

// ======================= GPX CONTROLEREN =======================
// Behoudt een geldig GPX-object volledig.
// Segmenten zonder GPX blijven toegestaan.
function _normalizeGpx(gpx) {
  if (gpx === null || gpx === undefined) {
    return null;
  }

  if (typeof gpx !== "object" || Array.isArray(gpx)) {
    throw new Error(
      "[route-normalize] Segment bevat een ongeldig gpx-object."
    );
  }

  return gpx;
}

// ======================= SEGMENT NORMALISEREN =======================
// Normaliseert routevelden, maar laat het volledige GPX-object intact.
function _normalizeSegment(segment, index) {
  const source = _ensureObject(segment);

  return {
    transport: source.transport || "walking",
    label: source.label || "",
    date: source.date || source.published_date || null,
    location: source.location || "",
    country: source.country || "",
    region: source.region || "",
    place: source.place || "",
    weather: source.weather || null,
    difficulty: source.difficulty || "",
    difficulty_auto: source.difficulty_auto !== false,
    rough_surface: source.rough_surface === true,
    gpx: _normalizeGpx(source.gpx, index),
  };
}

// ======================= ROUTE NORMALISEREN =======================
// Retourneert één consistente routestructuur volgens het nieuwe model.
function normalizeRouteJson(input) {
  console.info("[route-normalize] Normalisatie gestart");

  const source = _ensureObject(input);

  if (!Array.isArray(source.segments) || source.segments.length === 0) {
    throw new Error(
      "[route-normalize] Ongeldig JSON: een niet-lege segments-array is verplicht."
    );
  }

  const segments = source.segments.map(_normalizeSegment);
  const firstSegment = segments[0];

  const output = {
    id: source.id || source.route_id || null,
    status: source.status || "draft",

    title: _normalizeLanguageField(source.title),
    summary: _normalizeLanguageField(
      source.summary,
      source.intro || ""
    ),
    tips: _normalizeLanguageField(source.tips),

    source_reference:
      source.source_reference ||
      source.source ||
      "",

    tags: Array.isArray(source.tags)
      ? source.tags
      : typeof source.tags === "string"
        ? source.tags
            .split(/\s*,\s*/)
            .filter(Boolean)
        : [],

    photos: Array.isArray(source.photos)
      ? source.photos.map((photo) => {
          if (typeof photo === "string") {
            return {
              url: photo,
              role: null,
            };
          }

          return {
            ...photo,
            url: photo?.url || "",
            role: photo?.role || null,
          };
        })
      : [],

    gallery: Array.isArray(source.gallery)
      ? source.gallery.map((photo) => {
          if (typeof photo === "string") {
            return {
              url: photo,
            };
          }

          return {
            ...photo,
            url: photo?.url || "",
          };
        })
      : [],

    story_blocks: Array.isArray(source.story_blocks)
      ? source.story_blocks.map((block) => ({
          ...block,
          value: block?.value || "",
        }))
      : [],

    segments,

    // ======================= ROUTE SAMENVATTING =======================
    // Afgeleid van het eerste segment voor hero en overzichtsweergave.
    location: source.location || firstSegment.location || "",
    country: source.country || firstSegment.country || "",
    region: source.region || firstSegment.region || "",
    place: source.place || firstSegment.place || "",
    difficulty: source.difficulty || firstSegment.difficulty || "",
    published_date:
      source.published_date ||
      firstSegment.date ||
      null,
  };

  if (!output.id) {
    const title =
      typeof output.title?.nl === "string"
        ? output.title.nl.trim()
        : "";

    output.id = title
      ? title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : null;
  }

  console.info("[route-normalize] Nieuw GPX-model gevalideerd");

  return output;
}

// ======================= GLOBAL EXPORT =======================
// Maakt de normalizer beschikbaar voor route-loader.js en creator.js.
window.normalizeRouteJson = normalizeRouteJson;
