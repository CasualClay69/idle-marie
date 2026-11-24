"use strict";
// =====================================================
//  GUIDE & KOMPASS – Logik
//  Der Guide = die Auftrags-Kette (daten-quests.js) + die Schritte bis 100 % (daten-wiki.js).
//  spiel.guide = { schrittId: Zeitpunkt } – einmal abgehakt bleibt abgehakt.
//  Der Kompass-Knopf zeigt immer auf den ersten Schritt, der noch nicht abgehakt ist –
//  und zwar auf die beste Stelle dafür (z.B. die beste Tätigkeit, das richtige Monster, das leere Beet).
// =====================================================

const KAMPF_IDS = ["mut", "kraft", "schutz", "herzen", "fernkampf", "magie"];
let ROUTE = null;

function route() {
  if (ROUTE) return ROUTE;
  const liste = [], ids = new Set();
  const dazu = s => {
    let id = s.id, n = 2;
    while (ids.has(id)) id = `${s.id}#${n++}`;
    ids.add(id); s.id = id; liste.push(s);
  };
  const letzter = QUESTS.find(q => q.ziel === FERTIGKEITEN.length * SPIEL.maxStufe);   // „Werde Meister in allem“
  QUESTS.forEach((q, i) => {
    if (q === letzter) guideVervollstaendigen().forEach(dazu);
    dazu({ id: `q:${q.titel}`, kapitel: q === letzter && liste.length ? liste[liste.length - 1].kapitel : q.kapitel || "Aufträge", nurAbholen: q.nurAbholen, titel: q.titel, text: q.text, quest: q, questNr: i,
      ziel: q.ziel, wert: q.wert, fertigkeitId: q.fertigkeitId, hilfe: q.hilfe, icon: q.icon, symbol: q.symbol });
    for (const e of GUIDE_EINSCHUEBE.filter(x => x.nach === q.titel)) dazu({ ...e.schritt, kapitel: q.kapitel || "Aufträge" });
  });
  if (!letzter) guideVervollstaendigen().forEach(dazu);
  ROUTE = liste;
  return ROUTE;
}

// Kapitel in der Reihenfolge des Guides
function guideKapitel() {
  const k = [];
  for (const s of route()) {
    let kap = k[k.length - 1];
    if (!kap || kap.name !== s.kapitel) k.push(kap = { name: s.kapitel, schritte: [] });
    kap.schritte.push(s);
  }
  return k;
}

function schrittWert(s) {
  let w = 0;
  try { w = s.wert(); } catch (e) { /* noch nicht berechenbar */ }
  return Math.min(Number(w) || 0, s.ziel);
}
function schrittErledigt(s) { return !!spiel.guide?.[s.id]; }

// Abhaken, was geschafft ist. Gibt die neu abgehakten Schritte zurück.
function pruefeGuide() {
  spiel.guide = spiel.guide || {};
  const neu = [];
  for (const s of route()) {
    if (spiel.guide[s.id]) continue;
    if ((s.quest && s.questNr < (spiel.quest || 0)) || (!s.nurAbholen && schrittWert(s) >= s.ziel)) { spiel.guide[s.id] = Date.now(); neu.push(s); }
  }
  return neu;
}
const naechsterGuideSchritt = () => route().find(s => !schrittErledigt(s)) || null;
function guideProzent() {
  const r = route();
  return Math.floor(r.filter(schrittErledigt).length / r.length * 100);
}

// ===================== Wohin genau? =====================
// Die beste Tätigkeit einer Fertigkeit: schon freigeschaltet, Material vorhanden, am meisten EP pro Sekunde
function besteTaetigkeit(fid) {
  const L = stufe(fid);
  const offen = TAETIGKEITEN.filter(t => t.fertigkeit === fid && t.stufe <= L && !(t.kleidung && (spiel.garderobe || []).includes(t.kleidung)));
  if (!offen.length) return null;
  const machbar = offen.filter(t => Object.entries(t.braucht || {}).every(([id, n]) => anzahl(id) >= n));
  const liste = machbar.length ? machbar : offen;
  return [...liste].sort((a, b) => b.xp / b.zeit - a.xp / a.zeit)[0];
}
// Das stärkste normale Monster, das zur Kampfstufe passt
function besterGegner() {
  const L = kampfStufe();
  const passend = GEBIETE.flatMap(g => g.monster).filter(m => !m.chef && m.stufe <= L);
  // stärkste passende zuerst, bei fast gleicher Stufe lieber eins, gegen das die Waffe stark ist
  const wert = m => m.stufe + dreieck(m) * 20;
  return passend.sort((a, b) => wert(b) - wert(a))[0] || GEBIETE[0].monster[0];
}
function kampfZiel(fid) {
  // Passende Waffe (und Munition) für Mut/Kraft, Fernkampf oder Magie?
  const brauchtArt = fid === "fernkampf" ? "fern" : fid === "magie" ? "magie" : ["mut", "kraft"].includes(fid) ? "nah" : null;
  if (brauchtArt && kampfArt() !== brauchtArt) {
    const ka = KAMPFARTEN[brauchtArt];
    const passt = id => GEGENSTAENDE[id]?.platz === "waffe" && (GEGENSTAENDE[id].kampfart || "nah") === brauchtArt && darfTragen(GEGENSTAENDE[id]);
    if (Object.keys(spiel.bank).some(id => anzahl(id) > 0 && passt(id)) || brauchtArt === "nah")
      return { seite: "seiteAbenteuer", abenteuerTab: "ausruestung", ziel: '.platz[data-platz="waffe"]', hinweis: `Leg ${brauchtArt === "nah" ? "ein Schwert" : `einen ${ka.waffe}`} an – dann übst du ${fertigkeit(fid).name.replaceAll("\u00ad", "")}.` };
    const t = brauchtArt === "fern" ? "schnitzen-bogen0" : "schmuck-stab0";
    return { fertigkeit: brauchtArt === "fern" ? "schnitzen" : "schmuck", ziel: `.taetigkeit[data-id="${t}"]`, hinweis: `Mach dir zuerst einen ${ka.waffe}: ${taetigkeitNachId(t).name}.` };
  }
  const mun = brauchtArt && KAMPFARTEN[brauchtArt].munition;
  if (mun && !munitionBereit(brauchtArt)) {
    const hat = Object.keys(spiel.bank).some(id => anzahl(id) > 0 && GEGENSTAENDE[id]?.munition === mun && darfTragen(GEGENSTAENDE[id]));
    if (hat) return { seite: "seiteAbenteuer", abenteuerTab: "ausruestung", ziel: `.platz[data-platz="${mun}"]`, hinweis: `Wähle ${mun === "pfeile" ? "deine Pfeile" : "deine Zauberperlen"} aus.` };
    const t = mun === "pfeile" ? "schnitzen-pfeil0" : "schmuck-perle0";
    return { fertigkeit: mun === "pfeile" ? "schnitzen" : "schmuck", ziel: `.taetigkeit[data-id="${t}"]`, hinweis: `Mach dir zuerst ${mun === "pfeile" ? "Pfeile" : "Zauberperlen"}: ${taetigkeitNachId(t).name}.` };
  }
  const stil = fid === "herzen" ? null : fid;
  if (stil && aktiverStil() !== stil) {
    const k = KAMPFSTILE.find(x => x.id === stil);
    return { seite: "seiteAbenteuer", abenteuerTab: "kampf", ziel: `.stilKnopf[data-stil="${stil}"]`, hinweis: `Wähle den Kampfstil „${k.icon} ${k.name}“ – der übt ${fertigkeit(fid).name}.` };
  }
  const m = besterGegner();
  return { seite: "seiteAbenteuer", abenteuerTab: "gebiete", ziel: `.monsterKarte[data-monster="${m.id}"]`, hinweis: `Kämpfe gegen ${m.name.replaceAll("­", "")} – das passt gerade am besten zu dir.` };
}
function gartenZiel(s) {
  const g = gartenStand();
  const h = { fertigkeit: "garten" };
  if (g.beete.some(b => b && beetFortschritt(b) >= 1)) return { ...h, ziel: "#alleErnten", hinweis: "Ernte zuerst deine reifen Beete!" };
  if (!g.beete.some(b => !b)) return { ...h, ziel: ".beete", hinweis: "Alle Beete wachsen gerade. Mach in der Zeit etwas anderes und schau später wieder vorbei!" };
  const L = stufe("garten");
  const offen = PFLANZEN.filter(p => p.stufe <= L);
  const gesucht = s && PFLANZEN.find(p => p.ertrag === s.symbol);
  const p = gesucht && gesucht.stufe <= L ? gesucht
    : offen.filter(x => anzahl(x.samen) > 0).sort((a, b) => b.stufe - a.stufe)[0]
    || offen.filter(x => GEGENSTAENDE[x.samen].preis <= spiel.muenzen).sort((a, b) => b.stufe - a.stufe)[0] || offen[0];
  if (anzahl(p.samen) > 0) return { ...h, ziel: ".beet.leer", hinweis: `Pflanze ${p.name} in ein leeres Beet.` };
  return { ...h, ziel: `[data-samen="${p.samen}"][data-n="10"]`, hinweis: `Kauf ${p.name}-Samen und pflanze sie ein.` };
}
// Monster-Aufträge: erst einen holen, dann zum Monster
function jagdZiel() {
  const a = jagdFrei() && jagd().auftrag;
  if (!jagdFrei()) return { seite: "seiteAbenteuer", abenteuerTab: "pfade", hinweis: "Die Monster-Aufträge gibt es nach deinem vierten Abenteuer-Pfad." };
  if (!a) return { seite: "seiteAbenteuer", abenteuerTab: "jagd", ziel: ".jagdHolen:not([disabled])", hinweis: `Hol dir bei ${JAGD_JAEGERIN} einen Monster-Auftrag.` };
  if (spiel.aktiv?.monster !== a.monster) return { seite: "seiteAbenteuer", abenteuerTab: "jagd", ziel: "#jagdZumMonster", hinweis: `Kämpfe gegen ${MONSTER[a.monster].name.replaceAll("\u00ad", "")} – das ist dein Auftrag.` };
  return { seite: "seiteAbenteuer", abenteuerTab: "kampf", hinweis: "Du kämpfst schon gegen dein Auftrags-Monster. Weiter so!" };
}
// Ziel-Stelle für einen Schritt
function wegZiel(s) {
  const h = { ...(s.hilfe || {}) };
  if (h.ziel && h.ziel.includes('data-id=""')) delete h.ziel;
  if (s.fertigkeitId === "jagd" || h.jagd) return jagdZiel();
  if (s.fertigkeitId && KAMPF_IDS.includes(s.fertigkeitId)) return kampfZiel(s.fertigkeitId);
  if (h.fertigkeit === "garten" && (!h.ziel || h.ziel === ".beete")) return gartenZiel(s);
  if (h.fertigkeit && !h.ziel) {
    const t = besteTaetigkeit(h.fertigkeit);
    if (t) { h.ziel = `.taetigkeit[data-id="${t.id}"]`; h.hinweis = `Am besten jetzt: ${t.name}.`; }
  }
  return h;
}

// Zur Stelle springen und sie leuchten lassen (bis man sie antippt, höchstens 15 Sekunden)
function zeigeWegHilfe(h) {
  if (h.ichTab) ichTab = h.ichTab;
  if (h.seite === "seiteAbenteuer") {
    const z = h.ziel || "";
    abenteuerTab = h.abenteuerTab || (z.includes("pfadKarte") ? "pfade" : z.includes("monsterKarte") ? "gebiete" : z.includes("platz") ? "ausruestung" : "kampf");
  }
  if (h.seite === "seiteIch" && !h.ichTab) ichTab = /haustier/i.test(h.ziel || "") ? "tiere" : "figur";
  if (h.fertigkeit) { offeneFertigkeit = h.fertigkeit; zeigeSeite("seiteFertigkeit"); }
  else if (h.seite) zeigeSeite(h.seite);
  setTimeout(() => {
    for (const alt of document.querySelectorAll(".wegZiel")) alt.classList.remove("wegZiel");
    const el = h.ziel && document.querySelector(h.ziel);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("wegZiel");
    const weg = () => el.classList.remove("wegZiel");
    el.addEventListener("click", weg, { once: true });
    setTimeout(weg, 15000);
  }, 150);
}

// ===================== Kompass-Knopf =====================
let blasenUhr = 0;
function zeigeBlase(titel, text) {
  const b = $("wegBlase");
  b.innerHTML = `<b>${titel}</b>${text ? `<span>${text}</span>` : ""}<small>Tippe hier für den ganzen Guide</small>`;
  b.hidden = false;
  clearTimeout(blasenUhr);
  blasenUhr = setTimeout(() => { b.hidden = true; }, 8000);
}
function kompass() {
  ton.klick();
  pruefeGuide();
  const q = aktuellerQuest();
  if (q && questStand(q).fertig) {
    zeigeBlase("🎁 Zuerst die Belohnung abholen!", `Auftrag geschafft: ${q.titel}`);
    zeigeQuestFenster();
    return;
  }
  const s = naechsterGuideSchritt();
  if (!s) { zeigeBlase("👑 100 % geschafft!", "Du hast wirklich alles erreicht. Du bist großartig!"); return; }
  const h = wegZiel(s);
  const stand = s.ziel > 1 ? ` (${zahl(schrittWert(s))} / ${zahl(s.ziel)})` : "";
  zeigeBlase(`🧭 ${s.titel}${stand}`, h.hinweis || s.text);
  zeigeWegHilfe(h);
}
function zeichneKompass() {
  $("kompassProzent").textContent = `${Math.floor(spielFortschritt())} %`;
}

function richteWikiEin() {
  pruefeGuide();   // beim Start still abhaken, was schon geschafft ist
  $("kompassKnopf").addEventListener("click", kompass);
  const oeffneWiki = () => { if (aktuelleSeite !== "seiteWiki") wikiZurueck = aktuelleSeite; $("wegBlase").hidden = true; zeigeSeite("seiteWiki"); };
  $("wikiKnopf").addEventListener("click", () => { ton.klick(); oeffneWiki(); });
  $("wegBlase").addEventListener("click", () => { wikiTab = "guide"; $("wikiSuche").value = ""; oeffneWiki(); });
  richteWikiSeiteEin();
  zeichneKompass();
  setInterval(() => {
    const neu = pruefeGuide().filter(s => !s.quest);   // für Aufträge gibt es schon eine eigene Meldung
    if (neu.length === 1) melde(`✅ Guide abgehakt: ${neu[0].titel}`);
    else if (neu.length > 1) melde(`✅ ${neu.length} Guide-Schritte abgehakt!`);
    zeichneKompass();
    if (neu.length) { if (aktuelleSeite === "seiteWiki" && wikiTab === "guide") zeichneWiki(); }
  }, 2000);
}
