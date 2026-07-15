// ======================= ROUTE JSON NORMALIZATION =======================
// Normaliseert route-JSON naar één consistente datastructuur.

"use strict"; // Voorkomt onbedoelde globale variabelen en andere stille JavaScript-fouten.

// ======================= HULPFUNCTIES =======================

function _ensureObj(value) { // Zorgt dat alleen geldige objecten worden verwerkt.
  return value && typeof value === "object" ? value : {}; // Geeft een leeg object terug bij ongeldige invoer.
}

// ======================= ROUTE NORMALISEREN =======================

function normalizeRouteJson(input) { // Normaliseert een volledig route-object.
  try { // Vangt fouten tijdens de normalisatie gecontroleerd op.
    console.info("[route-normalize] Normalisatie gestart"); // Meldt het begin van de normalisatie.

    const src = _ensureObj(input); // Zet de invoer om naar een veilig bronobject.
    const out = {}; // Maakt het nieuwe genormaliseerde route-object.

    // ======================= BASISGEGEVENS =======================

    out.id = src.id || src.route_id || null; // Gebruikt het huidige ID of een oud route_id.
    out.status = src.status || "draft"; // Gebruikt standaard de status draft.

    out.title = typeof src.title === "object" // Controleert of de titel al een taalobject is.
      ? src.title // Behoudt het bestaande taalobject.
      : { nl: src.title || "" }; // Zet een teksttitel om naar een Nederlands taalobject.

    out.source_reference = src.source_reference || src.source || ""; // Ondersteunt de huidige en oude bronveldnaam.

    out.tags = Array.isArray(src.tags) // Controleert of tags al een array zijn.
      ? src.tags // Behoudt de bestaande tag-array.
      : typeof src.tags === "string" // Controleert of tags als tekst zijn opgeslagen.
        ? src.tags.split(/\s*,\s*/).filter(Boolean) // Splitst kommagescheiden tags en verwijdert lege waarden.
        : []; // Gebruikt een lege array wanneer tags ontbreken.

    // ======================= CONTENT BLOCKS =======================

    out.content_blocks = Array.isArray(src.content_blocks) // Controleert of Content Blocks aanwezig zijn.
      ? src.content_blocks.map((block) => ({ ...block })) // Maakt van ieder Content Block een veilige kopie.
      : []; // Gebruikt een lege array wanneer Content Blocks ontbreken.

    // ======================= SEGMENTEN =======================

    if (Array.isArray(src.segments) && src.segments.length > 0) { // Controleert of het nieuwe segmentformaat aanwezig is.
      console.info("[route-normalize] Nieuw formaat gedetecteerd (segments array)"); // Meldt dat het nieuwe formaat wordt gebruikt.

      out.segments = src.segments.map((segment) => { // Normaliseert ieder segment afzonderlijk.
        const seg = _ensureObj(segment); // Zet het segment om naar een veilig object.

        return { // Bouwt het genormaliseerde segment.
          transport: seg.transport || "walking", // Gebruikt standaard wandelen als vervoerstype.
          label: seg.label || "", // Gebruikt een leeg label wanneer dit ontbreekt.
          date: seg.date || seg.published_date || null, // Ondersteunt de huidige en oude datumveldnaam.
          location: seg.location || "", // Gebruikt een lege locatie wanneer deze ontbreekt.
          country: seg.country || "", // Gebruikt een leeg land wanneer dit ontbreekt.
          region: seg.region || "", // Gebruikt een lege regio wanneer deze ontbreekt.
          place: seg.place || "", // Gebruikt een lege plaats wanneer deze ontbreekt.
          weather: seg.weather || null, // Behoudt weerdata of gebruikt null.
          difficulty: seg.difficulty || "", // Gebruikt een lege moeilijkheidsgraad wanneer deze ontbreekt.
          difficulty_auto: seg.difficulty_auto !== false, // Schakelt automatische moeilijkheid standaard in.
          rough_surface: seg.rough_surface || false, // Gebruikt standaard geen ruw wegdek.
          gpx: seg.gpx || null, // Behoudt het gekoppelde GPX-object.
          gpx_stats: seg.gpx_stats || null, // Behoudt de berekende GPX-statistieken.
          gpx_raw: seg.gpx_raw || null, // Behoudt de ruwe GPX-data.
        }; // Sluit het genormaliseerde segment af.
      }); // Sluit de segmentnormalisatie af.
    } else if (src.gpx_stats) { // Controleert of een oud routeformaat met GPX-data aanwezig is.
      console.info("[route-normalize] Oud formaat gedetecteerd (root gpx_stats → segments)"); // Meldt de conversie van oud naar nieuw formaat.

      const transport = typeof src.transport === "string" // Controleert of transport één tekstwaarde is.
        ? src.transport // Gebruikt de bestaande tekstwaarde.
        : Array.isArray(src.transport) // Controleert of transport als array is opgeslagen.
          ? src.transport[0] || "walking" // Gebruikt het eerste array-item of wandelen.
          : "walking"; // Gebruikt wandelen wanneer transport ontbreekt.

      out.segments = [{ // Zet de oude routegegevens om naar één segment.
        transport: transport, // Gebruikt het vastgestelde vervoerstype.
        label: "", // Oude routes hebben standaard geen segmentlabel.
        date: src.published_date || src.date || null, // Ondersteunt beide oude datumvelden.
        location: src.location || "", // Neemt de oude locatie over.
        country: src.country || "", // Neemt het oude land over.
        region: src.region || "", // Neemt de oude regio over.
        place: src.place || "", // Neemt de oude plaats over.
        weather: src.weather || null, // Neemt oude weerdata over.
        difficulty: src.difficulty || "", // Neemt de oude moeilijkheidsgraad over.
        difficulty_auto: src.difficulty_auto !== false, // Schakelt automatische moeilijkheid standaard in.
        rough_surface: src.rough_surface || false, // Neemt de oude waarde voor ruw wegdek over.
        gpx: src.gpx || null, // Neemt het oude GPX-object over.
        gpx_stats: src.gpx_stats || null, // Neemt de oude GPX-statistieken over.
        gpx_raw: src.gpx_raw || null, // Neemt de oude ruwe GPX-data over.
      }]; // Sluit het automatisch aangemaakte segment af.
    } else { // Wordt uitgevoerd wanneer geen bruikbare segmentdata aanwezig is.
      const message = "[route-normalize] Ongeldig JSON: verwacht een `segments` array of `gpx_stats` op root-niveau."; // Maakt een duidelijke foutmelding.
      console.error(message); // Schrijft de fout naar de console.
      throw new Error(message); // Stopt de normalisatie met een fout.
    }

    // ======================= ID FALLBACK =======================

    if (!out.id && typeof src.title === "string") { // Maakt alleen een ID wanneer dit ontbreekt en de titel tekst is.
      out.id = src.title // Gebruikt de titel als basis.
        .toLowerCase() // Zet de titel om naar kleine letters.
        .trim() // Verwijdert spaties aan het begin en einde.
        .replace(/[^a-z0-9]+/g, "-") // Vervangt ongeschikte tekens door koppeltekens.
        .replace(/^-+|-+$/g, ""); // Verwijdert koppeltekens aan het begin en einde.
    }

    console.info("[route-normalize] Normalisatie voltooid"); // Meldt dat de normalisatie succesvol is afgerond.

    return out; // Geeft het genormaliseerde route-object terug.
  } catch (error) { // Vangt iedere fout tijdens het normaliseren op.
    console.error("[route-normalize] Fout tijdens normalisatie:", error); // Schrijft de fout met context naar de console.
    throw error; // Geeft de fout door aan de aanroepende code.
  }
}

// ======================= PUBLIEKE API =======================

if (typeof window !== "undefined") { // Controleert of de code in een browser wordt uitgevoerd.
  window.normalizeRouteJson = normalizeRouteJson; // Maakt de normalisatiefunctie globaal beschikbaar.
}

// ======================= END ROUTE JSON NORMALIZATION =======================
