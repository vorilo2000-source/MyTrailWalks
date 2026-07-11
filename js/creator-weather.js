// ======================= CREATOR WEATHER =======================
"use strict";

// -----------------------------------------------------------
// WEERDATA VIA OPEN-METEO
// -----------------------------------------------------------
async function fetchWeather(sid) {
  const seg = _getSeg(sid);
  if (!seg) return;
  // Coördinaten komen nu uit seg.gpx.stats
  const date = seg.date;
  const lat  = seg.gpx?.stats?.start_lat;
  const lon  = seg.gpx?.stats?.start_lon;

  if (!date) { alert("Kies eerst een datum voor dit segment."); return; }
  if (!lat || !lon) { alert("Laad eerst een GPX-bestand voor dit segment."); return; }

  const fetchBtn = document.querySelector(`.segment-fetch-weather[data-sid="${sid}"]`);
  if (fetchBtn) { fetchBtn.textContent = "Ophalen…"; fetchBtn.disabled = true; }

  try {
    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(date);
    if (chosenDate >= today) { alert("Weerdata is enkel beschikbaar voor datums in het verleden. Kies een datum vóór vandaag."); return; }

    const url  = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe/Brussels`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      const reason  = errData?.reason || `HTTP ${resp.status}`;
      console.error("[creator.js] Open-Meteo fout:", reason);
      alert(`Weerdata kon niet worden opgehaald: ${reason}`);
      return;
    }

    const data = await resp.json();
    const d    = data.daily;
    if (!d) { alert("Weerdata kon niet worden opgehaald. Open-Meteo gaf geen dagdata terug."); return; }

    const condInp = document.querySelector(`.segment-weather-condition[data-sid="${sid}"]`);
    seg.weather = {
      date,
      temperature_min:  d.temperature_2m_min?.[0]   ?? null,
      temperature_max:  d.temperature_2m_max?.[0]   ?? null,
      precipitation_mm: d.precipitation_sum?.[0]    ?? null,
      wind_kmh:         d.wind_speed_10m_max?.[0]   ?? null,
      condition:        condInp?.value || "",
      source:           "Open-Meteo",
    };

    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set(`w-temp-min-${sid}`, seg.weather.temperature_min  != null ? `${seg.weather.temperature_min}°C`  : "—");
    set(`w-temp-max-${sid}`, seg.weather.temperature_max  != null ? `${seg.weather.temperature_max}°C`  : "—");
    set(`w-precip-${sid}`,   seg.weather.precipitation_mm != null ? `${seg.weather.precipitation_mm} mm` : "—");
    set(`w-wind-${sid}`,     seg.weather.wind_kmh         != null ? `${seg.weather.wind_kmh} km/u`       : "—");

    const weatherBlock = $(`weather-block-${sid}`);
    if (weatherBlock) weatherBlock.hidden = false;

    if (seg.difficultyAuto && seg.gpx) {
      const auto = calculateSegmentDifficulty(seg);
      if (auto) { seg.difficulty = auto; _refreshDifficultyBlock(sid); }
    }
    if (sid === state.segments[0].id) applyCalculatedDifficulty();
    updatePreview();
  } catch (err) {
    console.error("[creator.js] Weerdata fout:", err);
    alert("Weerdata kon niet worden opgehaald. Controleer datum en verbinding.");
  } finally {
    if (fetchBtn) { fetchBtn.textContent = "Weerdata ophalen"; fetchBtn.disabled = false; }
  }
}
window.fetchWeather = fetchWeather;
