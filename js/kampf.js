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
// Kampfstufe: die beste Angriffs-Art zählt (Nahkampf = Mittel aus Mut und Kraft, Fernkampf, Magie)
function kampfStufe() {
  const angriff = Math.max((stufe("mut") + stufe("kraft")) / 2, stufe("fernkampf"), stufe("magie"));
  return Math.floor((2 * angriff + stufe("schutz") + stufe("herzen")) / 4);
}
// Die Waffe bestimmt die Kampfart
function kampfArt() { return ausgeruestet("waffe")?.kampfart || "nah"; }
// Der Kampfstil muss zur Kampfart passen (sonst der erste passende)
function erlaubteStile(art = kampfArt()) { return [...KAMPFSTILE.filter(s => s.kampfart === art), ...KAMPFSTILE.filter(s => s.kampfart === "alle")]; }
function aktiverStil() {
  const erlaubt = erlaubteStile();
  return erlaubt.some(s => s.id === spiel.kampfstil) ? spiel.kampfstil : erlaubt[0].id;
}
// Gewählte Munition (Pfeile / Zauberperlen), wenn noch welche da sind und man sie benutzen darf
function munitionBereit(art = kampfArt()) {
  const was = KAMPFARTEN[art].munition;
  if (!was) return null;
  const id = spiel.munition?.[was];
  const g = id && GEGENSTAENDE[id];
  return g && anzahl(id) > 0 && darfTragen(g) ? g : null;
}
// Kampf-Dreieck: +Bonus (stark), −Malus (schwach) oder 0
function dreieck(m, art = kampfArt()) {
  const ma = monsterArt(m);
  if (KAMPFARTEN[art].stark === ma) return KAMPF.dreieckStark + jagdWert("talisman");
  if (KAMPFARTEN[ma].stark === art) return -KAMPF.dreieckSchwach;
  return 0;
}
function maxHp() { return Math.round(stufe("herzen") * KAMPF.hpProStufe * (1 + schmuckBonus("herzen") + sternBonus("herzen"))); }
function spielerWerte(m = null) {
  const art = kampfArt();
  let treffStufe = stufe("mut"), kraftStufe = stufe("kraft"), treffB = ausruestungsBonus("treff"), kraftB = ausruestungsBonus("kraft");
  if (art !== "nah") {
    // Fernkampf und Magie: eine Fertigkeit für Treffen UND Schlag – aber nur mit Munition richtig stark
    treffStufe = kraftStufe = stufe(KAMPFARTEN[art].fertigkeit);
    const mun = munitionBereit(art);
    if (mun) kraftB += mun.bonus.kraft;
    else { treffB = Math.round(treffB / 3); kraftB = 0; kraftStufe = Math.round(kraftStufe / 3); }
  }
  const d = m ? dreieck(m, art) : 0;
  const fernglas = m && spiel.jagd?.auftrag?.monster === m.id ? jagdWert("fernglas") : 0;
  return {
    art,
    dreieck: d,
    genauigkeit: Math.round((treffStufe + 8) * (64 + treffB) * (1 + d + fernglas + trankKampf("treff") + haustierBonus("treff") + schmuckBonus("treff") + sternBonus("treff"))),
    maxSchlag: Math.floor((15 + kraftStufe * 1.6 + kraftB * 1.5) * (1 + d + trankKampf("kraft") + haustierBonus("kraft") + schmuckBonus("kraft") + sternBonus("kraft"))),
    ausweichen: (stufe("schutz") + 8) * (64 + ausruestungsBonus("abwehr")),
    weniger: Math.min(0.6, ausruestungsBonus("weniger") / 100 + trankKampf("schutz") + haustierBonus("schutz") + sternBonus("schutz")),
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
  if (monsterId === "weltboss" && typeof aktualisiereWeltboss === "function") aktualisiereWeltboss();
  const pfad = pfadId && pfadNachId(pfadId);
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
  const stil = aktiverStil();
  const f = trankFaktorXp() * (1 + baumhausBonus("kampfxp"));
  for (const [fid, xp] of [[stil, schaden * KAMPF.xpProSchaden * (f + sternBonus("xp", stil))], ["herzen", schaden * KAMPF.herzenXpProSchaden * (f + sternBonus("xp", "herzen"))]]) {
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
    const w = spielerWerte(m);
    if (a.spielerNaechster <= a.monsterNaechster) {
      // Die Figur ist dran
      a.spielerNaechster += w.tempo * 1000;
      if (w.art !== "nah") verbraucheMunition(w.art, ergebnis);
      if (Math.random() < trefferChance(w.genauigkeit, m.ausweichen)) {
        const schaden = Math.min(a.mhp, zufall(1, w.maxSchlag));
        a.mhp -= schaden;
        if (m.weltboss && typeof bossSchaden === "function") bossSchaden(schaden);   // Gemeinschafts-Boss
        gibKampfXp(schaden, ergebnis);
        logge(`💥 ${figurNameKurz()} trifft: ${schaden}`);
      } else logge(`💨 ${m.name} weicht aus`);
      // Der aktive Begleiter stupst mit an (Tier-Freunde)
      const stups = stupsAnteil();
      if (stups && a.mhp > 0) {
        const n = Math.min(a.mhp, Math.max(1, Math.round(w.maxSchlag * stups)));
        a.mhp -= n;
        logge(`🐾 ${begleiterTier().name} stupst mit: ${n}`);
      }
      begleiterFrisst(ergebnis);
      if (a.mhp <= 0) {
        besiegt(m, ergebnis);
        if (a.pfad) pfadWeiter(a, ergebnis);
        if (!spiel.aktiv) break;   // Verlies zu Ende
        a.pauseBis = naechster + KAMPF.pauseNachSieg * 1000;
      }
    } else {
      // Das Monster ist dran
      a.monsterNaechster += m.tempo * 1000;
      if (Math.random() < trefferChance(m.genauigkeit, w.ausweichen)) {
        const schaden = Math.max(1, Math.round(zufall(1, m.maxSchlag) * (1 - w.weniger)));
        spiel.hp = Math.max(0, spiel.hp - schaden);
        spiel.xp.herzen = (spiel.xp.herzen || 0) + schaden * KAMPF.herzenXpProTreffer;
        ergebnis.xp.herzen = (ergebnis.xp.herzen || 0) + schaden * KAMPF.herzenXpProTreffer;
        logge(`🌀 ${m.name} schubst: −${schaden} ❤️`);
      } else logge(`✨ ${figurNameKurz()} weicht aus`);
      if (spiel.hp < maxHp() * KAMPF.essenUnter) isst(ergebnis);
      if (spiel.hp <= 0) {
        logge(`😴 ${figurNameKurz()} ist zu müde und geht nach Hause.`);
        ergebnis.gestoppt = a.pfad
          ? `Der ${pfadNachId(a.pfad.id).name} war diesmal zu schwer – nimm mehr Essen mit oder werde noch etwas stärker!`
          : `${figurNameKurz()} war zu müde und ist nach Hause gegangen – nimm mehr Essen mit!`;
        ergebnis.muede = true;
        spiel.hp = maxHp();
        spiel.aktiv = null;
      }
    }
  }
}

// Ein Pfeil / eine Zauberperle pro Angriff (Pfeile kann man manchmal wieder aufsammeln)
function verbraucheMunition(art, ergebnis) {
  const g = munitionBereit(art);
  if (!g) {
    if (!spiel.aktiv.ohneMunition) { spiel.aktiv.ohneMunition = true; logge(art === "fern" ? `🏹 Keine Pfeile mehr – ${figurNameKurz()} schubst mit dem Bogen` : `🪄 Keine Zauberperlen mehr – nur noch kleine Funken`); }
    return;
  }
  spiel.aktiv.ohneMunition = false;
  if (art === "fern" && Math.random() < KAMPF.pfeilZurueck + jagdWert("koecher")) return;
  if (art === "magie" && Math.random() < jagdWert("perlen")) return;
  nimmAusBank(g.id, 1);
  ergebnis.verbraucht[g.id] = (ergebnis.verbraucht[g.id] || 0) + 1;
}

function besiegt(m, ergebnis) {
  if (typeof karteFallen === "function") karteFallen(m);   // Sammelkarten
  if (typeof eventFund === "function") eventFund();       // Jahres-Events
  const statKey = { nah: "besiegtNah", fern: "besiegtFern", magie: "besiegtMagie" }[kampfArt()];
  spiel.statistik[statKey] = (spiel.statistik[statKey] || 0) + 1;
  ergebnis.durchgaenge++;
  ergebnis.besiegt = (ergebnis.besiegt || 0) + 1;
  spiel.statistik.besiegt = (spiel.statistik.besiegt || 0) + 1;
  if (m.season) {
    pruefeSeasonWechsel();
    const neu = gibSeasonPunkte(SEASON.monsterPunkte);
    if (neu.length) ergebnis.ereignisse.push({ seasonStufen: neu });
  }
  trankNachSieg();
  jagdNachSieg(m, ergebnis);
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
  const p = pfadNachId(a.pfad.id);
  a.pfad.schritt++;
  if (p.dungeon && a.pfad.schritt >= p.liste.length) { verliesEnde(p, ergebnis); return; }   // Verlies geschafft: für heute Schluss
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
