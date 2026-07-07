// ======================= ROUTE CONFIG =======================
// Centrale labels en kleuren voor route.html en later creator-preview.
"use strict";

// ======================= TRANSPORT KLEUREN =======================
// Kleur per vervoersmiddel. Deze kleuren worden gebruikt voor kaartlijnen en segmentheaders.
window.TRANSPORT_COLORS = {
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

// ======================= TRANSPORT LABELS =======================
// Label per vervoersmiddel. De key blijft belangrijk voor bestaande JSON-bestanden.
window.TRANSPORT_LABELS = {
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

// ======================= ROUTE TRANSLATE HELPER =======================
// Veilige vertaalfunctie. Valt terug op de key als i18n niet beschikbaar is.
window.routeTranslate = function routeTranslate(key) {
  try {
    return i18nModule.t(`route:${key}`);
  } catch (_) {
    return key;
  }
};
