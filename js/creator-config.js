// -----------------------------------------------------------
// MOEILIJKHEIDSSCHALEN PER VERVOERSMIDDEL
// -----------------------------------------------------------
const DIFFICULTY_SCALES = {
  walking: [
    { value: "W1", label: "W1 — Vlak (wandelpad, park, heide)" },
    { value: "W2", label: "W2 — Glooiend (bos, polders)" },
    { value: "W3", label: "W3 — Heuvelachtig (onverhard, hellingen)" },
  ],
  hike: [
    { value: "T1", label: "T1 — Wandelen (vlak, gymschoenen volstaan)" },
    { value: "T2", label: "T2 — Bergwandeling (gedeeltelijk steil)" },
    { value: "T3", label: "T3 — Veeleisende bergwandeling (steil terrein)" },
    { value: "T4", label: "T4 — Alpine wandeling (soms handen nodig)" },
    { value: "T5", label: "T5 — Veeleisende alpine wandeling (bergschoenen)" },
    { value: "T6", label: "T6 — Moeilijke alpine wandeling (klimgedeeltes)" },
  ],
  cycling: [
    { value: "C1", label: "C1 — Ontspannen (fietspad, rivierdal)" },
    { value: "C2", label: "C2 — Gemiddeld (landweg, lichte bochten)" },
    { value: "C3", label: "C3 — Pittig (heuvelweg, col met bochten)" },
    { value: "C4", label: "C4 — Zwaar (bergpas, haarspeldbochten)" },
  ],
  motorcycle: [
    { value: "M1", label: "M1 — Verharde weg (lokaal, snelweg, asfalt/beton/klinkers)" },
    { value: "M2", label: "M2 — Toeren / kasseien (landweg of kinderkopjes)" },
    { value: "M3", label: "M3 — Sportief (bergweg met bochten)" },
    { value: "M4", label: "M4 — Uitdagend (alpenpas, haarspeldbochten)" },
  ],
  car: [
    { value: "A1", label: "A1 — Verharde weg (lokaal, snelweg, asfalt/beton/klinkers)" },
    { value: "A2", label: "A2 — Landweg / kasseien (secundaire weg of kinderkopjes)" },
    { value: "A3", label: "A3 — Bergweg (heuvelachtig, col met bochten)" },
    { value: "A4", label: "A4 — Pas (alpenpas, serpentines)" },
  ],
};
window.DIFFICULTY_SCALES = DIFFICULTY_SCALES;
