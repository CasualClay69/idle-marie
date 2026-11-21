"use strict";
// =====================================================
//  ABENTEUER-PFADE – Daten
//  Ein Pfad = mehrere Monster hintereinander, dann der Gebiets-Chef und zum Schluss ein
//  Pfad-Wächter. Danach gibt es eine Schatztruhe, und der Pfad beginnt von vorn.
//  Frei, sobald der Chef des Gebiets einmal eingeschlafen ist.
// =====================================================

const PFAD_WAECHTER = {
  wiese:  { id: "hummelkoenigin", name: "Hummel­königin", plus: 8,  aussehen: { farbe: "#ffcc33", fluegel: true, extra: "krone" } },
  wald:   { id: "eichenriese",    name: "Uralter Eichen­riese", plus: 10, aussehen: { farbe: "#6e5236", hoerner: true, extra: "blaetter" } },
  burg:   { id: "gespensterkoenigin", name: "Gespenster­königin", plus: 10, aussehen: { farbe: "#f3eaff", form: "geist", extra: "krone" } },
  feuer:  { id: "lavagolem",      name: "Lava­golem", plus: 10, aussehen: { farbe: "#b8452e", form: "rund", extra: "flamme" } },
  eis:    { id: "eisdrache",      name: "Eis­drache", plus: 10, aussehen: { farbe: "#9ad8f5", hoerner: true, fluegel: "drache", extra: "flocken" } },
  wolken: { id: "sternenwal",     name: "Sternen­wal", plus: 12, aussehen: { farbe: "#5a6fd6", form: "wolke", extra: "sterne" } },
};

const PFADE = [
  { id: "p-wiese",  gebiet: "wiese",  name: "Pusteblumen-Pfad", icon: "🌼" },
  { id: "p-wald",   gebiet: "wald",   name: "Flüsterpfad",      icon: "🌲" },
  { id: "p-burg",   gebiet: "burg",   name: "Spukgang",         icon: "🏰" },
  { id: "p-feuer",  gebiet: "feuer",  name: "Glutpfad",         icon: "🌋" },
  { id: "p-eis",    gebiet: "eis",    name: "Frostpfad",        icon: "❄️" },
  { id: "p-wolken", gebiet: "wolken", name: "Sternenpfad",      icon: "☁️" },
];

const PFAD_REGEL = { rahmenChance: 0.2, kikiChance: 1 / 25 };

PFADE.forEach((p, i) => {
  const g = GEBIETE.find(x => x.id === p.gebiet);
  const chef = g.monster.find(m => m.chef);
  const normal = g.monster.filter(m => !m.chef);
  // Wächter: stärker als der Chef
  const w = PFAD_WAECHTER[p.gebiet];
  const L = chef.stufe + w.plus;
  MONSTER[w.id] = {
    id: w.id, name: w.name, stufe: L, aussehen: w.aussehen, gebiet: p.gebiet, chef: true, waechter: true,
    hp: Math.round((15 + L * 7 + L * L * 0.1) * 3), maxSchlag: Math.round((2 + L * 1.6) * 1.35),
    genauigkeit: Math.round((L + 8) * (52 + L * 0.6)), ausweichen: Math.round((L + 8) * (64 + L * 0.8)), tempo: 3.2,
    muenzen: [L * 10, L * 30], beute: [],
  };
  p.liste = [...normal.flatMap(m => [m.id, m.id]), chef.id, w.id];
  p.chef = chef.id;
  p.waechter = w.id;
  p.stufe = L;
  // Pfad-Rahmen für den Kleiderschrank (aus der Truhe)
  p.rahmenId = `rp${i}`;
  RAHMEN.push({ id: p.rahmenId, name: `${p.name}-Rahmen`, icon: p.icon, pfad: p.name, svg: emojiRahmen(g.farbe, [p.icon, "🗝️"]) });
  // Inhalt der Schatztruhe
  p.truhe = {
    muenzen: [L * 8, L * 16],   // nicht zu viel – sonst wären Laden und Werkzeuge zu schnell gekauft
    sachen: [
      { id: g.beute[0], anzahl: [10, 20] },
      { id: g.beute[1], anzahl: [3, 6] },
      { id: `barren${Math.min(7, i + 1)}`, anzahl: [3, 8] },
      { id: `essen${Math.min(7, i + 1)}`, anzahl: [5, 10] },
    ],
  };
});

// Neues Haustier aus den Schatztruhen
HAUSTIERE.push({ id: "kiki", name: "Kiki", tier: "Papagei", emoji: "🦜", truhe: true, bonus: { art: "muenzen", wert: 0.1 }, text: "+10 % Münzen von Monstern" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}
erfolg({ id: "pfad-1", icon: "🗺️", name: "Pfadfinderin", text: "Schaffe deinen ersten Abenteuer-Pfad", ziel: 1, muenzen: 2000, wert: () => spiel.statistik.truhen || 0 });
erfolg({ id: "pfad-alle", icon: "🗺️", name: "Alle Wege gegangen", text: "Schaffe jeden der 6 Abenteuer-Pfade", ziel: PFADE.length, muenzen: 2000000,
  wert: () => PFADE.filter(p => spiel.pfade?.[p.id]).length });
erfolg({ id: "truhen-100", icon: "🧰", name: "Schatzsucherin", text: "Öffne 100 Schatztruhen", ziel: 100, muenzen: 500000, wert: () => spiel.statistik.truhen || 0 });
