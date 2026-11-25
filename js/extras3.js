"use strict";
// =====================================================
//  v1.34 – AUSFLÜGE · ALLE STREICHELN · GARTEN-DEKO · FOTOALBUM · SAMMELKARTEN
//  (Gemeinschafts-Boss und Angel-Wettbewerb: gemeinschaft.js)
// =====================================================

// ===================== 🎒 HAUSTIER-AUSFLÜGE =====================
// Haustiere (außer dem Begleiter) gehen 1, 4 oder 8 Stunden auf Ausflug und bringen Sachen mit.
// spiel.ausfluege = { tierId: { start, bis, stunden } }
const AUSFLUG = { dauern: [1, 4, 8], mengeProStunde: 6 };
const ausfluege = () => (spiel.ausfluege = spiel.ausfluege || {});
const aufAusflug = id => !!ausfluege()[id];
const ausflugZurueck = id => aufAusflug(id) && ausfluege()[id].bis <= Date.now();
const kannAufAusflug = id => hatHaustier(id) && !aufAusflug(id) && id !== spiel.begleiter;
function schickeAufAusflug(id, stunden) {
  if (!kannAufAusflug(id)) return false;
  ausfluege()[id] = { start: Date.now(), bis: Date.now() + stunden * 3600000, stunden };
  return true;
}
// Was bringt ein Tier mit? Hängt von seiner Art (Sammeln, Herstellen, Kampf, Glück) und der Pflege-Stufe ab
function ausflugBeute(id) {
  const h = HAUSTIERE.find(x => x.id === id), a = ausfluege()[id];
  const st = tierStufe(id), tier = Math.min(7, Math.floor(st * 0.7) + (h.zucht || h.chef ? 1 : 0));
  const menge = Math.max(1, Math.round(a.stunden * AUSFLUG.mengeProStunde * (0.7 + st * 0.06) * (0.8 + Math.random() * 0.4)
    * (typeof zubehoerFaktor === "function" ? zubehoerFaktor(id, "ausflug") : 1)));   // Mini-Rucksack
  const gruppe = zuchtGruppe(h), beute = {};
  const dazu = (gid, n) => { if (GEGENSTAENDE[gid] && n > 0) beute[gid] = (beute[gid] || 0) + n; };
  if (gruppe === "sammeln") { const art = h.fertigkeit === "angeln" ? "fisch" : h.fertigkeit === "bergbau" ? "erz" : h.fertigkeit === "garten" ? "kraut" : "holz"; dazu(`${art}${tier}`, menge); }
  else if (gruppe === "machen") { dazu(`barren${tier}`, Math.ceil(menge / 3)); dazu(`brett${tier}`, Math.ceil(menge / 3)); }
  else if (gruppe === "kampf" || gruppe === "chef") { const g = GEBIETE[Math.min(GEBIETE.length - 1, Math.floor(tier * 0.8))]; dazu(g.beute[0], Math.ceil(menge / 2)); dazu(`essen${tier}`, Math.ceil(menge / 3)); }
  else { dazu("goldsplitter5", Math.random() < 0.3 * a.stunden / 4 ? 1 : 0); dazu(`samen-gemuese${Math.min(7, tier)}`, Math.ceil(menge / 4)); }
  return { beute, muenzen: Math.round(a.stunden * 40 * (1 + tier) * (0.8 + Math.random() * 0.4)) };
}
function holeAusflug(id) {
  if (!ausflugZurueck(id)) return null;
  const e = ausflugBeute(id);
  for (const [gid, n] of Object.entries(e.beute)) { gibInBank(gid, n); zaehle(gid, n); }
  spiel.muenzen += e.muenzen;
  gibTierXp(id, 5 * ausfluege()[id].stunden);   // Ausflüge machen Spaß: ein bisschen Pflege-Erfahrung
  delete ausfluege()[id];
  spiel.statistik.ausfluege = (spiel.statistik.ausfluege || 0) + 1;
  return e;
}
function holeAlleAusfluege() {
  const summe = { beute: {}, muenzen: 0, n: 0 };
  for (const id of Object.keys(ausfluege())) {
    const e = holeAusflug(id);
    if (!e) continue;
    summe.n++; summe.muenzen += e.muenzen;
    for (const [gid, n] of Object.entries(e.beute)) summe.beute[gid] = (summe.beute[gid] || 0) + n;
  }
  return summe;
}
const restZeit = ms => { const min = Math.max(1, Math.ceil(ms / 60000)); return min >= 60 ? `${Math.floor(min / 60)} Std. ${min % 60} Min.` : `${min} Min.`; };

// ===================== 🐾 ALLE STREICHELN =====================
function streichleAlle() {
  let n = 0, stufen = 0;
  for (const id of spiel.haustiere || []) {
    if (!darfGestreicheltWerden(id)) continue;
    const e = streichle(id);
    if (e) { n++; if (e.neueStufe) stufen++; }
  }
  return { n, stufen };
}

// Karte unter Ich → Tiere: Streicheln + Ausflüge
function zeichneTierExtras() {
  const ziel = $("tierExtras");
  if (!ziel) return;
  const streichelbar = (spiel.haustiere || []).filter(darfGestreicheltWerden).length;
  const zurueck = Object.keys(ausfluege()).filter(ausflugZurueck).length;
  const frei = (spiel.haustiere || []).filter(kannAufAusflug);
  const unterwegs = Object.keys(ausfluege());
  ziel.innerHTML = `<div class="tierKnopfReihe">
      <button type="button" class="knopf ${streichelbar ? "kaufen" : "leise"}" id="alleStreicheln" ${streichelbar ? "" : "disabled"}>🐾 Alle streicheln${streichelbar ? ` (${streichelbar})` : ""}</button>
    </div>
    <h3>🎒 Ausflüge <small>${unterwegs.length} unterwegs</small></h3>
    <p class="hinweis">Haustiere (außer deinem Begleiter) können auf Ausflug gehen und bringen Sachen mit – je höher ihre Pflege-Stufe, desto mehr und bessere. Auch wenn das Spiel zu ist!</p>
    ${zurueck ? `<button type="button" class="knopf kaufen" id="alleAbholen">📦 Alle abholen (${zurueck} zurück)</button>` : ""}
    ${frei.length ? `<div class="tierKnopfReihe">${AUSFLUG.dauern.map(d => `<button type="button" class="knopf" data-alle="${d}">🎒 Alle ${d} Std. losschicken (${frei.length})</button>`).join("")}</div>` : ""}
    ${spiel.begleiter && typeof tierZubehoer === "function" ? (() => { const b = HAUSTIERE.find(x => x.id === spiel.begleiter), zb = tierZubehoer(spiel.begleiter);
      return b ? `<div class="ausflugZeile"><span class="ausflugTier">${b.emoji}</span><span class="rkName">${b.name} <small class="sanft">Begleiter · bleibt bei dir</small></span>
        <button type="button" class="zubehoerKnopf${zb ? " an" : ""}" data-zubehoerwahl="${spiel.begleiter}" title="Zubehör">${zb ? zb.icon : "🎀"}</button></div>` : ""; })() : ""}
    <div class="ausflugListe">${(spiel.haustiere || []).map(id => {
      const h = HAUSTIERE.find(x => x.id === id);
      if (!h || id === spiel.begleiter) return "";
      const a = ausfluege()[id];
      const rechts = !a ? AUSFLUG.dauern.map(d => `<button type="button" class="knopf klein" data-tier="${id}" data-std="${d}">${d} Std.</button>`).join("")
        : ausflugZurueck(id) ? `<button type="button" class="knopf kaufen klein" data-holen="${id}">📦 Abholen</button>`
        : `<small>🎒 noch ${restZeit(a.bis - Date.now())}</small>`;
      const zb = typeof tierZubehoer === "function" ? tierZubehoer(id) : null;
      return `<div class="ausflugZeile"><span class="ausflugTier">${h.emoji}</span><span class="rkName">${h.name} <small class="sanft">Stufe ${tierStufe(id)}</small></span>
        <button type="button" class="zubehoerKnopf${zb ? " an" : ""}" data-zubehoerwahl="${id}" title="Zubehör">${zb ? zb.icon : "🎀"}</button><span class="ausflugKnoepfe">${rechts}</span></div>`;
    }).join("")}</div>`;
  $("alleStreicheln")?.addEventListener("click", () => {
    const e = streichleAlle();
    if (!e.n) return;
    ton.muenze(); melde(`🐾 ${e.n} Haustier${e.n === 1 ? "" : "e"} gestreichelt${e.stufen ? ` · ${e.stufen}× eine Stufe höher!` : ""}`, "gross");
    speichern(); zeichneIch();
  });
  $("alleAbholen")?.addEventListener("click", () => {
    const s = holeAlleAusfluege();
    if (!s.n) return;
    ton.muenze(); melde(`📦 ${s.n} Haustier${s.n === 1 ? " ist" : "e sind"} zurück: +${zahl(s.muenzen)} Münzen und ${Object.entries(s.beute).map(([g, n]) => `${n}× ${GEGENSTAENDE[g].name}`).join(", ")}`, "gross");
    speichern(); zeichneKopf(); zeichneIch();
  });
  for (const b of ziel.querySelectorAll("[data-alle]")) b.addEventListener("click", () => {
    const d = Number(b.dataset.alle), n = (spiel.haustiere || []).filter(kannAufAusflug).filter(id => schickeAufAusflug(id, d)).length;
    ton.klick(); melde(`🎒 ${n} Haustier${n === 1 ? " geht" : "e gehen"} für ${d} Std. auf Ausflug!`); speichern(); zeichneIch();
  });
  for (const b of ziel.querySelectorAll("[data-tier]")) b.addEventListener("click", () => {
    if (!schickeAufAusflug(b.dataset.tier, Number(b.dataset.std))) return;
    ton.klick(); speichern(); zeichneIch();
  });
  for (const b of ziel.querySelectorAll("[data-zubehoerwahl]")) b.addEventListener("click", () => { ton.klick(); zeigeZubehoerWahl(b.dataset.zubehoerwahl); });
  for (const b of ziel.querySelectorAll("[data-holen]")) b.addEventListener("click", () => {
    const e = holeAusflug(b.dataset.holen);
    if (!e) return;
    ton.muenze(); melde(`📦 Zurück vom Ausflug: +${zahl(e.muenzen)} Münzen · ${Object.entries(e.beute).map(([g, n]) => `${n}× ${GEGENSTAENDE[g].name}`).join(", ")}`, "gross");
    speichern(); zeichneKopf(); zeichneIch();
  });
}
erfolg({ id: "ausflug-1", icon: "🎒", name: "Gute Reise", text: "Hol ein Haustier von seinem ersten Ausflug ab", ziel: 1, muenzen: 2000, wert: () => spiel.statistik.ausfluege || 0 });
erfolg({ id: "ausflug-100", icon: "🎒", name: "Weltenbummler", text: "100 Ausflüge", ziel: 100, muenzen: 300000, wert: () => spiel.statistik.ausfluege || 0 });

// ===================== 🏡 GARTEN-DEKO =====================
const GARTEN_DEKO = [
  { id: "zaun",     name: "Gartenzaun",     emoji: "🪵", tier: 1, bretter: 30,  barren: 0,  muenzen: 2000 },
  { id: "zwerg",    name: "Gartenzwerg",    emoji: "🧙", tier: 2, bretter: 20,  barren: 10, muenzen: 10000 },
  { id: "vogel",    name: "Vogelhaus",      emoji: "🐦", tier: 3, bretter: 40,  barren: 10, muenzen: 40000 },
  { id: "bogen",    name: "Rosenbogen",     emoji: "🌸", tier: 4, bretter: 50,  barren: 20, muenzen: 120000 },
  { id: "teich",    name: "Seerosenteich",  emoji: "🐸", tier: 5, bretter: 40,  barren: 40, muenzen: 400000 },
  { id: "brunnen",  name: "Springbrunnen",  emoji: "💧", tier: 6, bretter: 60,  barren: 60, muenzen: 1200000 },
  { id: "laterne",  name: "Sternenlaterne", emoji: "🌟", tier: 6, bretter: 40,  barren: 80, muenzen: 2500000 },
  { id: "karussell", name: "Garten-Karussell", emoji: "🎡", tier: 7, bretter: 100, barren: 100, muenzen: 6000000 },
];
GARTEN_DEKO.forEach((d, i) => { d.bonus = 3; d.ab = [1, 10, 20, 30, 45, 60, 70, 85][i]; });
const dekoGebaut = id => !!spiel.gartenDeko?.[id];
const dekoKosten = d => ({ [`brett${d.tier}`]: d.bretter, ...(d.barren ? { [`barren${d.tier}`]: d.barren } : {}) });
const dekoBezahlbar = d => spiel.muenzen >= d.muenzen && Object.entries(dekoKosten(d)).every(([id, n]) => anzahl(id) >= n);
function baueDeko(id) {
  const d = GARTEN_DEKO.find(x => x.id === id);
  if (!d || dekoGebaut(id) || stufe("garten") < d.ab || !dekoBezahlbar(d)) return false;
  for (const [g, n] of Object.entries(dekoKosten(d))) nimmAusBank(g, n);
  spiel.muenzen -= d.muenzen;
  spiel.gartenDeko = { ...(spiel.gartenDeko || {}), [id]: Date.now() };
  return true;
}
const dekoBonus = art => (art === "garten" ? GARTEN_DEKO.filter(d => dekoGebaut(d.id)).reduce((s, d) => s + d.bonus, 0) / 100 : 0);
function gartenDekoHtml() {
  const gebaut = GARTEN_DEKO.filter(d => dekoGebaut(d.id));
  return `<div class="dekoStreifen">${gebaut.length ? gebaut.map(d => `<span title="${d.name}">${d.emoji}</span>`).join("") : "<small>Noch keine Deko – bau unten etwas Hübsches!</small>"}</div>
    <h3 class="rasterTitel">🏡 Garten-Deko <small>${gebaut.length} / ${GARTEN_DEKO.length} · jede: Garten +3 % schneller</small></h3>
    <div class="samenListe">${GARTEN_DEKO.map(d => {
      const hat = dekoGebaut(d.id), zu = stufe("garten") < d.ab;
      return `<div class="samenZeile${zu ? " gesperrt" : ""}"><span class="lIcon">${d.emoji}</span><span class="lText"><b>${d.name}</b><small>${hat ? "✅ steht im Garten" : zu ? `🔒 ab Gärtnern ${d.ab}`
        : `${Object.entries(dekoKosten(d)).map(([g, n]) => `${n}× ${GEGENSTAENDE[g].name}`).join(", ")} · ${muenzeHtml("muenze klein")} ${zahl(d.muenzen)}`}</small></span>
        ${hat || zu ? "" : `<button type="button" class="knopf kaufen" data-deko="${d.id}" ${dekoBezahlbar(d) ? "" : "disabled"}>Bauen</button>`}</div>`;
    }).join("")}</div>`;
}
function gartenDekoVerdrahten(ziel) {
  for (const b of ziel.querySelectorAll("[data-deko]")) b.addEventListener("click", () => {
    if (!baueDeko(b.dataset.deko)) { ton.nein(); return; }
    ton.stufe(); melde(`🏡 ${GARTEN_DEKO.find(d => d.id === b.dataset.deko).name} steht jetzt im Garten!`, "gross");
    speichern(); zeichneKopf(); zeichneSeite();
  });
}
erfolg({ id: "deko-alle", icon: "🏡", name: "Traumgarten", text: "Bau alle Garten-Dekos", ziel: GARTEN_DEKO.length, muenzen: 3000000, wert: () => GARTEN_DEKO.filter(d => dekoGebaut(d.id)).length });

// ===================== 🃏 SAMMELKARTEN =====================
// Jedes Monster kann eine Karte fallen lassen (Chefs öfter). Volle Alben geben Boni.
const KARTEN = { chance: 1 / 120, chefChance: 1 / 25 };
const KARTEN_ALBEN = [
  ...GEBIETE.map((g, i) => ({ id: g.id, name: g.name, icon: g.icon, monster: [...g.monster.map(m => m.id), PFAD_WAECHTER[g.id]?.id].filter(Boolean),
    bonus: [["xp", 2], ["muenzen", 5], ["kampfxp", 5], ["doppelt", 2], ["heilen", 10], ["xp", 3], ["muenzen", 8], ["kampfxp", 8]][i] || ["xp", 2] })),
  { id: "verliese", name: "Verliese", icon: "🏰", monster: DUNGEONS.flatMap(d => d.liste), bonus: ["xp", 4] },
];
const ALLE_KARTEN = KARTEN_ALBEN.flatMap(a => a.monster);
const BONUS_TEXT = { xp: w => `+${w} % Erfahrung bei allem`, muenzen: w => `+${w} % Münzen von Monstern`, kampfxp: w => `+${w} % Kampf-Erfahrung`, doppelt: w => `+${w} % doppelte Ausbeute`, heilen: w => `Essen heilt ${w} % mehr` };
const karteDa = id => (spiel.karten?.[id] || 0) > 0;
const albumVoll = a => a.monster.every(karteDa);
function karteFallen(m) {
  if (!ALLE_KARTEN.includes(m.id)) return null;
  const chance = (m.chef ? KARTEN.chefChance : KARTEN.chance) * (1 + baumhausBonus("tier"));
  if (Math.random() >= chance) return null;
  spiel.karten = spiel.karten || {};
  const neu = !karteDa(m.id);
  spiel.karten[m.id] = (spiel.karten[m.id] || 0) + 1;
  if (!neu) spiel.muenzen += 200 + m.stufe * 20;   // doppelte Karte: wird verkauft
  if (typeof melde === "function") melde(neu ? `🃏 Neue Sammelkarte: ${m.name.replaceAll("­", "")}!` : `🃏 Doppelte Karte ${m.name.replaceAll("­", "")} – verkauft`, neu ? "gross" : "");
  return m.id;
}
function kartenBonus(art) { return KARTEN_ALBEN.filter(a => a.bonus[0] === art && albumVoll(a)).reduce((s, a) => s + a.bonus[1], 0) / 100; }
function zeigeKarten() {
  $("kochbuchInhalt").innerHTML = `<div class="zirkusKopf"><span>🃏</span><h2>Sammelkarten</h2><small><b>${ALLE_KARTEN.filter(karteDa).length}</b> von ${ALLE_KARTEN.length} Karten</small></div>
    <p class="hinweis">Monster lassen manchmal eine Karte fallen – Chefs öfter. Ist ein Album voll, gibt es einen Bonus für immer. Doppelte Karten werden automatisch verkauft.</p>
    ${KARTEN_ALBEN.map(a => `<div class="kochSeite${albumVoll(a) ? " voll" : ""}"><h3>${a.icon} ${a.name} <small>${a.monster.filter(karteDa).length} / ${a.monster.length}</small></h3>
      <div class="kartenRaster">${a.monster.map(id => { const m = MONSTER[id];
        return karteDa(id) ? `<span class="sammelKarte${m.chef ? " chef" : ""}">${monsterSvg(m.aussehen)}<small>${m.name.replaceAll("­", "")}</small></span>` : `<span class="sammelKarte zu">❔<small>???</small></span>`; }).join("")}</div>
      <p class="hinweis">${albumVoll(a) ? "✅" : "🔒"} Volles Album: <b>${BONUS_TEXT[a.bonus[0]](a.bonus[1])}</b></p></div>`).join("")}`;
  $("kochbuchOverlay").hidden = false;
}
erfolg({ id: "karten-1", icon: "🃏", name: "Erste Karte", text: "Finde deine erste Sammelkarte", ziel: 1, muenzen: 3000, wert: () => ALLE_KARTEN.filter(karteDa).length });
erfolg({ id: "karten-alle", icon: "🃏", name: "Kartenkönigin", text: "Sammle alle Sammelkarten", ziel: ALLE_KARTEN.length, muenzen: 5000000, wert: () => ALLE_KARTEN.filter(karteDa).length });

// ===================== 📸 FOTOALBUM =====================
// Besondere Momente werden zu gemalten Bildern. spiel.album = { fotoId: Zeitpunkt }
const fotoBild = (farben, emojis) => `<svg viewBox="0 0 160 100"><defs><linearGradient id="fb${farben[0].slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${farben[0]}"/><stop offset="1" stop-color="${farben[1]}"/></linearGradient></defs>
  <rect width="160" height="100" rx="10" fill="url(#fb${farben[0].slice(1)})"/><ellipse cx="80" cy="102" rx="100" ry="22" fill="${farben[2] || "#a8e08f"}"/>
  ${emojis.map((e, i) => emojiText(e, 30 + i * (100 / Math.max(1, emojis.length - 1 || 1)), 48 + (i % 2) * 8, i === 0 ? 34 : 26)).join("")}</svg>`;
const besiegtIrgendwo = ids => ids.some(id => (spiel.besiegt?.[id] || 0) > 0);
const FOTOS = [
  { id: "start", titel: "Der allererste Tag", bild: ["#d6ecff", "#fff0f8"], emojis: ["🌳", "🌿"], ok: () => (spiel.statistik.aktionen || 0) >= 1 },
  { id: "monster", titel: "Das erste Monster schläft", bild: ["#e8f8e8", "#fff8d6"], emojis: ["💤", "🌼"], ok: () => (spiel.statistik.besiegt || 0) >= 1 },
  ...GEBIETE.map(g => { const c = g.monster.find(m => m.chef); return { id: `chef-${g.id}`, titel: `${c.name.replaceAll("­", "")} schläft!`, bild: ["#fff4dc", g.farbe], emojis: [g.icon, "🏆"], ok: () => besiegtIrgendwo([c.id]) }; }),
  { id: "tier", titel: "Ein neuer Freund", bild: ["#fff0f8", "#ffe0f0"], emojis: ["🐾", "💖"], ok: () => (spiel.haustiere || []).length >= 1 },
  { id: "tiere10", titel: "Zehn Freunde", bild: ["#f0f8ff", "#e6f4ff"], emojis: ["🐶", "🐱", "🐰"], ok: () => (spiel.haustiere || []).length >= 10 },
  { id: "zucht", titel: "Es ist geschlüpft!", bild: ["#fff8e6", "#fff0d6"], emojis: ["🥚", "✨"], ok: () => (spiel.haustiere || []).some(id => id.startsWith("zucht")) },
  { id: "truhe", titel: "Die erste Schatztruhe", bild: ["#fff3c4", "#ffe08a"], emojis: ["🧰", "💰"], ok: () => (spiel.statistik.truhen || 0) >= 1 },
  { id: "verlies", titel: "Raus aus dem Verlies", bild: ["#e6e0f0", "#c9b8e8"], emojis: ["🏰", "🔥"], ok: () => (spiel.statistik.verliese || 0) >= 1 },
  { id: "s50", titel: "Halbe Meisterin", bild: ["#e8f6ff", "#fff"], emojis: ["⭐", "📈"], ok: () => FERTIGKEITEN.some(f => stufe(f.id) >= 50) },
  { id: "s99", titel: "Stufe 99!", bild: ["#fff3c4", "#ffd54f"], emojis: ["👑", "🎉"], ok: () => FERTIGKEITEN.some(f => stufe(f.id) >= 99) },
  { id: "g500", titel: "Gesamtstufe 500", bild: ["#efe6ff", "#d9c8ff"], emojis: ["🌟", "🏅"], ok: () => gesamtStufe() >= 500 },
  { id: "g1000", titel: "Gesamtstufe 1.000", bild: ["#ffe0f0", "#ffb3d1"], emojis: ["🏆", "🌈"], ok: () => gesamtStufe() >= 1000 },
  { id: "kuchen", titel: "Frisch gebacken", bild: ["#fff0e6", "#ffd9b8"], emojis: ["🎂", "🍰"], ok: () => (spiel.statistik.kuchen || 0) >= 1 },
  { id: "baumhaus", titel: "Mein Baumhaus", bild: ["#d6ecff", "#e8f8e8"], emojis: ["🏡", "🌳"], ok: () => BAUPLAETZE.every(p => (spiel.baumhaus?.[p.id] || 0) > 0) },
  { id: "dorf", titel: "Willkommen im Dorf", bild: ["#fff4dc", "#e8f8e8"], emojis: ["🏘️", "🧚"], ok: () => !!spiel.dorf },
  { id: "karte", titel: "Die geheime Insel", bild: ["#ffd6f0", "#d6ecff"], emojis: ["🗺️", "🌈"], ok: () => !!spiel.karte?.offen?.["0,0"] },
  { id: "regenbogen", titel: "Ein Regenbogen am Himmel", bild: ["#d6ecff", "#fff0f8"], emojis: ["🌈", "☀️"], ok: () => (spiel.statistik.regenbogen || 0) >= 1 },
  { id: "zirkus", titel: "Manege frei!", bild: ["#fff0f0", "#ffd6d6"], emojis: ["🎪", "🎈"], ok: () => (spiel.zirkus?.tickets || 0) > 0 || Object.keys(spiel.zirkus?.geholt || {}).length > 0 },
  { id: "kochbuch", titel: "Eine volle Kochbuch-Seite", bild: ["#fff8e6", "#f6e3c8"], emojis: ["📖", "🍳"], ok: () => typeof KOCHBUCH_SEITEN !== "undefined" && KOCHBUCH_SEITEN.some(seiteVoll) },
  { id: "karte1", titel: "Die erste Sammelkarte", bild: ["#e8f0ff", "#d6e4ff"], emojis: ["🃏", "⭐"], ok: () => ALLE_KARTEN.some(karteDa) },
  { id: "angel", titel: "Petri Heil!", bild: ["#dff6fb", "#9ad8f5"], emojis: ["🎣", "🐟"], ok: () => (spiel.angel?.rekord || 0) > 0 },
  { id: "boss", titel: "Gemeinsam stark", bild: ["#efe6ff", "#c9b8ff"], emojis: ["🐉", "🤝"], ok: () => Object.keys(spiel.gemeinschaft?.belohnt || {}).length > 0 },
  { id: "finale", titel: "Die Farben sind zurück", bild: ["#bfe6ff", "#ffe9f3"], emojis: ["🌈", "👑"], ok: () => (spiel.pfade?.["p-gipfel"] || 0) > 0 },
  { id: "prestige", titel: "Ein neues Abenteuer", bild: ["#fff8e0", "#ffd54f"], emojis: ["⭐", "🌟"], ok: () => (spiel.prestige || 0) >= 1 },
];
function pruefeAlbum() {
  spiel.album = spiel.album || {};
  const neu = [];
  for (const f of FOTOS) { try { if (!spiel.album[f.id] && f.ok()) { spiel.album[f.id] = Date.now(); neu.push(f); } } catch (e) { /* noch nicht prüfbar */ } }
  return neu;
}
function zeigeAlbum() {
  const da = FOTOS.filter(f => spiel.album?.[f.id]);
  $("kochbuchInhalt").innerHTML = `<div class="zirkusKopf"><span>📸</span><h2>Fotoalbum</h2><small><b>${da.length}</b> von ${FOTOS.length} Fotos</small></div>
    <p class="hinweis">Besondere Momente landen hier ganz von allein als Bild.</p>
    <div class="albumRaster">${[...FOTOS].sort((a, b) => (spiel.album?.[b.id] ? 1 : 0) - (spiel.album?.[a.id] ? 1 : 0)).map(f => spiel.album?.[f.id]
      ? `<figure class="foto">${fotoBild(f.bild, f.emojis)}<figcaption><b>${f.titel}</b><small>${new Date(spiel.album[f.id]).toLocaleDateString("de-DE")}</small></figcaption></figure>`
      : `<figure class="foto zu"><div class="fotoLeer">❔</div><figcaption><b>???</b></figcaption></figure>`).join("")}</div>`;
  $("kochbuchOverlay").hidden = false;
}
erfolg({ id: "album-10", icon: "📸", name: "Fotografin", text: "Sammle 10 Fotos im Album", ziel: 10, muenzen: 50000, wert: () => Object.keys(spiel.album || {}).length });
erfolg({ id: "album-alle", icon: "📸", name: "Volles Album", text: `Sammle alle ${FOTOS.length} Fotos`, ziel: FOTOS.length, muenzen: 3000000, wert: () => Object.keys(spiel.album || {}).length });

// ===================== VERDRAHTUNG =====================
function extras3Bonus(art) { return dekoBonus(art) + kartenBonus(art); }
function richteExtras3Ein() {
  $("albumKnopf")?.addEventListener("click", () => { ton.klick(); zeigeAlbum(); });
  $("kartenKnopf")?.addEventListener("click", () => { ton.klick(); zeigeKarten(); });
  pruefeAlbum();
  jedeSekunde(() => {
    for (const f of pruefeAlbum()) { ton.stufe(); melde(`📸 Neues Foto im Album: „${f.titel}“`, "gross"); }
  }, 5);
}
function heuteExtras3(dazu, geh) {
  const zurueck = Object.keys(ausfluege()).filter(ausflugZurueck).length;
  if (zurueck) dazu("ausflug", "🎒", `${zurueck} Haustier${zurueck === 1 ? " ist" : "e sind"} vom Ausflug zurück`, geh({ seite: "seiteIch", ichTab: "tiere", ziel: "#tierExtras" }));
  const streichelbar = (spiel.haustiere || []).filter(darfGestreicheltWerden).length;
  if (streichelbar >= 2) dazu("alleStreicheln", "🐾", `Alle streicheln (${streichelbar})`, geh({ seite: "seiteIch", ichTab: "tiere", ziel: "#alleStreicheln" }));
}

