// ======================= ROUTE STORY RENDERER =======================
// Verhaal, tips en fotogrid voor route.html en creator-preview.
"use strict";

// -----------------------------------------------------------
// RENDER VERHAAL — alleen tekst en link blokken
// Foto blokken gaan altijd naar de foto grid (rechterkolom)
// -----------------------------------------------------------
function renderStory(route) {
  const blocks = route.story_blocks;
  const container = $("route-story");

  // Altijd tonen, ook als leeg
  $("section-story").hidden = false;

  if (!blocks?.length) return;

  blocks.forEach((block) => {
    if (block.type === "text" && block.value) {
      const p = document.createElement("p");
      p.className = "route-story__text";
      p.textContent = block.value;
      container.appendChild(p);
    } else if (block.type === "link" && block.url) {
      const a = document.createElement("a");
      a.className = "route-story__link";
      a.href = block.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<span>🔗</span><span>${block.name || block.url}</span>`;
      container.appendChild(a);
    }
    // foto en photo-grid blokken worden genegeerd hier — gaan naar renderPhotoGrid
  });
}
// -----------------------------------------------------------
// RENDER TIPS — altijd tonen, ook als leeg
// -----------------------------------------------------------
function renderTips(route) {
  const lang = i18nModule?.language?.substring(0, 2) || "nl";
  const tips = route.tips?.[lang] || route.tips?.nl || route.tips;

  // Altijd tonen
  $("section-tips").hidden = false;

  if (!tips) return;

  const p = document.createElement("p");
  p.className = "route-tips__text";
  p.textContent = tips;
  $("route-tips").appendChild(p);
}

// -----------------------------------------------------------
// RENDER FOTO GRID (rechterkolom verhaal)
// Combineert foto blokken uit story_blocks + photos[1+]
// Altijd tonen
// -----------------------------------------------------------
function renderPhotoGrid(route) {
  const container = $("route-photo-grid");
  $("section-photos").hidden = false;

  const urls = new Set();

  // Foto blokken uit story_blocks
  (route.story_blocks || []).forEach((block) => {
    if (block.type === "photo" && block.value) {
      urls.add(block.value);
    } else if (block.type === "photo-grid" && block.photos?.length) {
      block.photos.filter(Boolean).forEach((url) => urls.add(url));
    }
  });

  // Extra photos (index 1+)
  (route.photos || []).slice(1).forEach((p) => {
    if (p.url) urls.add(p.url);
  });

  urls.forEach((url) => {
    const img = document.createElement("img");
    img.className = "route-photo-grid__img";
    img.src = url;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => img.remove();
    container.appendChild(img);
  });
}
window.renderStory = renderStory;
window.renderTips = renderTips;
window.renderPhotoGrid = renderPhotoGrid;
