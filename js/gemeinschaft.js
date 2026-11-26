"use strict";
// =====================================================
//  v1.34 – GEMEINSCHAFTS-BOSS & ANGEL-WETTBEWERB (online, braucht supabase/gemeinschaft.sql)
//  🐉 Boss: jede Woche ein Riesenmonster, alle Spieler der Bestenliste kämpfen zusammen dagegen.
//     Der eigene Schaden wird gesammelt und jede Minute gemeldet. Ist der Boss besiegt, holt sich
//     jeder Helfer eine Belohnung ab. spiel.gemeinschaft = { offen, belohnt: { woche: true } }
//  🎣 Angel-Wettbewerb: freitags beißt der Riesenwels an – der schwerste Fang kommt in eine eigene Liste.
// =====================================================

// ===================== 🐉 GEMEINSCHAFTS-BOSS =====================
MONSTER.weltboss = { id: "weltboss", name: "Wolken-Titan", weltboss: true, chef: true, gebiet: "wolken", kampfart: "nah",
  aussehen: { farbe: "#8a7bd6", hoerner: true, fluegel: "drache", extra: "blitz" }, stufe: 10, hp: 1e12, maxSchlag: 10, genauigkeit: 100, ausweichen: 100, tempo: 3, muenzen: [5, 15], beute: [] };
// Der Titan passt sich der eigenen Kampfstufe an (wie das Season-Monster) und wechselt jede Woche die Kampfart
function aktualisiereWeltboss() {
  const m = MONSTER.weltboss, L = Math.max(5, kampfStufe() + 3);
  const woche = Math.floor(Date.now() / (7 * 86400000));
  Object.assign(m, { stufe: L, hp: 1e12, maxSchlag: Math.round((2 + L * 1.6) * 1.1), genauigkeit: Math.round((L + 8) * (52 + L * 0.6)),
    ausweichen: Math.round((L + 8) * (64 + L * 0.8)), muenzen: [L, L * 3], kampfart: ["nah", "fern", "magie"][woche % 3] });
}
const gemeinschaft = () => (spiel.gemeinschaft = spiel.gemeinschaft || { offen: 0, belohnt: {} });
let bossStand = null, bossGeladen = 0;
// aus kampf.js: Schaden am Titan sammeln
function bossSchaden(n) { gemeinschaft().offen += n; }
async function ladeBossStand(erzwingen = false) {
  if (!erzwingen && Date.now() - bossGeladen < 60000) return bossStand;
  bossGeladen = Date.now();
  try { bossStand = await rufeOnlineAuf("boss_stand", { p_spieler_id: mitglied?.spielerId || null }); } catch (e) { bossStand = bossStand || { fehler: e.message }; }
  return bossStand;
}
async function meldeBossSchaden() {
  const g = gemeinschaft();
  if (!mitglied || g.offen < 1) return;
  const n = Math.min(Math.floor(g.offen), 60000);
  try {
    bossStand = await rufeOnlineAuf("boss_schlag", { p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis, p_schaden: n });
    bossGeladen = Date.now();
    g.offen = Math.max(0, g.offen - n);
    speichern();
  } catch (e) { /* offline – beim nächsten Mal */ }
}
const BOSS_BELOHNUNG = { muenzenJeStufe: 2000, tierChance: 1 / 4 };
const bossBelohnbar = () => bossStand?.besiegt && bossStand.mein > 0 && !gemeinschaft().belohnt[bossStand.woche];
function holeBossBelohnung() {
  if (!bossBelohnbar()) return null;
  const tier = Math.min(7, Math.floor(kampfStufe() / 14));
  const e = { muenzen: BOSS_BELOHNUNG.muenzenJeStufe * Math.max(10, kampfStufe()), sachen: { [`kuchen${tier}`]: 3, [`barren${tier}`]: 15, goldsplitter5: 2 } };
  spiel.muenzen += e.muenzen;
  for (const [id, n] of Object.entries(e.sachen)) { gibInBank(id, n); zaehle(id, n); }
  if (!hatHaustier("nimbus") && Math.random() < BOSS_BELOHNUNG.tierChance) e.tier = gibHaustier(HAUSTIERE.find(h => h.id === "nimbus"));
  gemeinschaft().belohnt[bossStand.woche] = Date.now();
  spiel.statistik.bossSiege = (spiel.statistik.bossSiege || 0) + 1;
  return e;
}
HAUSTIERE.push({ id: "nimbus", name: "Nimbus", tier: "Titan-Baby", emoji: "🐲", quelle: `🐉 Belohnung vom Gemeinschafts-Boss: 1 von ${Math.round(1 / BOSS_BELOHNUNG.tierChance)}`, bonus: { art: "kraft", wert: 0.04 }, text: "+4 % stärkerer Schlag" });
erfolg({ id: "boss-1", icon: "🐉", name: "Gemeinsam stark", text: "Hilf mit, den Gemeinschafts-Boss zu besiegen", ziel: 1, muenzen: 100000, wert: () => spiel.statistik.bossSiege || 0 });
erfolg({ id: "boss-10", icon: "🐉", name: "Titanenbezwingerin", text: "Besiege den Gemeinschafts-Boss 10-mal", ziel: 10, muenzen: 2000000, wert: () => spiel.statistik.bossSiege || 0 });

function weltbossHtml() {
  if (Date.now() - bossGeladen > 60000 && navigator.onLine !== false) ladeBossStand().then(() => { if (aktuelleSeite === "seiteAbenteuer" && abenteuerTab === "gebiete") zeichneAbenteuer(); });
  const s = bossStand, m = MONSTER.weltboss;
  aktualisiereWeltboss();
  const anteil = s && !s.fehler ? Math.min(1, s.schaden / s.hp_max) : 0;
  let info;
  if (!mitglied) info = `<p class="hinweis">🏅 Trag dich unter Ich → Bestenliste ein, dann zählt dein Schaden für alle mit!</p>`;
  else if (!s) info = `<p class="hinweis">⏳ Lade …</p>`;
  else if (s.fehler) info = `<p class="hinweis">📡 ${s.fehler}</p>`;
  else info = `<div class="bossBalken"><div style="width:${(100 - anteil * 100).toFixed(1)}%"></div></div>
    <p class="hinweis">❤️ ${zahl(Math.max(0, s.hp_max - s.schaden))} / ${zahl(s.hp_max)} · ${s.helfer} Helfer · dein Schaden: <b>${zahl(s.mein + Math.floor(gemeinschaft().offen))}</b></p>
    ${s.top?.length ? `<p class="hinweis">🏅 ${s.top.slice(0, 5).map((t, i) => `${i + 1}. ${textSicher(t.name)} (${zahl(t.schaden)})`).join(" · ")}</p>` : ""}
    ${s.besiegt ? (bossBelohnbar() ? `<button type="button" class="knopf kaufen" id="bossBelohnung">🎁 Belohnung abholen!</button>`
      : `<p class="hinweis">🎉 Der Titan ist besiegt! ${gemeinschaft().belohnt[s.woche] ? "Belohnung abgeholt ✓" : "Nur wer mitgeholfen hat, bekommt eine Belohnung."} Montag kommt ein neuer.</p>`) : ""}`;
  return `<div class="gebiet weltbossGebiet" style="--farbe:#b8a8ff">
    <h3>🐉 Gemeinschafts-Boss <small>alle zusammen · jede Woche neu</small></h3>${info}
    <div class="monsterListe"><button type="button" class="monsterKarte chef" data-monster="weltboss">${monsterSvg(m.aussehen)}<b>${m.name}</b><small>Stufe ${m.stufe} · passt sich dir an</small></button></div></div>`;
}

// ===================== 🎣 ANGEL-WETTBEWERB =====================
const istFreitag = () => new Date(Date.now()).getDay() === 5;
// Der Riesenwels ist ein echter Fisch (Bild + Bank); die Münzen gibt es über seinen Verkaufswert
gegenstand("riesenwels", "Riesenwels", "fisch", "#7a8a5a", 60);
taetigkeit({ id: "angeln-wettbewerb", fertigkeit: "angeln", name: "Riesenwels (nur freitags)", stufe: 10, xp: XP[3], zeit: 7, gibt: { riesenwels: 1 }, wettbewerb: true });
function angelFang() {
  const L = stufe("angeln");
  const kg = Math.round((0.8 + Math.pow(Math.random(), 3) * (4 + L / 4) + (Math.random() < 0.02 ? L / 6 : 0)) * 100) / 100;
  const tag = tagText();
  spiel.angel = spiel.angel || { tag: "", heute: 0, rekord: 0 };
  const a = spiel.angel;
  if (a.tag !== tag) { a.tag = tag; a.heute = 0; }
  if (kg > a.heute) {
    a.heute = kg;
    if (mitglied) rufeOnlineAuf("angel_melde", { p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis, p_gewicht: kg }).then(() => { angelGeladen = 0; }).catch(() => {});
  }
  if (kg > a.rekord) { a.rekord = kg; if (typeof melde === "function") melde(`🎣 Neuer Rekord: Riesenwels mit ${kg.toLocaleString("de-DE")} kg!`, "gross"); }
  return kg;
}
let angelListe = null, angelGeladen = 0;
async function ladeAngelListe() {
  if (Date.now() - angelGeladen < 60000 && angelListe) return angelListe;
  angelGeladen = Date.now();
  try { angelListe = await rufeOnlineAuf("angel_liste"); } catch (e) { angelListe = { fehler: e.message }; }
  return angelListe;
}
async function zeigeAngelWettbewerb() {
  const a = spiel.angel || {};
  const kopf = `<div class="zirkusKopf"><span>🎣</span><h2>Angel-Wettbewerb</h2><small>jeden Freitag · der schwerste Riesenwels gewinnt</small></div>
    <p class="hinweis">Freitags beißt bei 🎣 Angeln der <b>Riesenwels</b> an (ab Angeln-Stufe 10). Jeder Fang wird gewogen – dein schwerster zählt für die Liste. Höhere Angeln-Stufe = schwerere Fische.${mitglied ? "" : " <b>Trag dich in die Bestenliste ein, um mitzumachen!</b>"}</p>
    <p class="hinweis">${istFreitag() ? "🟢 Heute ist Wettbewerb!" : "⏸️ Heute ist kein Freitag."} · Dein bester heute: <b>${a.tag === tagText() ? (a.heute || 0).toLocaleString("de-DE") : 0} kg</b> · Rekord: <b>${(a.rekord || 0).toLocaleString("de-DE")} kg</b></p>`;
  $("kochbuchInhalt").innerHTML = kopf + `<p class="hinweis">⏳ Lade die Liste …</p>`;
  $("kochbuchOverlay").hidden = false;
  const l = await ladeAngelListe();
  if ($("kochbuchOverlay").hidden) return;
  $("kochbuchInhalt").innerHTML = kopf + (l?.fehler ? `<p class="hinweis">📡 ${l.fehler}</p>`
    : l?.liste?.length ? `<h3>🏆 Wettbewerb vom ${new Date(l.tag).toLocaleDateString("de-DE")}</h3><ol class="angelListe">${l.liste.map(x => `<li><b>${textSicher(x.name)}</b> <span>${Number(x.gewicht).toLocaleString("de-DE")} kg</span></li>`).join("")}</ol>`
    : `<p class="hinweis">Noch hat niemand etwas gefangen.</p>`);
}
erfolg({ id: "angel-10kg", icon: "🎣", name: "Dicker Fisch", text: "Fang einen Riesenwels mit mindestens 10 kg", ziel: 10, muenzen: 200000, wert: () => Math.floor(spiel.angel?.rekord || 0) });

// ===================== VERDRAHTUNG =====================
function richteGemeinschaftEin() {
  jedeSekunde(() => { meldeBossSchaden(); }, 60);
  document.addEventListener("click", e => {
    if (e.target.closest("#bossBelohnung")) {
      const b = holeBossBelohnung();
      if (!b) return;
      ton.stufe(); melde(`🐉 Belohnung vom Gemeinschafts-Boss: +${zahl(b.muenzen)} Münzen, Kuchen, Barren und Goldsplitter!`, "gross");
      if (b.tier) zeigeHaustierFund(b.tier);
      speichern(); zeichneKopf(); zeichneSeite();
    }
    if (e.target.closest("#angelKnopf")) { ton.klick(); zeigeAngelWettbewerb(); }
  });
}
function heuteGemeinschaft(dazu, geh) {
  if (istFreitag() && stufe("angeln") >= 10) dazu("angel", "🎣", "Angel-Wettbewerb: Heute beißt der Riesenwels!", geh({ fertigkeit: "angeln", ziel: '.taetigkeit[data-id="angeln-wettbewerb"]' }));
  if (bossBelohnbar()) dazu("boss", "🐉", "Gemeinschafts-Boss besiegt – Belohnung abholen!", geh({ seite: "seiteAbenteuer", abenteuerTab: "gebiete", ziel: "#bossBelohnung" }));
}
