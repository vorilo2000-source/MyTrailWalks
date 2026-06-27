// =======================================================
// app.js — v3.1.0
// MyTrailWalks — centrale init: i18n + componenten
// =======================================================
// Wijziging v3.0.0: robuuste init-volgorde
//   1. i18next initialiseren met alle vaste namespaces
//   2. topbar + footer injecteren
//   3. window.i18nReady + window.appReady exporteren
//   Paginascripts wachten op window.appReady.
//   topbar-auth.js wacht op window.i18nReady.
//   home.js en creator.js roepen geen i18nModule.init() meer aan.
// =======================================================
"use strict";

function getBasePath() {
  const segments = window.location.pathname
    .split("/")
    .filter(Boolean)
    .filter((seg) => !seg.endsWith(".html"));
  const depth = Math.max(0, segments.length - 1);
  return depth > 0 ? "../".repeat(depth) : "";
}

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

function setActiveNavLink() {
  const currentPath = window.location.pathname;
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href && currentPath.endsWith(href)) {
      link.setAttribute("aria-current", "page");
    }
  });
}

// Detecteer huidige paginanaam voor namespace
function getPageNamespace() {
  const path = window.location.pathname;
  if (path.includes("creator")) return "creator";
  if (path.includes("wandelingen")) return "wandelingen";
  if (path.includes("route")) return "route";
  return "home";
}

async function initApp() {
  const base = getBasePath();

  // 1. i18next initialiseren — altijd common + auth + paginaspecifieke namespace
  const pageNs = getPageNamespace();
  const namespaces = ["common", "auth", pageNs];

  try {
    await i18nModule.init(namespaces);
  } catch (error) {
    console.error("app.js: i18n init mislukt", error);
  }

  // 2. i18nReady resolven — topbar-auth.js wacht hierop
  if (window._i18nResolve) window._i18nResolve();

  // 3. Componenten injecteren
  await Promise.all([
    injectComponent("topbar-placeholder", `${base}components/topbar.html`),
    injectComponent("footer-placeholder", `${base}components/footer.html`),
  ]);

  // 4. Vertalingen toepassen + nav links
  i18nModule.applyTranslations();
  setActiveNavLink();

  // 5. Taalwisselaar vullen
  const selectEl = document.getElementById("languageSwitcher");
  if (selectEl) {
    i18nModule.buildLanguageSwitcher(selectEl);
  }
}

// window.i18nReady: resolvet zodra i18next klaar is
// topbar-auth.js wacht hierop vóór modal te renderen
window.i18nReady = new Promise((resolve) => {
  window._i18nResolve = resolve;
});

// window.appReady: resolvet zodra i18n + componenten klaar zijn
window.appReady = new Promise((resolve) => {
  document.addEventListener("DOMContentLoaded", () => {
    initApp().then(resolve).catch(resolve);
  });
});
