// ======================= ROUTE HERO + SOURCE RENDERER =======================
// Rendert hero en bronvermelding voor route.html en creator-preview.
"use strict";

// ======================= ROUTE HERO RENDEREN =======================
// Vult titel, locatie, regio, hero-foto, status en badges.
function renderHero(route) {
  const lang = i18nModule?.language?.substring(0, 2) || "nl"; // Bepaal actieve taal.

  const title = typeof route.title === "object" // Controleer of title meertalig is.
    ? route.title[lang] || route.title.nl || "" // Neem actieve taal, anders Nederlands.
    : route.title || ""; // Gebruik gewone stringtitel als fallback.

  $("route-title").textContent = title || "Voorvertoning"; // Zet route titel.
  document.title = title ? `${title} — MyTrailWalks` : "Route creator — MyTrailWalks"; // Zet browser titel.

  const locationEl = $("route-location"); // Pak locatie-element.
  if (locationEl) locationEl.textContent = route.location || route.segments?.[0]?.location || ""; // Zet locatie.

  const regionEl = $("route-region"); // Pak regio-element.
  if (regionEl) regionEl.textContent = route.region || route.segments?.[0]?.region || ""; // Zet regio.

  const heroBg = $("route-hero-bg"); // Pak hero achtergrond.
  const heroPhoto = route.photos?.find((p) => p.role === "hero")?.url || route.photos?.[0]?.url || ""; // Zoek hero-foto.

  if (heroBg) { // Controleer of hero bestaat.
   heroBg.style.backgroundImage = heroPhoto ? `url("${heroPhoto}")` : ""; // Zet of leeg achtergrondbeeld.
    heroBg.classList.toggle("has-photo", Boolean(heroPhoto)); // Markeer of foto bestaat.
  }

  const statusEl = $("route-status-badge"); // Pak statuscontainer.

  if (statusEl) { // Controleer of statuscontainer bestaat.
    statusEl.innerHTML = ""; // Reset statusbadge.

    if (route.status) { // Alleen badge tonen als status bestaat.
      const isDraft = route.status === "draft"; // Bepaal draft/final.
      const badge = document.createElement("span"); // Maak badge element.

      badge.className = isDraft // Kies juiste CSS class.
        ? "route-status-badge route-status-badge--draft"
        : "route-status-badge route-status-badge--final";

      badge.textContent = isDraft ? "Draft" : "Final"; // Zet label.
      statusEl.appendChild(badge); // Voeg badge toe.
    }
  }

  const badges = $("route-badges"); // Pak badges-container.

  if (badges) { // Controleer of badges bestaan.
    badges.innerHTML = ""; // Reset badges.

    if (route.difficulty) { // Toon algemene moeilijkheid als die bestaat.
      const badge = document.createElement("span"); // Maak badge.
      badge.className = "route-badge route-badge--difficulty"; // Zet badge-class.
      badge.textContent = route.difficulty; // Zet tekst.
      badges.appendChild(badge); // Voeg toe.
    }

    if (route.published_date) { // Toon publicatiedatum als die bestaat.
      const badge = document.createElement("span"); // Maak datum badge.
      badge.className = "route-badge"; // Zet badge-class.

      const date = new Date(route.published_date); // Parse datum.

      badge.textContent = date.toLocaleDateString( // Format datum.
        lang === "en" ? "en-GB" : "nl-BE",
        { day: "numeric", month: "long", year: "numeric" }
      );

      badges.appendChild(badge); // Voeg datum badge toe.
    }
  }
}

// ======================= ROUTE BRONVERMELDING RENDEREN =======================
// Toont bronvermelding als route.source_reference bestaat.
function renderSource(route) {
  const container = $("route-source"); // Pak source-container.
  const section = $("section-source"); // Pak source-sectie.

  if (!container || !section) return; // Stop als HTML ontbreekt.

  container.innerHTML = ""; // Reset bronvermelding.
  section.hidden = true; // Verberg standaard.

  if (!route.source_reference) return; // Stop als er geen bron is.

  const a = document.createElement("a"); // Maak link.
  a.className = "route-source__link"; // Zet CSS class.
  a.href = route.source_reference; // Zet URL.
  a.target = "_blank"; // Open in nieuw tabblad.
  a.rel = "noopener noreferrer"; // Veiligheid voor externe link.
  a.innerHTML = `<span>🔗</span><span>${route.source_reference.replace(/^https?:\/\//, "")}</span>`; // Toon nette linktekst.

  container.appendChild(a); // Voeg link toe.
  section.hidden = false; // Toon sectie.
}

// ======================= GLOBAL EXPORT =======================
// Maakt hero/source renderers beschikbaar voor route.js en creator.js.
window.renderHero = renderHero;
window.renderSource = renderSource;
