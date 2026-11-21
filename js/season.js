"use strict";
// =====================================================
//  SEASON-PASS – Logik
//  spiel.season = { id: "2026-11", punkte, stufeErreicht, aufgaben: [ … ], tag, woche }
//  Aufgabe = { id, art, typ, ziel, start, punkte, tag, fertig, abgeholt }
//  Fortschritt einer Aufgabe = Zähler jetzt − Zähler beim Erstellen (start).
// =====================================================

const zweistellig = n => String(n).padStart(2, "0");
function tagText(d = new Date(Date.now())) { return `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}-${zweistellig(d.getDate())}`; }
function wochenText(d = new Date(Date.now())) {
  const montag = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7);
  return tagText(montag);
}
function seasonId(d = new Date(Date.now())) { return `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}`; }
function aktuellesThema() { return SEASON_THEMEN[new Date(Date.now()).getMonth()]; }
function seasonTageUebrig() {
  const d = new Date(Date.now());
  const ende = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return Math.max(1, Math.ceil((ende - d) / 86400000));
}

// ----- Zähler, an denen Aufgaben gemessen werden -----
function zaehleAktion(fertigkeitId) {
  spiel.statistik.aktionenNach = spiel.statistik.aktionenNach || {};
  spiel.statistik.aktionenNach[fertigkeitId] = (spiel.statistik.aktionenNach[fertigkeitId] || 0) + 1;
}
const AUFGABEN_TYPEN = {
  aktion:  { wert: f => spiel.statistik.aktionenNach?.[f] || 0 },
  monster: { wert: () => spiel.statistik.besiegt || 0 },
  season:  { wert: () => spiel.besiegt?.season || 0 },
  ernte:   { wert: () => spiel.statistik.geerntet || 0 },
  truhe:   { wert: () => spiel.statistik.truhen || 0 },
};
// Vorlagen: [typ, fertigkeit, Menge am Tag, Menge in der Woche, Text]
const AUFGABEN_VORLAGEN = [
  ["aktion", "holz", 60, 400, n => `Sammle ${n}× Holz`],
  ["aktion", "angeln", 50, 350, n => `Angle ${n}× einen Fisch`],
  ["aktion", "bergbau", 50, 350, n => `Grabe ${n}× nach Erz`],
  ["aktion", "kochen", 30, 200, n => `Koche ${n} Gerichte`],
  ["aktion", "schmieden", 30, 200, n => `Schmiede ${n}× etwas`],
  ["aktion", "schnitzen", 30, 200, n => `Schnitze ${n}× etwas`],
  ["aktion", "bauen", 30, 200, n => `Säge ${n} Bretter`],
  ["aktion", "naehen", 25, 150, n => `Näh ${n}× etwas`],
  ["aktion", "traenke", 8, 50, n => `Braue ${n} Tränke`, () => stufe("traenke") >= 5],
  ["monster", null, 15, 100, n => `Bring ${n} Monster zum Einschlafen`],
  ["season", null, 5, 30, n => `Lass das Season-Monster ${n}× einschlafen`],
  ["ernte", null, 2, 12, n => `Ernte ${n} Beete`],
  ["truhe", null, 1, 6, n => `Öffne ${n === 1 ? "eine Schatztruhe" : `${n} Schatztruhen`} auf einem Abenteuer-Pfad`, () => PFADE.some(pfadFrei)],
];

function zaehlerVon(a) { return AUFGABEN_TYPEN[a.typ].wert(a.fertigkeit); }
function aufgabeStand(a) {
  const wert = Math.max(0, zaehlerVon(a) - a.start);
  return { wert: Math.min(wert, a.ziel), fertig: wert >= a.ziel };
}

function neueAufgaben(art, anzahl, tag) {
  const vorlagen = AUFGABEN_VORLAGEN.filter(v => !v[5] || v[5]());
  // Season-Monster ist immer dabei, der Rest zufällig (ohne doppelte)
  const auswahl = [vorlagen.find(v => v[0] === "season")];
  const rest = vorlagen.filter(v => v[0] !== "season").sort(() => Math.random() - 0.5);
  while (auswahl.length < anzahl && rest.length) auswahl.push(rest.shift());
  return auswahl.map((v, i) => {
    const ziel = art === "tag" ? v[2] : v[3];
    const a = { id: `${art}-${tag}-${i}`, art, typ: v[0], fertigkeit: v[1], ziel, tag, text: v[4](ziel),
      punkte: art === "tag" ? SEASON.tagesPunkte : SEASON.wochenPunkte, abgeholt: false };
    a.start = zaehlerVon(a);
    return a;
  });
}

// Prüft Monats-, Tages- und Wochenwechsel. Gibt true zurück, wenn sich etwas geändert hat.
function pruefeSeasonWechsel() {
  const id = seasonId(), heute = tagText(), woche = wochenText();
  let neu = false;
  if (!spiel.season || spiel.season.id !== id) {
    spiel.season = { id, punkte: 0, stufeErreicht: 0, aufgaben: [], tag: null, woche: null };
    neu = true;
  }
  const s = spiel.season;
  if (s.tag !== heute) {
    // alte, nicht abgeholte Tagesaufgaben bleiben bis zu 7 Tage (zum Aufholen)
    const grenze = tagText(new Date(Date.now() - SEASON.aufholTage * 86400000));
    s.aufgaben = s.aufgaben.filter(a => a.art !== "tag" || (!a.abgeholt && a.tag > grenze));
    s.aufgaben.push(...neueAufgaben("tag", SEASON.tagesAufgaben, heute));
    s.tag = heute;
    neu = true;
  }
  if (s.woche !== woche) {
    s.aufgaben = s.aufgaben.filter(a => a.art !== "woche");
    s.aufgaben.push(...neueAufgaben("woche", SEASON.wochenAufgaben, woche));
    s.woche = woche;
    neu = true;
  }
  return neu;
}

function seasonStufe() { return Math.min(SEASON.stufen, Math.floor((spiel.season?.punkte || 0) / SEASON.punkteProStufe)); }
function abholbereiteAufgaben() { return (spiel.season?.aufgaben || []).filter(a => !a.abgeholt && aufgabeStand(a).fertig); }

// Punkte gutschreiben und dabei erreichte Stufen belohnen. Rückgabe: Liste der neuen Stufen mit Belohnung
function gibSeasonPunkte(n) {
  const s = spiel.season;
  s.punkte += n;
  const neu = [];
  while (s.stufeErreicht < seasonStufe()) {
    s.stufeErreicht++;
    spiel.statistik.seasonStufen = (spiel.statistik.seasonStufen || 0) + 1;
    spiel.statistik.seasonMax = Math.max(spiel.statistik.seasonMax || 0, s.stufeErreicht);
    neu.push({ stufe: s.stufeErreicht, belohnung: gibStufenBelohnung(s.stufeErreicht) });
  }
  // Über Stufe 30 hinaus: je 100 Punkte ein Münzen-Bonus
  const extra = Math.floor(Math.max(0, s.punkte - SEASON.stufen * SEASON.punkteProStufe) / SEASON.punkteProStufe);
  while ((s.bonusAbgeholt || 0) < extra) {
    s.bonusAbgeholt = (s.bonusAbgeholt || 0) + 1;
    const m = bonusMuenzen(SEASON.stufen);
    spiel.muenzen += m;
    neu.push({ stufe: SEASON.stufen + s.bonusAbgeholt, belohnung: { muenzen: m } });
  }
  return neu;
}
function holeAufgabe(a) {
  if (a.abgeholt || !aufgabeStand(a).fertig) return null;
  a.abgeholt = true;
  return gibSeasonPunkte(a.punkte);
}

// ----- Belohnungen der 30 Stufen -----
function bonusMuenzen(stufe) { return Math.round(40 * stufe * (1 + gesamtStufe() / 40) / 10) * 10; }
function besteFreiePflanze(art) {
  const frei = PFLANZEN.filter(p => p.art === art && stufe("garten") >= p.stufe);
  return frei[frei.length - 1] || PFLANZEN.find(p => p.art === art);
}
// Was gibt es auf Stufe n? (für die Anzeige, ohne etwas zu verteilen)
function stufenBelohnung(n) {
  const t = aktuellesThema();
  if (n === 10) return { aussehen: t.rahmenId };
  if (n === 20) return { aussehen: t.kleidId };
  if (n === 25) return { aussehen: t.hut };
  if (n === 30) return { haustier: t.haustierId };
  if (n === 15 || n === 28) return { sachen: { trank7: n === 28 ? 3 : 2 } };
  if (n % 5 === 0) return { sachen: { trank7: 1 } };
  if (n % 3 === 0) return { samen: true };
  if (n % 4 === 2) return { essen: true };
  return { muenzen: bonusMuenzen(n) };
}
function gibStufenBelohnung(n) {
  const b = stufenBelohnung(n), ergebnis = { ...b };
  if (b.muenzen) spiel.muenzen += b.muenzen;
  for (const [id, m] of Object.entries(b.sachen || {})) gibInBank(id, m);
  if (b.aussehen) gibTeil(b.aussehen);
  if (b.haustier) { const h = HAUSTIERE.find(x => x.id === b.haustier); if (gibHaustier(h)) ergebnis.neuesHaustier = h; }
  if (b.samen) {
    const g = besteFreiePflanze("gemuese"), k = besteFreiePflanze("kraut");
    gibInBank(g.samen, 5); gibInBank(k.samen, 5);
    ergebnis.sachen = { [g.samen]: 5, [k.samen]: 5 };
  }
  if (b.essen) {
    const tier = Math.min(7, Math.floor(kampfStufe() / 12));
    gibInBank(`essen${tier}`, 15);
    ergebnis.sachen = { [`essen${tier}`]: 15 };
  }
  return ergebnis;
}

// ----- Season-Monster: passt sich der Kampfstufe an -----
function aktualisiereSeasonMonster() {
  const t = aktuellesThema();
  const L = Math.max(3, kampfStufe() + 2);
  MONSTER.season = Object.assign(MONSTER.season || {}, {
    id: "season", name: t.monster.name, stufe: L, aussehen: t.monster.aussehen, gebiet: "season", season: true,
    hp: Math.round(15 + L * 7 + L * L * 0.1), maxSchlag: Math.round(2 + L * 1.6),
    genauigkeit: Math.round((L + 8) * (52 + L * 0.6)), ausweichen: Math.round((L + 8) * (64 + L * 0.8)), tempo: 2.8,
    muenzen: [L * 2, L * 6],
    beute: [{ id: `essen${Math.min(7, Math.floor(L / 12))}`, chance: 0.3, anzahl: [1, 2] }],
  });
}
