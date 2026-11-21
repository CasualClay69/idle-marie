"use strict";
// =====================================================
//  SPIELDATEN – Fertigkeiten, Tätigkeiten, Gegenstände, Laden
//  Hier kann man alles einstellen, ohne die Spiel-Logik anzufassen.
//
//  Jede Fertigkeit geht bis Stufe 99. Jede Tätigkeit (z.B. "Birke fällen") hat
//  zusätzlich eine eigene Übungs-Stufe (⭐ bis 99): je mehr Übung, desto öfter gibt es
//  doppelte Ausbeute, und als Meister (⭐ 99) geht es schneller.
// =====================================================

const SPIEL = {
  maxStufe: 99,
  offlineMaxStunden: 12,      // so lange arbeitet die Figur weiter, wenn das Spiel zu ist
  bankStart: 24,              // freie Bankfächer am Anfang
  uebungDoppeltProZehn: 0.05, // je 10 Übungs-Stufen +5 % Chance auf doppelte Ausbeute
  meisterSchneller: 0.2,      // Übung 99: 20 % schneller
};

// Stufen der Materialien: ab welcher Stufe, Farbe des Symbols
const STUFEN = [1, 10, 20, 30, 45, 60, 75, 90];
const TIER_FARBEN = ["#c9a27a", "#e8d8b0", "#ff9fb8", "#f2a65a", "#8fcf7a", "#b48cff", "#ffd54f", "#7ad7f0"];

const FERTIGKEITEN = [
  { id: "holz",      name: "Holz­sammeln", icon: "🌳", art: "sammeln", farbe: "#7cc36b", werkzeug: "axt",
    tun: "sammelt Holz" },
  { id: "angeln",    name: "Angeln",      icon: "🎣", art: "sammeln", farbe: "#5fb7e8", werkzeug: "angel",
    tun: "angelt" },
  { id: "bergbau",   name: "Bergbau",     icon: "⛏️", art: "sammeln", farbe: "#a78a72", werkzeug: "hacke",
    tun: "sucht Erz" },
  { id: "kochen",    name: "Kochen",      icon: "🍳", art: "machen",  farbe: "#ff9f5a", tun: "kocht" },
  { id: "schmieden", name: "Schmieden",   icon: "🔨", art: "machen",  farbe: "#9aa3b5", tun: "schmiedet" },
  { id: "schnitzen", name: "Schnitzen",   icon: "🪚", art: "machen",  farbe: "#c98f5a", tun: "schnitzt" },
];

// ----- Gegenstände -----
// art bestimmt das gezeichnete Symbol (siehe symbole.js), farbe die Färbung, wert = Verkaufspreis in Münzen
const GEGENSTAENDE = {};
function gegenstand(id, name, art, farbe, wert, extra = {}) {
  GEGENSTAENDE[id] = { id, name, art, farbe, wert, ...extra };
}

const HOLZ = ["Ästchen", "Birkenholz", "Kirschholz", "Ahornholz", "Eichenholz", "Zauberholz", "Sternenholz", "Regenbogenholz"];
const BAEUME = ["Busch", "Birke", "Kirschbaum", "Ahorn", "Eiche", "Zauberbaum", "Sternenbaum", "Regenbogenbaum"];
const FISCHE = ["Stichling", "Forelle", "Karpfen", "Lachs", "Thunfisch", "Kugelfisch", "Tintenfisch", "Goldfisch"];
const GERICHTE = ["Stichling-Happen", "Gebratene Forelle", "Karpfen-Suppe", "Lachs-Teller", "Thunfisch-Steak", "Kugelfisch-Bällchen", "Tintenfisch-Ringe", "Goldfisch-Festmahl"];
const ERZE = ["Kupfer", "Eisen", "Silber", "Gold", "Kristall", "Mondstein", "Sternenstein", "Regenbogenstein"];
const WERTE = [1, 3, 6, 12, 25, 50, 100, 200];
const XP = [10, 17, 25, 37, 55, 80, 110, 150];
const ZEIT = [3, 3.5, 4, 4.5, 5, 5.5, 6, 7];

HOLZ.forEach((n, i) => gegenstand(`holz${i}`, n, "holz", TIER_FARBEN[i], WERTE[i]));
FISCHE.forEach((n, i) => gegenstand(`fisch${i}`, n, "fisch", TIER_FARBEN[i], WERTE[i] + 1));
GERICHTE.forEach((n, i) => gegenstand(`essen${i}`, n, "essen", TIER_FARBEN[i], WERTE[i] * 3, { heilt: [10, 20, 30, 45, 60, 80, 100, 130][i] }));
ERZE.forEach((n, i) => gegenstand(`erz${i}`, n === "Kristall" ? "Kristall" : `${n}erz`, "erz", TIER_FARBEN[i], WERTE[i] + 1));
ERZE.forEach((n, i) => gegenstand(`barren${i}`, `${n}barren`, "barren", TIER_FARBEN[i], WERTE[i] * 4));

// Schnitzereien: aus Holz entstehen kleine Kunstwerke (später auch Bögen und Zauberstäbe)
const SCHNITZEREIEN = [
  ["Holzlöffel", "🥄"], ["Flöte", "🪈"], ["Spielzeugpferd", "🐴"], ["Holzschale", "🥣"],
  ["Holzschwert", "🗡️"], ["Zauberstab", "🪄"], ["Sternen-Mobile", "🌟"], ["Regenbogen-Harfe", "🎵"],
];
SCHNITZEREIEN.forEach(([n, e], i) => gegenstand(`schnitz${i}`, n, "emoji", TIER_FARBEN[i], WERTE[i] * 5, { emoji: e }));

// ----- Tätigkeiten -----
const TAETIGKEITEN = [];
function taetigkeit(t) { TAETIGKEITEN.push(t); }

for (let i = 0; i < 8; i++) {
  taetigkeit({ id: `holz-${i}`, fertigkeit: "holz", name: BAEUME[i], stufe: STUFEN[i], xp: XP[i], zeit: ZEIT[i],
    gibt: { [`holz${i}`]: 1 }, ort: ["🌿", "🌳", "🌸", "🍁", "🌳", "✨", "⭐", "🌈"][i] });
  taetigkeit({ id: `angeln-${i}`, fertigkeit: "angeln", name: FISCHE[i], stufe: STUFEN[i], xp: XP[i], zeit: ZEIT[i] + 0.5,
    gibt: { [`fisch${i}`]: 1 } });
  taetigkeit({ id: `bergbau-${i}`, fertigkeit: "bergbau", name: GEGENSTAENDE[`erz${i}`].name, stufe: STUFEN[i], xp: XP[i], zeit: ZEIT[i],
    gibt: { [`erz${i}`]: 1 } });
  taetigkeit({ id: `kochen-${i}`, fertigkeit: "kochen", name: GERICHTE[i], stufe: STUFEN[i], xp: Math.round(XP[i] * 1.2), zeit: 3,
    braucht: { [`fisch${i}`]: 1 }, gibt: { [`essen${i}`]: 1 } });
  taetigkeit({ id: `schmieden-${i}`, fertigkeit: "schmieden", name: GEGENSTAENDE[`barren${i}`].name, stufe: STUFEN[i],
    xp: Math.round(XP[i] * (i < 2 ? 1.2 : 2.2)), zeit: 3,
    braucht: { [`erz${i}`]: i < 2 ? 1 : 2 }, gibt: { [`barren${i}`]: 1 } });
  taetigkeit({ id: `schnitzen-${i}`, fertigkeit: "schnitzen", name: SCHNITZEREIEN[i][0], stufe: STUFEN[i],
    xp: Math.round(XP[i] * 1.8), zeit: 2.5, braucht: { [`holz${i}`]: 2 }, gibt: { [`schnitz${i}`]: 1 } });
}

// ----- Werkzeuge (im Laden): jede Stufe macht die Sammel-Fertigkeit 5 % schneller -----
const WERKZEUG_STUFEN = [
  { name: "Kupfer",   preis: 50,      stufe: 1 },
  { name: "Eisen",    preis: 750,     stufe: 10 },
  { name: "Silber",   preis: 4000,    stufe: 20 },
  { name: "Gold",     preis: 15000,   stufe: 30 },
  { name: "Kristall", preis: 60000,   stufe: 45 },
  { name: "Mondstein", preis: 250000, stufe: 60 },
  { name: "Sternen",  preis: 1000000, stufe: 75 },
];
const WERKZEUGE = {
  axt:   { name: "Axt",        icon: "🪓", fertigkeit: "holz" },
  angel: { name: "Angel",      icon: "🎣", fertigkeit: "angeln" },
  hacke: { name: "Spitzhacke", icon: "⛏️", fertigkeit: "bergbau" },
};
const WERKZEUG_BONUS = 0.05;

// Bankfächer: jedes weitere Fach wird etwas teurer
function bankFachPreis(gekauft) {
  return Math.round(100 * Math.pow(1.18, gekauft) / 10) * 10;
}
