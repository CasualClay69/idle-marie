"use strict";
// =====================================================
//  GARTEN & TRÄNKE – Logik
//  spiel.garten = { beete: [ { pflanze, start, gemeldet } | null, … ], gekauft }
//  spiel.traenke = { trankId: übrige Ladungen }
// =====================================================

function gartenStand() {
  if (!spiel.garten) spiel.garten = { beete: [], gekauft: 0 };
  const blumenkasten = spiel.baumhaus?.blumen || 0;   // ab Ahorn-Stufe je ein Beet mehr (bis zu 3)
  const anzahlBeete = GARTEN.startBeete + spiel.garten.gekauft + Math.max(0, blumenkasten - 2);
  while (spiel.garten.beete.length < anzahlBeete) spiel.garten.beete.push(null);
  return spiel.garten;
}
const pflanze = id => PFLANZEN.find(p => p.id === id);

// Wachszeit in ms (der Blumenkasten im Baumhaus macht schneller)
function wachsMs(beet) { return pflanze(beet.pflanze).minuten * 60000 * (1 - baumhausBonus("garten")); }
function beetFortschritt(beet, jetzt = Date.now()) {
  if (!beet) return 0;
  return Math.min(1, (jetzt - beet.start) / wachsMs(beet));
}
function beetRestMs(beet, jetzt = Date.now()) {
  return Math.max(0, beet.start + wachsMs(beet) - jetzt);
}

function pflanzeEin(nr, pflanzenId) {
  const g = gartenStand(), p = pflanze(pflanzenId);
  if (g.beete[nr] || !p || stufe("garten") < p.stufe || anzahl(p.samen) < 1) return false;
  nimmAusBank(p.samen, 1);
  g.beete[nr] = { pflanze: p.id, start: Date.now() };
  return true;
}

// Ernten: Rückgabe { menge, samen, xp, neueStufe } oder ein Grund (Text)
function ernte(nr) {
  const g = gartenStand(), beet = g.beete[nr];
  if (!beet || beetFortschritt(beet) < 1) return "Noch nicht reif";
  const p = pflanze(beet.pflanze);
  if (!passtInBank(p.ertrag)) return "Die Bank ist voll";
  const uebungsId = `garten-${p.id}`;
  let menge = p.menge[0] + Math.floor(Math.random() * (p.menge[1] - p.menge[0] + 1));
  if (Math.random() < Math.floor(stufeAusXp(spiel.uebung[uebungsId] || 0) / 10) * SPIEL.uebungDoppeltProZehn + haustierBonus("doppelt", "garten") + baumhausBonus("doppelt")) menge *= 2;
  gibInBank(p.ertrag, menge);
  zaehle(p.ertrag, menge);
  let samen = 0;
  if (Math.random() < GARTEN.samenZurueck && passtInBank(p.samen)) { gibInBank(p.samen, 1); samen = 1; }
  const vorher = stufe("garten");
  const xp = Math.round(p.xp * trankFaktorXp());
  spiel.xp.garten = (spiel.xp.garten || 0) + xp;
  spiel.uebung[uebungsId] = (spiel.uebung[uebungsId] || 0) + xp;
  spiel.statistik.geerntet = (spiel.statistik.geerntet || 0) + 1;
  zaehleAktion("garten");
  g.beete[nr] = null;
  const haustier = vielleichtHaustierBeiErnte();
  return { menge, samen, xp, p, haustier, neueStufe: stufe("garten") > vorher ? stufe("garten") : 0 };
}

function beetPreis() { return GARTEN.beetPreise[gartenStand().gekauft]; }   // undefined = alle gekauft
function kaufeBeet() {
  const preis = beetPreis();
  if (preis === undefined || spiel.muenzen < preis) return false;
  spiel.muenzen -= preis;
  spiel.garten.gekauft++;
  gartenStand();
  return true;
}
function kaufeSamen(id, n) {
  const kosten = GEGENSTAENDE[id].preis * n;
  if (spiel.muenzen < kosten || !passtInBank(id)) return false;
  spiel.muenzen -= kosten;
  gibInBank(id, n);
  return true;
}

// Welche Beete sind gerade fertig geworden (für eine einmalige Meldung)?
function neuReifeBeete() {
  const neu = [];
  gartenStand().beete.forEach(b => {
    if (b && !b.gemeldet && beetFortschritt(b) >= 1) { b.gemeldet = true; neu.push(pflanze(b.pflanze)); }
  });
  return neu;
}

// =====================================================
//  TRÄNKE
// =====================================================
function trinke(id) {
  const t = GEGENSTAENDE[id]?.trank;
  if (!t || anzahl(id) < 1) return false;
  nimmAusBank(id, 1);
  spiel.traenke = spiel.traenke || {};
  spiel.traenke[id] = (spiel.traenke[id] || 0) + t.ladungen;
  spiel.statistik.getrunken = (spiel.statistik.getrunken || 0) + 1;
  return true;
}
function aktiveTraenke() {
  return Object.entries(spiel.traenke || {}).filter(([, n]) => n > 0).map(([id, n]) => ({ ...GEGENSTAENDE[id].trank, ladungen: n }));
}
// Passt ein aktiver Trank zu …? (pruefe bekommt die Wirkung)
function trankWirkung(pruefe) {
  return aktiveTraenke().filter(t => pruefe(t.wirkung));
}
function verbraucheTrank(t) {
  spiel.traenke[t.id] = Math.max(0, (spiel.traenke[t.id] || 0) - 1);
  if (!spiel.traenke[t.id]) {
    delete spiel.traenke[t.id];
    spiel.traenkeLeer = (spiel.traenkeLeer || []).concat(t.name);   // für eine Meldung
  }
}
function trankFaktorXp() {   // Tränke und Haustiere zusammen
  return 1 + haustierBonus("xp") + baumhausBonus("xp") + trankWirkung(w => w.art === "xp").reduce((s, t) => s + t.wirkung.wert, 0);
}
// Bonus für eine Tätigkeit (ohne zu verbrauchen)
function trankDoppelt(t) {
  return trankWirkung(w => w.art === "doppelt" && w.fertigkeit === t.fertigkeit).reduce((s, x) => s + x.wirkung.wert, 0);
}
function trankSchneller(t) {
  if (fertigkeit(t.fertigkeit).art !== "machen") return 0;
  return trankWirkung(w => w.art === "schneller").reduce((s, x) => s + x.wirkung.wert, 0);
}
// Nach einer Tätigkeit: passende Tränke verbrauchen
function trankNachTaetigkeit(t) {
  for (const x of trankWirkung(w => w.art === "xp" || (w.art === "doppelt" && w.fertigkeit === t.fertigkeit) ||
                                    (w.art === "schneller" && fertigkeit(t.fertigkeit).art === "machen"))) verbraucheTrank(x);
}
// Kampf
function trankKampf(art) {
  return trankWirkung(w => w.art === art).reduce((s, x) => s + x.wirkung.wert, 0);
}
function trankNachSieg() {
  for (const x of trankWirkung(w => ["treff", "kraft", "schutz", "xp"].includes(w.art))) verbraucheTrank(x);
}
