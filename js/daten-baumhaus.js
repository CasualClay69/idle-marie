"use strict";
// =====================================================
//  BAUMHAUS – Daten
//  Neue Fertigkeit "Bauen": aus Holz Bretter sägen (normale Tätigkeiten) und damit im
//  Baumhaus 12 Plätze einrichten. Jeder Platz hat 5 Stufen; jede Stufe gibt einen Dauer-Bonus.
//  Zuerst muss die Plattform stehen, dann geht alles andere.
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "traenke") + 1, 0,
  { id: "bauen", name: "Bauen", icon: "🔨", art: "machen", farbe: "#c9a27a", tun: "baut" });

// ----- Bretter sägen -----
const BRETTER = ["Ast-Bündel", "Birkenbrett", "Kirschbrett", "Ahornbrett", "Eichenbrett", "Zauberbrett", "Sternenbrett", "Regenbogenbrett"];
BRETTER.forEach((name, i) => {
  gegenstand(`brett${i}`, name, "brett", TIER_FARBEN[i], WERTE[i] * 3);
  taetigkeit({ id: `bauen-${i}`, fertigkeit: "bauen", name, stufe: STUFEN[i], xp: Math.round(XP[i] * 1.4), zeit: 3,
    braucht: { [`holz${i}`]: 2 }, gibt: { [`brett${i}`]: 1 } });
});

// ----- Die 5 Stufen eines Platzes -----
const BAU_STUFEN = [
  { vorsilbe: "Ast",        bauen: 1,  brett: 0, barren: 0, bretter: 10,  barrenAnzahl: 0,  muenzen: 200,     xp: 150 },
  { vorsilbe: "Birken",     bauen: 10, brett: 1, barren: 1, bretter: 25,  barrenAnzahl: 8,  muenzen: 3000,    xp: 1200 },
  { vorsilbe: "Ahorn",      bauen: 30, brett: 3, barren: 3, bretter: 50,  barrenAnzahl: 15, muenzen: 40000,   xp: 8000 },
  { vorsilbe: "Zauber",     bauen: 60, brett: 5, barren: 5, bretter: 100, barrenAnzahl: 30, muenzen: 400000,  xp: 50000 },
  { vorsilbe: "Regenbogen", bauen: 90, brett: 7, barren: 7, bretter: 200, barrenAnzahl: 60, muenzen: 4000000, xp: 300000 },
];

// bonus: art + Wert je Stufe. Texte mit {w} = Wert
const BAUPLAETZE = [
  { id: "plattform", name: "Plattform", emoji: "🪵", bonus: { art: "bank", werte: [5, 10, 15, 20, 30] }, text: "+{w} Bankfächer", ohneBarren: true },
  { id: "dach",      name: "Dach",      emoji: "🏠", bonus: { art: "xp", werte: [1, 2, 3, 4, 6] }, text: "+{w} % Erfahrung bei allem" },
  { id: "leiter",    name: "Leiter",    emoji: "🪜", bonus: { art: "sammeln", werte: [2, 4, 6, 8, 10] }, text: "Sammeln {w} % schneller", ohneBarren: true },
  { id: "bett",      name: "Bett",      emoji: "🛏️", bonus: { art: "offline", werte: [1, 2, 4, 6, 12] }, text: "+{w} Std. Offline-Zeit" },
  { id: "werkbank",  name: "Werkbank",  emoji: "🛠️", bonus: { art: "machen", werte: [2, 4, 6, 8, 10] }, text: "Herstellen {w} % schneller" },
  { id: "regal",     name: "Regal",     emoji: "📚", bonus: { art: "doppelt", werte: [1, 2, 3, 4, 5] }, text: "+{w} % doppelte Ausbeute" },
  { id: "kamin",     name: "Kamin",     emoji: "🔥", bonus: { art: "heilen", werte: [5, 10, 15, 20, 30] }, text: "Essen heilt {w} % mehr" },
  { id: "teleskop",  name: "Teleskop",  emoji: "🔭", bonus: { art: "tier", werte: [10, 20, 30, 40, 60] }, text: "Haustiere {w} % öfter finden" },
  { id: "blumen",    name: "Blumenkasten", emoji: "🌷", bonus: { art: "garten", werte: [5, 10, 15, 20, 25] }, text: "Garten wächst {w} % schneller", ohneBarren: true },
  { id: "truhe",     name: "Schatztruhe", emoji: "🧰", bonus: { art: "muenzen", werte: [5, 10, 15, 20, 30] }, text: "+{w} % Münzen von Monstern" },
  { id: "puppe",     name: "Übungspuppe", emoji: "🎯", bonus: { art: "kampfxp", werte: [5, 10, 15, 20, 30] }, text: "+{w} % Kampf-Erfahrung" },
  { id: "haengematte", name: "Hängematte", emoji: "🪢", bonus: { art: "verschnaufen", werte: [2, 4, 6, 8, 10] }, text: "+{w} % Herzen nach jedem Sieg", ohneBarren: true },
];

// Kosten einer Stufe (0 … 4) eines Platzes
function bauKosten(platz, k) {
  const s = BAU_STUFEN[k];
  const sachen = { [`brett${s.brett}`]: s.bretter };
  if (!platz.ohneBarren && s.barrenAnzahl) sachen[`barren${s.barren}`] = s.barrenAnzahl;
  return { sachen, muenzen: s.muenzen, stufe: s.bauen, xp: s.xp };
}
const bauName = (platz, k) => `${BAU_STUFEN[k].vorsilbe}-${platz.name}`;
const bauBonusText = (platz, k) => platz.text.replace("{w}", platz.bonus.werte[k]);

// ----- Neues Haustier fürs Bauen -----
HAUSTIERE.push({ id: "klopfi", name: "Klopfi", tier: "Specht", emoji: "🐦", fertigkeit: "bauen", bonus: { art: "schneller", wert: 0.05 }, text: "Bauen 5 % schneller" });
// Erfolg "alle Haustiere" zählt das neue Tier mit
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}
// Erfolge fürs Baumhaus
erfolg({ id: "baumhaus-alle", icon: "🏡", name: "Fertiges Baumhaus", text: "Richte alle 12 Plätze im Baumhaus ein", ziel: 12, muenzen: 50000,
  wert: () => BAUPLAETZE.filter(p => (spiel.baumhaus?.[p.id] || 0) > 0).length });
erfolg({ id: "baumhaus-regenbogen", icon: "🌈", name: "Regenbogen-Baumhaus", text: "Bau alle 12 Plätze bis zur Regenbogen-Stufe aus", ziel: 60, muenzen: 10000000,
  wert: () => BAUPLAETZE.reduce((s, p) => s + (spiel.baumhaus?.[p.id] || 0), 0) });
