// ======================= CREATOR BLOCKS =======================
"use strict";
// -----------------------------------------------------------
// BLOKKEN-EDITOR
// -----------------------------------------------------------
function renderBlockEditor() {
  els.blockList.innerHTML = "";
  state.storyBlocks.forEach((block, i) => {
    const item = document.createElement("div");
    item.className  = `block-item block-item--${block.type}`;
    item.dataset.idx = i;
    const isFirst = i === 0;
    const isLast  = i === state.storyBlocks.length - 1;

    let bodyHtml = "";
    if (block.type === "text") {
      const escaped = (block.value || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      bodyHtml = `<div class="block-item__label">Tekst</div><textarea class="block-textarea input input--textarea" rows="4" placeholder="Schrijf een alinea\u2026" data-idx="${i}">${escaped}</textarea>`;
    } else if (block.type === "photo") {
      bodyHtml = `<div class="block-item__label">Foto (volledig breed)</div><input type="url" class="block-url-input input" placeholder="https://res.cloudinary.com/…" value="${block.value || ""}" data-idx="${i}">`;
          } else if (block.type === "photo-grid") {
      const cols   = block.cols   || 2;
      const photos = block.photos || ["", ""];

      const photosHtml = photos
        .map((url, pi) => `
          <div class="photo-grid-entry">
            <input
              type="url"
              class="block-url-input input block-grid-url"
              placeholder="Cloudinary URL…"
              value="${url}"
              data-idx="${i}"
              data-pi="${pi}"
            >
          </div>
        `)
        .join("");
      
      bodyHtml = `<div class="block-item__label">Foto grid</div><div class="block-grid-controls"><span style="font-size:var(--text-xs);color:var(--color-charcoal-soft);">Kolommen:</span><label class="block-grid-col-opt"><input type="radio" name="grid-cols-${i}" value="2" ${cols === 2 ? "checked" : ""} data-idx="${i}"> 2</label><label class="block-grid-col-opt"><input type="radio" name="grid-cols-${i}" value="3" ${cols === 3 ? "checked" : ""} data-idx="${i}"> 3</label></div><div class="photo-grid-inputs" data-idx="${i}" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;">${photosHtml}</div><button class="link-btn link-btn--small block-grid-add-photo" data-idx="${i}" style="margin-top:6px;">+ Foto toevoegen</button>`;
    } else if (block.type === "link") {
      bodyHtml = `<div class="block-item__label">Link</div><input type="text" class="block-link-name input" placeholder="Naam (bv. Route op AllTrails)" value="${block.name || ""}" data-idx="${i}" style="margin-bottom:6px;"><input type="url" class="block-link-url input" placeholder="https://â¦" value="${block.url || ""}" data-idx="${i}">`;
    }

    item.innerHTML = `<div class="block-controls"><button class="block-ctrl-btn" data-action="up" data-idx="${i}" title="Omhoog" ${isFirst ? "disabled" : ""}>â</button><button class="block-ctrl-btn" data-action="down" data-idx="${i}" title="Omlaag" ${isLast ? "disabled" : ""}>â</button></div><div class="block-body">${bodyHtml}</div><button class="block-remove-btn" data-action="remove" data-idx="${i}" title="Verwijder blok">â</button>`;
    els.blockList.appendChild(item);
  });

  els.blockList.querySelectorAll("[data-action]").forEach((btn) => btn.addEventListener("click", handleBlockAction));
  els.blockList.querySelectorAll(".block-textarea").forEach((ta) => ta.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].value = e.target.value; updatePreview(); }));
  els.blockList.querySelectorAll(".block-url-input:not(.block-grid-url)").forEach((inp) => {
    inp.addEventListener("blur", (e) => { const idx = parseInt(e.target.dataset.idx); const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); if (fixed !== e.target.value.trim()) { e.target.value = fixed; state.storyBlocks[idx].value = fixed; } updatePreview(); });
    inp.addEventListener("input", (e) => { const idx = parseInt(e.target.dataset.idx); state.storyBlocks[idx].value = e.target.value; const preview = els.blockList.querySelector(`.block-photo-preview[data-idx="${idx}"]`); if (preview) { const url = e.target.value.trim(); preview.hidden = !url; preview.innerHTML = url ? `<img src="${url}" alt="" class="block-photo-preview__img" onerror="this.parentElement.hidden=true">` : ""; } updatePreview(); });
  });
  els.blockList.querySelectorAll(".block-grid-url").forEach((inp) => {
    inp.addEventListener("blur", (e) => { const idx = parseInt(e.target.dataset.idx); const pi = parseInt(e.target.dataset.pi); const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); e.target.value = fixed; state.storyBlocks[idx].photos[pi] = fixed; updatePreview(); });
    inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].photos[parseInt(e.target.dataset.pi)] = e.target.value; updatePreview(); });
  });
  els.blockList.querySelectorAll(".block-grid-col-opt input").forEach((radio) => radio.addEventListener("change", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].cols = parseInt(e.target.value); renderBlockEditor(); updatePreview(); }));
  els.blockList.querySelectorAll(".block-grid-add-photo").forEach((btn) => btn.addEventListener("click", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].photos.push(""); renderBlockEditor(); }));
  els.blockList.querySelectorAll(".block-link-name").forEach((inp) => inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].name = e.target.value; updatePreview(); }));
  els.blockList.querySelectorAll(".block-link-url").forEach((inp) => inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].url = e.target.value; updatePreview(); }));
}

function handleBlockAction(e) {
  const action = e.currentTarget.dataset.action;
  const idx    = parseInt(e.currentTarget.dataset.idx);
  if (action === "up"     && idx > 0)                         [state.storyBlocks[idx - 1], state.storyBlocks[idx]] = [state.storyBlocks[idx], state.storyBlocks[idx - 1]];
  else if (action === "down" && idx < state.storyBlocks.length - 1) [state.storyBlocks[idx], state.storyBlocks[idx + 1]] = [state.storyBlocks[idx + 1], state.storyBlocks[idx]];
  else if (action === "remove") state.storyBlocks.splice(idx, 1);
  renderBlockEditor();
  updatePreview();
}

els.btnAddTextBlock.addEventListener("click",      () => { state.storyBlocks.push({ type: "text",       value: "" });               renderBlockEditor(); updatePreview(); });
els.btnAddPhotoBlock.addEventListener("click",     () => { state.storyBlocks.push({ type: "photo",      value: "" });               renderBlockEditor(); updatePreview(); });
els.btnAddPhotoGridBlock.addEventListener("click", () => { state.storyBlocks.push({ type: "photo-grid", cols: 2, photos: ["", ""] }); renderBlockEditor(); updatePreview(); });
els.btnAddLinkBlock.addEventListener("click",      () => { state.storyBlocks.push({ type: "link",       name: "", url: "" });       renderBlockEditor(); updatePreview(); });


// -----------------------------------------------------------
// GALERIJ
// -----------------------------------------------------------
function renderGalleryEditor() {
  if (!els.galleryList) return;
  els.galleryList.innerHTML = "";
  state.galleryPhotos.forEach((photo, i) => {
    const entry = document.createElement("div");
    entry.className = "photo-entry";
    entry.innerHTML = `<input type="url" class="input gallery-url-input" placeholder="https://res.cloudinary.com/â¦" value="${photo.url || ""}" data-idx="${i}"><button class="photo-entry__remove" data-idx="${i}" title="Verwijder">â</button>`;
    entry.querySelector(".gallery-url-input").addEventListener("blur",  (e) => { const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); e.target.value = fixed; state.galleryPhotos[i].url = fixed; updatePreview(); });
    entry.querySelector(".gallery-url-input").addEventListener("input", (e) => { state.galleryPhotos[i].url = e.target.value; updatePreview(); });
    entry.querySelector(".photo-entry__remove").addEventListener("click", () => { state.galleryPhotos.splice(i, 1); renderGalleryEditor(); updatePreview(); });
    els.galleryList.appendChild(entry);
  });
}

if (els.btnAddGalleryPhoto) els.btnAddGalleryPhoto.addEventListener("click", () => { state.galleryPhotos.push({ url: "" }); renderGalleryEditor(); });

function calculateDifficulty() {
  // Leest uit seg.gpx.stats van het eerste segment
  const stats   = state.segments[0]?.gpx?.stats;
  const weather = state.segments[0]?.weather;
  if (!stats) return null;
  let score = 0;
  if (stats.distance_km)    score += stats.distance_km;
  if (stats.elevation_up_m) score += stats.elevation_up_m / 100;
  if (weather) {
    if (weather.temperature_max >= 25)  score += 2;
    if (weather.precipitation_mm >= 5)  score += 2;
    if (weather.wind_kmh >= 30)         score += 1;
  }
  if (score <= 5)  return "T1";
  if (score <= 10) return "T2";
  if (score <= 16) return "T3";
  if (score <= 22) return "T4";
  if (score <= 28) return "T5";
  return "T6";
}

function applyCalculatedDifficulty() {
  const difficulty = calculateDifficulty();
  if (difficulty && !els.inputDifficulty.value) { els.inputDifficulty.value = difficulty; updatePreview(); }
}

// -----------------------------------------------------------
// ROUTEVELDEN â LIVE PREVIEW
// -----------------------------------------------------------
els.inputTitle.addEventListener("input", updatePreview);

els.inputIntro.addEventListener("input", () => {
  els.introCount.textContent = `${els.inputIntro.value.length}/160`;
  updatePreview();
});

// -----------------------------------------------------------
// CLOUDINARY URL AUTO-FIX
// -----------------------------------------------------------
function fixCloudinaryUrl(url, transform = "w_1200,f_auto") {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  if (url.includes(transform)) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

els.inputHeroPhoto.addEventListener("blur", () => {
  const fixed = fixCloudinaryUrl(els.inputHeroPhoto.value.trim());

  if (fixed !== els.inputHeroPhoto.value.trim()) {
    els.inputHeroPhoto.value = fixed;
  }

  updatePreview();
});

els.inputHeroPhoto.addEventListener("input", updatePreview);

window.renderBlockEditor = renderBlockEditor;
window.renderGalleryEditor = renderGalleryEditor;
window.fixCloudinaryUrl = fixCloudinaryUrl;
