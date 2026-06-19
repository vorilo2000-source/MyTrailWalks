// =======================================================
// i18n.js — v1.2.0
// MyTrailWalks — wrapper rond i18next (T0-005)
// Wijziging v1.2.0: loadPath dynamisch op basis van paginadiepte
// zodat zowel root-pagina's (index.html) als submap-pagina's
// (routes/ninglinspo.html) correct de JSON-bestanden vinden.
// =======================================================
"use strict";

const SUPPORTED_LANGUAGES = ["nl", "en"];
const FALLBACK_LANGUAGE = "en";
const DEFAULT_LANGUAGE = "nl";

// ---------------------------------------------------------
// BASE PAD HELPER
// Bepaalt het relatieve pad terug naar de root op basis van
// de huidige paginalocatie.
// index.html (diepte 0) → ""
// routes/ninglinspo.html (diepte 1) → "../"
// ---------------------------------------------------------
function getBasePath() {
  const depth = window.location.pathname
    .split("/")
    .filter(Boolean).length - 1;
  return depth > 0 ? "../".repeat(depth) : "";
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(src);
    script.onerror = () => reject(new Error(`i18n.js: kon script niet laden: ${src}`));
    document.head.appendChild(script);
  });
}

function init(initialNamespaces) {
  const namespaces = ["common"].concat(initialNamespaces || []);
  const base = getBasePath();

  return new Promise((resolve, reject) => {
    i18next
      .use(i18nextHttpBackend)
      .use(i18nextBrowserLanguageDetector)
      .init(
        {
          supportedLngs: SUPPORTED_LANGUAGES,
          fallbackLng: FALLBACK_LANGUAGE,
          lng: undefined,
          ns: namespaces,
          defaultNS: namespaces[namespaces.length - 1],
          backend: {
            // Dynamisch pad: werkt correct vanuit root én submappen
            loadPath: `${base}data/i18n/{{lng}}/{{ns}}.json`,
          },
          detection: {
            order: ["localStorage", "querystring", "navigator"],
            lookupLocalStorage: "mtw_language",
            caches: ["localStorage"],
          },
          interpolation: {
            escapeValue: false,
          },
        },
        (error) => {
          if (error) {
            console.error("i18n.js: i18next init mislukt", error);
            reject(error);
            return;
          }
          resolve();
        }
      );
  });
}

function loadNamespace(namespace) {
  return new Promise((resolve, reject) => {
    i18next.loadNamespaces(namespace, (error) => {
      if (error) {
        console.error(`i18n.js: kon namespace "${namespace}" niet laden`, error);
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function t(key) {
  return i18next.t(key);
}

function applyTranslations(root) {
  const scope = root || document;

  scope.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = t(key);
    if (value && value !== key) {
      element.textContent = value;
    } else {
      console.error(`i18n.js: key "${key}" niet gevonden`);
    }
  });

  scope.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria");
    const value = t(key);
    if (value && value !== key) {
      element.setAttribute("aria-label", value);
    } else {
      console.error(`i18n.js: aria-key "${key}" niet gevonden`);
    }
  });
}

function changeLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.error(`i18n.js: taal "${lang}" wordt niet ondersteund`);
    return Promise.reject(new Error(`Unsupported language: ${lang}`));
  }

  return new Promise((resolve, reject) => {
    i18next.changeLanguage(lang, (error) => {
      if (error) {
        console.error(`i18n.js: taalwissel naar "${lang}" mislukt`, error);
        reject(error);
        return;
      }
      try {
        localStorage.setItem("mtw_language", lang);
      } catch (e) {
        console.warn("i18n.js: kon taalvoorkeur niet opslaan in localStorage", e);
      }
      applyTranslations();
      resolve(lang);
    });
  });
}

const LANGUAGE_LABELS = {
  nl: "Nederlands",
  en: "English",
};

function buildLanguageSwitcher(selectEl) {
  if (!selectEl) {
    console.error("i18n.js: buildLanguageSwitcher — geen <select> element meegegeven");
    return;
  }

  const activeLang = i18next.language || DEFAULT_LANGUAGE;
  selectEl.innerHTML = "";

  SUPPORTED_LANGUAGES.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = LANGUAGE_LABELS[lang] || lang.toUpperCase();
    if (lang === activeLang || activeLang.startsWith(lang)) {
      option.selected = true;
    }
    selectEl.appendChild(option);
  });

  selectEl.addEventListener("change", (event) => {
    changeLanguage(event.target.value).catch(() => {});
  });
}

window.i18nModule = {
  init,
  loadNamespace,
  applyTranslations,
  t,
  loadScript,
  changeLanguage,
  buildLanguageSwitcher,
  SUPPORTED_LANGUAGES,
  FALLBACK_LANGUAGE,
  DEFAULT_LANGUAGE,
};
