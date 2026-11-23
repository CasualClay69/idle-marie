"use strict";
// =====================================================
//  MONSTER-AUFTRÄGE (wie "Slayer" in Melvor Idle)
//  Frei, sobald der erste Chef (Pusteblumen-Riese) eingeschlafen ist.
//  Die Wichtel-Jägerin Pia gibt Aufträge: "Lass 30× Wuschelwolf einschlafen".
//  • Jedes Auftrags-Monster bringt 🏅 Jagd-Münzen und Jagd-Erfahrung (= seine Herzen).
//  • Am Ende gibt es einen Bonus (+25 %) und mit Glück das Haustier Stups.
//  • Jagd-Münzen gibt man im Jagd-Laden aus: dauerhafte Verbesserungen und Kleidung.
//  spiel.jagd = { muenzen, auftrag: { monster, ziel, stand, art } | null, laden: { id: Stufe } }
// =====================================================

FERTIGKEITEN.push({ id: "jagd", name: "Jagd", icon: "📋", art: "kampf", farbe: "#8fb35a", tun: "erfüllt Monster-Aufträge", text: "Wie gut erfüllst du Monster-Aufträge?" });

const JAGD = {
  arten: [
    { id: "leicht", name: "Leicht", icon: "🌱", stufe: 1,  faktor: 1,   anteil: 0.6, menge: [15, 25] },
    { id: "mittel", name: "Mittel", icon: "⚔️", stufe: 10, faktor: 1.5, anteil: 1.0, menge: [20, 35] },
    { id: "schwer", name: "Schwer", icon: "🔥", stufe: 30, faktor: 2.2, anteil: 1.0, plus: 10, menge: [25, 45] },
  ],
  bonusAmEnde: 0.25,
  tauschenKostet: 10,
  haustierChance: 1 / 40,     // pro geschafftem Auftrag
};
const JAGD_JAEGERIN = "Pia";

// Laden: Verbesserungen (Stufen) und Kleidung (einmal)
const JAGD_LADEN = [
  { id: "koecher", name: "Jäger-Köcher",     icon: "🏹", preise: [50, 120, 250, 500, 1000],   ab: [1, 5, 15, 30, 50], text: "+{w} % Pfeile wieder aufsammeln", wert: 8 },
  { id: "perlen",  name: "Perlen-Täschchen", icon: "🔮", preise: [50, 120, 250, 500, 1000],   ab: [1, 5, 15, 30, 50], text: "{w} % Chance, keine Zauberperle zu verbrauchen", wert: 10 },
  { id: "fernglas", name: "Jagd-Fernglas",   icon: "🔭", preise: [40, 100, 220, 450, 900],    ab: [1, 8, 20, 40, 60], text: "+{w} % öfter treffen bei Auftrags-Monstern", wert: 4 },
  { id: "talisman", name: "Dreiecks-Talisman", icon: "🔺", preise: [100, 250, 500, 1000, 2000], ab: [10, 20, 35, 50, 70], text: "Kampf-Dreieck stärker: +{w} %", wert: 4 },
  { id: "hut",     name: "Jägerhut",         icon: "👒", preise: [300], ab: [5],  kleidung: "hj1", text: "Ein grüner Hut mit Feder für den Kleiderschrank" },
  { id: "rahmen",  name: "Jagd-Rahmen",      icon: "🖼️", preise: [600], ab: [25], kleidung: "rj1", text: "Ein Rahmen mit Pfeilen für deine Figur" },
];

// Kleidung (hinten an die Listen – die Bestenliste merkt sich Listenplätze!)
HUETE.push({ id: "hj1", name: "Jägerhut", icon: "👒", jagd: true, svg: `<path d="M26 30Q26 12 50 10Q74 12 74 30Z" fill="#5fae6a" stroke="#3f8a4f" stroke-width="2"/>
  <ellipse cx="50" cy="30" rx="34" ry="6" fill="#4f9a5a" stroke="#3f8a4f" stroke-width="2"/><path d="M28 26Q50 30 72 26L73 30Q50 34 27 30Z" fill="#c98a5a"/>
  <path d="M66 26Q80 4 88 2Q82 14 70 28Z" fill="#ff5f8f" stroke="#d63384" stroke-width="1.5"/>` });
RAHMEN.push({ id: "rj1", name: "Jagd-Rahmen", icon: "🖼️", jagd: true, svg: ring("#8fb35a", 5, ringPunkte(6).map(([x, y], i) =>
  `<g transform="translate(${x} ${y}) rotate(${i * 60 + 45})"><path d="M-6 0H5" stroke="#a8693a" stroke-width="2"/><path d="M7 0L3 -2.5V2.5Z" fill="#9aa3b5"/><path d="M-6 0L-8 -2.5H-5ZM-6 0L-8 2.5H-5Z" fill="#ff7eb6"/></g>`).join("")) });

HAUSTIERE.push({ id: "stups", name: "Stups", tier: "Igel", emoji: "🦔", jagd: true, bonus: { art: "jagd", wert: 0.1 }, text: "+10 % Jagd-Münzen" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

// ===================== LOGIK =====================
const jagdFrei = () => (spiel.besiegt?.pusteriese || 0) > 0 || (spiel.xp?.jagd || 0) > 0;
function jagd() { return spiel.jagd || (spiel.jagd = { muenzen: 0, auftrag: null, laden: {} }); }
const jagdLaden = id => jagd().laden[id] || 0;
const jagdWert = id => jagdLaden(id) * (JAGD_LADEN.find(x => x.id === id).wert || 0) / 100;
const jagdMuenzenFuer = (m, art) => Math.max(1, Math.round((1 + Math.floor(m.stufe / 10)) * art.faktor * (1 + haustierBonus("jagd"))));

// Monster, die für eine Schwierigkeit passen (keine Chefs, nur die normalen Gebiets-Monster)
function jagdKandidaten(art) {
  const L = kampfStufe();
  const grenze = Math.max(1, Math.round(L * art.anteil) + (art.plus || 0));
  const alle = GEBIETE.flatMap(g => g.monster).filter(m => !m.chef);
  const passend = alle.filter(m => m.stufe <= grenze);
  return passend.length ? passend : [alle[0]];
}
function neuerAuftrag(artId) {
  const art = JAGD.arten.find(a => a.id === artId);
  if (!art || stufe("jagd") < art.stufe || jagd().auftrag) return null;
  const k = jagdKandidaten(art);
  // eher die stärkeren der passenden Monster
  const m = k.sort((a, b) => b.stufe - a.stufe)[Math.floor(Math.random() * Math.min(4, k.length))];
  const ziel = art.menge[0] + Math.floor(Math.random() * (art.menge[1] - art.menge[0] + 1));
  jagd().auftrag = { monster: m.id, ziel, stand: 0, art: art.id };
  return jagd().auftrag;
}
function tauscheAuftrag() {
  const j = jagd();
  if (!j.auftrag) return false;
  const artId = j.auftrag.art;
  if (j.muenzen >= JAGD.tauschenKostet) j.muenzen -= JAGD.tauschenKostet;   // wer zu wenig hat, darf kostenlos tauschen
  j.auftrag = null;
  return neuerAuftrag(artId);
}
// Wird bei jedem eingeschlafenen Monster aufgerufen (kampf.js)
function jagdNachSieg(m, ergebnis) {
  const a = spiel.jagd?.auftrag;
  if (!a || a.monster !== m.id) return;
  const art = JAGD.arten.find(x => x.id === a.art);
  a.stand++;
  const muenzen = jagdMuenzenFuer(m, art);
  spiel.jagd.muenzen += muenzen;
  const vorher = stufe("jagd");
  spiel.xp.jagd = (spiel.xp.jagd || 0) + Math.round(m.hp * trankFaktorXp());
  if (stufe("jagd") > vorher) ergebnis.ereignisse.push({ kampfStufe: "jagd", neueStufe: stufe("jagd") });
  if (a.stand >= a.ziel) {
    const bonus = Math.round(muenzen * a.ziel * JAGD.bonusAmEnde);
    spiel.jagd.muenzen += bonus;
    spiel.statistik.jagdAuftraege = (spiel.statistik.jagdAuftraege || 0) + 1;
    if (a.art === "schwer") spiel.statistik.jagdSchwer = (spiel.statistik.jagdSchwer || 0) + 1;
    ergebnis.ereignisse.push({ jagdFertig: { monster: m.id, bonus } });
    const tier = HAUSTIERE.find(h => h.id === "stups");
    if (!hatHaustier("stups") && Math.random() < JAGD.haustierChance * (1 + baumhausBonus("tier"))) { gibHaustier(tier); ergebnis.ereignisse.push({ haustier: tier }); }
    spiel.jagd.auftrag = null;
  }
}

function jagdKosten(x) { const n = jagdLaden(x.id); return n < x.preise.length ? { preis: x.preise[n], ab: x.ab[n] } : null; }
function jagdKaufe(x) {
  const k = jagdKosten(x);
  if (!k || stufe("jagd") < k.ab || jagd().muenzen < k.preis) return false;
  jagd().muenzen -= k.preis;
  jagd().laden[x.id] = jagdLaden(x.id) + 1;
  if (x.kleidung) gibTeil(x.kleidung);
  return true;
}
const jagdLadenSumme = () => JAGD_LADEN.reduce((s, x) => s + jagdLaden(x.id), 0);
const jagdLadenMax = () => JAGD_LADEN.reduce((s, x) => s + x.preise.length, 0);

// ----- Erfolge -----
erfolg({ id: "jagd-1", icon: "📋", name: "Erster Auftrag", text: "Schaffe deinen ersten Monster-Auftrag", ziel: 1, muenzen: 1000, wert: () => spiel.statistik.jagdAuftraege || 0 });
erfolg({ id: "jagd-50", icon: "📋", name: "Jagd-Profi", text: "Schaffe 50 Monster-Aufträge", ziel: 50, muenzen: 250000, wert: () => spiel.statistik.jagdAuftraege || 0 });
erfolg({ id: "jagd-schwer", icon: "🔥", name: "Mutige Jägerin", text: "Schaffe 10 schwere Monster-Aufträge", ziel: 10, muenzen: 500000, wert: () => spiel.statistik.jagdSchwer || 0 });
erfolg({ id: "jagd-laden", icon: "🏅", name: "Alles aus dem Jagd-Laden", text: "Kauf alles im Jagd-Laden", ziel: jagdLadenMax(), muenzen: 2000000, wert: () => (spiel.jagd ? jagdLadenSumme() : 0) });
