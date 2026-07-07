"use strict";

const TRANSPORT_COLORS = {
  walking: "#E8800A",
  hike: "#9B59B6",
  cycling: "#2980B9",
  motorcycle: "#E74C3C",
  car: "#16A085",
  train: "#F39C12",
  bus: "#8E44AD",
  boat: "#1ABC9C",
  plane: "#2C3E50"
};

const TRANSPORT_LABELS = {
  walking: "🚶 Wandelen",
  hike: "🥾 Hike / Trail",
  cycling: "🚴 Fietsen",
  motorcycle: "🏍 Motor",
  car: "🚗 Auto",
  train: "🚆 Trein",
  bus: "🚌 Bus",
  boat: "⛵ Boot",
  plane: "✈️ Vliegtuig"
};

function t(key) {
    try {
        return i18nModule.t(`route:${key}`);
    }
    catch (_) {
        return key;
    }
}

window.TRANSPORT_COLORS = TRANSPORT_COLORS;
window.TRANSPORT_LABELS = TRANSPORT_LABELS;
window.routeTranslate = t;
