"use strict";
// =====================================================
//  ABENTEUER-SPIELPLATZ (wie "Agility" in Melvor Idle)
//  Frei nach dem 5. geschafften Abenteuer-Pfad. Neue Fertigkeit "Turnen".
//  • Parcours mit 8 Stationen (frei ab Turnen-Stufe 1, 10, 20 …). An jeder Station baut man EINES
//    von 3 Hindernissen – jedes gibt einen Dauer-Bonus, solange es steht (umbauen geht).
//  • "Parcours laufen" ist eine Tätigkeit: Je mehr Hindernisse stehen, desto länger dauert eine
//    Runde und desto mehr Erfahrung und Münzen gibt es.
//  • Stehen alle 8 Stationen, kann man das Siegerpodest bauen (extra Bonus).
//  spiel.parcours = { stationen: [Option-Nr | null …], podest: true/false }
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "dorf") + 1, 0,
  { id: "turnen", name: "Turnen", icon: "🤸", art: "sammeln", farbe: "#ff9fc8", tun: "turnt" });

const SAMMEL = ["holz", "angeln", "bergbau", "garten", "sterne"];
const MACHEN = ["kochen", "feuer", "schmieden", "schmuck", "schnitzen", "traenke", "bauen", "naehen"];
// bonus: art + wert (Prozent bzw. Anzahl bei bank/offline) + fuer (Fertigkeiten, nur bei schneller/doppelt/xp)
const PARCOURS = [
  { name: "Balancierbalken", icon: "🪵", optionen: [
    { name: "Wackel-Baumstamm", bonus: { art: "schneller", wert: 4, fuer: ["holz", "schnitzen"] } },
    { name: "Hängebrücke",      bonus: { art: "schneller", wert: 4, fuer: ["angeln", "kochen"] } },
    { name: "Stein-Pfad",       bonus: { art: "schneller", wert: 4, fuer: ["bergbau", "schmieden"] } } ] },
  { name: "Kletterwand", icon: "🧗", optionen: [
    { name: "Blumen-Wand",      bonus: { art: "schneller", wert: 4, fuer: ["garten", "traenke"] } },
    { name: "Seil-Wand",        bonus: { art: "schneller", wert: 4, fuer: ["naehen", "bauen"] } },
    { name: "Glitzer-Wand",     bonus: { art: "schneller", wert: 4, fuer: ["schmuck", "feuer"] } } ] },
  { name: "Hangelleiter", icon: "🪜", optionen: [
    { name: "Ast-Leiter",       bonus: { art: "doppelt", wert: 3, fuer: ["holz", "angeln"] } },
    { name: "Ketten-Leiter",    bonus: { art: "doppelt", wert: 3, fuer: ["bergbau", "garten"] } },
    { name: "Regenbogen-Leiter", bonus: { art: "doppelt", wert: 3, fuer: ["traenke", "naehen", "sterne"] } } ] },
  { name: "Seilbahn", icon: "🚡", optionen: [
    { name: "Mutige Seilbahn",  bonus: { art: "treff", wert: 4 } },
    { name: "Starke Seilbahn",  bonus: { art: "kraft", wert: 4 } },
    { name: "Sichere Seilbahn", bonus: { art: "schutz", wert: 3 } } ] },
  { name: "Trampolin", icon: "🤸", optionen: [
    { name: "Hüpf-Trampolin",   bonus: { art: "bank", wert: 10 } },
    { name: "Traum-Trampolin",  bonus: { art: "offline", wert: 2 } },
    { name: "Picknick-Trampolin", bonus: { art: "heilen", wert: 10 } } ] },
  { name: "Riesenrutsche", icon: "🛝", optionen: [
    { name: "Sammel-Rutsche",   bonus: { art: "xp", wert: 4, fuer: SAMMEL } },
    { name: "Bastel-Rutsche",   bonus: { art: "xp", wert: 4, fuer: MACHEN } },
    { name: "Kampf-Rutsche",    bonus: { art: "kampfxp", wert: 5 } } ] },
  { name: "Netz-Tunnel", icon: "🕸️", optionen: [
    { name: "Gold-Tunnel",      bonus: { art: "muenzen", wert: 8 } },
    { name: "Tier-Tunnel",      bonus: { art: "tier", wert: 15 } },
    { name: "Blüten-Tunnel",    bonus: { art: "garten", wert: 5 } } ] },
  { name: "Riesenschaukel", icon: "🎢", optionen: [
    { name: "Wind-Schaukel",    bonus: { art: "verschnaufen", wert: 5 } },
    { name: "Herz-Schaukel",    bonus: { art: "herzen", wert: 5 } },
    { name: "Glücks-Schaukel",  bonus: { art: "doppelt", wert: 2, fuer: [...SAMMEL, ...MACHEN] } } ] },
];
const PODEST = { name: "Siegerpodest", icon: "🏆", bonus: [{ art: "xp", wert: 3 }, { art: "muenzen", wert: 5 }],
  kosten: { brett7: 200, barren7: 100 }, muenzen: 5000000, stufe: 95 };

PARCOURS.forEach((s, i) => {
  s.nr = i;
  s.stufe = STUFEN[i];
  s.kosten = { [`brett${i}`]: 20 + i * 10, [`barren${i}`]: 10 + i * 5 };
  s.muenzen = Math.round(500 * Math.pow(4, i) / 100) * 100;
  s.xp = Math.round(XP[i] * 1.5);
  s.gold = 3 * (i + 1) * (i + 1);
});

// Die Runde ist EINE Tätigkeit – Dauer und Erfahrung hängen davon ab, was gebaut ist
const parcours = () => spiel.parcours || (spiel.parcours = { stationen: PARCOURS.map(() => null), podest: false });
const gebauteStationen = () => PARCOURS.filter((s, i) => (spiel.parcours?.stationen?.[i] ?? null) !== null);
taetigkeit({ id: "turnen-0", fertigkeit: "turnen", name: "Parcours laufen", stufe: 1, gibt: {}, parcours: true,
  get zeit() { return 1 + 2.5 * Math.max(1, gebauteStationen().length); },
  get xp() { return Math.max(5, gebauteStationen().reduce((s, x) => s + x.xp, 0)); } });

HAUSTIERE.push({ id: "huepfi", name: "Hüpfi", tier: "Känguru", emoji: "🦘", fertigkeit: "turnen", bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppelte Parcours-Münzen" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

// ===================== LOGIK =====================
const turnenFrei = () => PFADE.filter(p => (spiel.pfade?.[p.id] || 0) > 0).length >= 5 || (spiel.xp?.turnen || 0) > 0;
const stationOption = i => { const n = spiel.parcours?.stationen?.[i]; return n === null || n === undefined ? null : PARCOURS[i].optionen[n]; };
function parcoursBoni() {
  const liste = PARCOURS.map((_, i) => stationOption(i)?.bonus).filter(Boolean);
  if (spiel.parcours?.podest) liste.push(...PODEST.bonus);
  return liste;
}
// Für sternBonus(): schneller/doppelt/xp je Fertigkeit, Kampf-Kräfte global (Anteil)
function parcoursBonus(art, fid = null) {
  if (!spiel.parcours) return 0;
  return parcoursBoni().filter(b => b.art === art && (!b.fuer || b.fuer.includes(fid)) && (["schneller", "doppelt", "xp"].includes(art) ? b.fuer : true))
    .reduce((s, b) => s + b.wert / 100, 0);
}
// Für sternGold() / baumhausBonus(): allgemeine Boni (bank/offline als Anzahl, sonst Anteil)
function parcoursAllgemein(art) {
  if (!spiel.parcours) return 0;
  const summe = parcoursBoni().filter(b => b.art === art && !b.fuer).reduce((s, b) => s + b.wert, 0);
  return ["bank", "offline"].includes(art) ? summe : summe / 100;
}
const bonusText = b => {
  const namen = b.fuer ? (b.fuer.length > 3 ? (b.fuer === SAMMEL || b.fuer.every(f => SAMMEL.includes(f)) ? "allem Sammeln" : b.fuer.every(f => MACHEN.includes(f)) ? "allem Herstellen" : "allem") : b.fuer.map(f => fertigkeit(f).name.replaceAll("­", "")).join(" und ")) : "";
  return {
    schneller: `${namen} ${b.wert} % schneller`, doppelt: `+${b.wert} % doppelt bei ${namen}`, xp: b.fuer ? `+${b.wert} % Erfahrung bei ${namen}` : `+${b.wert} % Erfahrung bei allem`,
    treff: `+${b.wert} % öfter treffen`, kraft: `+${b.wert} % stärkerer Schlag`, schutz: `${b.wert} % weniger Schaden`, herzen: `+${b.wert} % Herzen`,
    bank: `+${b.wert} Bankfächer`, offline: `+${b.wert} Std. Offline-Zeit`, heilen: `Essen heilt ${b.wert} % mehr`, kampfxp: `+${b.wert} % Kampf-Erfahrung`,
    muenzen: `+${b.wert} % Münzen von Monstern`, tier: `Haustiere ${b.wert} % öfter finden`, garten: `Garten wächst ${b.wert} % schneller`, verschnaufen: `+${b.wert} % Herzen nach jedem Sieg`,
  }[b.art];
};

function kannStationBauen(i, nr) {
  const s = PARCOURS[i];
  if (!turnenFrei()) return "Noch nicht frei";
  if (stufe("turnen") < s.stufe) return `Ab Turnen-Stufe ${s.stufe}`;
  if (parcours().stationen[i] === nr) return "Steht schon";
  if (spiel.muenzen < s.muenzen) return "Zu wenig Münzen";
  for (const [id, n] of Object.entries(s.kosten)) if (anzahl(id) < n) return `Es fehlt: ${GEGENSTAENDE[id].name}`;
  return null;
}
function baueStation(i, nr) {
  if (kannStationBauen(i, nr)) return false;
  const s = PARCOURS[i];
  spiel.muenzen -= s.muenzen;
  for (const [id, n] of Object.entries(s.kosten)) nimmAusBank(id, n);
  parcours().stationen[i] = nr;
  spiel.statistik.hindernisse = (spiel.statistik.hindernisse || 0) + 1;
  return true;
}
function kannPodestBauen() {
  if (parcours().podest) return "Steht schon";
  if (gebauteStationen().length < PARCOURS.length) return "Bau zuerst alle 8 Stationen";
  if (stufe("turnen") < PODEST.stufe) return `Ab Turnen-Stufe ${PODEST.stufe}`;
  if (spiel.muenzen < PODEST.muenzen) return "Zu wenig Münzen";
  for (const [id, n] of Object.entries(PODEST.kosten)) if (anzahl(id) < n) return `Es fehlt: ${GEGENSTAENDE[id].name}`;
  return null;
}
function bauePodest() {
  if (kannPodestBauen()) return false;
  spiel.muenzen -= PODEST.muenzen;
  for (const [id, n] of Object.entries(PODEST.kosten)) nimmAusBank(id, n);
  parcours().podest = true;
  return true;
}
// Münzen für eine Runde (wird in fuehreAus gutgeschrieben)
const rundenMuenzen = () => gebauteStationen().reduce((s, x) => s + x.gold, 0);

// ----- Erfolge -----
erfolg({ id: "turnen-1", icon: "🤸", name: "Erste Runde", text: "Lauf deine erste Runde auf dem Abenteuer-Spielplatz", ziel: 1, muenzen: 5000, wert: () => spiel.statistik.aktionenNach?.turnen || 0 });
erfolg({ id: "turnen-alle", icon: "🛝", name: "Ganzer Spielplatz", text: "Bau an allen 8 Stationen ein Hindernis", ziel: PARCOURS.length, muenzen: 500000, wert: () => (spiel.parcours ? gebauteStationen().length : 0) });
erfolg({ id: "turnen-podest", icon: "🏆", name: "Auf dem Siegerpodest", text: "Bau das Siegerpodest", ziel: 1, muenzen: 3000000, wert: () => (spiel.parcours?.podest ? 1 : 0) });
