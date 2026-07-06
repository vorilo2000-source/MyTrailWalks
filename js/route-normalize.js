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

    // Segments normalization — strict: require `segments` array
    if (!Array.isArray(src.segments) || src.segments.length === 0) {
      const msg = '[route-normalize] Ongeldig/ontbrekend veld: verwacht een `segments` array in de route JSON.';
      console.error(msg);
      throw new Error(msg);
    }

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
        gpx: gpx,
        gpx_stats: seg.gpx_stats || null,
        gpx_raw: seg.gpx_raw || null,
      };
    });

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
