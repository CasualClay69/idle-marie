"use strict";
// =====================================================
//  ENTDECKER-KARTE (wie "Kartografie" in Melvor Idle)
//  Frei nach dem 7. geschafften Abenteuer-Pfad. Neue Fertigkeit "Entdecken".
//  • Eine Insel aus 9×9 Feldern liegt im Nebel – nur das Lager in der Mitte ist frei.
//  • Man wählt ein Feld neben dem Entdeckten und erkundet es (Tätigkeit). Weiter außen = mehr Schritte
//    und eine höhere Entdecken-Stufe nötig. Ohne Wahl nimmt die Figur das nächste günstige Feld.
//  • Auf den Feldern: Landschaft, Schätze, Kristallhöhlen, Aussichtspunkte (Nachbarn halb so teuer),
//    Zauberquellen (+1 % Erfahrung bei allem), Schatzkarten (bessere Funde beim Ausgraben),
//    ein Tiernest und ganz außen die geheime Regenbogen-Insel.
//  spiel.karte = { offen: { "x,y": true }, ziel: "x,y" | null, punkte: { "x,y": n } }
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "graben") + 1, 0,
  { id: "karte", name: "Ent­decken", icon: "🗺️", art: "sammeln", farbe: "#5fb8a8", tun: "erkundet die Insel" });

const KARTE = {
  groesse: 9,
  schritteBasis: 40,          // Schritte für ein Feld = 40 × (Abstand + 1)²
  stufeFuerAbstand: [1, 1, 15, 35, 60],   // so viel Entdecken-Stufe braucht ein Feld mit Abstand 0 … 4
};
const MITTE = Math.floor(KARTE.groesse / 2);
const feldId = (x, y) => `${x},${y}`;
const abstand = (x, y) => Math.max(Math.abs(x - MITTE), Math.abs(y - MITTE));

// Feld-Arten (Landschaft hängt vom Abstand ab, besondere Orte werden fest verteilt)
const FELD_ARTEN = {
  lager:     { name: "Dein Lager",         icon: "🏡", farbe: "#ffe9c9" },
  wiese:     { name: "Blumenwiese",        icon: "🌼", farbe: "#c9eeb8" },
  wald:      { name: "Wald",               icon: "🌲", farbe: "#a8d8a0" },
  berg:      { name: "Berge",              icon: "⛰️", farbe: "#d8d0c8" },
  see:       { name: "See",                icon: "💧", farbe: "#bfe3ff" },
  strand:    { name: "Strand",             icon: "🏖️", farbe: "#fff0c2" },
  schatz:    { name: "Versteckter Schatz", icon: "🧰", farbe: "#ffe08a", text: "Münzen und Edelsteine!" },
  kristall:  { name: "Kristallhöhle",      icon: "💎", farbe: "#d6ecff", text: "Wertvolle Edelsteine" },
  aussicht:  { name: "Aussichtspunkt",     icon: "🔭", farbe: "#e8dcff", text: "Die Felder rundherum gehen nur noch halb so lange" },
  quelle:    { name: "Zauberquelle",       icon: "✨", farbe: "#d8f6ff", text: "+1 % Erfahrung bei allem – für immer" },
  schatzkarte: { name: "Alte Schatzkarte", icon: "🗺️", farbe: "#f2e6cf", text: "Bessere Funde an einem Ausgrabungsort" },
  nest:      { name: "Tiernest",           icon: "🐾", farbe: "#ffe1ee", text: "Hier wohnt ein kleines Tier …" },
  geheim:    { name: "Regenbogen-Insel",   icon: "🌈", farbe: "#ffd6f0", text: "Der geheimste Ort der ganzen Insel!" },
};

// Die Insel ist für alle gleich (fester Zufall)
const INSEL = (() => {
  let s = 20261124;
  const z = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const felder = {};
  for (let y = 0; y < KARTE.groesse; y++) for (let x = 0; x < KARTE.groesse; x++) {
    const d = abstand(x, y);
    const landschaft = d === 0 ? "lager" : d === 1 ? "wiese" : d === 2 ? (z() < 0.5 ? "wald" : "wiese") : d === 3 ? (z() < 0.5 ? "berg" : z() < 0.5 ? "see" : "wald") : (z() < 0.6 ? "strand" : "see");
    felder[feldId(x, y)] = { x, y, d, art: landschaft };
  }
  felder[feldId(0, 0)].art = "geheim";
  const frei = Object.values(felder).filter(f => f.d >= 1 && f.art !== "geheim").sort(() => z() - 0.5);
  const verteile = (art, n, minD = 1) => { for (let i = 0; i < n; i++) { const k = frei.findIndex(f => f.d >= minD); if (k >= 0) frei.splice(k, 1)[0].art = art; } };
  verteile("aussicht", 4, 1); verteile("quelle", 6, 2); verteile("schatzkarte", 6, 2); verteile("kristall", 4, 3); verteile("schatz", 8, 1); verteile("nest", 1, 3);
  // Schatzkarten gehören je zu einem Ausgrabungsort
  Object.values(felder).filter(f => f.art === "schatzkarte").forEach((f, i) => { f.grabung = GRABUNGEN[i % GRABUNGEN.length].id; });
  return felder;
})();

RAHMEN.push({ id: "rk1", name: "Entdecker-Rahmen", icon: "🗺️", karte: true, svg: ring("#5fb8a8", 5, ringPunkte(8).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${["#ffd54f", "#7ad7f0", "#8fcf6a", "#ff9fc8"][i % 4]}"/>`).join("")) });
HAUSTIERE.push({ id: "fini", name: "Fini", tier: "Flamingo", emoji: "🦩", karte: true, bonus: { art: "xp", wert: 0.03 }, text: "+3 % Erfahrung bei allem" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

// Die Tätigkeit "Erkunden": Erfahrung wächst mit der Stufe (wie bei den anderen Sammel-Fertigkeiten)
taetigkeit({ id: "karte-0", fertigkeit: "karte", name: "Insel erkunden", stufe: 1, gibt: {}, karte: true, zeit: 5,
  get xp() { const i = Math.max(0, STUFEN.filter(s => s <= stufe("karte")).length - 1); return Math.round(XP[i] * (STUFEN[i] >= 45 ? 0.7 : 1) * 0.9); } });

// ===================== LOGIK =====================
const karteFrei = () => PFADE.filter(p => (spiel.pfade?.[p.id] || 0) > 0).length >= 7 || (spiel.xp?.karte || 0) > 0;
function karte() { return spiel.karte || (spiel.karte = { offen: { [feldId(MITTE, MITTE)]: true }, ziel: null, punkte: {} }); }
const istOffen = id => !!karte().offen[id];
const nachbarn = f => [-1, 0, 1].flatMap(dx => [-1, 0, 1].map(dy => INSEL[feldId(f.x + dx, f.y + dy)])).filter(n => n && n !== f);
// Ein Feld darf erkundet werden: noch zu, grenzt an Entdecktes, Stufe reicht
function erkundbar(id) {
  const f = INSEL[id];
  return f && !istOffen(id) && nachbarn(f).some(n => istOffen(feldId(n.x, n.y))) && stufe("karte") >= KARTE.stufeFuerAbstand[f.d];
}
function feldKosten(id) {
  const f = INSEL[id];
  let k = KARTE.schritteBasis * (f.d + 1) * (f.d + 1);
  if (nachbarn(f).some(n => n.art === "aussicht" && istOffen(feldId(n.x, n.y)))) k = Math.round(k / 2);
  return k;
}
// Ohne gewähltes Ziel: das günstigste erkundbare Feld
function naechstesZiel() {
  const kandidaten = Object.keys(INSEL).filter(erkundbar);
  return kandidaten.sort((a, b) => (feldKosten(a) - (karte().punkte[a] || 0)) - (feldKosten(b) - (karte().punkte[b] || 0)))[0] || null;
}
const kartenZiel = () => (karte().ziel && erkundbar(karte().ziel) ? karte().ziel : naechstesZiel());
const offeneFelder = () => Object.keys(karte().offen).length;
const alleFelder = () => Object.keys(INSEL).length;

// Ein Schritt Erkunden (aus fuehreAus). Rückgabe: entdecktes Feld oder null
function erkundeSchritt(mal) {
  const k = karte(), id = kartenZiel();
  if (!id) return null;
  k.ziel = id;
  k.punkte[id] = (k.punkte[id] || 0) + mal;
  if (k.punkte[id] < feldKosten(id)) return null;
  delete k.punkte[id];
  k.offen[id] = true;
  k.ziel = null;
  return entdecke(INSEL[id]);
}
// Belohnung für ein neu entdecktes Feld
function entdecke(f) {
  const t = Math.min(7, 2 + f.d), b = { feld: feldId(f.x, f.y), art: f.art, text: "" };
  const geld = n => { spiel.muenzen += n; return `${zahl(n)} Münzen`; };
  if (f.art === "schatz") { const s = `stein${Math.min(7, 3 + f.d)}`; gibInBank(s, 2); b.text = `${geld(20000 * (f.d + 1) ** 2)} und 2× ${GEGENSTAENDE[s].name}`; }
  else if (f.art === "kristall") { const s = `stein${Math.min(7, 4 + f.d)}`; gibInBank(s, 4); gibInBank("goldsplitter5", 3); b.text = `4× ${GEGENSTAENDE[s].name} und 3 Goldsplitter`; }
  else if (f.art === "aussicht") b.text = "Von hier oben siehst du weit – die Felder rundherum gehen jetzt schneller!";
  else if (f.art === "quelle") b.text = "+1 % Erfahrung bei allem – für immer!";
  else if (f.art === "schatzkarte") b.text = `Bessere Funde beim Ausgraben: ${GRABUNGEN.find(g => g.id === f.grabung).name}`;
  else if (f.art === "nest") { const h = HAUSTIERE.find(x => x.id === "fini"); if (gibHaustier(h)) b.haustier = h; b.text = "Ein kleines Tier wohnt jetzt bei dir!"; }
  else if (f.art === "geheim") { gibTeil("rk1"); b.text = `${geld(5000000)} und der Entdecker-Rahmen!`; }
  else b.text = geld(500 * (t + 1) ** 2);
  spiel.statistik.felder = (spiel.statistik.felder || 0) + 1;
  return b;
}
// Dauer-Boni: Zauberquellen (Erfahrung) und Schatzkarten (Ausgraben)
const kartenAnzahl = art => Object.values(INSEL).filter(f => f.art === art && spiel.karte?.offen[feldId(f.x, f.y)]).length;
function karteAllgemein(art) { return art === "xp" && spiel.karte ? kartenAnzahl("quelle") * 0.01 : 0; }
const karteFundBonus = ort => (spiel.karte ? Object.values(INSEL).filter(f => f.art === "schatzkarte" && f.grabung === ort && spiel.karte.offen[feldId(f.x, f.y)]).length * 0.25 : 0);

erfolg({ id: "karte-10", icon: "🗺️", name: "Kleine Entdeckerin", text: "Entdecke 10 Felder auf der Insel", ziel: 10, muenzen: 50000, wert: () => (spiel.karte ? offeneFelder() - 1 : 0) });
erfolg({ id: "karte-alle", icon: "🗺️", name: "Die ganze Insel", text: "Entdecke jedes Feld der Insel", ziel: alleFelder(), muenzen: 5000000, wert: () => (spiel.karte ? offeneFelder() : 0) });
erfolg({ id: "karte-geheim", icon: "🌈", name: "Regenbogen-Insel", text: "Finde den geheimsten Ort der Insel", ziel: 1, muenzen: 1000000, wert: () => (spiel.karte?.offen[feldId(0, 0)] ? 1 : 0) });
