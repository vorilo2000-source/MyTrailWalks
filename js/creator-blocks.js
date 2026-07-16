// ======================= CREATOR BLOCKS =======================
"use strict"; // Voorkomt onbedoelde globale variabelen en stille JavaScript-fouten.

// ======================= MOEILIJKHEID BEREKENEN =======================

function calculateDifficulty() { // Berekent automatisch de moeilijkheid van het eerste segment.
  const stats = state.segments[0]?.gpx?.stats; // Leest de GPX-statistieken van het eerste segment.
  const weather = state.segments[0]?.weather; // Leest de weerdata van het eerste segment.

  if (!stats) return null; // Stopt wanneer geen GPX-statistieken beschikbaar zijn.

  let score = 0; // Start de score.

  if (stats.distance_km) score += stats.distance_km; // Verwerkt de afstand.
  if (stats.elevation_up_m) score += stats.elevation_up_m / 100; // Verwerkt de hoogtemeters.

  if (weather) { // Controleert of weerdata aanwezig is.
    if (weather.temperature_max >= 25) score += 2; // Verhoogt de score bij warmte.
    if (weather.precipitation_mm >= 5) score += 2; // Verhoogt de score bij neerslag.
    if (weather.wind_kmh >= 30) score += 1; // Verhoogt de score bij sterke wind.
  }

  if (score <= 5) return "T1"; // Geeft niveau T1 terug.
  if (score <= 10) return "T2"; // Geeft niveau T2 terug.
  if (score <= 16) return "T3"; // Geeft niveau T3 terug.
  if (score <= 22) return "T4"; // Geeft niveau T4 terug.
  if (score <= 28) return "T5"; // Geeft niveau T5 terug.

  return "T6"; // Geeft niveau T6 terug.
}

function applyCalculatedDifficulty() { // Past de berekende moeilijkheid toe.
  const difficulty = calculateDifficulty(); // Berekent de moeilijkheid.

  if (difficulty && !els.inputDifficulty.value) { // Controleert of het veld nog leeg is.
    els.inputDifficulty.value = difficulty; // Vult het moeilijkheidsveld.
    updatePreview(); // Werkt de preview bij.
  }
}

// ======================= LIVE PREVIEW =======================

els.inputTitle.addEventListener("input", updatePreview); // Werkt de preview bij bij titelwijziging.

// ======================= CLOUDINARY =======================

function fixCloudinaryUrl(url, transform = "w_1200,f_auto") { // Normaliseert een Cloudinary-URL.
  if (!url || !url.includes("res.cloudinary.com")) return url; // Laat andere URL's ongewijzigd.
  if (url.includes(transform)) return url; // Voorkomt dubbele transformaties.

  return url.replace("/upload/", `/upload/${transform}/`); // Voegt de transformatie toe.
}

els.inputHeroPhoto.addEventListener("blur", () => { // Corrigeert de URL bij verlaten van het veld.
  const fixed = fixCloudinaryUrl(els.inputHeroPhoto.value.trim()); // Maakt de gecorrigeerde URL.

  if (fixed !== els.inputHeroPhoto.value.trim()) { // Controleert of de URL is gewijzigd.
    els.inputHeroPhoto.value = fixed; // Schrijft de gecorrigeerde URL terug.
  }

  updatePreview(); // Werkt de preview bij.
});

els.inputHeroPhoto.addEventListener("input", updatePreview); // Werkt de preview tijdens invoer bij.

// ======================= PUBLIEKE API =======================

window.calculateDifficulty = calculateDifficulty; // Maakt de functie globaal beschikbaar.
window.applyCalculatedDifficulty = applyCalculatedDifficulty; // Maakt de functie globaal beschikbaar.
window.fixCloudinaryUrl = fixCloudinaryUrl; // Maakt de functie globaal beschikbaar.

// ======================= END CREATOR BLOCKS =======================
