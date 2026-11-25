"use strict";
// =====================================================
//  NEUE INHALTE – Logik und Anzeige (v1.32)
//  🍰 Kuchen essen · 🥚 Haustier-Zucht · 🎪 Wanderzirkus (2. Wochenende im Monat)
//  ⭐ Prestige „Neues Abenteuer" (10 Stufen) · 🏰 Verliese (einmal am Tag)
//  Daten der Fertigkeit, Mischtiere und Verliese: daten-extras.js
// =====================================================

// ===================== SPIND-TEILE (hinten an die Listen!) =====================
const quelle = (kurz, lang) => ({ kurz, lang });
HUETE.push({ id: "hd1", name: "Kobold-Mütze", icon: "🔥", quelle: quelle("🏰 Kobold-Keller", "🏰 Die Kobold-Mütze liegt manchmal in der Truhe vom Kobold-Keller (Verlies)"),
  svg: `<path d="M24 32Q20 6 54 -4Q50 14 76 32Z" fill="#8fbf5a" stroke="#5a8a3a" stroke-width="2" stroke-linejoin="round"/><rect x="22" y="26" width="56" height="8" rx="4" fill="#c98a5a"/><circle cx="54" cy="-4" r="5" fill="#ffd27a"/>` });
KLEIDUNG.push({ id: "kd1", name: "Drachenschuppen-Pulli", icon: "🐉", quelle: quelle("🏰 Drachengruft", "🏰 Der Drachenschuppen-Pulli liegt manchmal in der Truhe der Drachengruft (Verlies)"),
  svg: () => kleidSvg("#d9583a", [80, 86, 92, 98].map((y, i) => [16, 26, 36, 46, 56, 66, 76, 86].map(x => `<path d="M${x + (i % 2) * 5 - 5} ${y}Q${x + (i % 2) * 5} ${y + 6} ${x + (i % 2) * 5 + 5} ${y}" fill="none" stroke="#a8392a" stroke-width="1.6"/>`).join("")).join(""), "#ffd27a") });
RAHMEN.push({ id: "rd1", name: "Sternenturm-Rahmen", icon: "🌌", quelle: quelle("🏰 Sternenturm", "🏰 Der Sternenturm-Rahmen liegt manchmal in der Truhe vom Sternenturm (Verlies)"),
  svg: ring("#3b3f8f", 5, ringPunkte(8).map(([x, y]) => stern(x, y, 4, "#ffd54f")).join("")) });
HUETE.push({ id: "hz1", name: "Zirkus-Zylinder", icon: "🎪", quelle: quelle("🎪 Zirkus", "🎪 Den Zirkus-Zylinder gibt es im Zirkus-Laden (2. Wochenende im Monat)"),
  svg: `<ellipse cx="50" cy="28" rx="30" ry="6" fill="#3a2f4a"/><rect x="34" y="0" width="32" height="28" rx="3" fill="#e8453a" stroke="#8a1f1a" stroke-width="2"/><rect x="34" y="18" width="32" height="5" fill="#ffd54f"/>${stern(50, 10, 4, "#ffd54f")}` });
KLEIDUNG.push({ id: "kz1", name: "Zirkusdirektor-Jacke", icon: "🎪", quelle: quelle("🎪 Zirkus", "🎪 Die Zirkusdirektor-Jacke gibt es im Zirkus-Laden (2. Wochenende im Monat)"),
  svg: () => kleidSvg("#e8453a", streifen("#ffd54f") + `<circle cx="44" cy="90" r="2" fill="#ffd54f"/><circle cx="56" cy="90" r="2" fill="#ffd54f"/>`, "#ffd54f") });
RAHMEN.push({ id: "rz1", name: "Zirkus-Rahmen", icon: "🎈", quelle: quelle("🎪 Zirkus", "🎪 Den Zirkus-Rahmen gibt es im Zirkus-Laden (2. Wochenende im Monat)"),
  svg: emojiRahmen("#e8453a", ["🎈", "⭐"]) });
const PRESTIGE_FARBEN = ["#c9a27a", "#9aa3b5", "#f5b942", "#7ad7f0", "#8fcf6a", "#b48cff", "#ff7eb6", "#e8453a", "#3b3f8f", "#ffd54f"];
for (let n = 1; n <= 10; n++) RAHMEN.push({ id: `rx${n}`, name: `Prestige-Rahmen ${n}`, icon: "⭐", prestige: n,
  quelle: quelle(`⭐ Prestige ${n}`, `⭐ Den Prestige-Rahmen ${n} bekommst du mit Prestige-Stufe ${n} (Ich → Optionen)`),
  svg: ring(PRESTIGE_FARBEN[n - 1], 5, ringPunkte(n).map(([x, y]) => stern(x, y, 4.5, n === 10 ? "#ff5fa2" : "#ffd54f")).join("")) });

// ===================== BONI (stecken in sternGold -> baumhausBonus) =====================
function zusatzAllgemein(art) { return kuchenBonus(art) + prestigeBonus(art); }

// ===================== 🍰 KUCHEN =====================
const aktiverKuchen = () => (spiel.kuchen && spiel.kuchen.bis > Date.now() ? KUCHEN.find(k => k.id === spiel.kuchen.id) : null);
function kuchenBonus(art) { const k = aktiverKuchen(); return k && k.art === art ? k.wert / 100 : 0; }
function isskuchen(id) {
  const k = GEGENSTAENDE[id]?.kuchen;
  if (!k || anzahl(id) < 1) return false;
  nimmAusBank(id, 1);
  spiel.kuchen = { id, bis: Date.now() + k.stunden * 3600000 };
  spiel.statistik.kuchen = (spiel.statistik.kuchen || 0) + 1;
  return true;
}
function kuchenRestText() {
  const ms = (spiel.kuchen?.bis || 0) - Date.now(), min = Math.max(1, Math.ceil(ms / 60000));
  return min >= 60 ? `${Math.floor(min / 60)} Std. ${min % 60} Min.` : `${min} Min.`;
}
function kuchenChip() {
  const k = aktiverKuchen();
  return k ? `<span class="trankChip kuchenChip" title="${k.text}">${symbolHtml(k.id, "mini")} ${k.text} <b>${kuchenRestText()}</b></span>` : "";
}
function gegenstandExtra(id) {
  const k = GEGENSTAENDE[id]?.kuchen;
  if (!k) return "";
  const an = aktiverKuchen();
  return `<p class="hinweis">🍰 ${k.text} · wirkt ${k.stunden} Stunden${an ? ` · gerade wirkt: ${an.name} (noch ${kuchenRestText()}) – ein neuer Kuchen ersetzt ihn` : ""}</p>
    <button type="button" class="knopf" id="kuchenEssen">🍰 Essen</button>`;
}
function gegenstandExtraVerdrahten(inhalt, id) {
  inhalt.querySelector("#kuchenEssen")?.addEventListener("click", () => {
    if (!isskuchen(id)) return;
    ton.stufe(); melde(`🍰 Lecker! ${GEGENSTAENDE[id].kuchen.text} für ${GEGENSTAENDE[id].kuchen.stunden} Stunden`, "gross");
    speichern(); zeichneTrankLeiste(); zeichneSeite(); zeigeGegenstand(id);
  });
}

// ===================== 🥚 HAUSTIER-ZUCHT =====================
const zuchtFaehig = id => hatHaustier(id) && tierStufe(id) >= PFLEGE.maxStufe;
const zuchtBereit = () => !!spiel.zucht && spiel.zucht.bis <= Date.now();
let zuchtWahl = [];
function starteZucht(a, b) {
  if (spiel.zucht || a === b || !zuchtFaehig(a) || !zuchtFaehig(b)) return false;
  const tier = mischtierFuer(HAUSTIERE.find(h => h.id === a), HAUSTIERE.find(h => h.id === b));
  spiel.zucht = { a, b, tier: tier.id, bis: Date.now() + ZUCHT.stunden * 3600000 };
  return true;
}
function schluepfen() {
  if (!zuchtBereit()) return null;
  const tier = HAUSTIERE.find(h => h.id === spiel.zucht.tier);
  spiel.zucht = null;
  spiel.statistik.gezuechtet = (spiel.statistik.gezuechtet || 0) + 1;
  if (gibHaustier(tier)) return { tier };
  spiel.muenzen += ZUCHT.schonDaMuenzen;
  return { tier, schonDa: true };
}
function zeichneBrutnest() {
  const ziel = $("brutnest");
  if (!ziel) return;
  const faehig = (spiel.haustiere || []).filter(zuchtFaehig).map(id => HAUSTIERE.find(h => h.id === id)).filter(Boolean);
  let html = `<h3>🥚 Brutnest <small>Haustier-Zucht</small></h3>`;
  if (spiel.zucht) {
    const z = spiel.zucht, t = HAUSTIERE.find(h => h.id === z.tier), kennt = hatHaustier(t.id);
    const rest = Math.max(0, z.bis - Date.now()), std = Math.floor(rest / 3600000), min = Math.ceil(rest % 3600000 / 60000);
    html += `<p class="hinweis">${HAUSTIERE.find(h => h.id === z.a)?.emoji} + ${HAUSTIERE.find(h => h.id === z.b)?.emoji} → 🥚 ${kennt ? `${t.emoji} ${t.name}` : "Was schlüpft wohl?"}</p>`
      + (zuchtBereit() ? `<button type="button" class="knopf kaufen" id="schluepfen">🥚 Schlüpfen lassen!</button>`
        : `<p class="hinweis">⏳ Das Ei schlüpft in ${std ? `${std} Std. ` : ""}${min} Min. – auch wenn das Spiel zu ist.</p>`);
  } else if (faehig.length < 2) {
    html += `<p class="hinweis">Bring zwei Haustiere auf Pflege-Stufe ${PFLEGE.maxStufe} (streicheln und füttern). Dann können sie zusammen ein Ei bekommen – daraus schlüpft eins von ${MISCHTIERE.length} seltenen Mischtieren!</p>`;
  } else {
    zuchtWahl = zuchtWahl.filter(id => faehig.some(h => h.id === id));
    const vorschau = zuchtWahl.length === 2 ? mischtierFuer(...zuchtWahl.map(id => HAUSTIERE.find(h => h.id === id))) : null;
    html += `<p class="hinweis">Wähle zwei Haustiere (Stufe ${PFLEGE.maxStufe}). Nach ${ZUCHT.stunden} Stunden schlüpft ein Mischtier – welches, hängt von den Eltern ab.</p>
      <div class="zuchtWahl">${faehig.map(h => `<button type="button" class="zuchtTier${zuchtWahl.includes(h.id) ? " an" : ""}" data-id="${h.id}"><span>${h.emoji}</span><small>${h.name}</small></button>`).join("")}</div>
      ${vorschau ? `<p class="hinweis">🥚 Daraus wird: <b>${hatHaustier(vorschau.id) ? `${vorschau.emoji} ${vorschau.name}` : "❔ ein Mischtier, das du noch nicht hast"}</b></p>` : ""}
      <button type="button" class="knopf kaufen" id="zuchtStart" ${zuchtWahl.length === 2 ? "" : "disabled"}>🥚 Ins Brutnest setzen</button>`;
  }
  html += `<p class="hinweis">Mischtiere: ${(spiel.haustiere || []).filter(id => id.startsWith("zucht")).length} / ${MISCHTIERE.length}</p>`;
  ziel.innerHTML = html;
  for (const b of ziel.querySelectorAll(".zuchtTier")) b.addEventListener("click", () => {
    ton.klick();
    const id = b.dataset.id;
    zuchtWahl = zuchtWahl.includes(id) ? zuchtWahl.filter(x => x !== id) : [...zuchtWahl, id].slice(-2);
    zeichneBrutnest();
  });
  $("zuchtStart")?.addEventListener("click", () => {
    if (!starteZucht(...zuchtWahl)) return;
    ton.stufe(); melde("🥚 Ein Ei liegt im Brutnest!", "gross"); zuchtWahl = []; speichern(); zeichneBrutnest();
  });
  $("schluepfen")?.addEventListener("click", () => {
    const e = schluepfen();
    if (!e) return;
    speichern();
    if (e.schonDa) { ton.muenze(); melde(`🥚 Noch ein ${e.tier.name}! Es zieht zu Freunden – du bekommst ${zahl(ZUCHT.schonDaMuenzen)} Münzen`, "gross"); }
    else zeigeHaustierFund(e.tier);
    zeichneKopf(); zeichneSeite();
  });
}

// ===================== 🎪 WANDERZIRKUS =====================
// Am 2. Wochenende jedes Monats (Samstag + Sonntag). Aufgaben bringen Zirkus-Tickets, damit kauft man im Zirkus-Laden.
function zirkusAktiv(d = new Date(Date.now())) {
  const t = d.getDate(), w = d.getDay();
  return (w === 6 && t >= 8 && t <= 14) || (w === 0 && t >= 9 && t <= 15);
}
const zirkusId = (d = new Date(Date.now())) => `${d.getFullYear()}-${d.getMonth() + 1}`;
const ZIRKUS_AUFGABEN = [
  { id: "arbeit", icon: "🛠️", text: "Erledige 300 Tätigkeiten", ziel: 300, wert: () => spiel.statistik.aktionen || 0, tickets: 15 },
  { id: "monster", icon: "⚔️", text: "Lass 100 Monster einschlafen", ziel: 100, wert: () => spiel.statistik.besiegt || 0, tickets: 15 },
  { id: "ernte", icon: "🧺", text: "Ernte 15 Beete", ziel: 15, wert: () => spiel.statistik.geerntet || 0, tickets: 15 },
  { id: "kuchen", icon: "🍰", text: "Iss einen Kuchen", ziel: 1, wert: () => spiel.statistik.kuchen || 0, tickets: 10 },
];
const ZIRKUS_LADEN = [
  { id: "hz1", name: "Zirkus-Zylinder", icon: "🎪", preis: 40, teil: true },
  { id: "kz1", name: "Zirkusdirektor-Jacke", icon: "🎪", preis: 40, teil: true },
  { id: "rz1", name: "Zirkus-Rahmen", icon: "🎈", preis: 40, teil: true },
  { id: "pony", name: "Zirkuspony Konfetti (Haustier)", icon: "🐴", preis: 120, tier: "konfetti" },
  { id: "trank", name: "5 Glücks-Tränke", icon: "🧪", preis: 20, sachen: { trank7: 5 } },
  { id: "kuchen", name: "3 Regenbogen-Torten", icon: "🎂", preis: 25, sachen: { kuchen7: 3 } },
  { id: "muenzen", name: "100.000 Münzen", icon: "🪙", preis: 15, muenzen: 100000 },
];
HAUSTIERE.push({ id: "konfetti", name: "Konfetti", tier: "Zirkuspony", emoji: "🐴", quelle: "🎪 Im Zirkus-Laden (2. Wochenende im Monat)", bonus: { art: "xp", wert: 0.03 }, text: "+3 % Erfahrung bei allem" });
function zirkus() {
  spiel.zirkus = spiel.zirkus || { tickets: 0, id: "", start: {}, geholt: {} };
  const z = spiel.zirkus;
  if (zirkusAktiv() && z.id !== zirkusId()) { z.id = zirkusId(); z.geholt = {}; z.start = Object.fromEntries(ZIRKUS_AUFGABEN.map(a => [a.id, a.wert()])); }
  return z;
}
const zirkusStand = a => Math.min(a.ziel, a.wert() - (zirkus().start[a.id] ?? a.wert()));
const zirkusAbholbar = () => zirkusAktiv() && ZIRKUS_AUFGABEN.some(a => !zirkus().geholt[a.id] && zirkusStand(a) >= a.ziel);
function zirkusKaufen(w) {
  const z = zirkus();
  if (z.tickets < w.preis) return false;
  if (w.teil) { if (besitztTeil(teilNachId(w.id))) return false; gibTeil(w.id); }
  else if (w.tier) { if (hatHaustier(w.tier)) return false; gibHaustier(HAUSTIERE.find(h => h.id === w.tier)); }
  else if (w.sachen) for (const [id, n] of Object.entries(w.sachen)) gibInBank(id, n);
  else if (w.muenzen) spiel.muenzen += w.muenzen;
  z.tickets -= w.preis;
  return true;
}
let zirkusKarteText = "";
function zeichneZirkusKarte() {
  const k = $("zirkusKarte");
  if (!k) return;
  const z = zirkus(), an = zirkusAktiv();
  k.hidden = !an && !z.tickets;
  const html = an ? `<span class="gkIcon">🎪</span><span class="gkText"><b>Der Wanderzirkus ist da!</b><small>🎟️ ${z.tickets} Tickets · ${zirkusAbholbar() ? "Belohnung abholen!" : "Aufgaben und Zirkus-Laden"}</small></span><span class="gkLos">Hin!</span>`
    : `<span class="gkIcon">🎪</span><span class="gkText"><b>Zirkus-Laden</b><small>🎟️ ${z.tickets} Tickets · der Zirkus kommt am 2. Wochenende im Monat</small></span>`;
  if (html !== zirkusKarteText) { zirkusKarteText = html; k.innerHTML = html; }
}
function zeigeZirkus() {
  const z = zirkus(), an = zirkusAktiv();
  $("zirkusInhalt").innerHTML = `<div class="zirkusKopf"><span>🎪</span><h2>Der Wanderzirkus</h2><small>🎟️ <b>${z.tickets}</b> Tickets</small></div>
    ${an ? `<h3>🎯 Aufgaben an diesem Wochenende</h3><ul class="offlineListe">${ZIRKUS_AUFGABEN.map(a => {
      const st = zirkusStand(a), fertig = st >= a.ziel, geholt = z.geholt[a.id];
      return `<li>${a.icon} <span class="rkName">${a.text} <small class="sanft">${zahl(st)} / ${zahl(a.ziel)}</small></span>${geholt ? "✅" : fertig ? `<button type="button" class="knopf kaufen zirkusHolen" data-id="${a.id}">🎟️ +${a.tickets}</button>` : `<small>🎟️ ${a.tickets}</small>`}</li>`;
    }).join("")}</ul>` : `<p class="hinweis">Der Zirkus ist gerade weitergezogen. Er kommt am 2. Wochenende jedes Monats wieder – Tickets bleiben dir!</p>`}
    <h3>🛒 Zirkus-Laden</h3><ul class="offlineListe">${ZIRKUS_LADEN.map(w => {
      const hat = (w.teil && besitztTeil(teilNachId(w.id))) || (w.tier && hatHaustier(w.tier));
      return `<li>${w.icon} <span class="rkName">${w.name}</span>${hat ? "✅" : `<button type="button" class="knopf kaufen zirkusKauf" data-id="${w.id}" ${z.tickets >= w.preis ? "" : "disabled"}>🎟️ ${w.preis}</button>`}</li>`;
    }).join("")}</ul>`;
  $("zirkusOverlay").hidden = false;
  for (const b of $("zirkusInhalt").querySelectorAll(".zirkusHolen")) b.addEventListener("click", () => {
    const a = ZIRKUS_AUFGABEN.find(x => x.id === b.dataset.id);
    if (z.geholt[a.id] || zirkusStand(a) < a.ziel) return;
    z.geholt[a.id] = true; z.tickets += a.tickets; ton.muenze(); speichern(); zeigeZirkus(); zeichneZirkusKarte();
  });
  for (const b of $("zirkusInhalt").querySelectorAll(".zirkusKauf")) b.addEventListener("click", () => {
    const w = ZIRKUS_LADEN.find(x => x.id === b.dataset.id);
    if (!zirkusKaufen(w)) { ton.nein(); return; }
    ton.stufe(); melde(`🎪 ${w.name} gekauft!`, "gross"); speichern(); zeichneKopf(); zeigeZirkus(); zeichneZirkusKarte();
  });
}

// ===================== ⭐ PRESTIGE „NEUES ABENTEUER" =====================
// Nach 100 % (bzw. ab Prestige 2 mit hoher Gesamtstufe) fängt man freiwillig neu an – mit Boni für immer.
const PRESTIGE = { max: 10, xp: 0.1, muenzen: 0.1, offline: 1, bank: 5 };
const prestigeStufe = () => spiel.prestige || 0;
function prestigeBonus(art) {
  const n = prestigeStufe();
  return n * ({ xp: PRESTIGE.xp, muenzen: PRESTIGE.muenzen, offline: PRESTIGE.offline, bank: PRESTIGE.bank }[art] || 0);
}
// Was braucht die nächste Prestige-Stufe?
function prestigeBedingung(n = prestigeStufe() + 1) {
  if (n === 1) return { text: "100 % Fortschritt", ok: () => spielFortschritt() >= 100, stand: () => fortschrittText(spielFortschritt()) };
  const ziel = 1000 + (n - 2) * 175;
  return { text: `Gesamtstufe ${zahl(ziel)}`, ok: () => gesamtStufe() >= ziel, stand: () => `Gesamtstufe ${zahl(gesamtStufe())}` };
}
// Was bleibt beim Neuanfang erhalten?
const PRESTIGE_BEHALTEN = ["figur", "aussehen", "garderobe", "haustiere", "tierPflege", "begleiter", "erfolge", "season", "gluecksrad", "zirkus", "advent",
  "statistik", "mitglied", "einfuehrung", "turnenIntro", "sternIntro", "karteIntro", "jagdIntro", "grabenIntro", "freundeIntro", "feuerIntro", "dorfIntro", "finale", "prestige"];
function machePrestige() {
  const n = prestigeStufe() + 1;
  if (n > PRESTIGE.max || !prestigeBedingung(n).ok()) return false;
  const neu = neuerSpielstand();
  for (const k of PRESTIGE_BEHALTEN) if (spiel[k] !== undefined) neu[k] = spiel[k];
  neu.prestige = n;
  neu.garderobe = [...new Set([...(neu.garderobe || []), `rx${n}`])];
  neu.aussehen = { ...(neu.aussehen || {}), rahmen: `rx${n}` };
  neu.muenzen = 1000 * n;   // ein kleines Startgeld
  spiel = neu;
  speichern();
  return true;
}
function zeichnePrestige() {
  const ziel = $("prestigeKarte");
  if (!ziel) return;
  const n = prestigeStufe(), b = n < PRESTIGE.max ? prestigeBedingung(n + 1) : null;
  ziel.innerHTML = `<h3>⭐ Prestige: Neues Abenteuer ${n ? `<small>Stufe ${n} / ${PRESTIGE.max}</small>` : ""}</h3>
    ${n ? `<p class="hinweis">Deine Boni für immer: <b>+${Math.round(prestigeBonus("xp") * 100)} % Erfahrung</b>, <b>+${Math.round(prestigeBonus("muenzen") * 100)} % Münzen</b> von Monstern, <b>+${prestigeBonus("offline")} Std.</b> Offline-Zeit und <b>+${prestigeBonus("bank")}</b> Bankfächer.</p>` : ""}
    ${b ? `<p class="hinweis">Für Prestige ${n + 1} brauchst du: <b>${b.text}</b> (jetzt: ${b.stand()}). Dann fängst du ganz von vorn an – Fertigkeiten, Bank, Münzen, Aufträge, Garten, Baumhaus und Dorf beginnen neu.
      <b>Du behältst:</b> Haustiere, Kleiderschrank, Erfolge, Season und Statistik – und bekommst je Stufe +${Math.round(PRESTIGE.xp * 100)} % Erfahrung, +${Math.round(PRESTIGE.muenzen * 100)} % Münzen, +${PRESTIGE.offline} Std. Offline-Zeit, +${PRESTIGE.bank} Bankfächer und einen Prestige-Rahmen.</p>
      <button type="button" class="knopf ${b.ok() ? "kaufen" : "leise"}" id="prestigeLos" ${b.ok() ? "" : "disabled"}>⭐ Prestige ${n + 1} starten</button>`
      : `<p class="hinweis">👑 Du hast die höchste Prestige-Stufe erreicht!</p>`}`;
  $("prestigeLos")?.addEventListener("click", () => {
    frage(`⭐ Prestige ${n + 1}?`, `Wirklich ganz von vorn anfangen? Fertigkeiten, Bank, Münzen und fast alles andere beginnen neu. Haustiere, Kleiderschrank und Erfolge bleiben – und du wirst für immer stärker.<br><br>Tipp: Sichere vorher deinen Spielstand als Code!`,
      "⭐ Ja, neues Abenteuer!", () => { if (machePrestige()) { melde(`⭐ Prestige ${prestigeStufe()}! Ein neues Abenteuer beginnt.`, "gross"); setTimeout(() => location.reload(), 900); } });
  });
}

// ===================== 🏰 VERLIESE =====================
const pfadNachId = id => PFADE.find(p => p.id === id) || DUNGEONS.find(d => d.id === id) || null;
function verliesHeute() {
  spiel.verlies = spiel.verlies || { tag: "", geschafft: {} };
  if (spiel.verlies.tag !== tagText()) spiel.verlies = { tag: tagText(), geschafft: {} };
  return spiel.verlies;
}
const verliesFrei = d => kampfStufe() >= d.ab;
const verliesGeschafft = d => !!verliesHeute().geschafft[d.id];
// Am Ende eines Verlieses (aus pfadWeiter in kampf.js): große Truhe, dann ist für heute Schluss
function verliesEnde(d, ergebnis) {
  verliesHeute().geschafft[d.id] = true;
  spiel.statistik.verliese = (spiel.statistik.verliese || 0) + 1;
  spiel.statistik.truhen = (spiel.statistik.truhen || 0) + 1;
  const inhalt = { pfad: d, muenzen: Math.round(zufallAus(d.truhe.muenzen) * (1 + baumhausBonus("muenzen"))), sachen: {} };
  spiel.muenzen += inhalt.muenzen;
  for (const s of d.truhe.sachen) { const n = zufallAus(s.anzahl); gibInBank(s.id, n); zaehle(s.id, n); inhalt.sachen[s.id] = n; }
  if (!(spiel.garderobe || []).includes(d.teil.id) && Math.random() < VERLIES_REGEL.teilChance) { gibTeil(d.teil.id); inhalt.rahmen = d.teil.id; }
  if (!hatHaustier("gruftie") && Math.random() < VERLIES_REGEL.tierChance * (1 + baumhausBonus("tier"))) inhalt.haustier = gibHaustier(HAUSTIERE.find(h => h.id === "gruftie"));
  ergebnis.ereignisse.push({ truhe: inhalt });
  logge(`🏰 ${d.name} geschafft! Die Verlies-Truhe gehört dir. Morgen kannst du wieder rein.`);
  spiel.aktiv = null;
}
function dungeonHtml() {
  return `<h3 class="rasterTitel">🏰 Verliese <small>jedes einmal am Tag</small></h3><div class="pfadListe">${DUNGEONS.map(d => {
    const frei = verliesFrei(d), fertig = verliesGeschafft(d), laeuft = spiel.aktiv?.pfad?.id === d.id;
    return `<button type="button" class="pfadKarte dungeonKarte${frei && !fertig ? "" : " zu"}${laeuft ? " aktiv" : ""}" data-dungeon="${d.id}" style="--farbe:${d.farbe}">
      <span class="pfadIcon">${d.icon}</span><span class="pfadText"><b>${d.name}</b><small>${!frei ? `🔒 ab Kampfstufe ${d.ab}` : fertig ? "✅ Heute geschafft – morgen wieder" : laeuft ? "⚔️ Du bist gerade drin!" : `5 Räume + ${wName ? MONSTER[d.chef].name.replaceAll("­", "") : ""} · große Truhe`}</small></span></button>`;
  }).join("")}</div>`;
}
function verdrahteDungeons(seite) {
  for (const b of seite.querySelectorAll(".dungeonKarte")) b.addEventListener("click", () => {
    const d = DUNGEONS.find(x => x.id === b.dataset.dungeon);
    if (!verliesFrei(d)) { ton.nein(); melde(`🔒 ${d.name} öffnet sich ab Kampfstufe ${d.ab}`); return; }
    if (verliesGeschafft(d)) { ton.nein(); melde(`✅ ${d.name} hast du heute schon geschafft – morgen wieder!`); return; }
    if (spiel.aktiv?.pfad?.id === d.id) return;
    ton.klick();
    starteKampf(null, d.id);
    abenteuerTab = "kampf";
    speichern(); zeichneAktivLeiste(); zeichneAbenteuer();
    $("inhalt").scrollTop = 0;
  });
}

// ===================== HEUTE-KARTE =====================
function heuteExtras(dazu, geh) {
  if (zuchtBereit()) dazu("zucht", "🥚", "Im Brutnest schlüpft ein Ei!", geh({ seite: "seiteIch", ichTab: "tiere", ziel: "#brutnest" }));
  if (zirkusAktiv()) dazu("zirkus", "🎪", zirkusAbholbar() ? "Zirkus-Tickets abholen" : "Der Wanderzirkus ist da!", () => zeigeZirkus());
  const frei = DUNGEONS.filter(d => verliesFrei(d) && !verliesGeschafft(d));
  if (frei.length) dazu("verlies", "🏰", `${frei.length} Verlies${frei.length === 1 ? "" : "e"} heute noch offen`, geh({ seite: "seiteAbenteuer", abenteuerTab: "pfade", ziel: ".dungeonKarte" }));
}

// Herkunft für Wiki und Tier-Karten, "alle Haustiere" neu zählen
for (const m of MISCHTIERE) HAUSTIERE.find(h => h.id === m.id).quelle = `🥚 Zucht im Brutnest: ${m.eltern.map(e => ({ sammeln: "Sammel-Tier", machen: "Herstell-Tier", kampf: "Kampf-Tier", glueck: "Glücks-Tier", season: "Season-Tier", chef: "Chef-Tier", "*": "irgendein Tier" }[e])).join(" + ")}`;
HAUSTIERE.find(h => h.id === "gruftie").quelle = `🏰 Verlies-Truhen: 1 von ${Math.round(1 / VERLIES_REGEL.tierChance)}`;
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
  const monster = ERFOLGE.find(e => e.id === "alle-monster");
  if (monster) monster.ziel = Object.keys(MONSTER).length;
}
