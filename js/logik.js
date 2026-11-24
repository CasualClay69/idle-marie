"use strict";
// =====================================================
//  SPIEL-LOGIK: Spielstand, Erfahrung, Tätigkeiten, Bank, Laden, Offline-Fortschritt
//  Diese Datei fasst das HTML nicht an – die Anzeige macht anzeige.js.
// =====================================================

const SPEICHER_SCHLUESSEL = "idleMarie-spielstand";

function neuerSpielstand() {
  return {
    version: 1,
    figur: null,                 // hannah | marie – wird beim ersten Start gewählt
    muenzen: 0,
    xp: { herzen: KAMPF.herzenStartXp },   // fertigkeitId -> Erfahrung (Herzen beginnen auf Stufe 10)
    uebung: {},                  // taetigkeitId -> Übungs-Erfahrung
    bank: {},                    // gegenstandId -> Anzahl
    bankFaecherGekauft: 0,
    werkzeuge: { axt: 0, angel: 0, hacke: 0 },   // 0 = keins, 1 = Kupfer …
    aktiv: null,                 // { id, start } – was die Figur gerade tut
    letzteZeit: Date.now(),
    statistik: { aktionen: 0, verkauft: 0, verdient: 0, besiegt: 0 },
    ausruestung: {},             // platz -> gegenstandId
    essen: null,                 // welches Essen im Kampf gegessen wird
    kampfstil: "mut",
    hp: 0,
    besiegt: {},                 // monsterId -> wie oft eingeschlafen
    kampfLog: [],
  };
}

let spiel = neuerSpielstand();

function laden() {
  try {
    const text = localStorage.getItem(SPEICHER_SCHLUESSEL);
    if (text) spiel = Object.assign(neuerSpielstand(), JSON.parse(text));
    if (!spiel.xp.herzen) spiel.xp.herzen = KAMPF.herzenStartXp;
    if (spiel.figur && !FIGUREN.some(f => f.id === spiel.figur)) spiel.figur = null;   // Figur gibt es nicht mehr
  } catch (e) { /* kaputter oder gesperrter Speicher -> neues Spiel */ }
}
function speichern() {
  spiel.letzteZeit = Date.now();
  try { localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(spiel)); } catch (e) { /* Speicher voll/gesperrt */ }
}

// ----- Erfahrung & Stufen (klassische Kurve: Stufe 99 ≈ 13 Mio. Erfahrung) -----
const XP_TABELLE = [0, 0];
{
  let summe = 0;
  for (let l = 1; l < 120; l++) {
    summe += Math.floor(l + 300 * Math.pow(2, l / 7));
    XP_TABELLE[l + 1] = Math.floor(summe / 4);
  }
}
function stufeAusXp(xp) {
  let l = 1;
  while (l < SPIEL.maxStufe && xp >= XP_TABELLE[l + 1]) l++;
  return l;
}
function fortschrittInStufe(xp) {
  const l = stufeAusXp(xp);
  if (l >= SPIEL.maxStufe) return 1;
  return (xp - XP_TABELLE[l]) / (XP_TABELLE[l + 1] - XP_TABELLE[l]);
}
function stufe(fertigkeitId) { return stufeAusXp(spiel.xp[fertigkeitId] || 0); }
function uebungStufe(taetigkeitId) { return stufeAusXp(spiel.uebung[taetigkeitId] || 0); }
function gesamtStufe() { return FERTIGKEITEN.reduce((s, f) => s + stufe(f.id), 0); }

// ----- Nachschlagen -----
const fertigkeit = id => FERTIGKEITEN.find(f => f.id === id);
const taetigkeitNachId = id => TAETIGKEITEN.find(t => t.id === id);
const taetigkeitenVon = fid => TAETIGKEITEN.filter(t => t.fertigkeit === fid);

// Dauer einer Tätigkeit in Sekunden (Werkzeug und Meister-Übung machen schneller)
function dauer(t) {
  let faktor = 1;
  const f = fertigkeit(t.fertigkeit);
  if (f.werkzeug) faktor -= WERKZEUG_BONUS * (spiel.werkzeuge[f.werkzeug] || 0);
  if (uebungStufe(t.id) >= SPIEL.maxStufe) faktor -= SPIEL.meisterSchneller;
  faktor -= trankSchneller(t);
  faktor -= sternBonus("schneller", t.fertigkeit) + topfBonus(t.fertigkeit, "schneller");
  if (f.art === "machen") faktor -= haustierBonus("schneller", t.fertigkeit);
  if (f.art === "sammeln") faktor -= baumhausBonus("sammeln") + schmuckBonus("sammeln");
  if (f.art === "machen") faktor -= baumhausBonus("machen") + schmuckBonus("machen");
  return Math.max(0.5, t.zeit * faktor);
}
function doppeltChance(t) {
  return Math.floor(uebungStufe(t.id) / 10) * SPIEL.uebungDoppeltProZehn + trankDoppelt(t) + haustierBonus("doppelt", t.fertigkeit) + baumhausBonus("doppelt") + schmuckBonus("doppelt") + sternBonus("doppelt", t.fertigkeit) + topfBonus(t.fertigkeit, "doppelt");
}

// ----- Bank -----
// Bonus von Ring und Kette (Anteil, z.B. 0,05)
function schmuckBonus(art) {
  return ["ring", "kette"].reduce((s, p) => {
    const g = GEGENSTAENDE[spiel.ausruestung?.[p]];
    return s + (g?.schmuck?.art === art ? g.schmuck.wert : 0);
  }, 0);
}
function bankFaecher() { return SPIEL.bankStart + spiel.bankFaecherGekauft + baumhausBonus("bank"); }
function belegteFaecher() { return Object.keys(spiel.bank).filter(id => spiel.bank[id] > 0).length; }
function anzahl(id) { return spiel.bank[id] || 0; }
function passtInBank(id) { return anzahl(id) > 0 || belegteFaecher() < bankFaecher(); }
function gibInBank(id, n) {
  spiel.bank[id] = anzahl(id) + n;
}
function nimmAusBank(id, n) {
  spiel.bank[id] = anzahl(id) - n;
  if (spiel.bank[id] <= 0) delete spiel.bank[id];
}
function verkaufe(id, n) {
  n = Math.min(n, anzahl(id));
  if (n <= 0) return 0;
  const erloes = n * GEGENSTAENDE[id].wert;
  nimmAusBank(id, n);
  spiel.muenzen += erloes;
  spiel.statistik.verkauft += n;
  spiel.statistik.verdient += erloes;
  return erloes;
}

// ----- Kann die Tätigkeit laufen? Rückgabe: null = ja, sonst ein Grund -----
function hindernis(t) {
  if (t.kleidung && (spiel.garderobe || []).includes(t.kleidung)) return "Fertig genäht – zieh es im 👗 Kleiderschrank an!";
  if (t.fertigkeit === "sterne" && !sterneFrei()) return "Schaffe zuerst einen Abenteuer-Pfad";
  if (t.fertigkeit === "feuer" && !feuerFrei()) return "Schaffe zuerst drei Abenteuer-Pfade";
  if (t.parcours && !turnenFrei()) return "Schaffe zuerst fünf Abenteuer-Pfade";
  if (t.fertigkeit === "freunde" && !freundeFrei()) return "Bring zuerst den Pusteblumen-Riesen zum Einschlafen";
  if (t.karte && !karteFrei()) return "Schaffe zuerst sieben Abenteuer-Pfade";
  if (t.grabung && !grabenFrei()) return "Schaffe zuerst sechs Abenteuer-Pfade";
  if (t.parcours && !gebauteStationen().length) return "Bau zuerst ein Hindernis auf dem Spielplatz";
  if (stufe(t.fertigkeit) < t.stufe) return `Erst ab Stufe ${t.stufe}`;
  for (const [id, n] of Object.entries(t.braucht || {})) {
    if (anzahl(id) < n) return `Es fehlt: ${GEGENSTAENDE[id].name}`;
  }
  for (const id of Object.keys(t.gibt)) {
    const wirdFrei = Object.keys(t.braucht || {}).some(b => anzahl(b) === (t.braucht[b]));   // ein Fach wird gleich leer
    if (!passtInBank(id) && !wirdFrei) return "Die Bank ist voll";
  }
  return null;
}

// Eine Tätigkeit einmal ausführen. Rückgabe: Ereignisse für die Anzeige
function fuehreAus(t) {
  const ereignisse = { stufeVorher: stufe(t.fertigkeit), uebungVorher: uebungStufe(t.id), doppelt: false };
  for (const [id, n] of Object.entries(t.braucht || {})) nimmAusBank(id, n);
  const mal = Math.random() < doppeltChance(t) ? 2 : 1;
  ereignisse.doppelt = mal === 2;
  for (const [id, n] of Object.entries(t.gibt)) { gibInBank(id, n * mal); zaehle(id, n * mal); }
  if (t.kleidung) { gibTeil(t.kleidung); ereignisse.kleidung = t.kleidung; }
  if (t.parcours) spiel.muenzen += rundenMuenzen() * mal;
  if (t.grabung) ereignisse.fund = grabeFund(t);
  if (t.karte) ereignisse.karte = erkundeSchritt(mal);
  if (t.fertigkeit !== "freunde") begleiterFrisst(null);
  if (t.fertigkeit === "sterne" && Math.random() < STERNE.goldChance && passtInBank("goldsplitter5")) {
    gibInBank("goldsplitter5", 1); zaehle("goldsplitter5", 1); ereignisse.goldsplitter = true;
  }
  if (t.fertigkeit === "bergbau" && Math.random() < SCHMUCK.edelsteinChance + baumhausBonus("edelstein")) {
    const stein = `stein${t.id.replace(/\D/g, "")}`;
    if (passtInBank(stein)) { gibInBank(stein, 1); zaehle(stein, 1); ereignisse.edelstein = stein; }
  }
  const xp = Math.round(t.xp * (trankFaktorXp() + sternBonus("xp", t.fertigkeit) + topfBonus(t.fertigkeit, "xp")));
  ereignisse.xp = xp;
  spiel.xp[t.fertigkeit] = (spiel.xp[t.fertigkeit] || 0) + xp;
  uebungGeben(t.id, t.fertigkeit, xp);   // füllt auch den Übungs-Topf
  spiel.statistik.aktionen++;
  zaehleAktion(t.fertigkeit);
  trankNachTaetigkeit(t);
  ereignisse.haustier = vielleichtHaustierBeiArbeit(t.fertigkeit, dauer(t));
  ereignisse.neueStufe = stufe(t.fertigkeit) > ereignisse.stufeVorher ? stufe(t.fertigkeit) : 0;
  ereignisse.neueUebung = uebungStufe(t.id) > ereignisse.uebungVorher ? uebungStufe(t.id) : 0;
  return ereignisse;
}

function starte(t) {
  if (hindernis(t)) return false;
  spiel.aktiv = { id: t.id, start: Date.now() };
  spiel.danach = null;   // "Danach weitermachen mit …" gehört zur laufenden Tätigkeit
  return true;
}
function stoppe() { spiel.aktiv = null; }

// Fortschritt der laufenden Tätigkeit (0 … 1)
function aktivFortschritt(jetzt = Date.now()) {
  if (!spiel.aktiv) return 0;
  if (spiel.aktiv.kampf) {
    if (spiel.aktiv.pauseBis) return 0;
    return Math.max(0, Math.min(1, 1 - (spiel.aktiv.spielerNaechster - jetzt) / (spielerWerte().tempo * 1000)));
  }
  const t = taetigkeitNachId(spiel.aktiv.id);
  return Math.min(1, (jetzt - spiel.aktiv.start) / (dauer(t) * 1000));
}

// Wird regelmäßig aufgerufen. Erledigt alle fälligen Durchgänge (auch nach längerer Pause).
// Rückgabe: Liste der Ereignisse und ob die Tätigkeit beenden musste
function tick(jetzt = Date.now(), maxDurchgaenge = Infinity) {
  const ergebnis = { durchgaenge: 0, ereignisse: [], gestoppt: null, gewonnen: {}, verbraucht: {}, xp: {} };
  if (spiel.aktiv?.kampf) {
    kampfTick(jetzt, ergebnis);
    if (ergebnis.gestoppt) spiel.letzterStopp = { grund: ergebnis.gestoppt, zeit: jetzt };
    return ergebnis;
  }
  while (spiel.aktiv && ergebnis.durchgaenge < maxDurchgaenge) {
    const t = taetigkeitNachId(spiel.aktiv.id);
    if (!t) { stoppe(); break; }
    const ms = dauer(t) * 1000;
    if (jetzt - spiel.aktiv.start < ms) break;
    const grund = hindernis(t);
    if (grund) { if (wechsleZuDanach(spiel.aktiv.start, grund, ergebnis)) continue; ergebnis.gestoppt = grund; stoppe(); break; }
    const vorher = { ...spiel.bank };
    const e = fuehreAus(t);
    for (const id of new Set([...Object.keys(vorher), ...Object.keys(spiel.bank)])) {
      const diff = anzahl(id) - (vorher[id] || 0);
      if (diff > 0) ergebnis.gewonnen[id] = (ergebnis.gewonnen[id] || 0) + diff;
      if (diff < 0) ergebnis.verbraucht[id] = (ergebnis.verbraucht[id] || 0) - diff;
    }
    ergebnis.xp[t.fertigkeit] = (ergebnis.xp[t.fertigkeit] || 0) + e.xp;
    e.taetigkeit = t;
    ergebnis.ereignisse.push(e);
    ergebnis.durchgaenge++;
    spiel.aktiv.start += ms;
    // Kann es weitergehen? Sonst gleich anhalten (z.B. Fisch alle)
    const weiter = hindernis(t);
    if (weiter && !wechsleZuDanach(spiel.aktiv.start, weiter, ergebnis)) { ergebnis.gestoppt = weiter; stoppe(); }
  }
  if (ergebnis.gestoppt) spiel.letzterStopp = { grund: ergebnis.gestoppt, zeit: jetzt };
  return ergebnis;
}

// "Danach weitermachen mit …": Geht es nicht weiter (z. B. Material alle), nahtlos zur gewählten zweiten Tätigkeit wechseln.
// start = Zeitpunkt, ab dem die neue Tätigkeit läuft (so zählt auch die Offline-Zeit weiter). Nur einmal, dann ist die Wahl verbraucht.
function wechsleZuDanach(start, grund, ergebnis) {
  const t = spiel.danach && taetigkeitNachId(spiel.danach);
  spiel.danach = null;
  if (!t || hindernis(t) || t.id === spiel.aktiv?.id) return false;
  spiel.aktiv = { id: t.id, start };
  ergebnis.gewechselt = { von: grund, zu: t };
  spiel.letzterStopp = { grund: `${grund} – darum hat ${figurName()} mit ${t.name} weitergemacht.`, zeit: Date.now() };
  return true;
}

// Beim Öffnen: die Zeit, in der das Spiel zu war, nachholen (höchstens offlineMaxStunden)
function holeOfflineNach() {
  if (!spiel.aktiv) return null;
  const jetzt = Date.now();
  const weg = jetzt - spiel.letzteZeit;
  if (weg < 60 * 1000) return null;
  const grenze = (SPIEL.offlineMaxStunden + baumhausBonus("offline")) * 3600 * 1000;   // das Bett im Baumhaus verlängert
  const xpVorher = { ...spiel.xp };
  const stufenVorher = Object.fromEntries(FERTIGKEITEN.map(f => [f.id, stufe(f.id)]));
  let ergebnis;
  if (spiel.aktiv.kampf) {
    // Kampf: nur bis zur Grenze rechnen, danach die Uhren auf "jetzt" verschieben
    const ende = Math.min(jetzt, spiel.letzteZeit + grenze);
    ergebnis = tick(ende);
    const a = spiel.aktiv;
    if (a?.kampf && ende < jetzt) {
      const d = jetzt - ende;
      a.spielerNaechster += d; a.monsterNaechster += d;
      if (a.pauseBis) a.pauseBis += d;
    }
  } else {
    if (jetzt - spiel.aktiv.start > grenze) spiel.aktiv.start = jetzt - grenze;
    ergebnis = tick(jetzt);
  }
  ergebnis.weg = Math.min(weg, grenze);
  ergebnis.stufenVorher = stufenVorher;
  ergebnis.xpVorher = xpVorher;
  return ergebnis;
}

// ----- Laden -----
function werkzeugNaechstes(art) {
  return WERKZEUG_STUFEN[spiel.werkzeuge[art] || 0];   // undefined = alles gekauft
}
function kaufeWerkzeug(art) {
  const naechstes = werkzeugNaechstes(art);
  if (!naechstes) return "fertig";
  if (stufe(WERKZEUGE[art].fertigkeit) < naechstes.stufe) return "stufe";
  if (spiel.muenzen < naechstes.preis) return "geld";
  spiel.muenzen -= naechstes.preis;
  spiel.werkzeuge[art] = (spiel.werkzeuge[art] || 0) + 1;
  return "ok";
}
function kaufeBankFach() {
  const preis = bankFachPreis(spiel.bankFaecherGekauft);
  if (spiel.muenzen < preis) return "geld";
  spiel.muenzen -= preis;
  spiel.bankFaecherGekauft++;
  return "ok";
}
