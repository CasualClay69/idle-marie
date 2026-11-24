"use strict";
// =====================================================
//  ADVENTSKALENDER – vom 1. bis 24. Dezember jeden Tag ein Türchen
//  Verpasste Türchen kann man bis Silvester nachholen. Jedes Jahr gibt es den Kalender neu
//  (Kleidung und Haustier nur einmal – danach gibt es stattdessen Münzen).
//  spiel.advent = { jahr, offen: { tag: true } }
// =====================================================

// Für den Rundum-Test: einen Dezember-Tag vortäuschen (sonst null)
let adventTestTag = null;
function adventTag() {
  if (adventTestTag) return adventTestTag;
  const d = new Date(Date.now());
  return d.getMonth() === 11 ? d.getDate() : 0;   // 0 = kein Dezember
}
const adventAktiv = () => adventTag() > 0;
function advent() {
  const jahr = new Date(Date.now()).getFullYear();
  if (!spiel.advent || spiel.advent.jahr !== jahr) spiel.advent = { jahr, offen: {} };
  return spiel.advent;
}
const tuerchenOffen = n => !!advent().offen[n];
const tuerchenErlaubt = n => adventAktiv() && n <= Math.min(24, adventTag()) && !tuerchenOffen(n);

// Kleidung und Haustier aus dem Kalender (Listen nur hinten erweitern!)
HUETE.push({ id: "ha1", name: "Rentier-Geweih", icon: "🦌", advent: true, svg: `<path d="M34 30Q30 12 22 10M30 20L20 18M34 26L24 28M66 30Q70 12 78 10M70 20L80 18M66 26L76 28" stroke="#a8693a" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M28 34Q50 26 72 34" stroke="#ff5f5f" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="29" r="4" fill="#ffd54f"/>` });
RAHMEN.push({ id: "ra1", name: "Adventskranz", icon: "🎄", advent: true, svg: ring("#4f9a5a", 6, ringPunkte(10).map(([x, y], i) => i % 3 === 0
  ? `<rect x="${x - 2}" y="${y - 7}" width="4" height="9" rx="1.5" fill="#ff5f5f"/><path d="M${x} ${y - 10}Q${x + 2} ${y - 8} ${x} ${y - 7}Q${x - 2} ${y - 8} ${x} ${y - 10}Z" fill="#ffd54f"/>`
  : `<circle cx="${x}" cy="${y}" r="2.6" fill="${["#ff5f5f", "#ffd54f"][i % 2]}"/>`).join("")) });
HAUSTIERE.push({ id: "flocke", name: "Flocke", tier: "Eisbär", emoji: "🐻", advent: true, bonus: { art: "xp", wert: 0.03 }, text: "+3 % Erfahrung bei allem" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

// Die 24 Geschenke. muenzen = Vielfaches der Glücksrad-Grundmenge (wächst mit der Gesamtstufe)
const beste = (art, fid) => `${art}${Math.max(0, STUFEN.filter(s => s <= stufe(fid)).length - 1)}`;
const ADVENT_GESCHENKE = [
  { icon: "🪙", muenzen: 2 },
  { icon: "🦴", sache: () => [beste("leckerli", "freunde"), 20] },
  { icon: "🌱", sache: () => [`samen-kraut${Math.max(0, STUFEN.filter(s => s <= stufe("garten")).length - 1)}`, 10] },
  { icon: "🍲", sache: () => [beste("essen", "kochen"), 15] },
  { icon: "💰", muenzen: 4 },
  { icon: "🥾", name: "Nikolausstiefel", muenzen: 6, sache: () => ["goldsplitter5", 2] },
  { icon: "🧪", sache: () => [`trank${Math.max(0, STUFEN.filter(s => s <= Math.max(1, stufe("traenke"))).length - 1)}`, 3] },
  { icon: "💎", sache: () => [beste("stein", "bergbau"), 2] },
  { icon: "🎟️", season: 50 },
  { icon: "💫", sache: () => ["sternsplitter2", 50] },
  { icon: "🪙", muenzen: 3 },
  { icon: "🦌", kleidung: "ha1" },
  { icon: "🦴", sache: () => [beste("leckerli", "freunde"), 30] },
  { icon: "🍲", sache: () => [beste("essen", "kochen"), 25] },
  { icon: "💎", sache: () => [beste("stein", "bergbau"), 3] },
  { icon: "🎟️", season: 100 },
  { icon: "🧪", sache: () => [`trank${Math.max(0, STUFEN.filter(s => s <= Math.max(1, stufe("traenke"))).length - 1)}`, 4] },
  { icon: "🎄", kleidung: "ra1" },
  { icon: "💰", muenzen: 5 },
  { icon: "🌟", sache: () => ["goldsplitter5", 5] },
  { icon: "🌱", sache: () => [`samen-gemuese${Math.max(0, STUFEN.filter(s => s <= stufe("garten")).length - 1)}`, 20] },
  { icon: "💎", sache: () => [`stein${Math.min(7, Math.max(0, STUFEN.filter(s => s <= stufe("bergbau")).length - 1) + 1)}`, 4] },
  { icon: "💰", muenzen: 8 },
  { icon: "🐻", haustier: "flocke", muenzen: 10 },
];
// Reihenfolge der Türchen im Kalender (gemischt wie bei einem echten Kalender)
const ADVENT_ORDNUNG = [7, 15, 2, 20, 11, 24, 4, 18, 9, 13, 1, 22, 16, 6, 21, 3, 10, 19, 14, 8, 23, 5, 17, 12];

function oeffneTuerchen(n) {
  if (!tuerchenErlaubt(n)) return null;
  advent().offen[n] = true;
  const g = ADVENT_GESCHENKE[n - 1], teile = [];
  let haustier = null, seasonNeu = [];
  if (g.kleidung) {
    const t = teilNachId(g.kleidung);
    if (besitztTeil(t)) teile.push(`${muenzeHtml("muenze klein")} ${zahl(radBasis() * 5)} Münzen (${t.name} hast du schon)`), (spiel.muenzen += radBasis() * 5);
    else { gibTeil(g.kleidung); teile.push(`${t.icon} ${t.name} für deinen Kleiderschrank`); }
  }
  if (g.haustier) { const h = HAUSTIERE.find(x => x.id === g.haustier); if (gibHaustier(h)) { haustier = h; teile.push(`${h.emoji} ${h.tier} ${h.name}!`); } }
  if (g.muenzen) { const m = radBasis() * g.muenzen; spiel.muenzen += m; teile.push(`${muenzeHtml("muenze klein")} ${zahl(m)} Münzen`); }
  if (g.sache) { const [id, m] = g.sache(); gibInBank(id, m); teile.push(`${symbolHtml(id, "mini")} ${m}× ${GEGENSTAENDE[id].name}`); }
  if (g.season) { seasonNeu = gibSeasonPunkte(g.season); teile.push(`⭐ ${g.season} Season-Punkte`); }
  spiel.statistik.tuerchen = (spiel.statistik.tuerchen || 0) + 1;
  return { text: teile.join(" · "), haustier, seasonNeu };
}

erfolg({ id: "advent-24", icon: "🎄", name: "Ganzer Adventskalender", text: "Öffne alle 24 Türchen eines Adventskalenders", ziel: 24, muenzen: 500000,
  wert: () => (spiel.advent ? Object.keys(spiel.advent.offen).length : 0) });

// ===================== ANZEIGE =====================
function zeichneAdventKarte() {
  const k = $("adventKarte");
  if (!k) return;
  if (!adventAktiv()) { k.hidden = true; return; }
  const heute = Math.min(24, adventTag()), offenHeute = tuerchenErlaubt(heute);
  const nachholen = Array.from({ length: heute }, (_, i) => i + 1).filter(tuerchenErlaubt).length;
  k.hidden = false;
  const html = `<span class="gkIcon">🎄</span><span class="gkText"><b>Adventskalender</b>
    <small>${nachholen ? `${nachholen} Türchen ${nachholen === 1 ? "wartet" : "warten"} auf dich${heute === 24 && offenHeute ? " – heute ist Heiligabend!" : ""}` : "Alle Türchen bis heute geöffnet 🎉"}</small></span>
    ${nachholen ? `<span class="gkLos">Öffnen</span>` : ""}`;
  if (k.dataset.html !== html) { k.dataset.html = html; k.innerHTML = html; k.classList.toggle("bereit", !!nachholen); }
}
function zeigeAdvent() {
  const heute = Math.min(24, adventTag());
  $("adventGitter").innerHTML = ADVENT_ORDNUNG.map(n => {
    const offen = tuerchenOffen(n), erlaubt = tuerchenErlaubt(n), g = ADVENT_GESCHENKE[n - 1];
    return `<button type="button" class="tuerchen${offen ? " offen" : ""}${erlaubt ? " bereit" : ""}${n === heute ? " heute" : ""}" data-tag="${n}" ${erlaubt ? "" : "disabled"}>
      ${offen ? `<span class="tGeschenk">${g.icon}</span>` : `<span class="tZahl">${n}</span>`}</button>`;
  }).join("");
  $("adventErgebnis").innerHTML = "";
  for (const b of $("adventGitter").querySelectorAll(".tuerchen.bereit")) b.addEventListener("click", () => {
    const r = oeffneTuerchen(Number(b.dataset.tag));
    if (!r) return;
    ton.stufe(); herzchen(b);
    $("adventErgebnis").innerHTML = `<div class="radGewinn"><small>🎄 Türchen ${b.dataset.tag}</small><span>${r.text}</span></div>`;
    if (r.haustier) setTimeout(() => zeigeHaustierFund(r.haustier), 900);
    if (r.seasonNeu.length) setTimeout(() => zeigeSeasonStufen(r.seasonNeu), 900);
    for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
    speichern(); zeichneKopf(); zeichneAdventKarte();
    const ergebnis = $("adventErgebnis").innerHTML;
    zeigeAdvent(); $("adventErgebnis").innerHTML = ergebnis;
  });
  $("adventOverlay").hidden = false;
}
function richteAdventEin() {
  $("adventKarte").addEventListener("click", () => { ton.klick(); zeigeAdvent(); });
  $("adventZu").addEventListener("click", () => { ton.klick(); $("adventOverlay").hidden = true; });
  $("adventX").addEventListener("click", () => { ton.klick(); $("adventOverlay").hidden = true; });
  jedeSekunde(zeichneAdventKarte, 5);
  zeichneAdventKarte();
}
