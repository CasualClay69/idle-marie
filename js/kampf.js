"use strict";
// =====================================================
//  KAMPF-LOGIK: läuft wie eine Tätigkeit (spiel.aktiv = { kampf: true, monster, … })
//  und wird von tick() in logik.js aufgerufen – auch für die Zeit, in der das Spiel zu war.
// =====================================================

// ----- Werte der Figur -----
function ausgeruestet(platz) {
  const id = spiel.ausruestung?.[platz];
  return id && GEGENSTAENDE[id] ? GEGENSTAENDE[id] : null;
}
function ausruestungsBonus(art) {
  return PLAETZE.reduce((s, p) => s + (ausgeruestet(p.id)?.bonus[art] || 0), 0);
}
function kampfStufe() {
  return Math.floor((stufe("mut") + stufe("kraft") + stufe("schutz") + stufe("herzen")) / 4);
}
function maxHp() { return stufe("herzen") * KAMPF.hpProStufe; }
function spielerWerte() {
  return {
    genauigkeit: Math.round((stufe("mut") + 8) * (64 + ausruestungsBonus("treff")) * (1 + trankKampf("treff") + haustierBonus("treff"))),
    maxSchlag: Math.floor((15 + stufe("kraft") * 1.6 + ausruestungsBonus("kraft") * 1.5) * (1 + trankKampf("kraft") + haustierBonus("kraft"))),
    ausweichen: (stufe("schutz") + 8) * (64 + ausruestungsBonus("abwehr")),
    weniger: Math.min(0.6, ausruestungsBonus("weniger") / 100 + trankKampf("schutz") + haustierBonus("schutz")),
    tempo: KAMPF.ohneWaffeTempo,
  };
}
// Trefferchance wie im Genre üblich: Genauigkeit gegen Ausweichen
function trefferChance(genauigkeit, ausweichen) {
  return genauigkeit < ausweichen ? 0.5 * genauigkeit / ausweichen : 1 - 0.5 * ausweichen / genauigkeit;
}
function darfTragen(g) {
  return Object.entries(g.braucht || {}).every(([fid, l]) => stufe(fid) >= l);
}
function ruesteAus(id) {
  const g = GEGENSTAENDE[id];
  if (!g?.platz || !darfTragen(g) || anzahl(id) < 1) return false;
  const alt = spiel.ausruestung[g.platz];
  nimmAusBank(id, 1);
  if (alt) gibInBank(alt, 1);
  spiel.ausruestung[g.platz] = id;
  return true;
}
function legeAb(platz) {
  const alt = spiel.ausruestung[platz];
  if (!alt || !passtInBank(alt)) return false;
  gibInBank(alt, 1);
  delete spiel.ausruestung[platz];
  return true;
}

// ----- Kampf starten / beenden -----
function starteKampf(monsterId, pfadId = null) {
  if (monsterId === "season") aktualisiereSeasonMonster();
  const pfad = pfadId && PFADE.find(p => p.id === pfadId);
  if (pfad) monsterId = pfad.liste[0];
  const m = MONSTER[monsterId];
  if (!m) return false;
  const jetzt = Date.now();
  if (!spiel.hp || spiel.aktiv?.kampf === undefined) spiel.hp = maxHp();
  spiel.aktiv = { kampf: true, monster: m.id, mhp: m.hp, start: jetzt,
    spielerNaechster: jetzt + spielerWerte().tempo * 1000, monsterNaechster: jetzt + m.tempo * 1000, pauseBis: 0 };
  if (pfad) spiel.aktiv.pfad = { id: pfad.id, schritt: 0 };
  spiel.kampfLog = [pfad ? `🗺️ ${figurNameKurz()} betritt den ${pfad.name}!` : `⚔️ ${figurNameKurz()} trifft auf ${m.name}!`];
  return true;
}
function figurNameKurz() {
  return (FIGUREN.find(f => f.id === spiel.figur) || FIGUREN[0]).name;
}
function logge(text) {
  spiel.kampfLog = spiel.kampfLog || [];
  spiel.kampfLog.unshift(text);
  spiel.kampfLog.length = Math.min(spiel.kampfLog.length, 6);
}
const zufall = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function isst(ergebnis) {
  const id = spiel.essen;
  if (!id || anzahl(id) < 1) return false;
  nimmAusBank(id, 1);
  const vorher = spiel.hp;
  spiel.hp = Math.min(maxHp(), spiel.hp + Math.round(GEGENSTAENDE[id].heilt * (1 + baumhausBonus("heilen"))));
  ergebnis.verbraucht[id] = (ergebnis.verbraucht[id] || 0) + 1;
  logge(`😋 ${figurNameKurz()} isst ${GEGENSTAENDE[id].name}: +${spiel.hp - vorher} ❤️`);
  return true;
}

function gibKampfXp(schaden, ergebnis) {
  const stil = spiel.kampfstil || "mut";
  const f = trankFaktorXp() * (1 + baumhausBonus("kampfxp"));
  for (const [fid, xp] of [[stil, schaden * KAMPF.xpProSchaden * f], ["herzen", schaden * KAMPF.herzenXpProSchaden * f]]) {
    const vorher = stufe(fid);
    spiel.xp[fid] = (spiel.xp[fid] || 0) + xp;
    ergebnis.xp[fid] = (ergebnis.xp[fid] || 0) + xp;
    if (stufe(fid) > vorher) ergebnis.ereignisse.push({ kampfStufe: fid, neueStufe: stufe(fid) });
  }
}

// Alle Ereignisse bis "jetzt" der Reihe nach abarbeiten
function kampfTick(jetzt, ergebnis) {
  const a = spiel.aktiv;
  let schritte = 0;
  while (spiel.aktiv && schritte++ < 200000) {
    const m = MONSTER[a.monster];
    // Pause zwischen zwei Monstern
    if (a.pauseBis) {
      if (jetzt < a.pauseBis) break;
      a.mhp = m.hp;
      a.spielerNaechster = a.pauseBis + spielerWerte().tempo * 1000;
      a.monsterNaechster = a.pauseBis + m.tempo * 1000;
      a.pauseBis = 0;
      logge(a.pfad ? `👀 Weiter auf dem Pfad: ${m.name}!` : `👀 Ein neues ${m.name} taucht auf!`);
    }
    const naechster = Math.min(a.spielerNaechster, a.monsterNaechster);
    if (naechster > jetzt) break;
    const w = spielerWerte();
    if (a.spielerNaechster <= a.monsterNaechster) {
      // Die Figur ist dran
      a.spielerNaechster += w.tempo * 1000;
      if (Math.random() < trefferChance(w.genauigkeit, m.ausweichen)) {
        const schaden = Math.min(a.mhp, zufall(1, w.maxSchlag));
        a.mhp -= schaden;
        gibKampfXp(schaden, ergebnis);
        logge(`💥 ${figurNameKurz()} trifft: ${schaden}`);
      } else logge(`💨 ${m.name} weicht aus`);
      if (a.mhp <= 0) {
        besiegt(m, ergebnis);
        if (a.pfad) pfadWeiter(a, ergebnis);
        a.pauseBis = naechster + KAMPF.pauseNachSieg * 1000;
      }
    } else {
      // Das Monster ist dran
      a.monsterNaechster += m.tempo * 1000;
      if (Math.random() < trefferChance(m.genauigkeit, w.ausweichen)) {
        const schaden = Math.max(1, Math.round(zufall(1, m.maxSchlag) * (1 - w.weniger)));
        spiel.hp = Math.max(0, spiel.hp - schaden);
        logge(`🌀 ${m.name} schubst: −${schaden} ❤️`);
      } else logge(`✨ ${figurNameKurz()} weicht aus`);
      if (spiel.hp < maxHp() * KAMPF.essenUnter) isst(ergebnis);
      if (spiel.hp <= 0) {
        logge(`😴 ${figurNameKurz()} ist zu müde und geht nach Hause.`);
        ergebnis.gestoppt = a.pfad
          ? `Der ${PFADE.find(p => p.id === a.pfad.id).name} war diesmal zu schwer – nimm mehr Essen mit oder werde noch etwas stärker!`
          : `${figurNameKurz()} war zu müde und ist nach Hause gegangen – nimm mehr Essen mit!`;
        ergebnis.muede = true;
        spiel.hp = maxHp();
        spiel.aktiv = null;
      }
    }
  }
}

function besiegt(m, ergebnis) {
  ergebnis.durchgaenge++;
  ergebnis.besiegt = (ergebnis.besiegt || 0) + 1;
  spiel.statistik.besiegt = (spiel.statistik.besiegt || 0) + 1;
  if (m.season) {
    pruefeSeasonWechsel();
    const neu = gibSeasonPunkte(SEASON.monsterPunkte);
    if (neu.length) ergebnis.ereignisse.push({ seasonStufen: neu });
  }
  trankNachSieg();
  spiel.besiegt = spiel.besiegt || {};
  spiel.besiegt[m.id] = (spiel.besiegt[m.id] || 0) + 1;
  const muenzen = Math.round(zufall(m.muenzen[0], m.muenzen[1]) * (1 + haustierBonus("muenzen") + baumhausBonus("muenzen")));
  if (m.chef) { const h = vielleichtHaustierBeiChef(m.id); if (h) ergebnis.ereignisse.push({ haustier: h }); }
  spiel.muenzen += muenzen;
  ergebnis.muenzen = (ergebnis.muenzen || 0) + muenzen;
  spiel.hp = Math.min(maxHp(), spiel.hp + Math.round(maxHp() * (KAMPF.verschnaufen + baumhausBonus("verschnaufen"))));
  logge(`💤 ${m.name} schläft ein! +${muenzen} Münzen`);
  for (const b of m.beute) {
    if (Math.random() >= b.chance) continue;
    const n = zufall(b.anzahl[0], b.anzahl[1]);
    if (!passtInBank(b.id)) { ergebnis.bankVoll = true; continue; }
    gibInBank(b.id, n);
    zaehle(b.id, n);
    ergebnis.gewonnen[b.id] = (ergebnis.gewonnen[b.id] || 0) + n;
    if (b.id.startsWith("pokal")) ergebnis.ereignisse.push({ pokal: b.id });
  }
}

// ----- Abenteuer-Pfade -----
const zufallAus = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
function pfadWeiter(a, ergebnis) {
  const p = PFADE.find(x => x.id === a.pfad.id);
  a.pfad.schritt++;
  if (a.pfad.schritt >= p.liste.length) {
    ergebnis.ereignisse.push({ truhe: oeffneTruhe(p) });
    a.pfad.schritt = 0;
    logge(`🧰 Schatztruhe geöffnet! Der ${p.name} beginnt von vorn.`);
  }
  a.monster = p.liste[a.pfad.schritt];
}
function oeffneTruhe(p) {
  spiel.pfade = spiel.pfade || {};
  spiel.pfade[p.id] = (spiel.pfade[p.id] || 0) + 1;
  spiel.statistik.truhen = (spiel.statistik.truhen || 0) + 1;
  const inhalt = { pfad: p, muenzen: Math.round(zufallAus(p.truhe.muenzen) * (1 + baumhausBonus("muenzen"))), sachen: {} };
  spiel.muenzen += inhalt.muenzen;
  for (const s of p.truhe.sachen) {
    const n = zufallAus(s.anzahl);
    gibInBank(s.id, n);
    zaehle(s.id, n);
    inhalt.sachen[s.id] = n;
  }
  if (!(spiel.garderobe || []).includes(p.rahmenId) && Math.random() < PFAD_REGEL.rahmenChance) { gibTeil(p.rahmenId); inhalt.rahmen = p.rahmenId; }
  const kiki = HAUSTIERE.find(h => h.id === "kiki");
  if (!hatHaustier("kiki") && Math.random() < PFAD_REGEL.kikiChance * (1 + baumhausBonus("tier"))) inhalt.haustier = gibHaustier(kiki);
  return inhalt;
}
function pfadFrei(p) { return (spiel.besiegt?.[p.chef] || 0) > 0; }

// Herzen füllen sich außerhalb des Kampfes wieder auf
function ruheAus() {
  if (!spiel.aktiv?.kampf) spiel.hp = maxHp();
}
