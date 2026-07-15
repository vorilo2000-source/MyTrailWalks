// ======================= ROUTE CONTENT BLOCKS — CONFIGURATIE =======================

const ROUTE_CONTENT_BLOCKS_VERSION = "1.0.1"; // Versienummer van de Content Blocks-renderer.

const ROUTE_CONTENT_BLOCK_LAYOUTS = { // Bevat alle ondersteunde contentblok-layouts.
  TEXT_ONLY: "text-only", // Toont alleen titel en tekst.
  PHOTO_LEFT: "photo-left", // Toont foto's links en tekst rechts.
  PHOTO_RIGHT: "photo-right", // Toont tekst links en foto's rechts.
  PHOTO_TOP: "photo-top", // Toont foto's boven de tekst.
  PHOTO_BOTTOM: "photo-bottom", // Toont foto's onder de tekst.
  PHOTOS_ONLY: "photos-only" // Toont alleen foto's.
}; // Sluit ROUTE_CONTENT_BLOCK_LAYOUTS af.

const ROUTE_CONTENT_BLOCK_PHOTO_COLUMNS = { // Bevat alle ondersteunde fotoverdelingen.
  AUTO: "auto", // Bepaalt het aantal kolommen automatisch.
  ONE: "1", // Toont één foto per rij.
  TWO: "2", // Toont twee foto's per rij.
  THREE: "3", // Toont drie foto's per rij.
  FOUR: "4" // Toont vier foto's per rij.
}; // Sluit ROUTE_CONTENT_BLOCK_PHOTO_COLUMNS af.


// ======================= ROUTE CONTENT BLOCKS — HELPERS =======================

function escapeRouteContentBlockHtml(value) { // Beveiligt tekst voordat deze in HTML wordt geplaatst.
  return String(value ?? "") // Zet iedere waarde veilig om naar tekst.
    .replaceAll("&", "&amp;") // Beveiligt ampersands.
    .replaceAll("<", "&lt;") // Beveiligt kleiner-dan-tekens.
    .replaceAll(">", "&gt;") // Beveiligt groter-dan-tekens.
    .replaceAll('"', "&quot;") // Beveiligt dubbele aanhalingstekens.
    .replaceAll("'", "&#039;"); // Beveiligt enkele aanhalingstekens.
} // Sluit escapeRouteContentBlockHtml af.

function getRouteContentBlockText(value, language = "nl") { // Leest tekst uit een meertalig tekstveld.
  if (typeof value === "string") return value; // Geeft gewone tekst direct terug.
  if (!value || typeof value !== "object") return ""; // Geeft lege tekst terug bij ongeldige invoer.
  if (typeof value[language] === "string") return value[language]; // Gebruikt de gevraagde taal wanneer beschikbaar.
  if (typeof value.nl === "string") return value.nl; // Gebruikt Nederlands als standaardtaal.
  const firstText = Object.values(value).find(function (item) { // Zoekt de eerste beschikbare tekstwaarde.
    return typeof item === "string"; // Accepteert alleen tekstwaarden.
  }); // Sluit find af.
  return firstText || ""; // Geeft de gevonden tekst of een lege tekst terug.
} // Sluit getRouteContentBlockText af.

function normalizeRouteContentBlockPhoto(photo) { // Normaliseert één foto voor de routeweergave.
  const sourcePhoto = photo && typeof photo === "object" ? photo : {}; // Gebruikt alleen een geldig foto-object.

  return { // Geeft een veilige foto-entry terug.
    id: typeof sourcePhoto.id === "string" ? sourcePhoto.id : "", // Behoudt een geldig foto-ID.
    url: typeof sourcePhoto.url === "string" ? sourcePhoto.url.trim() : "", // Behoudt en trimt een geldige foto-URL.
    alt: typeof sourcePhoto.alt === "string" ? sourcePhoto.alt.trim() : "", // Behoudt en trimt de alternatieve tekst.
    caption: typeof sourcePhoto.caption === "string" ? sourcePhoto.caption.trim() : "" // Behoudt en trimt het onderschrift.
  }; // Sluit het genormaliseerde foto-object af.
} // Sluit normalizeRouteContentBlockPhoto af.

function normalizeRouteContentBlock(block) { // Normaliseert één contentblok voor de routeweergave.
  const sourceBlock = block && typeof block === "object" ? block : {}; // Gebruikt alleen een geldig blokobject.
  const validLayouts = Object.values(ROUTE_CONTENT_BLOCK_LAYOUTS); // Maakt een lijst van geldige layouts.
  const validPhotoColumns = Object.values(ROUTE_CONTENT_BLOCK_PHOTO_COLUMNS); // Maakt een lijst van geldige fotoverdelingen.

  return { // Geeft een veilig contentblok terug.
    id: typeof sourceBlock.id === "string" ? sourceBlock.id : "", // Behoudt een geldig blok-ID.
    layout: validLayouts.includes(sourceBlock.layout) // Controleert of de layout geldig is.
      ? sourceBlock.layout // Behoudt een geldige layout.
      : ROUTE_CONTENT_BLOCK_LAYOUTS.TEXT_ONLY, // Gebruikt anders Alleen tekst.
    title: getRouteContentBlockText(sourceBlock.title), // Normaliseert de titel.
    text: getRouteContentBlockText(sourceBlock.text), // Normaliseert de tekst.
    photoColumns: validPhotoColumns.includes(sourceBlock.photoColumns) // Controleert of de fotoverdeling geldig is.
      ? sourceBlock.photoColumns // Behoudt een geldige fotoverdeling.
      : ROUTE_CONTENT_BLOCK_PHOTO_COLUMNS.AUTO, // Gebruikt anders automatische verdeling.
    photos: Array.isArray(sourceBlock.photos) // Controleert of photos een lijst is.
      ? sourceBlock.photos // Gebruikt de bestaande fotolijst.
          .map(normalizeRouteContentBlockPhoto) // Normaliseert iedere foto.
          .filter(function (photo) { // Verwijdert lege foto-items.
            return photo.url !== ""; // Behoudt alleen foto's met een URL.
          }) // Sluit filter af.
      : [] // Gebruikt anders een lege fotolijst.
  }; // Sluit het genormaliseerde contentblok af.
} // Sluit normalizeRouteContentBlock af.

function normalizeRouteContentBlocks(blocks) { // Normaliseert een volledige lijst contentblokken.
  if (!Array.isArray(blocks)) return []; // Geeft een lege lijst terug bij ongeldige invoer.

  return blocks.map(normalizeRouteContentBlock); // Normaliseert ieder contentblok.
} // Sluit normalizeRouteContentBlocks af.

function getRouteContentBlockColumnCount(block) { // Bepaalt hoeveel fotokolommen gebruikt moeten worden.
  if (block.photoColumns !== ROUTE_CONTENT_BLOCK_PHOTO_COLUMNS.AUTO) { // Controleert of een vast aantal kolommen gekozen is.
    return Number(block.photoColumns); // Geeft het gekozen aantal kolommen terug.
  } // Sluit vaste kolomcontrole af.

  const photoCount = block.photos.length; // Leest het aantal foto's in het blok.

  if (photoCount <= 1) return 1; // Gebruikt één kolom voor nul of één foto.
  if (photoCount === 2) return 2; // Gebruikt twee kolommen voor twee foto's.
  if (photoCount <= 6) return 3; // Gebruikt drie kolommen voor drie tot zes foto's.
  return 4; // Gebruikt vier kolommen voor zeven of meer foto's.
} // Sluit getRouteContentBlockColumnCount af.

function routeContentBlockHasText(block) { // Controleert of een contentblok zichtbare tekst bevat.
  return block.title.trim() !== "" || block.text.trim() !== ""; // Geeft true terug wanneer titel of tekst is ingevuld.
} // Sluit routeContentBlockHasText af.

function routeContentBlockHasPhotos(block) { // Controleert of een contentblok zichtbare foto's bevat.
  return block.photos.length > 0; // Geeft true terug wanneer minimaal één geldige foto bestaat.
} // Sluit routeContentBlockHasPhotos af.


// ======================= ROUTE CONTENT BLOCKS — TEKST RENDERING =======================

function renderRouteContentBlockText(block) { // Bouwt het tekstgedeelte van één contentblok.
  const titleHtml = block.title.trim() !== "" // Controleert of een titel aanwezig is.
    ? `<h2 class="route-content-block__title">${escapeRouteContentBlockHtml(block.title)}</h2>` // Bouwt de titel.
    : ""; // Gebruikt geen titel-HTML wanneer de titel leeg is.

  const textHtml = block.text.trim() !== "" // Controleert of tekst aanwezig is.
    ? `<div class="route-content-block__text">${escapeRouteContentBlockHtml(block.text).replaceAll("\n", "<br>")}</div>` // Bouwt tekst met zichtbare regeleinden.
    : ""; // Gebruikt geen tekst-HTML wanneer de tekst leeg is.

  if (titleHtml === "" && textHtml === "") return ""; // Geeft niets terug wanneer titel en tekst ontbreken.

  return ` 
    <div class="route-content-block__content">
      ${titleHtml}
      ${textHtml}
    </div>
  `; // Geeft het volledige tekstgedeelte terug.
} // Sluit renderRouteContentBlockText af.


// ======================= ROUTE CONTENT BLOCKS — FOTO RENDERING =======================

function renderRouteContentBlockPhoto(photo, photoIndex) { // Bouwt één foto-element.
  const altText = photo.alt || `Routefoto ${photoIndex + 1}`; // Gebruikt alt-tekst of een veilige standaardtekst.
  const captionHtml = photo.caption !== "" // Controleert of een onderschrift aanwezig is.
    ? `<figcaption class="route-content-block__caption">${escapeRouteContentBlockHtml(photo.caption)}</figcaption>` // Bouwt het onderschrift.
    : ""; // Gebruikt geen onderschrift wanneer het leeg is.

  return ` 
    <figure class="route-content-block__figure">
      <img
        class="route-content-block__image"
        src="${escapeRouteContentBlockHtml(photo.url)}"
        alt="${escapeRouteContentBlockHtml(altText)}"
        loading="lazy"
        decoding="async">
      ${captionHtml}
    </figure>
  `; // Geeft het volledige foto-element terug.
} // Sluit renderRouteContentBlockPhoto af.

function renderRouteContentBlockPhotos(block) { // Bouwt het fotogedeelte van één contentblok.
  if (!routeContentBlockHasPhotos(block)) return ""; // Geeft niets terug wanneer geen foto's aanwezig zijn.

  const columnCount = getRouteContentBlockColumnCount(block); // Bepaalt het aantal fotokolommen.

  const photosHtml = block.photos.map(function (photo, photoIndex) { // Doorloopt alle foto's.
    return renderRouteContentBlockPhoto(photo, photoIndex); // Bouwt één foto-element.
  }).join(""); // Voegt alle foto-elementen samen.

  return ` 
    <div
      class="route-content-block__photos"
      style="--route-content-photo-columns: ${columnCount};">
      ${photosHtml}
    </div>
  `; // Geeft het volledige fotogedeelte terug.
} // Sluit renderRouteContentBlockPhotos af.


// ======================= ROUTE CONTENT BLOCKS — BLOK RENDERING =======================

function renderRouteContentBlock(block, index) { // Bouwt één volledig routecontentblok.
  const normalizedBlock = normalizeRouteContentBlock(block); // Normaliseert het blok voor veilige rendering.
  const textHtml = renderRouteContentBlockText(normalizedBlock); // Bouwt het tekstgedeelte.
  const photosHtml = renderRouteContentBlockPhotos(normalizedBlock); // Bouwt het fotogedeelte.
  const hasText = routeContentBlockHasText(normalizedBlock); // Controleert of tekst aanwezig is.
  const hasPhotos = routeContentBlockHasPhotos(normalizedBlock); // Controleert of foto's aanwezig zijn.

  if (!hasText && !hasPhotos) return ""; // Slaat volledig lege contentblokken over.

if (normalizedBlock.layout === ROUTE_CONTENT_BLOCK_LAYOUTS.TEXT_ONLY) { // Controleert de layout Alleen tekst.
    if (!hasText) return ""; // Slaat een leeg tekstblok over.

    return ` 
      <article
        class="route-content-block route-content-block--text-only"
        data-content-block-index="${index}">
        ${textHtml}
      </article>
    `; // Geeft de Alleen tekst-layout terug.
  } // Sluit Alleen tekst af.

if (normalizedBlock.layout === ROUTE_CONTENT_BLOCK_LAYOUTS.PHOTOS_ONLY) { // Controleert de layout Alleen foto's.
  if (!hasPhotos) return ""; // Slaat een fotoblok zonder foto's over.

  const titleHtml = normalizedBlock.title.trim() !== "" // Controleert of een titel aanwezig is.
    ? `<h2 class="route-content-block__title">${escapeRouteContentBlockHtml(normalizedBlock.title)}</h2>` // Bouwt alleen de titel.
    : ""; // Toont niets wanneer de titel leeg is.

  return ` 
    <article
      class="route-content-block route-content-block--photos-only"
      data-content-block-index="${index}">
      ${titleHtml}
      ${photosHtml}
    </article>
  `; // Geeft titel en foto's terug, zonder tekstblok.
}.

  if ( === ROUTE_CONTENT_BLOCK_LAYOUTS.PHOTO_LEFT) { // Controleert de layout Foto's links.
    return ` 
      <article
        class="route-content-block route-content-block--photo-left"
        data-content-block-index="${index}">
        ${photosHtml}
        ${textHtml}
      </article>
    `; // Geeft de Foto's links-layout terug.
  } // Sluit Foto's links af.

  if (normalizedBlock.layout === ROUTE_CONTENT_BLOCK_LAYOUTS.PHOTO_RIGHT) { // Controleert de layout Foto's rechts.
    return ` 
      <article
        class="route-content-block route-content-block--photo-right"
        data-content-block-index="${index}">
        ${textHtml}
        ${photosHtml}
      </article>
    `; // Geeft de Foto's rechts-layout terug.
  } // Sluit Foto's rechts af.

  if (normalizedBlock.layout === ROUTE_CONTENT_BLOCK_LAYOUTS.PHOTO_TOP) { // Controleert de layout Foto's boven.
    return ` 
      <article
        class="route-content-block route-content-block--photo-top"
        data-content-block-index="${index}">
        ${photosHtml}
        ${textHtml}
      </article>
    `; // Geeft de Foto's boven-layout terug.
  } // Sluit Foto's boven af.

  if (normalizedBlock.layout === ROUTE_CONTENT_BLOCK_LAYOUTS.PHOTO_BOTTOM) { // Controleert de layout Foto's onder.
    return ` 
      <article
        class="route-content-block route-content-block--photo-bottom"
        data-content-block-index="${index}">
        ${textHtml}
        ${photosHtml}
      </article>
    `; // Geeft de Foto's onder-layout terug.
  } // Sluit Foto's onder af.

  return ""; // Geeft niets terug bij een onbekende layout.
} // Sluit renderRouteContentBlock af.

function renderRouteContentBlocks(blocks, containerOrSelector) { // Rendert een volledige lijst contentblokken.
  const container = typeof containerOrSelector === "string" // Controleert of een CSS-selector is doorgegeven.
    ? document.querySelector(containerOrSelector) // Zoekt de container via de CSS-selector.
    : containerOrSelector; // Gebruikt anders het doorgegeven HTML-element.

  if (!container) return; // Stopt wanneer de container niet gevonden wordt.

  const normalizedBlocks = normalizeRouteContentBlocks(blocks); // Normaliseert alle contentblokken.

  const blocksHtml = normalizedBlocks.map(function (block, index) { // Doorloopt alle contentblokken.
    return renderRouteContentBlock(block, index); // Bouwt één contentblok.
  }).join(""); // Voegt alle contentblokken samen.

container.innerHTML = blocksHtml; // Plaatst de contentblokken in de routepagina.

const section = document.getElementById("section-content-blocks"); // Zoekt de buitenste Content Blocks-sectie.

if (section) { // Controleert of de buitenste sectie bestaat.
  section.hidden = blocksHtml.trim() === ""; // Toont de sectie zodra er zichtbare content is.
} // Sluit de sectiecontrole af.
} // Sluit renderRouteContentBlocks af.

// ======================= ROUTE CONTENT BLOCKS — PREVIEWBERICHT =======================
function handleRouteContentBlocksPreviewMessage(event) { // Ontvangt live previewdata vanuit creator.html.
  console.log("[ContentBlocks preview] Bericht ontvangen:", event.data); // Controleert of Creator-data de preview bereikt.
  const message = event.data; // Leest het ontvangen previewbericht.

  if (!message || typeof message !== "object") return; // Stopt bij ongeldige berichtdata.
  if (message.type !== "MYTRAILWALKS_CONTENT_BLOCKS_PREVIEW") return; // Reageert alleen op Content Blocks-previewberichten.

  renderRouteContentBlocks( // Rendert de ontvangen contentblokken.
    message.contentBlocks, // Gebruikt de contentblokken uit het previewbericht.
    "#route-content-blocks" // Gebruikt de vaste routecontainer.
  ); // Sluit renderRouteContentBlocks aanroep af.
} // Sluit handleRouteContentBlocksPreviewMessage af.

window.addEventListener("message", handleRouteContentBlocksPreviewMessage); // Luistert naar live previewberichten vanuit de Creator.


// ======================= ROUTE CONTENT BLOCKS — PUBLIEKE API =======================

window.RouteContentBlocks = { // Maakt de renderer beschikbaar voor andere routemodules.
  version: ROUTE_CONTENT_BLOCKS_VERSION, // Maakt het versienummer beschikbaar.
  layouts: ROUTE_CONTENT_BLOCK_LAYOUTS, // Maakt de ondersteunde layouts beschikbaar.
  photoColumns: ROUTE_CONTENT_BLOCK_PHOTO_COLUMNS, // Maakt de fotoverdelingen beschikbaar.
  normalizeBlock: normalizeRouteContentBlock, // Maakt normalisatie van één blok beschikbaar.
  normalizeBlocks: normalizeRouteContentBlocks, // Maakt normalisatie van een lijst beschikbaar.
  renderBlock: renderRouteContentBlock, // Maakt rendering van één blok beschikbaar.
  render: renderRouteContentBlocks // Maakt rendering van een volledige lijst beschikbaar.
}; // Sluit de publieke API af.
