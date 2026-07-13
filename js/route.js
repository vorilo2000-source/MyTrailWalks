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
// RENDER BRONVERMELDING
// -----------------------------------------------------------
function renderSource(route) {
  if (!route.source_reference) return;

  const container = $("route-source");
  if (!container) return;

  container.innerHTML = "";

  const a = document.createElement("a");
  a.className = "route-source__link";
  a.href = route.source_reference;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.innerHTML = `<span>🔗</span><span>${route.source_reference.replace(/^https?:\/\//, "")}</span>`;

  container.appendChild(a);

  const section = $("section-source");
  if (section) section.hidden = false;
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
// CREATOR PREVIEW — ROUTE ONTVANGEN
// -----------------------------------------------------------
window.addEventListener("message", async (event) => {
  if (event.origin !== window.location.origin) return;

  if (event.data?.type !== "mytrailwalks-preview-route") return;

  const route = event.data.route;
  if (!route) return;

  await window.appReady;

  renderHero(route);
  renderSegments(route);
  renderSource(route);
  renderMap(route);
  renderElevation(route);
  renderStory(route);
  renderTips(route);
  renderPhotoGrid(route);
  renderGallery(route);
});

// -----------------------------------------------------------
// INIT
// -----------------------------------------------------------
window.appReady.then(async () => {
  const isPreview = new URLSearchParams(window.location.search).get("preview") === "1";

  if (isPreview) {
    return;
  }

  const id = window.getRouteId();
  if (!id) {
    $("route-title").textContent = window.routeTranslate("notFound");
    return;
  }

  const route = await window.loadRoute(id);
  if (!route) {
    $("route-title").textContent = window.routeTranslate("loadError");
    return;
  }

  renderHero(route);
  renderSegments(route);
  renderSource(route);
  renderMap(route);
  renderElevation(route);
  renderStory(route);
  renderTips(route);
  renderPhotoGrid(route);
  renderGallery(route);
});
