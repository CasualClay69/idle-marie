"use strict";
// =====================================================
//  SCHMUCK – Daten
//  Beim Bergbau findet man manchmal Edelsteine. Beim Goldschmieden werden daraus mit Barren
//  Ringe und Ketten – zwei neue Ausrüstungsplätze. Jeder Edelstein hat seine eigene Kraft.
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "schmieden") + 1, 0,
  { id: "schmuck", name: "Goldschmieden", icon: "💍", art: "machen", farbe: "#f5b942", tun: "macht Schmuck" });

PLAETZE.push({ id: "ring", name: "Ring", icon: "💍" }, { id: "kette", name: "Kette", icon: "📿" });
const KAMPF_PLAETZE = ["waffe", "helm", "schild", "ruestung"];   // die "echte" Rüstung (für Aufträge und Erfolge)

const SCHMUCK = { edelsteinChance: 0.05 };   // pro Bergbau-Durchgang

// art: welcher Bonus (siehe schmuckBonus in logik.js) · ring/kette: Wert in Prozent
const EDELSTEINE = [
  { name: "Bernstein",  farbe: "#f2a33a", art: "sammeln", ring: 3,  kette: 5,  text: "Sammeln {w} % schneller" },
  { name: "Rosenquarz", farbe: "#ffb3c8", art: "herzen",  ring: 5,  kette: 8,  text: "+{w} % Herzen" },
  { name: "Amethyst",   farbe: "#b48cff", art: "xp",      ring: 2,  kette: 4,  text: "+{w} % Erfahrung bei allem" },
  { name: "Topas",      farbe: "#7ad7f0", art: "machen",  ring: 4,  kette: 6,  text: "Herstellen {w} % schneller" },
  { name: "Smaragd",    farbe: "#4fc27a", art: "doppelt", ring: 4,  kette: 6,  text: "+{w} % doppelte Ausbeute" },
  { name: "Saphir",     farbe: "#4a7fe0", art: "treff",   ring: 8,  kette: 12, text: "+{w} % öfter treffen" },
  { name: "Rubin",      farbe: "#e8344a", art: "kraft",   ring: 8,  kette: 12, text: "+{w} % stärkerer Schlag" },
  { name: "Diamant",    farbe: "#e8f6ff", art: "xp",      ring: 6,  kette: 10, text: "+{w} % Erfahrung bei allem" },
];

EDELSTEINE.forEach((e, i) => {
  const stein = `stein${i}`;
  gegenstand(stein, e.name, "edelstein", e.farbe, WERTE[i] * 15);
  for (const [art, name, barren, steine, plus, faktor] of [["ring", "ring", 2, 1, 0, 10], ["kette", "Kette", 3, 2, 5, 16]]) {
    const id = `${art}${i}`;
    const wert = e[art];
    gegenstand(id, `${e.name}-${art === "ring" ? "Ring" : "Kette"}`, art, e.farbe, WERTE[i] * 40 * steine, {
      platz: art, braucht: { schmuck: Math.min(99, STUFEN[i] + plus) },
      bonus: { treff: 0, kraft: 0, abwehr: 0, weniger: 0 },
      schmuck: { art: e.art, wert: wert / 100 }, schmuckText: e.text.replace("{w}", wert),
    });
    taetigkeit({ id: `schmuck-${id}`, fertigkeit: "schmuck", name: GEGENSTAENDE[id].name, stufe: Math.min(99, STUFEN[i] + plus),
      xp: Math.round(XP[i] * faktor), zeit: 4, braucht: { [`barren${i}`]: barren, [stein]: steine }, gibt: { [id]: 1 } });
  }
});

// Edelsteine auch in den Schatztruhen der Abenteuer-Pfade
PFADE.forEach((p, i) => p.truhe.sachen.push({ id: `stein${Math.min(7, i + 2)}`, anzahl: [1, 3] }));

// Erfolge
erfolg({ id: "schmuck-1", icon: "💎", name: "Glitzerfund", text: "Finde deinen ersten Edelstein beim Bergbau", ziel: 1, muenzen: 300,
  wert: () => EDELSTEINE.reduce((s, _, i) => s + (spiel.zaehler?.[`stein${i}`] || 0), 0) });
erfolg({ id: "schmuck-voll", icon: "💍", name: "Schick gemacht", text: "Trag einen Ring und eine Kette", ziel: 2, muenzen: 2000,
  wert: () => ["ring", "kette"].filter(p => spiel.ausruestung?.[p]).length });
erfolg({ id: "schmuck-diamant", icon: "💎", name: "Diamanten-Prinzessin", text: "Trag einen Diamant-Ring und eine Diamant-Kette", ziel: 2, muenzen: 1000000,
  wert: () => (spiel.ausruestung?.ring === "ring7" ? 1 : 0) + (spiel.ausruestung?.kette === "kette7" ? 1 : 0) });
