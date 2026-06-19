// =======================================================
// app.js — v2.0.0
// MyTrailWalks — component injectie (topbar + footer)
// T0-006: fetch + injectie van topbar.html en footer.html
// in hun respectieve placeholders.
// Aanroepen: <script src="js/app.js"></script> in elke pagina
// vóór het pagina-specifieke script (home.js, etc.)
// =======================================================
"use strict";

// ---------------------------------------------------------
// BASE PAD HELPER
// Bepaalt het relatieve pad terug naar de root op basis van
// de huidige paginalocatie. Pagina's in /routes/ hebben
// een dieper pad dan pagina's in de root.
// Bv: index.html → "" | routes/ninglinspo.html → "../"
// ---------------------------------------------------------
function getBasePath() {
  const depth = window.location.pathname
    .split("/")
    .filter(Boolean).length - 1;
  return depth > 0 ? "../".repeat(depth) : "";
}

// ---------------------------------------------------------
// COMPONENT INJECTIE
// Laadt een HTML-fragment via fetch en injecteert het in
// het opgegeven placeholder-element.
// ---------------------------------------------------------
async function injectComponent(placeholderId, componentPath) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) {
    console.warn(`app.js: placeholder #${placeholderId} niet gevonden`);
    return;
  }

  try {
    const response = await fetch(componentPath);
    if (!response.ok) {
      console.error(`app.js: kon ${componentPath} niet laden (status ${response.status})`);
      return;
    }
    const html = await response.text();
    placeholder.innerHTML = html;
    placeholder.removeAttribute("aria-hidden");
  } catch (error) {
    console.error(`app.js: fout bij laden van ${componentPath}`, error);
  }
}

// ---------------------------------------------------------
// ACTIEVE NAV LINK
// ---------------------------------------------------------
function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll("[data-nav-link]");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && currentPath.endsWith(href)) {
      link.setAttribute("aria-current", "page");
    }
  });
}

// ---------------------------------------------------------
// APP INIT
// ---------------------------------------------------------
async function initApp() {
  const base = getBasePath();

  await Promise.all([
    injectComponent("topbar-placeholder", `${base}components/topbar.html`),
    injectComponent("footer-placeholder", `${base}components/footer.html`),
  ]);

  if (typeof i18nModule !== "undefined" && i18nModule.buildLanguageSwitcher) {
    const selectEl = document.getElementById("languageSwitcher");
    if (selectEl) {
      i18nModule.buildLanguageSwitcher(selectEl);
    }
  }

  setActiveNavLink();
}

document.addEventListener("DOMContentLoaded", initApp);
