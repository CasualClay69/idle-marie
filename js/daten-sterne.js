"use strict";
// =====================================================
//  STERNENKUNDE (wie "Astrologie" in Melvor Idle)
//  Frei, sobald der erste Abenteuer-Pfad geschafft ist.
//  • Sternbilder beobachten = normale Tätigkeit -> EP + 💫 Sternsplitter (manchmal 🌟 Goldsplitter)
//  • Jedes Sternbild gehört zu 2 Fertigkeiten. Mit Sternsplittern kauft man seine 3 Sterne
//    (je 5 Stufen: schneller / doppelt / mehr EP – bei Kampf-Sternbildern Kampf-Kräfte),
//    mit Goldsplittern den goldenen Stern (3 Stufen, besondere Kraft).
//  • Höhere Stern-Stufen brauchen eine höhere Sternenkunde-Stufe.
//  spiel.sterne = { sternbildId: { k: [Stufe Stern 1, 2, 3], g: Stufe goldener Stern } }
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "garten") + 1, 0,
  { id: "sterne", name: "Sternen­kunde", icon: "🔭", art: "sammeln", farbe: "#7a8fe0", tun: "schaut in die Sterne" });

const STERNE = {
  goldChance: 0.006,          // pro Beobachtung
  maxNormal: 5, maxGold: 3,
  proStufe: 0.01,             // jeder Stern: +1 % je Stufe
  stufenAbstand: 4,           // normale Stern-Stufe k braucht Sternbild-Stufe + (k−1)·4 Sternenkunde
  goldAbstand: 8,             // goldene Stufe k braucht Sternbild-Stufe + k·8
  splitterBasis: [15, 25, 40, 60, 90, 130, 180, 250],
  goldBasis: [2, 4, 7],
};

gegenstand("sternsplitter2", "Sternsplitter", "emoji", "#bfd0ff", 2, { emoji: "💫" });
gegenstand("goldsplitter5", "Goldsplitter", "emoji", "#ffd54f", 60, { emoji: "🌟" });

// kraefte: die 3 normalen Sterne · gold: der goldene Stern (art wie im Baumhaus: offline/heilen/edelstein/garten/bank/tier/muenzen/xp)
const STERNBILDER = [
  { id: "hoernchen",  name: "Eichhörnchen",  icon: "🐿️", fertigkeiten: ["holz", "schnitzen"],  gold: { art: "offline",   wert: 1, text: "+{w} Std. Offline-Zeit" } },
  { id: "fisch",      name: "Großer Fisch",  icon: "🐟", fertigkeiten: ["angeln", "kochen"],   gold: { art: "heilen",    wert: 5, text: "Essen heilt {w} % mehr" } },
  { id: "drache",     name: "Drache",        icon: "🐉", fertigkeiten: ["bergbau", "schmieden"], gold: { art: "edelstein", wert: 1, text: "+{w} % Chance auf Edelsteine" } },
  { id: "blume",      name: "Sternblume",    icon: "🌸", fertigkeiten: ["garten", "traenke"],  gold: { art: "garten",    wert: 3, text: "Garten wächst {w} % schneller" } },
  { id: "krone",      name: "Krone",         icon: "👑", fertigkeiten: ["schmuck", "bauen"],   gold: { art: "bank",      wert: 5, text: "+{w} Bankfächer" } },
  { id: "falter",     name: "Schmetterling", icon: "🦋", fertigkeiten: ["naehen", "sterne"],   gold: { art: "tier",      wert: 10, text: "Haustiere {w} % öfter finden" } },
  { id: "fuchs",      name: "Mutiger Fuchs", icon: "🦊", fertigkeiten: ["mut", "kraft"],       gold: { art: "muenzen",   wert: 5, text: "+{w} % Münzen von Monstern" },
    kraefte: ["treff", "kraft", "xp"] },
  { id: "einhorn",    name: "Einhorn",       icon: "🦄", fertigkeiten: ["schutz", "herzen"],   gold: { art: "xp",        wert: 2, text: "+{w} % Erfahrung bei allem" },
    kraefte: ["schutz", "herzen", "xp"] },
];

const KRAFT_TEXTE = {
  schneller: "{f} {w} % schneller", doppelt: "+{w} % doppelte Ausbeute bei {f}", xp: "+{w} % Erfahrung bei {f}",
  treff: "+{w} % öfter treffen", kraft: "+{w} % stärkerer Schlag", schutz: "{w} % weniger Schaden", herzen: "+{w} % Herzen",
};
const KRAFT_ICONS = { schneller: "⏱️", doppelt: "✨", xp: "📈", treff: "🎯", kraft: "💪", schutz: "🛡️", herzen: "❤️" };

// Ein Sternbild am Himmel: Punkte (0–100 × 0–60), aus der Nummer berechnet – jedes sieht anders aus
function sternbildPunkte(nr) {
  let s = nr * 9301 + 49297;
  const z = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const n = 5 + (nr % 3);
  return Array.from({ length: n }, (_, i) => [Math.round(10 + (80 / (n - 1)) * i + (z() - 0.5) * 10), Math.round(12 + z() * 36)]);
}

STERNBILDER.forEach((sb, i) => {
  sb.nr = i;
  sb.stufe = STUFEN[i];
  sb.kraefte = (sb.kraefte || ["schneller", "doppelt", "xp"]).map(art => ({ art }));
  sb.punkte = sternbildPunkte(i);
  const xp = Math.round(XP[i] * (STUFEN[i] >= 45 ? 0.7 : 1) * 1.35);
  taetigkeit({ id: `sterne-${i}`, fertigkeit: "sterne", name: sb.name, stufe: sb.stufe, xp, zeit: ZEIT[i] + 1,
    gibt: { sternsplitter2: 1 }, sternbild: sb.id });
});

// Haustier fürs Sternegucken
HAUSTIERE.push({ id: "mondi", name: "Mondi", tier: "Nachtfalter", emoji: "🦋", fertigkeit: "sterne", bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppelte Sternsplitter" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

// ===================== LOGIK =====================
const sterneFrei = () => PFADE.some(p => (spiel.pfade?.[p.id] || 0) > 0) || (spiel.xp?.sterne || 0) > 0;
function sternStand(id) {
  spiel.sterne = spiel.sterne || {};
  return spiel.sterne[id] || (spiel.sterne[id] = { k: [0, 0, 0], g: 0 });
}
const sternName = sb => sb.fertigkeiten.map(f => fertigkeit(f).name.replaceAll("­", "")).join(" und ");
const kraftText = (sb, art, stufeN) => KRAFT_TEXTE[art].replace("{f}", sternName(sb)).replace("{w}", Math.round(stufeN * STERNE.proStufe * 100));
const goldText = (sb, stufeN) => sb.gold.text.replace("{w}", sb.gold.wert * stufeN);

// Bonus der normalen Sterne. schneller/doppelt/xp gelten nur für die Fertigkeiten des Sternbilds,
// Kampf-Kräfte (treff/kraft/schutz/herzen) immer.
function sternBonus(art, fid = null) {
  if (!spiel.sterne) return (parcoursBonus(art, fid) + museumBonus(art, fid));   // + Abenteuer-Spielplatz
  let summe = 0;
  for (const sb of STERNBILDER) {
    const st = spiel.sterne[sb.id];
    if (!st) continue;
    sb.kraefte.forEach((k, i) => {
      if (k.art !== art || !st.k[i]) return;
      if (["schneller", "doppelt", "xp"].includes(art) && !sb.fertigkeiten.includes(fid)) return;
      summe += st.k[i] * STERNE.proStufe;
    });
  }
  return summe + (parcoursBonus(art, fid) + museumBonus(art, fid));
}
// Bonus der goldenen Sterne – in derselben Einheit wie baumhausBonus (bank/offline: Anzahl, sonst Anteil)
function sternGold(art) {
  if (!spiel.sterne) return (parcoursAllgemein(art) + museumAllgemein(art) + karteAllgemein(art));   // + Abenteuer-Spielplatz
  const summe = STERNBILDER.reduce((s, sb) => s + (sb.gold.art === art ? (spiel.sterne[sb.id]?.g || 0) * sb.gold.wert : 0), 0);
  return (["bank", "offline"].includes(art) ? summe : summe / 100) + (parcoursAllgemein(art) + museumAllgemein(art) + karteAllgemein(art));
}

// Was kostet die nächste Stufe? nr = 0,1,2 (normal) oder "g" (golden). null = schon voll
function sternKosten(sb, nr) {
  const st = sternStand(sb.id);
  if (nr === "g") {
    const k = st.g + 1;
    if (k > STERNE.maxGold) return null;
    return { id: "goldsplitter5", n: Math.round(STERNE.goldBasis[k - 1] * (1 + sb.nr * 0.5)), stufe: Math.min(SPIEL.maxStufe, sb.stufe + k * STERNE.goldAbstand) };
  }
  const k = st.k[nr] + 1;
  if (k > STERNE.maxNormal) return null;
  return { id: "sternsplitter2", n: Math.round(STERNE.splitterBasis[sb.nr] * Math.pow(k, 1.5)), stufe: Math.min(SPIEL.maxStufe, sb.stufe + (k - 1) * STERNE.stufenAbstand) };
}
function kaufeStern(sb, nr) {
  const k = sternKosten(sb, nr);
  if (!k || stufe("sterne") < k.stufe || anzahl(k.id) < k.n) return false;
  nimmAusBank(k.id, k.n);
  const st = sternStand(sb.id);
  if (nr === "g") st.g++; else st.k[nr]++;
  spiel.statistik.sterneGekauft = (spiel.statistik.sterneGekauft || 0) + 1;
  return true;
}
const sternStufenSumme = () => STERNBILDER.reduce((s, sb) => { const st = spiel.sterne?.[sb.id]; return s + (st ? st.k.reduce((a, b) => a + b, 0) + st.g : 0); }, 0);
const sternStufenMax = () => STERNBILDER.length * (3 * STERNE.maxNormal + STERNE.maxGold);

// ----- Erfolge -----
erfolg({ id: "sterne-1", icon: "🔭", name: "Sternengucker", text: "Kauf deinen ersten Stern bei der Sternenkunde", ziel: 1, muenzen: 1000, wert: () => sternStufenSumme() });
erfolg({ id: "sterne-gold", icon: "🌟", name: "Goldener Himmel", text: "Bring alle goldenen Sterne auf die höchste Stufe", ziel: STERNBILDER.length * STERNE.maxGold, muenzen: 2000000,
  wert: () => STERNBILDER.reduce((s, sb) => s + (spiel.sterne?.[sb.id]?.g || 0), 0) });
erfolg({ id: "sterne-alle", icon: "✨", name: "Der ganze Himmel leuchtet", text: "Bring alle Sterne aller Sternbilder auf die höchste Stufe", ziel: sternStufenMax(), muenzen: 5000000,
  wert: () => sternStufenSumme() });
