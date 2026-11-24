"use strict";
// =====================================================
//  FORTSCHRITT – "Wie viel % vom Spiel habe ich geschafft?"
//  Das Spiel ist in Bereiche aufgeteilt. Jeder Bereich zählt mit seinem Gewicht (zusammen 100).
//  Diese Zahl steht auch am Kompass und im Guide. Season-Sachen zählen NICHT dazu
//  (sie kommen jedes Jahr wieder) – sie stehen extra unten als "Extras".
//
//  NEUER INHALT: hier einen Bereich ergänzen oder einen bestehenden erweitern
//  (die meisten Bereiche zählen automatisch alles aus den Spieldaten).
// =====================================================

const ohneSeason = liste => liste.filter(x => !x.season);
const FORTSCHRITT_BEREICHE = [
  { id: "fertigkeiten", name: "Fertigkeiten auf 99", icon: "🌟", gewicht: 21,
    stand: () => [FERTIGKEITEN.reduce((s, f) => s + Math.min(SPIEL.maxStufe, stufe(f.id)), 0), FERTIGKEITEN.length * SPIEL.maxStufe],
    hilfe: { seite: "seiteFertigkeiten" } },
  { id: "auftraege", name: "Aufträge", icon: "📜", gewicht: 8,
    stand: () => [Math.min(spiel.quest || 0, QUESTS.length), QUESTS.length], quest: true },
  { id: "erfolge", name: "Erfolge (ohne Season)", icon: "🏆", gewicht: 8,
    stand: () => { const e = ERFOLGE.filter(x => !x.id.startsWith("season")); return [e.filter(erfolgErreicht).length, e.length]; },
    hilfe: { seite: "seiteIch", ichTab: "erfolge" } },
  { id: "baumhaus", name: "Baumhaus (alle Plätze, alle Stufen)", icon: "🏡", gewicht: 8,
    stand: () => [BAUPLAETZE.reduce((s, p) => s + (spiel.baumhaus?.[p.id] || 0), 0), BAUPLAETZE.length * BAU_STUFEN.length],
    hilfe: { fertigkeit: "bauen" } },
  { id: "sterne", name: "Sternbilder (alle Sterne)", icon: "🔭", gewicht: 4,
    stand: () => [sternStufenSumme(), sternStufenMax()], hilfe: { fertigkeit: "sterne", ziel: ".sternKaufen" } },
  { id: "dorf", name: "Wichteldorf (alle Gebäude)", icon: "🏘️", gewicht: 4,
    stand: () => [spiel.dorf ? dorfAllesGebaut() : 0, dorfAllesMax()], hilfe: { fertigkeit: "dorf" } },
  { id: "haustiere", name: "Haustiere gefunden", icon: "🐾", gewicht: 6,
    stand: () => { const h = ohneSeason(HAUSTIERE); return [h.filter(x => hatHaustier(x.id)).length, h.length]; },
    hilfe: { seite: "seiteIch", ichTab: "tiere" } },
  { id: "pflege", name: "Haustiere gepflegt (Stufe 10)", icon: "💖", gewicht: 6,
    stand: () => { const h = ohneSeason(HAUSTIERE); return [h.reduce((s, x) => s + (hatHaustier(x.id) ? Math.min(PFLEGE.maxStufe, tierStufe(x.id)) : 0), 0), h.length * PFLEGE.maxStufe]; },
    hilfe: { seite: "seiteIch", ichTab: "tiere" } },
  { id: "ausruestung", name: "Beste Ausrüstung & Schmuck", icon: "🛡️", gewicht: 6,
    stand: () => { const p = PLAETZE.map(x => x.id); return [p.reduce((s, x) => s + ruestungsStufe(x) + 1, 0), p.length * ERZE.length]; },
    hilfe: { seite: "seiteAbenteuer", abenteuerTab: "ausruestung" } },
  { id: "kleider", name: "Kleiderschrank (ohne Season)", icon: "👗", gewicht: 5,
    stand: () => { const t = alleTeile().filter(x => !x.season); return [t.filter(besitztTeil).length, t.length]; },
    hilfe: { seite: "seiteIch", ichTab: "figur", ziel: "#schrankRaster" } },
  { id: "monster", name: "Jedes Monster einmal", icon: "💤", gewicht: 4,
    stand: () => { const m = Object.keys(MONSTER).filter(id => id !== "season"); return [m.filter(id => (spiel.besiegt?.[id] || 0) > 0).length, m.length]; },
    hilfe: { seite: "seiteAbenteuer", abenteuerTab: "gebiete" } },
  { id: "pfade", name: "Abenteuer-Pfade", icon: "🗺️", gewicht: 4,
    stand: () => [PFADE.filter(p => spiel.pfade?.[p.id]).length, PFADE.length],
    hilfe: { seite: "seiteAbenteuer", abenteuerTab: "pfade" } },
  { id: "jagd", name: "Jagd-Laden", icon: "📋", gewicht: 3,
    stand: () => [spiel.jagd ? jagdLadenSumme() : 0, jagdLadenMax()], hilfe: { seite: "seiteAbenteuer", abenteuerTab: "jagd" } },
  { id: "werkzeuge", name: "Werkzeuge", icon: "🪓", gewicht: 4,
    stand: () => [Object.keys(WERKZEUGE).reduce((s, a) => s + (spiel.werkzeuge?.[a] || 0), 0), Object.keys(WERKZEUGE).length * WERKZEUG_STUFEN.length],
    hilfe: { seite: "seiteLaden" } },
  { id: "turnen", name: "Abenteuer-Spielplatz", icon: "🤸", gewicht: 3,
    stand: () => [spiel.parcours ? gebauteStationen().length + (spiel.parcours.podest ? 1 : 0) : 0, PARCOURS.length + 1], hilfe: { fertigkeit: "turnen" } },
  { id: "museum", name: "Museum (alle Funde)", icon: "🏛️", gewicht: 3,
    stand: () => [spiel.museum ? museumAnzahl() : 0, FUNDE.length], hilfe: { fertigkeit: "graben" } },
  { id: "beete", name: "Garten-Beete", icon: "🟫", gewicht: 3,
    stand: () => [gartenStand().beete.length, GARTEN.startBeete + GARTEN.beetPreise.length + 3],
    hilfe: { fertigkeit: "garten", ziel: "#beetKaufen" } },
];

// Extras: zählen nicht zu den 100 %
const FORTSCHRITT_EXTRAS = [
  { name: "Season-Haustiere", icon: "🎟️", stand: () => { const h = HAUSTIERE.filter(x => x.season); return [h.filter(x => hatHaustier(x.id)).length, h.length]; } },
  { name: "Season-Kleidung", icon: "👒", stand: () => { const t = alleTeile().filter(x => x.season); return [t.filter(besitztTeil).length, t.length]; } },
  { name: "Übung: Meister ⭐ 99", icon: "⭐", stand: () => { const u = uebungsListe(); return [u.filter(x => stufeAusXp(spiel.uebung[x.id] || 0) >= SPIEL.maxStufe).length, u.length]; } },
];

function bereichStand(b) {
  let [hat, von] = [0, 1];
  try { [hat, von] = b.stand(); } catch (e) { /* noch nicht berechenbar */ }
  return { hat: Math.min(hat, von), von, anteil: von ? Math.min(1, hat / von) : 1 };
}
// Gesamt in Prozent (0–100, mit einer Nachkommastelle)
function spielFortschritt() {
  const summe = FORTSCHRITT_BEREICHE.reduce((s, b) => s + b.gewicht, 0);
  const wert = FORTSCHRITT_BEREICHE.reduce((s, b) => s + bereichStand(b).anteil * b.gewicht, 0) / summe * 100;
  return Math.floor(wert * 10) / 10;
}
const fortschrittText = p => `${p.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;

// ===================== FENSTER =====================
function zeichneFortschritt() {
  const p = spielFortschritt();
  const r = 52, umfang = 2 * Math.PI * r;
  const ring = `<svg class="fsRing" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="${r}" fill="#fff" stroke="#ffe1ee" stroke-width="12"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="url(#fsVerlauf)" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${(umfang * p / 100).toFixed(1)} ${umfang.toFixed(1)}" transform="rotate(-90 60 60)"/>
    <defs><linearGradient id="fsVerlauf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9fd0"/><stop offset="1" stop-color="#b56bff"/></linearGradient></defs>
    <text x="60" y="58" text-anchor="middle" font-size="22" font-weight="900" fill="#d63384" font-family="ui-rounded, sans-serif">${fortschrittText(p)}</text>
    <text x="60" y="76" text-anchor="middle" font-size="9" font-weight="800" fill="#9a6b8c" font-family="ui-rounded, sans-serif">geschafft</text></svg>`;
  const spruch = p >= 100 ? "👑 Du hast das ganze Spiel geschafft!" : p >= 75 ? "Fast am Ziel – großartig!" : p >= 50 ? "Schon mehr als die Hälfte!" : p >= 25 ? "Du kommst richtig gut voran!" : p >= 5 ? "Ein toller Anfang!" : "Los geht's – das Abenteuer beginnt!";
  const zeile = (b, extra) => {
    const s = bereichStand(b);
    return `<button type="button" class="fsZeile${s.anteil >= 1 ? " fertig" : ""}" ${extra ? "disabled" : `data-bereich="${b.id}"`}>
      <span class="fsIcon">${b.icon}</span>
      <span class="fsText"><b>${b.name}${s.anteil >= 1 ? " ✅" : ""}</b>
        <span class="balken duenn"><div style="width:${(s.anteil * 100).toFixed(1)}%"></div></span>
        <small>${zahl(s.hat)} / ${zahl(s.von)}${extra ? "" : ` · zählt ${b.gewicht} %`}</small></span>
      <span class="fsProzent">${Math.floor(s.anteil * 100)} %</span></button>`;
  };
  $("fortschrittInhalt").innerHTML = `<div class="fsKopf">${ring}<p>${spruch}</p></div>
    <h3 class="fsTitel">So setzt sich das zusammen</h3>
    <div class="fsListe">${FORTSCHRITT_BEREICHE.map(b => zeile(b)).join("")}</div>
    <p class="hinweis">Tippe einen Bereich an, um direkt hinzukommen. Der 🧭 Kompass zeigt dir immer den besten nächsten Schritt.</p>
    <h3 class="fsTitel">🎟️ Extras <small>(zählen nicht zu den 100 %)</small></h3>
    <div class="fsListe">${FORTSCHRITT_EXTRAS.map(b => zeile(b, true)).join("")}</div>`;
  for (const k of $("fortschrittInhalt").querySelectorAll("[data-bereich]")) k.addEventListener("click", () => {
    const b = FORTSCHRITT_BEREICHE.find(x => x.id === k.dataset.bereich);
    ton.klick();
    $("fortschrittOverlay").hidden = true;
    if (b.quest) { zeigeQuestFenster(); return; }
    zeigeWegHilfe(b.hilfe);
  });
}
function zeigeFortschritt() { zeichneFortschritt(); $("fortschrittOverlay").hidden = false; }
function zeichneFortschrittKnopf() { $("fortschrittKnopf").innerHTML = `🏁 ${fortschrittText(spielFortschritt())}`; }

function richteFortschrittEin() {
  for (const id of ["fortschrittZu", "fortschrittX"]) $(id).addEventListener("click", () => { ton.klick(); $("fortschrittOverlay").hidden = true; });
  $("fortschrittOverlay").addEventListener("click", e => { if (e.target.id === "fortschrittOverlay") $("fortschrittOverlay").hidden = true; });
  $("fortschrittKnopf").addEventListener("click", () => { ton.klick(); zeigeFortschritt(); });
  $("fortschrittIch").addEventListener("click", () => { ton.klick(); zeigeFortschritt(); });
  zeichneFortschrittKnopf();
}
