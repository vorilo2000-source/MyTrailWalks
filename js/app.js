// =======================================================
// app.js — v2.1.0
// MyTrailWalks — component injectie (topbar + footer)
// Exporteert window.appReady Promise zodat home.js kan
// wachten tot de componenten geïnjecteerd zijn voordat
// buildLanguageSwitcher() aangeroepen wordt.
// =======================================================
"use strict";

function getBasePath() {
  const depth = window.location.pathname
    .split("/")
    .filter(Boolean).length - 1;
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

async function initApp() {
  const base = getBasePath();
  await Promise.all([
    injectComponent("topbar-placeholder", `${base}components/topbar.html`),
    injectComponent("footer-placeholder", `${base}components/footer.html`),
  ]);
  setActiveNavLink();
}

// window.appReady: Promise die resolvet zodra topbar + footer
// geïnjecteerd zijn. home.js wacht hierop vóór buildLanguageSwitcher().
window.appReady = new Promise((resolve) => {
  document.addEventListener("DOMContentLoaded", () => {
    initApp().then(resolve).catch(resolve); // resolve ook bij fout — pagina blijft werken
  });
});
