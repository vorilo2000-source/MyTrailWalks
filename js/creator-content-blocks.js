// ======================= CREATOR CONTENT BLOCKS — CONFIGURATIE =======================

const CREATOR_CONTENT_BLOCKS_VERSION = "1.0.2"; // Versienummer van het nieuwe Content Blocks-systeem.

const CONTENT_BLOCK_LAYOUTS = { // Bevat alle beschikbare layouts voor een contentblok.
  TEXT_ONLY: "text-only", // Toont alleen titel en tekst.
  PHOTO_LEFT: "photo-left", // Toont foto's links en tekst rechts.
  PHOTO_RIGHT: "photo-right", // Toont tekst links en foto's rechts.
  PHOTO_TOP: "photo-top", // Toont foto's boven de tekst.
  PHOTO_BOTTOM: "photo-bottom", // Toont foto's onder de tekst.
  PHOTO_GRID: "photo-grid", // Toont meerdere foto's in een raster.
  PHOTOS_ONLY: "photos-only" // Toont alleen foto's zonder tekst.
}; // Sluit CONTENT_BLOCK_LAYOUTS af.

const CONTENT_BLOCK_LAYOUT_LABELS = { // Bevat de zichtbare namen van alle layouts.
  [CONTENT_BLOCK_LAYOUTS.TEXT_ONLY]: "Alleen tekst", // Zichtbare naam voor text-only.
  [CONTENT_BLOCK_LAYOUTS.PHOTO_LEFT]: "Foto links", // Zichtbare naam voor photo-left.
  [CONTENT_BLOCK_LAYOUTS.PHOTO_RIGHT]: "Foto rechts", // Zichtbare naam voor photo-right.
  [CONTENT_BLOCK_LAYOUTS.PHOTO_TOP]: "Foto boven", // Zichtbare naam voor photo-top.
  [CONTENT_BLOCK_LAYOUTS.PHOTO_BOTTOM]: "Foto onder", // Zichtbare naam voor photo-bottom.
  [CONTENT_BLOCK_LAYOUTS.PHOTO_GRID]: "Fotogrid", // Zichtbare naam voor photo-grid.
  [CONTENT_BLOCK_LAYOUTS.PHOTOS_ONLY]: "Alleen foto's" // Zichtbare naam voor photos-only.
}; // Sluit CONTENT_BLOCK_LAYOUT_LABELS af.


// ======================= CREATOR CONTENT BLOCKS — STATE =======================

const creatorContentBlocks = []; // Bewaart alle nieuwe contentblokken zolang de Creator geopend is.


// ======================= CREATOR CONTENT BLOCKS — HELPERS =======================

function createContentBlockId() { // Maakt een uniek ID voor een nieuw contentblok.
  return `content-block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; // Combineert tijd en willekeurige tekens.
} // Sluit createContentBlockId af.

function createContentPhoto() { // Maakt één lege foto-entry.
  return { // Geeft de standaardstructuur van één foto terug.
    id: `content-photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // Maakt een uniek foto-ID.
    url: "", // Bewaart de URL van de foto.
    alt: "", // Bewaart de alternatieve tekst van de foto.
    caption: "" // Bewaart een optioneel onderschrift.
  }; // Sluit het foto-object af.
} // Sluit createContentPhoto af.

function createContentBlock() { // Maakt één nieuw leeg contentblok.
  return { // Geeft het volledige standaardblok terug.
    id: createContentBlockId(), // Kent een uniek blok-ID toe.
    version: CREATOR_CONTENT_BLOCKS_VERSION, // Slaat de modelversie op.
    title: { // Bevat de meertalige titel.
      nl: "" // Bewaart voorlopig de Nederlandse titel.
    }, // Sluit title af.
    layout: CONTENT_BLOCK_LAYOUTS.TEXT_ONLY, // Gebruikt standaard de layout Alleen tekst.
    text: { // Bevat de meertalige tekst.
      nl: "" // Bewaart voorlopig de Nederlandse tekst.
    }, // Sluit text af.
    photos: [], // Bevat later alle foto-URL's van dit blok.
    options: {} // Houdt ruimte vrij voor toekomstige instellingen.
  }; // Sluit het contentblok-object af.
} // Sluit createContentBlock af.

function getContentBlockById(blockId) { // Zoekt één contentblok op basis van zijn ID.
  return creatorContentBlocks.find(function (block) { // Doorloopt alle contentblokken.
    return block.id === blockId; // Geeft het blok terug waarvan het ID overeenkomt.
  }); // Sluit find af.
} // Sluit getContentBlockById af.

function getContentBlockIndexById(blockId) { // Zoekt de positie van een contentblok.
  return creatorContentBlocks.findIndex(function (block) { // Doorloopt alle contentblokken.
    return block.id === blockId; // Geeft de index terug van het passende blok.
  }); // Sluit findIndex af.
} // Sluit getContentBlockIndexById af.

function escapeContentBlockHtml(value) { // Beveiligt tekst voordat die in HTML wordt geplaatst.
  return String(value ?? "") // Zet iedere waarde veilig om naar tekst.
    .replaceAll("&", "&amp;") // Beveiligt ampersands.
    .replaceAll("<", "&lt;") // Beveiligt kleiner-dan-tekens.
    .replaceAll(">", "&gt;") // Beveiligt groter-dan-tekens.
    .replaceAll('"', "&quot;") // Beveiligt dubbele aanhalingstekens.
    .replaceAll("'", "&#039;"); // Beveiligt enkele aanhalingstekens.
} // Sluit escapeContentBlockHtml af.

function getContentBlockLayoutOptions(selectedLayout) { // Bouwt alle opties voor de layout-dropdown.
  return Object.entries(CONTENT_BLOCK_LAYOUT_LABELS).map(function ([layoutValue, layoutLabel]) { // Doorloopt alle layouts.
    const selected = layoutValue === selectedLayout ? " selected" : ""; // Markeert de huidige layout.
    return `<option value="${layoutValue}"${selected}>${layoutLabel}</option>`; // Bouwt één option-element.
  }).join(""); // Voegt alle option-elementen samen.
} // Sluit getContentBlockLayoutOptions af.


// ======================= CREATOR CONTENT BLOCKS — NORMALISATIE =======================

function normalizeContentPhoto(photo) { // Normaliseert één foto-entry.
  const sourcePhoto = photo && typeof photo === "object" ? photo : {}; // Gebruikt alleen een geldig object.
  return { // Geeft een veilige foto-entry terug.
    id: sourcePhoto.id || `content-photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // Hergebruikt of maakt een foto-ID.
    url: typeof sourcePhoto.url === "string" ? sourcePhoto.url : "", // Normaliseert de foto-URL.
    alt: typeof sourcePhoto.alt === "string" ? sourcePhoto.alt : "", // Normaliseert de alternatieve tekst.
    caption: typeof sourcePhoto.caption === "string" ? sourcePhoto.caption : "" // Normaliseert het onderschrift.
  }; // Sluit het genormaliseerde foto-object af.
} // Sluit normalizeContentPhoto af.

function normalizeContentBlock(block) { // Normaliseert één volledig contentblok.
  const sourceBlock = block && typeof block === "object" ? block : {}; // Gebruikt alleen een geldig object.
  const normalizedLayout = Object.values(CONTENT_BLOCK_LAYOUTS).includes(sourceBlock.layout) // Controleert of de layout bestaat.
    ? sourceBlock.layout // Behoudt een geldige layout.
    : CONTENT_BLOCK_LAYOUTS.TEXT_ONLY; // Gebruikt anders Alleen tekst.

  return { // Geeft een veilig contentblok terug.
    id: sourceBlock.id || createContentBlockId(), // Hergebruikt of maakt een blok-ID.
    version: sourceBlock.version || CREATOR_CONTENT_BLOCKS_VERSION, // Hergebruikt of vult de modelversie in.
    title: { // Normaliseert de titel.
      nl: typeof sourceBlock.title?.nl === "string" ? sourceBlock.title.nl : "" // Behoudt alleen geldige Nederlandse tekst.
    }, // Sluit title af.
    layout: normalizedLayout, // Slaat de gecontroleerde layout op.
    text: { // Normaliseert de tekst.
      nl: typeof sourceBlock.text?.nl === "string" ? sourceBlock.text.nl : "" // Behoudt alleen geldige Nederlandse tekst.
    }, // Sluit text af.
    photos: Array.isArray(sourceBlock.photos) // Controleert of photos een lijst is.
      ? sourceBlock.photos.map(normalizeContentPhoto) // Normaliseert iedere foto.
      : [], // Gebruikt anders een lege lijst.
    options: sourceBlock.options && typeof sourceBlock.options === "object" // Controleert de opties.
      ? { ...sourceBlock.options } // Kopieert geldige opties.
      : {} // Gebruikt anders een leeg object.
  }; // Sluit het genormaliseerde contentblok af.
} // Sluit normalizeContentBlock af.

function normalizeContentBlocks(blocks) { // Normaliseert een volledige lijst contentblokken.
  if (!Array.isArray(blocks)) return []; // Geeft een lege lijst terug bij ongeldige invoer.
  return blocks.map(normalizeContentBlock); // Normaliseert ieder contentblok.
} // Sluit normalizeContentBlocks af.


// ======================= CREATOR CONTENT BLOCKS — VALIDATIE =======================

function validateContentBlock(block) { // Controleert of een contentblok bruikbaar is.
  const errors = []; // Bewaart alle gevonden validatiefouten.

  if (!block || typeof block !== "object") { // Controleert of het blok een object is.
    errors.push("Contentblok ontbreekt of is ongeldig."); // Voegt een duidelijke foutmelding toe.
    return errors; // Stopt omdat verdere controle niet mogelijk is.
  } // Sluit objectcontrole af.

  if (!block.id) { // Controleert of het blok een ID heeft.
    errors.push("Contentblok heeft geen ID."); // Voegt een foutmelding toe.
  } // Sluit ID-controle af.

  if (!Object.values(CONTENT_BLOCK_LAYOUTS).includes(block.layout)) { // Controleert of de layout geldig is.
    errors.push("Contentblok heeft een onbekende layout."); // Voegt een foutmelding toe.
  } // Sluit layoutcontrole af.

  if (!Array.isArray(block.photos)) { // Controleert of photos een lijst is.
    errors.push("Contentblok bevat geen geldige fotolijst."); // Voegt een foutmelding toe.
  } // Sluit fotolijstcontrole af.

  return errors; // Geeft alle gevonden fouten terug.
} // Sluit validateContentBlock af.


// ======================= CREATOR CONTENT BLOCKS — FOTO-EDITOR =======================

function addPhotoToContentBlock(blockId) { // Voegt één lege foto toe aan een contentblok.
  const block = getContentBlockById(blockId); // Zoekt het gekozen contentblok.
  if (!block) return; // Stopt wanneer het blok niet bestaat.
  block.photos.push(createContentPhoto()); // Voegt één lege foto-entry toe.
  renderCreatorContentBlocks(); // Bouwt de editor opnieuw op.
} // Sluit addPhotoToContentBlock af.

function removePhotoFromContentBlock(blockId, photoId) { // Verwijdert één foto uit een contentblok.
  const block = getContentBlockById(blockId); // Zoekt het gekozen contentblok.
  if (!block) return; // Stopt wanneer het blok niet bestaat.
  block.photos = block.photos.filter(function (photo) { // Maakt een nieuwe fotolijst.
    return photo.id !== photoId; // Behoudt alle foto's behalve de gekozen foto.
  }); // Sluit filter af.
  renderCreatorContentBlocks(); // Bouwt de editor opnieuw op.
} // Sluit removePhotoFromContentBlock af.

function renderContentBlockPhotos(block) { // Bouwt de foto-URL-velden van één contentblok.
  if (!block.photos.length) { // Controleert of het blok nog geen foto's heeft.
    return `<p class="field__help">Nog geen foto-URL's toegevoegd.</p>`; // Toont een korte melding.
  } // Sluit lege fotolijstcontrole af.

  return block.photos.map(function (photo, photoIndex) { // Doorloopt alle foto's van het blok.
    return ` 
      <div class="field content-block-photo" data-photo-id="${photo.id}">
        <label class="field__label">Foto ${photoIndex + 1} URL</label>
        <input
          type="url"
          class="input"
          data-content-photo-field="url"
          data-photo-id="${photo.id}"
          value="${escapeContentBlockHtml(photo.url)}"
          placeholder="https://res.cloudinary.com/…">
        <label class="field__label">Alternatieve tekst</label>
        <input
          type="text"
          class="input"
          data-content-photo-field="alt"
          data-photo-id="${photo.id}"
          value="${escapeContentBlockHtml(photo.alt)}"
          placeholder="Korte beschrijving van de foto">
        <label class="field__label">Onderschrift</label>
        <input
          type="text"
          class="input"
          data-content-photo-field="caption"
          data-photo-id="${photo.id}"
          value="${escapeContentBlockHtml(photo.caption)}"
          placeholder="Optioneel onderschrift">
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          data-action="remove-content-photo"
          data-photo-id="${photo.id}">
          Foto verwijderen
        </button>
      </div>
    `; // Geeft de HTML voor één foto terug.
  }).join(""); // Voegt alle foto-velden samen.
} // Sluit renderContentBlockPhotos af.


// ======================= CREATOR CONTENT BLOCKS — BLOKEDITOR =======================

function renderCreatorContentBlocks() { // Bouwt de volledige Content Blocks-editor opnieuw op.
  const container = document.getElementById("creator-content-blocks"); // Zoekt de Content Blocks-container.
  if (!container) return; // Stopt wanneer de container niet in creator.html staat.

  if (!creatorContentBlocks.length) { // Controleert of er nog geen contentblokken zijn.
    container.innerHTML = `<p class="field__help">Nog geen contentblokken toegevoegd.</p>`; // Toont de lege status.
    return; // Stopt omdat er niets anders hoeft te worden opgebouwd.
  } // Sluit lege status af.

  container.innerHTML = creatorContentBlocks.map(function (block, index) { // Bouwt voor ieder blok een editor.
    const hideTextFields = block.layout === CONTENT_BLOCK_LAYOUTS.PHOTOS_ONLY; // Bepaalt of titel en tekst verborgen moeten worden.

    return `
      <div class="block-editor__item content-block-editor" data-content-block-id="${block.id}">

        <div class="content-block-editor__header">
          <strong>Contentblok ${index + 1}</strong>

          <button
            type="button"
            class="btn btn--ghost btn--sm"
            data-action="remove-content-block">
            Verwijderen
          </button>
        </div>

        <div class="field">
          <label class="field__label">Layout</label>

          <select
            class="input"
            data-content-block-field="layout">
            ${getContentBlockLayoutOptions(block.layout)}
          </select>
        </div>

        <div class="field"${hideTextFields ? ' hidden' : ""}>
          <label class="field__label">Titel</label>

          <input
            type="text"
            class="input"
            data-content-block-field="title"
            value="${escapeContentBlockHtml(block.title.nl)}"
            placeholder="Titel van het contentblok">
        </div>

        <div class="field"${hideTextFields ? ' hidden' : ""}>
          <label class="field__label">Tekst</label>

          <textarea
            class="input input--textarea"
            rows="6"
            data-content-block-field="text"
            placeholder="Schrijf hier de tekst van het contentblok…">${escapeContentBlockHtml(block.text.nl)}</textarea>
        </div>

        <div class="field">
          <label class="field__label">Foto-URL's</label>

          <div class="content-block-photo-list">
            ${renderContentBlockPhotos(block)}
          </div>

          <button
            type="button"
            class="btn btn--ghost btn--sm"
            data-action="add-content-photo">
            + Foto toevoegen
          </button>
        </div>

      </div>
    `; // Geeft de volledige HTML voor één contentblok terug.
  }).join(""); // Voegt alle contentblok-editors samen.
} // Sluit renderCreatorContentBlocks af.

function addCreatorContentBlock() { // Voegt één nieuw leeg contentblok toe.
  creatorContentBlocks.push(createContentBlock()); // Plaatst een nieuw blok in de tijdelijke state.
  renderCreatorContentBlocks(); // Toont de bijgewerkte lijst.
} // Sluit addCreatorContentBlock af.

function removeCreatorContentBlock(blockId) { // Verwijdert één contentblok.
  const blockIndex = getContentBlockIndexById(blockId); // Zoekt de positie van het blok.
  if (blockIndex === -1) return; // Stopt wanneer het blok niet bestaat.
  creatorContentBlocks.splice(blockIndex, 1); // Verwijdert het blok uit de state.
  renderCreatorContentBlocks(); // Toont de bijgewerkte lijst.
} // Sluit removeCreatorContentBlock af.

function updateCreatorContentBlockField(blockId, fieldName, fieldValue) { // Werkt één invoerveld van een blok bij.
  const block = getContentBlockById(blockId); // Zoekt het gekozen blok.
  if (!block) return; // Stopt wanneer het blok niet bestaat.

  if (fieldName === "layout") { // Controleert of de layout gewijzigd wordt.
    block.layout = Object.values(CONTENT_BLOCK_LAYOUTS).includes(fieldValue) // Controleert de nieuwe layout.
      ? fieldValue // Gebruikt de geldige layout.
      : CONTENT_BLOCK_LAYOUTS.TEXT_ONLY; // Valt anders terug op Alleen tekst.
    renderCreatorContentBlocks(); // Bouwt opnieuw op zodat photos-only tekstvelden kan verbergen.
    return; // Stopt na het verwerken van de layout.
  } // Sluit layoutwijziging af.

  if (fieldName === "title") { // Controleert of de titel gewijzigd wordt.
    block.title.nl = fieldValue; // Slaat de nieuwe titel op.
    return; // Stopt na het verwerken van de titel.
  } // Sluit titelwijziging af.

  if (fieldName === "text") { // Controleert of de tekst gewijzigd wordt.
    block.text.nl = fieldValue; // Slaat de nieuwe tekst op.
  } // Sluit tekstwijziging af.
} // Sluit updateCreatorContentBlockField af.

function updateCreatorContentPhotoField(blockId, photoId, fieldName, fieldValue) { // Werkt één veld van een foto bij.
  const block = getContentBlockById(blockId); // Zoekt het gekozen blok.
  if (!block) return; // Stopt wanneer het blok niet bestaat.

  const photo = block.photos.find(function (item) { // Zoekt de gekozen foto.
    return item.id === photoId; // Vergelijkt het foto-ID.
  }); // Sluit find af.

  if (!photo) return; // Stopt wanneer de foto niet bestaat.
  if (!["url", "alt", "caption"].includes(fieldName)) return; // Staat alleen bekende fotovelden toe.

  photo[fieldName] = fieldValue; // Slaat de nieuwe fotowaarde op.
} // Sluit updateCreatorContentPhotoField af.


// ======================= CREATOR CONTENT BLOCKS — EVENTS =======================

function handleContentBlockClick(event) { // Verwerkt alle klikken binnen de Content Blocks-editor.
  const actionButton = event.target.closest("[data-action]"); // Zoekt de aangeklikte actieknop.
  if (!actionButton) return; // Stopt wanneer niet op een actieknop is geklikt.

  const blockElement = actionButton.closest("[data-content-block-id]"); // Zoekt het bijbehorende contentblok.
  if (!blockElement) return; // Stopt wanneer geen contentblok gevonden wordt.

  const blockId = blockElement.dataset.contentBlockId; // Leest het technische blok-ID.
  const action = actionButton.dataset.action; // Leest welke actie uitgevoerd moet worden.

  if (action === "remove-content-block") { // Controleert of het blok verwijderd moet worden.
    removeCreatorContentBlock(blockId); // Verwijdert het gekozen contentblok.
    return; // Stopt na het verwijderen.
  } // Sluit blok verwijderen af.

  if (action === "add-content-photo") { // Controleert of een foto toegevoegd moet worden.
    addPhotoToContentBlock(blockId); // Voegt een lege foto toe.
    return; // Stopt na het toevoegen.
  } // Sluit foto toevoegen af.

  if (action === "remove-content-photo") { // Controleert of een foto verwijderd moet worden.
    const photoId = actionButton.dataset.photoId; // Leest het technische foto-ID.
    removePhotoFromContentBlock(blockId, photoId); // Verwijdert de gekozen foto.
  } // Sluit foto verwijderen af.
} // Sluit handleContentBlockClick af.

function handleContentBlockInput(event) { // Verwerkt invoer in titel, tekst en foto-URL's.
  const blockElement = event.target.closest("[data-content-block-id]"); // Zoekt het bijbehorende contentblok.
  if (!blockElement) return; // Stopt wanneer geen contentblok gevonden wordt.

  const blockId = blockElement.dataset.contentBlockId; // Leest het technische blok-ID.
  const blockField = event.target.dataset.contentBlockField; // Leest eventueel het contentblokveld.
  const photoField = event.target.dataset.contentPhotoField; // Leest eventueel het fotoveld.

  if (blockField) { // Controleert of een normaal blokveld gewijzigd is.
    updateCreatorContentBlockField(blockId, blockField, event.target.value); // Werkt het blokveld bij.
    return; // Stopt na het verwerken.
  } // Sluit blokveldcontrole af.

  if (photoField) { // Controleert of een fotoveld gewijzigd is.
    const photoId = event.target.dataset.photoId; // Leest het technische foto-ID.
    updateCreatorContentPhotoField(blockId, photoId, photoField, event.target.value); // Werkt het fotoveld bij.
  } // Sluit fotoveldcontrole af.
} // Sluit handleContentBlockInput af.

function initializeCreatorContentBlocks() { // Start de nieuwe Content Blocks-editor.
  const addButton = document.getElementById("btn-add-content-block"); // Zoekt de knop Contentblok toevoegen.
  const container = document.getElementById("creator-content-blocks"); // Zoekt de Content Blocks-container.

  if (!addButton || !container) return; // Stopt zonder fout wanneer de HTML nog niet bestaat.

  addButton.addEventListener("click", addCreatorContentBlock); // Koppelt de knop aan een nieuw contentblok.
  container.addEventListener("click", handleContentBlockClick); // Verwerkt alle knoppen binnen de editor.
  container.addEventListener("input", handleContentBlockInput); // Verwerkt tekst- en URL-invoer.
  container.addEventListener("change", handleContentBlockInput); // Verwerkt wijzigingen in dropdowns.
  renderCreatorContentBlocks(); // Toont de lege beginstatus.
} // Sluit initializeCreatorContentBlocks af.

document.addEventListener("DOMContentLoaded", initializeCreatorContentBlocks); // Start de editor zodra creator.html geladen is.


// ======================= CREATOR CONTENT BLOCKS — PUBLIEKE API =======================

window.CreatorContentBlocks = { // Maakt de Content Blocks-functies later bereikbaar voor creator.js.
  version: CREATOR_CONTENT_BLOCKS_VERSION, // Maakt de huidige modelversie beschikbaar.
  layouts: CONTENT_BLOCK_LAYOUTS, // Maakt alle technische layoutwaarden beschikbaar.
  layoutLabels: CONTENT_BLOCK_LAYOUT_LABELS, // Maakt alle zichtbare layoutnamen beschikbaar.
  createBlock: createContentBlock, // Maakt extern een nieuw leeg blok mogelijk.
  normalizeBlock: normalizeContentBlock, // Maakt externe normalisatie van één blok mogelijk.
  normalizeBlocks: normalizeContentBlocks, // Maakt externe normalisatie van een lijst mogelijk.
  validateBlock: validateContentBlock, // Maakt externe validatie mogelijk.
  getBlocks: function () { // Geeft een veilige kopie van alle huidige blokken terug.
    return structuredClone(creatorContentBlocks); // Voorkomt dat externe code de interne state direct wijzigt.
  }, // Sluit getBlocks af.
  setBlocks: function (blocks) { // Vervangt de volledige interne blokkenlijst.
    creatorContentBlocks.length = 0; // Maakt de huidige lijst leeg.
    creatorContentBlocks.push(...normalizeContentBlocks(blocks)); // Plaatst de genormaliseerde blokken in de state.
    renderCreatorContentBlocks(); // Toont de nieuwe blokken in de editor.
  }, // Sluit setBlocks af.
  clearBlocks: function () { // Verwijdert alle huidige contentblokken.
    creatorContentBlocks.length = 0; // Maakt de interne lijst leeg.
    renderCreatorContentBlocks(); // Toont opnieuw de lege status.
  }, // Sluit clearBlocks af.
  render: renderCreatorContentBlocks // Maakt handmatig opnieuw renderen mogelijk.
}; // Sluit de publieke API af.
