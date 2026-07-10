// ======================= ROUTE JSON NORMALIZATION =======================
// normalizeRouteJson(routeData)
// - accepteert oude en nieuwe route JSON-structuren
// - vult ontbrekende velden met veilige standaardwaarden
// - retourneert één consistente standaardstructuur
// - logt beknopt welke aanpassingen werden gedaan
"use strict";

function _ensureObj(v) { return v && typeof v === 'object' ? v : {}; }

function normalizeRouteJson(input) {
  try {
    console.info('[route-normalize] Normalisatie gestart');
    const src = _ensureObj(input);

    const out = {};
    out.id = src.id || src.route_id || null;
    out.status = src.status || 'draft';

    // Title support: string or map
    out.title = (typeof src.title === 'object') ? src.title : { nl: src.title || '' };

    out.summary = (typeof src.summary === 'object') ? src.summary : { nl: src.summary || src.intro || '' };
    out.tips = (typeof src.tips === 'object') ? src.tips : { nl: src.tips || '' };
    out.source_reference = src.source_reference || src.source || '';
    out.tags = Array.isArray(src.tags) ? src.tags : (typeof src.tags === 'string' ? src.tags.split(/\s*,\s*/).filter(Boolean) : []);

    // Photos / gallery normalization
    out.photos = Array.isArray(src.photos) ? src.photos.map((p) => ({ url: p.url || p, role: p.role || null })) : [];
    out.gallery = Array.isArray(src.gallery) ? src.gallery.map((p) => ({ url: p.url || p })) : [];

    // Story blocks: support legacy `story` string and `story_blocks` array
    if (Array.isArray(src.story_blocks)) {
      out.story_blocks = src.story_blocks.map((b) => ({ ...b, value: b.value || '' }));
    } else if (src.story && typeof src.story === 'object') {
      // object keyed by lang
      const lang = Object.keys(src.story)[0] || 'nl';
      out.story_blocks = [{ type: 'text', value: src.story[lang] }];
    } else if (typeof src.story === 'string') {
      out.story_blocks = [{ type: 'text', value: src.story }];
    } else {
      out.story_blocks = [];
    }

    // Segments normalization — support both old (root-level gpx_stats) and new (segments array) formats
    if (Array.isArray(src.segments) && src.segments.length > 0) {
      // New format: segments array
      console.info('[route-normalize] Nieuw formaat gedetecteerd (segments array)');
      out.segments = src.segments.map((s) => {
        const seg = _ensureObj(s);
        const gpx = seg.gpx || null;
        return {
          transport: seg.transport || 'walking',
          label: seg.label || '',
          date: seg.date || seg.published_date || null,
          location: seg.location || '',
          country: seg.country || '',
          region: seg.region || '',
          place: seg.place || '',
          weather: seg.weather || null,
          difficulty: seg.difficulty || '',
          difficulty_auto: seg.difficulty_auto !== false,
          rough_surface: seg.rough_surface || false,
          gpx: gpx || {
  version: null,
  creator: null,
  metadata: {},
  waypoints: [],
  routes: [],
  tracks: [],
  stats: seg.gpx_stats || {}
},
        };
      });
    } else if (src.gpx_stats) {
      // Old format: root-level gpx_stats (single segment, backward-compat conversion)
      console.info('[route-normalize] Oud formaat gedetecteerd (root gpx_stats → segments)');
      const transport = (src.transport && typeof src.transport === 'string') ? src.transport : (Array.isArray(src.transport) ? src.transport[0] : 'walking');
      
      out.segments = [{
        transport: transport,
        label: '',
        date: src.published_date || src.date || null,
        location: src.location || '',
        country: src.country || '',
        region: src.region || '',
        place: src.place || '',
        weather: src.weather || null,
        difficulty: src.difficulty || '',
        difficulty_auto: src.difficulty !== false,
        rough_surface: src.rough_surface || false,
        gpx: src.gpx || null,
        gpx_stats: src.gpx_stats || null,
        gpx_raw: src.gpx_raw || null,
      }];
    } else {
      // No segments and no gpx_stats — error
      const msg = '[route-normalize] Ongeldig JSON: verwacht óf een `segments` array óf `gpx_stats` op root-niveau.';
      console.error(msg);
      throw new Error(msg);
    }

    // Minimal metadata defaults
    out.id = out.id || (src.title ? (typeof src.title === 'string' ? src.title.toLowerCase().replace(/\s+/g, '-') : null) : null);

    console.info('[route-normalize] Normalisatie voltooid (strict)');
    return out;
  } catch (err) {
    console.error('[route-normalize] Fout tijdens normalisatie:', err);
    throw err;
  }
}

// Expose in window for pages
if (typeof window !== 'undefined') window.normalizeRouteJson = normalizeRouteJson;

// ======================= END ROUTE JSON NORMALIZATION =======================
