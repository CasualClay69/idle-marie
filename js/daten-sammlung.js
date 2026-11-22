"use strict";
// =====================================================
//  HAUSTIERE & ERFOLGE – Daten
//
//  Haustiere findet man selten: beim Arbeiten in "ihrer" Fertigkeit (im Schnitt nach etwa
//  3 Stunden), beim Ernten im Garten oder bei Abenteuer-Chefs. Jedes Haustier, das man hat,
//  gibt für immer einen kleinen Bonus. Eins darf als Begleiter neben der Figur sitzen.
// =====================================================

const HAUSTIER_REGEL = {
  sekundenProFund: 3 * 3600,   // Arbeiten: Chance pro Durchgang = Dauer / 3 Stunden
  gartenChance: 1 / 40,        // pro Ernte
  chefChance: 1 / 30,          // pro eingeschlafenem Chef
};

// bonus.art: doppelt (Sammeln), schneller (Herstellen), treff / kraft / schutz (Kampf), xp, muenzen
const HAUSTIERE = [
  { id: "nussi",   name: "Nussi",   tier: "Eichhörnchen", emoji: "🐿️", fertigkeit: "holz",      bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppeltes Holz" },
  { id: "plitsch", name: "Plitsch", tier: "Otter",        emoji: "🦦", fertigkeit: "angeln",    bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppelte Fische" },
  { id: "buddel",  name: "Buddel",  tier: "Dachs",        emoji: "🦡", fertigkeit: "bergbau",   bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppeltes Erz" },
  { id: "punkti",  name: "Punkti",  tier: "Marienkäfer",  emoji: "🐞", fertigkeit: "garten",    bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppelte Ernte" },
  { id: "mampf",   name: "Mampf",   tier: "Kätzchen",     emoji: "🐱", fertigkeit: "kochen",    bonus: { art: "schneller", wert: 0.05 }, text: "Kochen 5 % schneller" },
  { id: "funki",   name: "Funki",   tier: "Feuersalamander", emoji: "🦎", fertigkeit: "schmieden", bonus: { art: "schneller", wert: 0.05 }, text: "Schmieden 5 % schneller" },
  { id: "knabber", name: "Knabber", tier: "Biber",        emoji: "🦫", fertigkeit: "schnitzen", bonus: { art: "schneller", wert: 0.05 }, text: "Schnitzen 5 % schneller" },
  { id: "quaki",   name: "Quaki",   tier: "Frosch",       emoji: "🐸", fertigkeit: "traenke",   bonus: { art: "schneller", wert: 0.05 }, text: "Zaubertränke 5 % schneller" },
  { id: "summsi",  name: "Summsi",  tier: "Hummelchen",   emoji: "🐝", chef: "pusteriese",       bonus: { art: "treff", wert: 0.03 },   text: "+3 % öfter treffen" },
  { id: "huhu",    name: "Huhu",    tier: "Eulchen",      emoji: "🦉", chef: "baumgeist",        bonus: { art: "xp", wert: 0.03 },      text: "+3 % Erfahrung bei allem" },
  { id: "flatter", name: "Flatter", tier: "Fledermäuschen", emoji: "🦇", chef: "burggespenst",   bonus: { art: "schutz", wert: 0.03 },  text: "3 % weniger Schaden" },
  { id: "glutti",  name: "Glutti",  tier: "Feuerfuchs",   emoji: "🦊", chef: "feuerdrache",      bonus: { art: "kraft", wert: 0.03 },   text: "+3 % stärkerer Schlag" },
  { id: "pingu",   name: "Pingu",   tier: "Pinguin",      emoji: "🐧", chef: "frostkoenig",      bonus: { art: "muenzen", wert: 0.1 },  text: "+10 % Münzen von Monstern" },
  { id: "sternchen", name: "Sternchen", tier: "Einhorn",  emoji: "🦄", chef: "regenbogendrache", bonus: { art: "xp", wert: 0.05 },      text: "+5 % Erfahrung bei allem" },
];

// =====================================================
//  ERFOLGE – wert() = aktueller Stand, ziel = was man braucht, muenzen = Belohnung
// =====================================================
const ERFOLGE = [];
function erfolg(e) { ERFOLGE.push(e); }

// Stufen in jeder Fertigkeit (wird erst nach allen Daten-Dateien gebaut, damit alle Fertigkeiten dabei sind)
function baueStufenErfolge() {
  for (const f of FERTIGKEITEN) {
    for (const [ziel, muenzen, titel] of [[10, 100, "Anfänger"], [30, 1000, "Könner"], [50, 10000, "Profi"], [99, 250000, "Meister"]]) {
      erfolg({ id: `stufe-${f.id}-${ziel}`, icon: f.icon, name: `${f.name}-${titel}`, text: `Erreiche ${f.name} Stufe ${ziel}`,
        ziel, muenzen, wert: () => stufe(f.id) });
    }
  }
}

const besiegtVon = id => spiel.besiegt?.[id] || 0;
for (const [ziel, muenzen] of [[100, 2000], [250, 15000], [500, 100000], [1000, 1000000]]) {
  erfolg({ id: `gesamt-${ziel}`, icon: "🌟", name: `Gesamtstufe ${ziel}`, text: `Alle Fertigkeiten zusammen: Stufe ${ziel}`, ziel, muenzen, wert: () => gesamtStufe() });
}
erfolg({ id: "monster-1", icon: "💤", name: "Gute Nacht!", text: "Bring dein erstes Monster zum Einschlafen", ziel: 1, muenzen: 50, wert: () => spiel.statistik.besiegt || 0 });
for (const [ziel, muenzen] of [[100, 2000], [1000, 25000], [10000, 300000]]) {
  erfolg({ id: `monster-${ziel}`, icon: "💤", name: `${zahlKurz(ziel)} Schlafmützen`, text: `${zahlKurz(ziel)} Monster sind eingeschlafen`, ziel, muenzen, wert: () => spiel.statistik.besiegt || 0 });
}
GEBIETE.forEach((g, i) => {
  const chef = g.monster.find(m => m.chef);
  erfolg({ id: `chef-${chef.id}`, icon: g.icon, name: `Chef von ${g.name}`, text: `${chef.name.replaceAll("­", "")} schläft ein`, ziel: 1,
    muenzen: 500 * Math.pow(4, i), wert: () => besiegtVon(chef.id) });
});
erfolg({ id: "alle-monster", icon: "📖", name: "Monster-Kenner", text: "Jedes Monster mindestens einmal", ziel: Object.keys(MONSTER).length, muenzen: 500000,
  wert: () => Object.keys(MONSTER).filter(id => besiegtVon(id) > 0).length });
for (const [ziel, muenzen] of [[1000, 100], [100000, 5000], [10000000, 200000]]) {
  erfolg({ id: `muenzen-${ziel}`, icon: "🪙", name: `${zahlKurz(ziel)} Münzen`, text: `Verdiene insgesamt ${zahlKurz(ziel)} Münzen durch Verkaufen`, ziel, muenzen, wert: () => spiel.statistik.verdient || 0 });
}
for (const [ziel, muenzen] of [[1, 50], [100, 3000], [1000, 50000]]) {
  erfolg({ id: `ernte-${ziel}`, icon: "🧺", name: ziel === 1 ? "Erste Ernte" : `${zahlKurz(ziel)} Ernten`, text: `Ernte ${ziel === 1 ? "dein erstes Beet" : `${zahlKurz(ziel)} Beete`}`, ziel, muenzen, wert: () => spiel.statistik.geerntet || 0 });
}
erfolg({ id: "trank-1", icon: "🧪", name: "Hex, hex!", text: "Trink deinen ersten Zaubertrank", ziel: 1, muenzen: 200, wert: () => spiel.statistik.getrunken || 0 });
erfolg({ id: "trank-100", icon: "🧪", name: "Trank-Profi", text: "Trink 100 Zaubertränke", ziel: 100, muenzen: 50000, wert: () => spiel.statistik.getrunken || 0 });
erfolg({ id: "ruestung", icon: "🎒", name: "Gut geschützt", text: "Trag Waffe, Helm, Schild und Rüstung gleichzeitig", ziel: 4, muenzen: 1000,
  wert: () => ["waffe", "helm", "schild", "ruestung"].filter(p => spiel.ausruestung?.[p]).length });
erfolg({ id: "regenbogen", icon: "🌈", name: "Regenbogen-Ritter", text: "Trag ein Regenbogen-Schwert", ziel: 1, muenzen: 500000, wert: () => spiel.ausruestung?.waffe === "schwert7" ? 1 : 0 });
erfolg({ id: "meister", icon: "⭐", name: "Echter Meister", text: "Bring eine Tätigkeit auf Übung ⭐ 99", ziel: 99, muenzen: 100000,
  wert: () => Math.max(1, ...Object.values(spiel.uebung || {}).map(stufeAusXp)) });
erfolg({ id: "bank-voll", icon: "🏦", name: "Sammler", text: "Hab 40 verschiedene Sachen in der Bank", ziel: 40, muenzen: 5000, wert: () => belegteFaecher() });
erfolg({ id: "beete", icon: "🟫", name: "Großer Garten", text: "Hab 10 Beete", ziel: 10, muenzen: 100000, wert: () => gartenStand().beete.length });
for (const [ziel, muenzen, name] of [[1, 500, "Ein neuer Freund"], [5, 20000, "Tierfreund"], [HAUSTIERE.length, 1000000, "Zoodirektor"]]) {
  erfolg({ id: `haustiere-${ziel}`, icon: "🐾", name, text: ziel === 1 ? "Finde dein erstes Haustier" : `Finde ${ziel === HAUSTIERE.length ? "alle" : ziel} Haustiere`,
    ziel, muenzen, wert: () => (spiel.haustiere || []).filter(id => !id.startsWith("season")).length });
}

erfolg({ id: "season-1", icon: "🎟️", name: "Season-Starter", text: "Erreiche deine erste Season-Stufe", ziel: 1, muenzen: 300, wert: () => spiel.statistik.seasonStufen || 0 });
erfolg({ id: "season-30", icon: "🎟️", name: "Season-Held", text: "Erreiche alle 30 Stufen einer Season", ziel: 30, muenzen: 100000, wert: () => spiel.statistik.seasonMax || 0 });
erfolg({ id: "season-tiere", icon: "🐾", name: "Jahreszeiten-Freunde", text: "Sammle 12 Season-Haustiere", ziel: 12, muenzen: 2000000,
  wert: () => (spiel.haustiere || []).filter(id => id.startsWith("season")).length });

function zahlKurz(n) {
  return n >= 1e6 ? `${n / 1e6} Mio.` : n.toLocaleString("de-DE");
}
