"use strict";
// =====================================================
//  v1.35 – DER LADEN WIRD GRÖSSER
//  🛒 Tagesangebote · ⛏️ neue Werkzeuge · 🎟️ Dauer-Verbesserungen · 🧳 Händler (kauft doppelt)
//  🎀 Haustier-Zubehör · 💎 Tausch-Ecke
//  spiel.laden = { tag, angebote: [gekauft…], haendler: verkaufte Stück, verbesserung: { id: Stufe }, zubehoer: { id: Anzahl }, tierZubehoer: { tierId: id } }
// =====================================================

// ===================== ⛏️ NEUE WERKZEUGE =====================
// Wie Axt, Angel und Spitzhacke: jede Stufe macht die Fertigkeit 5 % schneller (Gießkanne: Garten wächst schneller)
Object.assign(WERKZEUGE, {
  pfanne:     { name: "Pfanne",        icon: "🍳", fertigkeit: "kochen" },
  amboss:     { name: "Amboss",        icon: "🛠️", fertigkeit: "schmieden" },
  messer:     { name: "Schnitzmesser", icon: "🗡️", fertigkeit: "schnitzen" },
  kessel:     { name: "Zauberkessel",  icon: "🫙", fertigkeit: "traenke" },
  nudelholz:  { name: "Nudelholz",     icon: "🥄", fertigkeit: "backen" },
  giesskanne: { name: "Gießkanne",     icon: "💧", fertigkeit: "garten" },
});
for (const [art, w] of Object.entries(WERKZEUGE)) { const f = fertigkeit(w.fertigkeit); if (f && !f.werkzeug) f.werkzeug = art; }
const giesskannenBonus = art => (art === "garten" ? WERKZEUG_BONUS * (spiel.werkzeuge?.giesskanne || 0) : 0);

// ===================== 🎟️ DAUER-VERBESSERUNGEN =====================
const VERBESSERUNGEN = [
  { id: "rucksack", name: "Großer Rucksack", icon: "🎒", art: "offline", werte: [1, 2, 4],  preise: [50000, 500000, 5000000],   text: w => `+${w} Std. Offline-Zeit` },
  { id: "klee",     name: "Glücksklee",      icon: "🍀", art: "tier",    werte: [10, 20, 35], preise: [100000, 1000000, 10000000], text: w => `Haustiere ${w} % öfter finden` },
  { id: "schwein",  name: "Sparschwein",     icon: "💰", art: "muenzen", werte: [5, 10, 15], preise: [80000, 800000, 8000000],   text: w => `+${w} % Münzen von Monstern` },
  { id: "buch",     name: "Lernbuch",        icon: "📚", art: "xp",      werte: [2, 4, 6],   preise: [200000, 2000000, 20000000], text: w => `+${w} % Erfahrung bei allem` },
  { id: "tresor",   name: "Doppel-Tresor",   icon: "🏦", art: "bank",    werte: [10, 20, 30], preise: [150000, 1500000, 15000000], text: w => `+${w} Bankfächer` },
];
const ladenStand = () => {
  spiel.laden = spiel.laden || {};
  const l = spiel.laden;
  l.verbesserung = l.verbesserung || {}; l.zubehoer = l.zubehoer || {}; l.tierZubehoer = l.tierZubehoer || {};
  if (l.tag !== tagText()) { l.tag = tagText(); l.angebote = []; l.haendler = 0; }
  return l;
};
const verbesserungStufe = id => ladenStand().verbesserung[id] || 0;
function verbesserungBonus(art) {
  return VERBESSERUNGEN.filter(v => v.art === art && verbesserungStufe(v.id)).reduce((s, v) => {
    const w = v.werte[verbesserungStufe(v.id) - 1];
    return s + (["offline", "bank"].includes(art) ? w : w / 100);
  }, 0);
}
function kaufeVerbesserung(id) {
  const v = VERBESSERUNGEN.find(x => x.id === id), st = verbesserungStufe(id);
  if (!v || st >= v.preise.length || spiel.muenzen < v.preise[st]) return false;
  spiel.muenzen -= v.preise[st];
  ladenStand().verbesserung[id] = st + 1;
  return true;
}

// ===================== 🛒 TAGESANGEBOTE =====================
// Jeden Tag 3 Angebote (für alle gleich), 30 % billiger als der normale Ladenpreis (= doppelter Verkaufswert)
const tagesZahl = () => { const d = new Date(Date.now()); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); };
function zufallAusTag(n, salz) { let s = Math.imul((tagesZahl() * 31 + salz) | 0, 0x9e3779b1); s ^= s >>> 15; s = Math.imul(s, 0x85ebca6b); s ^= s >>> 13; return (s >>> 0) % n; }
function tagesAngebote() {
  const t = Math.min(7, Math.max(0, Math.floor(gesamtStufe() / 120)));   // je weiter man ist, desto bessere Sorten
  const pool = [
    { id: `trank${zufallAusTag(8, 1)}`, menge: 5 }, { id: `kuchen${Math.min(7, t)}`, menge: 3 }, { id: `samen-kraut${Math.min(7, t)}`, menge: 10 },
    { id: `samen-gemuese${Math.min(7, t)}`, menge: 10 }, { id: `barren${Math.min(7, t)}`, menge: 20 }, { id: "goldsplitter5", menge: 2 },
    { id: BEUTE[Math.min(BEUTE.length - 1, zufallAusTag(BEUTE.length, 2))][0], menge: 8 }, { id: `essen${Math.min(7, t)}`, menge: 25 }, { id: `stein${Math.min(7, t)}`, menge: 3 },
  ].filter(a => GEGENSTAENDE[a.id]);
  const genommen = [];
  for (let i = 0; genommen.length < 3 && i < 20; i++) { const a = pool[zufallAusTag(pool.length, 10 + i)]; if (!genommen.includes(a)) genommen.push(a); }
  return genommen.map((a, i) => ({ ...a, nr: i, preis: Math.max(10, Math.round(GEGENSTAENDE[a.id].wert * a.menge * 2 * 0.7)) }));
}
function kaufeAngebot(nr) {
  const a = tagesAngebote()[nr], l = ladenStand();
  if (!a || l.angebote.includes(nr) || spiel.muenzen < a.preis) return false;
  spiel.muenzen -= a.preis; gibInBank(a.id, a.menge); l.angebote.push(nr);
  return true;
}

// ===================== 🧳 HÄNDLER =====================
// Kauft jeden Tag eine andere Sorte zum doppelten Preis – höchstens 300 Stück am Tag
const HAENDLER = { faktor: 2, maxStueck: 300, arten: ["holz", "fisch", "bergbau", "essen", "garten", "beute", "basteln", "traenke"] };
const haendlerArt = () => BANK_ARTEN.find(a => a.id === HAENDLER.arten[zufallAusTag(HAENDLER.arten.length, 99)]) || BANK_ARTEN[0];
const haendlerSachen = () => Object.keys(spiel.bank).filter(id => anzahl(id) > 0 && GEGENSTAENDE[id] && bankArt(id).art.id === haendlerArt().id && !GEGENSTAENDE[id].platz);
const haendlerRest = () => Math.max(0, HAENDLER.maxStueck - ladenStand().haendler);
function verkaufeAnHaendler(id) {
  const n = Math.min(anzahl(id), haendlerRest());
  if (n < 1 || bankArt(id).art.id !== haendlerArt().id) return 0;
  const geld = GEGENSTAENDE[id].wert * n * HAENDLER.faktor;
  nimmAusBank(id, n);
  spiel.muenzen += geld;
  spiel.statistik.verkauft = (spiel.statistik.verkauft || 0) + n;
  spiel.statistik.verdient = (spiel.statistik.verdient || 0) + geld;
  ladenStand().haendler += n;
  spiel.statistik.haendler = (spiel.statistik.haendler || 0) + n;
  return geld;
}

// ===================== 🎀 HAUSTIER-ZUBEHÖR =====================
const ZUBEHOER = [
  { id: "halsband",  name: "Glitzer-Halsband", icon: "🎀", preis: 25000,  art: "pflege",  wert: 0.5, text: "+50 % Pflege-Erfahrung beim Streicheln und Füttern" },
  { id: "rucksack",  name: "Mini-Rucksack",    icon: "🎒", preis: 40000,  art: "ausflug", wert: 0.4, text: "+40 % Beute von Ausflügen" },
  { id: "gloeckchen", name: "Goldenes Glöckchen", icon: "🔔", preis: 150000, art: "bonus", wert: 0.25, text: "Der Bonus des Tiers wirkt 25 % stärker" },
];
const tierZubehoer = id => ZUBEHOER.find(z => z.id === ladenStand().tierZubehoer[id]) || null;
function zubehoerFaktor(tierId, art) { const z = tierZubehoer(tierId); return z && z.art === art ? 1 + z.wert : 1; }
function kaufeZubehoer(id) {
  const z = ZUBEHOER.find(x => x.id === id);
  if (!z || spiel.muenzen < z.preis) return false;
  spiel.muenzen -= z.preis; ladenStand().zubehoer[id] = (ladenStand().zubehoer[id] || 0) + 1;
  return true;
}
// Zubehör einem Tier geben (das alte kommt zurück in den Vorrat)
function gibZubehoer(tierId, id) {
  const l = ladenStand(), alt = l.tierZubehoer[tierId];
  if (id && !(l.zubehoer[id] > 0)) return false;
  if (alt) l.zubehoer[alt] = (l.zubehoer[alt] || 0) + 1;
  if (id) { l.zubehoer[id]--; l.tierZubehoer[tierId] = id; } else delete l.tierZubehoer[tierId];
  return true;
}
function zeigeZubehoerWahl(tierId) {
  const h = HAUSTIERE.find(x => x.id === tierId), an = tierZubehoer(tierId), l = ladenStand();
  $("kochbuchInhalt").innerHTML = `<div class="zirkusKopf"><span>${h.emoji}</span><h2>Zubehör für ${h.name}</h2><small>${an ? `trägt: ${an.icon} ${an.name}` : "trägt noch nichts"}</small></div>
    <ul class="offlineListe">${ZUBEHOER.map(z => `<li>${z.icon} <span class="rkName">${z.name} <small class="sanft">${z.text} · im Vorrat: ${l.zubehoer[z.id] || 0}</small></span>
      ${an?.id === z.id ? "✅" : `<button type="button" class="knopf kaufen" data-geben="${z.id}" ${l.zubehoer[z.id] > 0 ? "" : "disabled"}>Anlegen</button>`}</li>`).join("")}</ul>
    ${an ? `<button type="button" class="knopf leise" data-geben="">Zubehör abnehmen</button>` : ""}
    <p class="hinweis">Zubehör kaufst du im 🛒 Laden. Jedes Tier kann ein Teil tragen.</p>`;
  $("kochbuchOverlay").hidden = false;
  for (const b of $("kochbuchInhalt").querySelectorAll("[data-geben]")) b.addEventListener("click", () => {
    if (!gibZubehoer(tierId, b.dataset.geben || null)) { ton.nein(); return; }
    ton.klick(); speichern(); zeigeZubehoerWahl(tierId); if (aktuelleSeite === "seiteIch") zeichneIch();
  });
}

// ===================== 💎 TAUSCH-ECKE =====================
// Beute tauschen: 10 einer Sorte gegen 1 der nächstbesseren – oder 1 gegen 3 der schlechteren
const TAUSCH = { hoch: 10, runter: 3 };
function tausche(i, richtung) {
  const a = BEUTE[i]?.[0], b = BEUTE[i + 1]?.[0];
  if (!a || !b) return false;
  if (richtung === "hoch") { if (anzahl(a) < TAUSCH.hoch) return false; nimmAusBank(a, TAUSCH.hoch); gibInBank(b, 1); }
  else { if (anzahl(b) < 1) return false; nimmAusBank(b, 1); gibInBank(a, TAUSCH.runter); }
  return true;
}

// ===================== ANZEIGE IM LADEN =====================
function ladenExtras(liste) {
  const l = ladenStand(), abschnitt = (titel, html) => liste.append(el("div", "ladenAbschnitt", `<h3 class="rasterTitel">${titel}</h3>${html}`));
  // Tagesangebote
  abschnitt("🛒 Tagesangebote <small>jeden Tag neu · 30 % billiger</small>", tagesAngebote().map(a => {
    const g = GEGENSTAENDE[a.id], weg = l.angebote.includes(a.nr);
    return `<div class="ladenKarte">${symbolHtml(a.id)}<div class="lText"><b>${a.menge}× ${g.name}</b><small>${weg ? "✅ Heute schon gekauft" : `statt ${zahl(Math.round(a.preis / 0.7))} nur`}</small></div>
      ${weg ? "" : `<button type="button" class="knopf kaufen" data-angebot="${a.nr}" ${spiel.muenzen >= a.preis ? "" : "disabled"}>${muenzeHtml("muenze klein")} ${zahl(a.preis)}</button>`}</div>`;
  }).join(""));
  // Händler
  const art = haendlerArt(), sachen = haendlerSachen().sort((a, b) => GEGENSTAENDE[b].wert - GEGENSTAENDE[a].wert).slice(0, 8);
  abschnitt(`🧳 Händler <small>kauft heute: ${art.icon} ${art.name} zum doppelten Preis</small>`,
    `<p class="hinweis">Noch ${haendlerRest()} von ${HAENDLER.maxStueck} Stück heute. Morgen will er etwas anderes.</p>`
    + (sachen.length ? sachen.map(id => `<div class="ladenKarte">${symbolHtml(id)}<div class="lText"><b>${GEGENSTAENDE[id].name}</b><small>Du hast ${zahl(anzahl(id))} · je ${zahl(GEGENSTAENDE[id].wert * HAENDLER.faktor)} statt ${zahl(GEGENSTAENDE[id].wert)}</small></div>
      <button type="button" class="knopf kaufen" data-haendler="${id}" ${haendlerRest() ? "" : "disabled"}>Verkaufen</button></div>`).join("") : `<p class="hinweis">Du hast gerade nichts davon in der Bank.</p>`));
  // Dauer-Verbesserungen
  abschnitt("🎟️ Verbesserungen <small>wirken für immer</small>", VERBESSERUNGEN.map(v => {
    const st = verbesserungStufe(v.id), voll = st >= v.preise.length;
    return `<div class="ladenKarte"><span class="lIcon">${v.icon}</span><div class="lText"><b>${v.name} ${st ? `<small>Stufe ${st} / ${v.preise.length}</small>` : ""}</b>
      <small>${st ? `Jetzt: ${v.text(v.werte[st - 1])}` : "Noch nicht gekauft"}${voll ? " · 🏆 ganz ausgebaut" : ` · nächste Stufe: ${v.text(v.werte[st])}`}</small></div>
      ${voll ? "" : `<button type="button" class="knopf kaufen" data-verbesserung="${v.id}" ${spiel.muenzen >= v.preise[st] ? "" : "disabled"}>${muenzeHtml("muenze klein")} ${zahl(v.preise[st])}</button>`}</div>`;
  }).join(""));
  // Zubehör
  abschnitt("🎀 Haustier-Zubehör <small>anlegen unter Ich → Tiere</small>", ZUBEHOER.map(z => `<div class="ladenKarte"><span class="lIcon">${z.icon}</span><div class="lText"><b>${z.name}</b><small>${z.text} · im Vorrat: ${l.zubehoer[z.id] || 0}</small></div>
    <button type="button" class="knopf kaufen" data-zubehoer="${z.id}" ${spiel.muenzen >= z.preis ? "" : "disabled"}>${muenzeHtml("muenze klein")} ${zahl(z.preis)}</button></div>`).join(""));
  // Tausch-Ecke
  const zeilen = BEUTE.slice(0, -1).map((b, i) => {
    const naechste = BEUTE[i + 1];
    if (anzahl(b[0]) < TAUSCH.hoch && anzahl(naechste[0]) < 1) return "";
    return `<div class="ladenKarte tauschZeile">${symbolHtml(b[0], "mini")}<span class="lText"><small>${zahl(anzahl(b[0]))} ${b[1]} · ${zahl(anzahl(naechste[0]))} ${naechste[1]}</small></span>
      <button type="button" class="knopf klein" data-tausch="${i}" data-richtung="hoch" ${anzahl(b[0]) >= TAUSCH.hoch ? "" : "disabled"}>${TAUSCH.hoch} → 1 ${symbolHtml(naechste[0], "mini")}</button>
      <button type="button" class="knopf klein leise" data-tausch="${i}" data-richtung="runter" ${anzahl(naechste[0]) >= 1 ? "" : "disabled"}>1 → ${TAUSCH.runter} ${symbolHtml(b[0], "mini")}</button></div>`;
  }).filter(Boolean);
  abschnitt("💎 Tausch-Ecke <small>Beute umtauschen</small>", zeilen.length ? zeilen.join("") : `<p class="hinweis">Hier kannst du Abenteuer-Beute umtauschen: ${TAUSCH.hoch} einer Sorte gegen 1 der nächstbesseren – oder 1 gegen ${TAUSCH.runter} der einfacheren. Sammle erst etwas Beute!</p>`);

  const neu = () => { speichern(); zeichneKopf(); zeichneLaden(); };
  for (const b of liste.querySelectorAll("[data-angebot]")) b.addEventListener("click", () => { if (kaufeAngebot(Number(b.dataset.angebot))) { ton.muenze(); melde("🛒 Angebot gekauft!"); neu(); } else ton.nein(); });
  for (const b of liste.querySelectorAll("[data-haendler]")) b.addEventListener("click", () => { const g = verkaufeAnHaendler(b.dataset.haendler); if (g) { ton.muenze(); melde(`🧳 Der Händler zahlt ${zahl(g)} Münzen!`); neu(); } else ton.nein(); });
  for (const b of liste.querySelectorAll("[data-verbesserung]")) b.addEventListener("click", () => { if (kaufeVerbesserung(b.dataset.verbesserung)) { ton.stufe(); melde("🎟️ Verbesserung gekauft – wirkt für immer!", "gross"); neu(); } else ton.nein(); });
  for (const b of liste.querySelectorAll("[data-zubehoer]")) b.addEventListener("click", () => { if (kaufeZubehoer(b.dataset.zubehoer)) { ton.muenze(); melde("🎀 Gekauft! Leg es unter Ich → Tiere einem Haustier an."); neu(); } else ton.nein(); });
  for (const b of liste.querySelectorAll("[data-tausch]")) b.addEventListener("click", () => { if (tausche(Number(b.dataset.tausch), b.dataset.richtung)) { ton.klick(); neu(); } else ton.nein(); });
}

function extras4Bonus(art) { return giesskannenBonus(art) + verbesserungBonus(art); }
erfolg({ id: "laden-verbesserung", icon: "🎟️", name: "Gut ausgestattet", text: "Bau alle Verbesserungen im Laden ganz aus", ziel: VERBESSERUNGEN.length * 3, muenzen: 5000000,
  wert: () => VERBESSERUNGEN.reduce((s, v) => s + verbesserungStufe(v.id), 0) });
erfolg({ id: "haendler-1", icon: "🧳", name: "Gutes Geschäft", text: "Verkauf etwas an den Händler", ziel: 1, muenzen: 2000, wert: () => (spiel.statistik.haendler || 0) });
