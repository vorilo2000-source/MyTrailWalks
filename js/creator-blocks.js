<!-- ======================= CREATOR BLOCKS ======================= -->
```javascript
// ======================= CREATOR BLOCKS =======================
"use strict"; // Voorkomt onbedoelde globale variabelen en stille JavaScript-fouten.

// ======================= MOEILIJKHEID BEREKENEN =======================

function calculateDifficulty() { // Berekent automatisch de moeilijkheid van het eerste segment.
  const stats = state.segments[0]?.gpx?.stats; // Leest de GPX-statistieken van het eerste segment.
  const weather = state.segments[0]?.weather; // Leest de weerdata van het eerste segment.

  if (!stats) return null; // Stopt wanneer geen GPX-statistieken beschikbaar zijn.

  let score = 0; // Start de score.

  if (stats.distance_km) score += stats.distance_km; // Afstand.
  if (stats.elevation_up_m) score += stats.elevation_up_m / 100; // Hoogtemeters.

  if (weather) {
    if (weather.temperature_max >= 25) score += 2; // Warm.
    if (weather.precipitation_mm >= 5) score += 2; // Regen.
    if (weather.wind_kmh >= 30) score += 1; // Wind.
  }

  if (score <= 5) return "T1";
  if (score <= 10) return "T2";
  if (score <= 16) return "T3";
  if (score <= 22) return "T4";
  if (score <= 28) return "T5";
  return "T6";
}

function applyCalculatedDifficulty() { // Past de berekende moeilijkheid toe.
  const difficulty = calculateDifficulty();

  if (difficulty && !els.inputDifficulty.value) {
    els.inputDifficulty.value = difficulty;
    updatePreview();
  }
}

// ======================= LIVE PREVIEW =======================

els.inputTitle.addEventListener("input", updatePreview); // Titel direct verversen.

// ======================= CLOUDINARY =======================

function fixCloudinaryUrl(url, transform = "w_1200,f_auto") { // Normaliseert Cloudinary URL's.
  if (!url || !url.includes("res.cloudinary.com")) return url;
  if (url.includes(transform)) return url;

  return url.replace("/upload/", `/upload/${transform}/`);
}

els.inputHeroPhoto.addEventListener("blur", () => {
  const fixed = fixCloudinaryUrl(els.inputHeroPhoto.value.trim());

  if (fixed !== els.inputHeroPhoto.value.trim()) {
    els.inputHeroPhoto.value = fixed;
  }

  updatePreview();
});

els.inputHeroPhoto.addEventListener("input", updatePreview);

// ======================= PUBLIEKE API =======================

window.calculateDifficulty = calculateDifficulty;
window.applyCalculatedDifficulty = applyCalculatedDifficulty;
window.fixCloudinaryUrl = fixCloudinaryUrl;

// ======================= END CREATOR BLOCKS =======================
```
