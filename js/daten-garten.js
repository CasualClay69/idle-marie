"use strict";
// =====================================================
//  GARTEN & ZAUBERTRÄNKE – Daten
//
//  Gärtnern läuft NEBENHER: Samen wachsen in echter Zeit in den Beeten, auch wenn die
//  Figur gerade etwas anderes macht oder das Spiel zu ist. Fertig = ernten.
//  Zaubertränke ist eine normale Fertigkeit (braucht Kräuter aus dem Garten + Abenteuer-Beute).
//  Ein getrunkener Trank wirkt eine bestimmte Anzahl Male ("Ladungen").
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "kochen"), 0,
  { id: "garten", name: "Gärtnern", icon: "🌱", art: "sammeln", farbe: "#8fcf6a", tun: "gärtnert" });
FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "schnitzen") + 1, 0,
  { id: "traenke", name: "Tränke", icon: "🧪", art: "machen", farbe: "#b48cff", tun: "braut" });

const GARTEN = {
  startBeete: 3,
  beetPreise: [500, 2000, 8000, 30000, 100000, 300000, 1000000, 3000000, 8000000, 20000000],   // Beet 4 … 13
  // Beet 14–16 gibt es mit dem Blumenkasten im Baumhaus (Ahorn-, Zauber- und Regenbogen-Stufe)
  samenZurueck: 0.3,       // Chance, beim Ernten einen Samen zurückzubekommen
};

// ----- Pflanzen -----
const GEMUESE = [
  ["Salat", "🥬"], ["Karotte", "🥕"], ["Kartoffel", "🥔"], ["Tomate", "🍅"],
  ["Kürbis", "🎃"], ["Erdbeere", "🍓"], ["Zaubermelone", "🍉"], ["Sternenbeere", "🫐"],
];
const KRAEUTER = [
  ["Minze", "🌿"], ["Kamille", "🌼"], ["Lavendel", "🪻"], ["Salbei", "🍃"],
  ["Mondkraut", "🌙"], ["Feuerblüte", "🌺"], ["Sternenkraut", "💫"], ["Regenbogenblume", "🌷"],
];
const WACHSZEIT = [5, 10, 15, 20, 30, 40, 50, 60];            // Minuten
const SAMEN_PREIS = [5, 20, 60, 150, 400, 1000, 2500, 6000];

const PFLANZEN = [];
for (const [liste, art, menge] of [[GEMUESE, "gemuese", [6, 10]], [KRAEUTER, "kraut", [8, 13]]]) {
  liste.forEach(([name, emoji], i) => {
    gegenstand(`${art}${i}`, name, "emoji", TIER_FARBEN[i], Math.round(WERTE[i] * (art === "kraut" ? 2 : 1.5)), { emoji });
    gegenstand(`samen-${art}${i}`, `${name}-Samen`, "samen", TIER_FARBEN[i], Math.max(1, Math.round(SAMEN_PREIS[i] / 4)), { emoji, preis: SAMEN_PREIS[i] });
    PFLANZEN.push({ id: `${art}${i}`, samen: `samen-${art}${i}`, ertrag: `${art}${i}`, name, emoji, art,
      stufe: STUFEN[i], minuten: WACHSZEIT[i] * (art === "kraut" ? 1.2 : 1), xp: XP[i] * 24, menge });
  });
}

// ----- Neue Gerichte aus Gemüse (Kochen) -----
const GEMUESE_GERICHTE = [
  ["Bunter Salat", "🥗"], ["Karotten-Suppe", "🍲"], ["Ofenkartoffel", "🍠"], ["Tomaten-Nudeln", "🍝"],
  ["Kürbis-Suppe", "🥣"], ["Erdbeer-Kuchen", "🍰"], ["Melonen-Eis", "🍧"], ["Sternenbeeren-Torte", "🎂"],
];
GEMUESE_GERICHTE.forEach(([name, emoji], i) => {
  gegenstand(`gericht${i}`, name, "emoji", TIER_FARBEN[i], WERTE[i] * 5, { emoji, heilt: Math.round([30, 60, 90, 130, 180, 240, 300, 400][i] * 1.25) });
  taetigkeit({ id: `kochen-gericht${i}`, fertigkeit: "kochen", name, stufe: Math.min(99, STUFEN[i] + 3), xp: Math.round(XP[i] * 1.6), zeit: 3.5,
    braucht: { [`gemuese${i}`]: 2 }, gibt: { [`gericht${i}`]: 1 } });
});

// ----- Zaubertränke -----
// wirkung: doppelt (Sammel-Fertigkeit), schneller (alle Herstellen-Fertigkeiten), treff/kraft/schutz (Kampf), xp (überall)
const TRAENKE = [
  { name: "Waldgeist-Trank",   farbe: "#7cc36b", beute: "bluete",       wirkung: { art: "doppelt", fertigkeit: "holz", wert: 0.15 },   ladungen: 120, text: "+15 % doppeltes Holz" },
  { name: "Anglerglück",       farbe: "#5fb7e8", beute: "honig",        wirkung: { art: "doppelt", fertigkeit: "angeln", wert: 0.15 }, ladungen: 120, text: "+15 % doppelte Fische" },
  { name: "Bergmanns-Trank",   farbe: "#a78a72", beute: "pilz",         wirkung: { art: "doppelt", fertigkeit: "bergbau", wert: 0.15 }, ladungen: 120, text: "+15 % doppeltes Erz" },
  { name: "Fleiß-Trank",       farbe: "#ff9f5a", beute: "feder",        wirkung: { art: "schneller", wert: 0.15 },                     ladungen: 150, text: "Herstellen 15 % schneller" },
  { name: "Mut-Trank",         farbe: "#ff7a7a", beute: "zahnrad",      wirkung: { art: "treff", wert: 0.2 },                          ladungen: 40,  text: "+20 % öfter treffen (40 Monster)" },
  { name: "Kraft-Trank",       farbe: "#ffa94d", beute: "glut",         wirkung: { art: "kraft", wert: 0.2 },                          ladungen: 40,  text: "+20 % stärkerer Schlag (40 Monster)" },
  { name: "Schutz-Trank",      farbe: "#6fa8ff", beute: "eis",          wirkung: { art: "schutz", wert: 0.15 },                        ladungen: 40,  text: "15 % weniger Schaden (40 Monster)" },
  { name: "Glücks-Trank",      farbe: "#ffd54f", beute: "sternenstaub", wirkung: { art: "xp", wert: 0.2 },                             ladungen: 200, text: "+20 % Erfahrung bei allem" },
];
TRAENKE.forEach((t, i) => {
  t.id = `trank${i}`;
  gegenstand(t.id, t.name, "trank", t.farbe, WERTE[i] * 12 + 20, { trank: t });
  taetigkeit({ id: `traenke-${i}`, fertigkeit: "traenke", name: t.name, stufe: STUFEN[i], xp: Math.round(XP[i] * 5), zeit: 3,
    braucht: { [`kraut${i}`]: 1, [t.beute]: 1 }, gibt: { [t.id]: 1 } });
});

// Mehr Platz in der Bank – es gibt jetzt viel mehr Sorten
SPIEL.bankStart = 40;
