// =======================================================
// route.js — MyTrailWalks
// Route detail pagina: laadt JSON en rendert route
// v2.4.1: fix relatief pad voor route JSON — /MyTrailWalks/routes/ → ../routes/
// v2.4.0: rood-omcirkeld stats/weer/vervoer-blok verwijderd (dubbel met
//         segmenten-sectie) — vervoer + label nu altijd samen in de
//         gekleurde segment-header (voorheen ontbrak vervoer soms per
//         segment als er geen apart "label" veld was ingevuld)
// v2.3.0: segmenten-sectie met compacte tabel per segment,
//         heldere kleurenpalet voor vervoersmiddelen
// v2.2.0: gpx_raw fallback voor ontbrekende track_points
// v2.1.0: kaart toont alle segmenten met kleurcode
// v2.0.0: nieuwe lay-out — 2-koloms, slideshow galerij, status badge
// =======================================================
"use strict";

const $ = (id) => document.getElementById(id);

// -----------------------------------------------------------
// RENDER HERO
// -----------------------------------------------------------
function renderHero(route) {
  const lang = i18nModule?.language?.substring(0, 2) || "nl";

  const title = typeof route.title === "object"
    ? route.title[lang] || route.title.nl || ""
    : route.title || "";

  $("route-title").textContent = title;
  document.title = `${title} — MyTrailWalks`;

  if (route.location) $("route-location").textContent = route.location;
  if (route.region) $("route-region").textContent = route.region;

  const heroBg = $("route-hero-bg");
  const heroPhoto = route.photos?.find((p) => p.role === "hero")?.url || route.photos?.[0]?.url || "";

  if (heroPhoto) {
    heroBg.style.backgroundImage = `url('${heroPhoto}')`;
    heroBg.classList.add("has-photo");
  }

  const statusEl = $("route-status-badge");

  if (statusEl && route.status) {
    statusEl.innerHTML = "";

    const isDraft = route.status === "draft";
    const badge = document.createElement("span");

    badge.className = isDraft
      ? "route-status-badge route-status-badge--draft"
      : "route-status-badge route-status-badge--final";

    badge.textContent = isDraft ? "Draft" : "Final";
    statusEl.appendChild(badge);
  }

  const badges = $("route-badges");

  if (badges) {
    badges.innerHTML = "";

    if (route.difficulty) {
      const badge = document.createElement("span");
      badge.className = "route-badge route-badge--difficulty";
      badge.textContent = route.difficulty;
      badges.appendChild(badge);
    }

    if (route.published_date) {
      const badge = document.createElement("span");
      badge.className = "route-badge";

      const date = new Date(route.published_date);

      badge.textContent = date.toLocaleDateString(
        lang === "en" ? "en-GB" : "nl-BE",
        { day: "numeric", month: "long", year: "numeric" }
      );

      badges.appendChild(badge);
    }
  }
}

// -----------------------------------------------------------
// RENDER SEGMENTEN
// Toont alle segmenten als compacte tabellen met vervoer-badge,
// GPX-stats en weerdata. Alleen zichtbaar als er meerdere segmenten
// zijn of als segments array aanwezig is.
// Startpunt van elk segment = referentie voor de weerdata.
//
// v2.4.0: vervoersmiddel staat nu ALTIJD in de gekleurde header, ook
// als het segment geen eigen "label" heeft. Voorheen viel de header
// terug op enkel de transportLabel als tekst wanneer seg.label
// ontbrak — dat werkte, maar zodra seg.label WEL gezet was, toonde
// de header enkel dat label en verdween het vervoersmiddel uit
// beeld (zichtbaar op segment 2 in de screenshot: "Naar Grenspark
// Noord parking" zonder vervoersicoon). Nu wordt vervoer + label
// altijd samen getoond: "🚶 Wandelen — <label>" of enkel
// "🚶 Wandelen" als er geen apart label is.
// -----------------------------------------------------------

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

// -----------------------------------------------------------
// RENDER SLIDESHOW GALERIJ
// -----------------------------------------------------------
function renderGallery(route) {
  if (!route.gallery?.length) return;

  const photos = route.gallery.filter((p) => p.url);
  if (!photos.length) return;

  let current = 0;
  const img = $("slideshow-img");
  const dotsEl = $("slideshow-dots");
  const prevBtn = $("slideshow-prev");
  const nextBtn = $("slideshow-next");

  function show(idx) {
    current = idx;
    img.src = photos[idx].url;
    img.alt = photos[idx].caption || "";
    dotsEl.querySelectorAll(".route-slideshow__dot").forEach((d, i) => {
      d.classList.toggle("route-slideshow__dot--active", i === idx);
    });
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === photos.length - 1;
  }

  // Dots aanmaken
  photos.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "route-slideshow__dot";
    dot.setAttribute("aria-label", `Foto ${i + 1}`);
    dot.addEventListener("click", () => show(i));
    dotsEl.appendChild(dot);
  });

  prevBtn.addEventListener("click", () => { if (current > 0) show(current - 1); });
  nextBtn.addEventListener("click", () => { if (current < photos.length - 1) show(current + 1); });

  show(0);
  $("section-gallery").hidden = false;
}

// -----------------------------------------------------------
// DELEN
// -----------------------------------------------------------
$("btn-share").addEventListener("click", async () => {
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url: window.location.href }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(window.location.href);
    $("btn-share").textContent = "✓ Gekopieerd!";
    setTimeout(() => { $("btn-share").innerHTML = `<span>🔗</span> Delen`; }, 2000);
  }
});

// -----------------------------------------------------------
// INIT
// v2.4.0: renderStats / renderWeather / renderTransport verwijderd —
// die vulden het rood-omcirkelde blok bovenaan de pagina, dat dubbel
// op was met de segmenten-sectie (elk segment toont al zijn eigen
// stats + weer + vervoer in de gekleurde header).
// -----------------------------------------------------------
window.appReady.then(async () => {
  const id =  window.getRouteId();
  if (!id) { $("route-title").textContent = window.routeTranslate("notFound"); return; }

  const route = await window.loadRoute(id);
  if (!route) { $("route-title").textContent = window.routeTranslate("loadError"); return; }

  renderHero(route);
  renderSegments(route);
  renderSource(route);
  renderMap(route);
  renderStory(route);
  renderTips(route);
  renderPhotoGrid(route);
  renderGallery(route);
});
