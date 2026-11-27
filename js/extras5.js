"use strict";
// =====================================================
//  v1.36 – BIBLIOTHEK · TITEL · JAHRES-EVENTS
//  📚 Lesen: Seiten finden, Bücher fertig lesen (Daten: daten-lesen.js)
//  🏷️ Titel: Erfolge schalten Titel frei; der gewählte steht unter Ich und in der Bestenliste (online: im_titel)
//  🎉 Jahres-Events: Ostern (Eiersuche), Sommerfest, Halloween – eine Woche vorher im Lauftext angekündigt
// =====================================================

// ===================== 📚 BIBLIOTHEK =====================
const buchSeiten = id => spiel.buecher?.[id] || 0;
const buchFertig = id => buchSeiten(id) >= LESEN.seitenProBuch;
// aus fuehreAus: beim Lesen manchmal eine Seite finden
function leseSeite(t) {
  if (t.fertigkeit !== "lesen") return null;
  const offen = GESCHICHTEN.filter(b => b.regal <= t.regal && !buchFertig(b.id));
  if (!offen.length || Math.random() >= LESEN.seitenChance * (1 + haustierBonus("doppelt", "lesen"))) return null;
  const b = offen[Math.floor(Math.random() * offen.length)];
  spiel.buecher = spiel.buecher || {};
  spiel.buecher[b.id] = buchSeiten(b.id) + 1;
  if (typeof melde === "function") {
    if (buchFertig(b.id)) { melde(`📖 „${b.titel}“ ist fertig gelesen! ${b.bonusText} – für immer.`, "gross"); }
    else melde(`📄 Eine Seite von „${b.titel}“ gefunden (${buchSeiten(b.id)} / ${LESEN.seitenProBuch})`);
  }
  return b;
}
function buchBonus(art) {
  return GESCHICHTEN.filter(b => b.bonus.art === art && buchFertig(b.id)).reduce((s, b) => s + (["offline", "bank"].includes(art) ? b.bonus.wert : b.bonus.wert / 100), 0);
}
function zeigeBuecher() {
  $("kochbuchInhalt").innerHTML = `<div class="zirkusKopf"><span>📚</span><h2>Meine Bücher</h2><small><b>${GESCHICHTEN.filter(b => buchFertig(b.id)).length}</b> von ${GESCHICHTEN.length} fertig gelesen</small></div>
    <p class="hinweis">Beim Lesen findest du manchmal eine Seite. Jedes Buch hat ${LESEN.seitenProBuch} Seiten – ist es fertig, erzählt es ein Stück der großen Geschichte und hilft dir für immer.</p>
    ${GESCHICHTEN.map((b, i) => {
      const fertig = buchFertig(b.id), s = buchSeiten(b.id);
      return `<div class="kochSeite${fertig ? " voll" : ""}"><h3>📖 Kapitel ${i + 1}: ${fertig || s ? b.titel : "???"} <small>${s} / ${LESEN.seitenProBuch} Seiten</small></h3>
        ${fertig ? `<p class="buchText">${b.text}</p>` : `<p class="hinweis">Seiten findest du beim Lesen ab dem Regal „${REGALE[b.regal]}“.</p>`}
        <p class="hinweis">${fertig ? "✅" : "🔒"} <b>${b.bonusText}</b></p></div>`;
    }).join("")}`;
  $("kochbuchOverlay").hidden = false;
}

// ===================== 🏷️ TITEL =====================
// Gespeichert wird die ID (online nur die ID – der Text kommt aus dieser Liste, so kann niemand Unsinn eintragen)
const besiegtMal = id => spiel.besiegt?.[id] || 0;
const TITEL = [
  { id: "neu",        name: "die Abenteurerin", m: "der Abenteurer",          ok: () => true },
  { id: "fleiss",     name: "die Fleißige", m: "der Fleißige",              ok: () => gesamtStufe() >= 250, wie: "Gesamtstufe 250" },
  { id: "drachen",    name: "die Drachenbezwingerin", m: "der Drachenbezwinger",    ok: () => besiegtMal("feuerdrache") > 0, wie: "Besiege den Feuerdrachen" },
  { id: "geister",    name: "die Geisterflüsterin", m: "der Geisterflüsterer",      ok: () => besiegtMal("burggespenst") > 0, wie: "Besiege das Burggespenst" },
  { id: "frost",      name: "die Frostkönigin", m: "der Frostkönig",          ok: () => besiegtMal("frostkoenig") > 0, wie: "Besiege den Frostkönig" },
  { id: "traum",      name: "die Traumhüterin", m: "der Traumhüter",          ok: () => besiegtMal("traumkoenigin") > 0, wie: "Besiege die Traumkönigin" },
  { id: "farben",     name: "die Retterin der Farben", m: "der Retter der Farben",   ok: () => (spiel.pfade?.["p-gipfel"] || 0) > 0, wie: "Schaffe das große Finale" },
  { id: "koechin",    name: "die Meisterköchin", m: "der Meisterkoch",         ok: () => typeof KOCHBUCH_SEITEN !== "undefined" && KOCHBUCH_SEITEN.every(seiteVoll), wie: "Mach das Kochbuch voll" },
  { id: "tiere",      name: "die Tierflüsterin", m: "der Tierflüsterer",         ok: () => (spiel.haustiere || []).length >= 25, wie: "Hab 25 Haustiere" },
  { id: "zucht",      name: "die Züchterin", m: "der Züchter",             ok: () => (spiel.haustiere || []).some(id => id.startsWith("zucht")), wie: "Züchte ein Mischtier" },
  { id: "zirkus",     name: "der Zirkusstar", m: "der Zirkusstar",            ok: () => hatHaustier("konfetti"), wie: "Hol dir Zirkuspony Konfetti" },
  { id: "verlies",    name: "die Verlies-Heldin", m: "der Verlies-Held",        ok: () => (spiel.statistik.verliese || 0) >= 25, wie: "Schaffe 25 Verliese" },
  { id: "titan",      name: "die Titanen-Bezwingerin", m: "der Titanen-Bezwinger",   ok: () => (spiel.statistik.bossSiege || 0) >= 1, wie: "Hilf beim Gemeinschafts-Boss" },
  { id: "karten",     name: "die Kartenkönigin", m: "der Kartenkönig",         ok: () => typeof ALLE_KARTEN !== "undefined" && ALLE_KARTEN.every(karteDa), wie: "Sammle alle Sammelkarten" },
  { id: "angel",      name: "die Petri-Heil-Meisterin", m: "der Petri-Heil-Meister",  ok: () => (spiel.angel?.rekord || 0) >= 10, wie: "Fang einen Riesenwels mit 10 kg" },
  { id: "buch",       name: "der Bücherwurm", m: "der Bücherwurm",            ok: () => GESCHICHTEN.every(b => buchFertig(b.id)), wie: "Lies alle Geschichtenbücher" },
  { id: "prestige",   name: "die Unermüdliche", m: "der Unermüdliche",          ok: () => (spiel.prestige || 0) >= 1, wie: "Erreiche Prestige 1" },
  { id: "legende",    name: "die Legende", m: "die Legende",               ok: () => (spiel.prestige || 0) >= 5, wie: "Erreiche Prestige 5" },
  { id: "ostern",     name: "der Osterhase", m: "der Osterhase",             ok: () => (spiel.events?.ostern?.gesamt || 0) >= 100, wie: "Finde 100 Ostereier" },
  { id: "sommer",     name: "die Sonnenscheinin", m: "der Sonnenschein",        ok: () => (spiel.events?.sommer?.gesamt || 0) >= 100, wie: "Sammle 100 Sonnenblumen beim Sommerfest" },
  { id: "halloween",  name: "die Kürbiskönigin", m: "der Kürbiskönig",         ok: () => (spiel.events?.halloween?.gesamt || 0) >= 100, wie: "Sammle 100 Bonbons an Halloween" },
  ...FERTIGKEITEN.map(f => ({ id: `f-${f.id}`, name: `Meisterin: ${f.name.replaceAll("­", "")}`, m: `Meister: ${f.name.replaceAll("­", "")}`, ok: () => stufe(f.id) >= 99, wie: `${f.name.replaceAll("­", "")} Stufe 99` })),
];
const titelFrei = t => { try { return t.ok(); } catch (e) { return false; } };
const aktuellerTitel = () => TITEL.find(t => t.id === spiel.titel && titelFrei(t)) || null;
// Form: spiel.titelForm "w" (weiblich, Standard) oder "m" (männlich). Online wird die ID mit "-m" angehängt gemeldet.
const titelMaennlich = () => spiel.titelForm === "m";
const titelName = (t, m = titelMaennlich()) => (m ? t.m || t.name : t.name);
const titelText = id => {
  if (!id) return "";
  const m = id.endsWith("-m"), t = TITEL.find(x => x.id === (m ? id.slice(0, -2) : id));
  return t ? titelName(t, m) : "";
};
const titelOnlineId = () => (spiel.titel ? spiel.titel + (titelMaennlich() ? "-m" : "") : "");
async function meldeTitel() {
  if (!mitglied) return;
  try { await rufeOnlineAuf("setze_titel", { p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis, p_titel: titelOnlineId() }); titelGeladen = 0; } catch (e) { /* später */ }
}
let titelOnline = {}, titelGeladen = 0;
async function ladeTitel() {
  if (Date.now() - titelGeladen < 60000) return titelOnline;
  titelGeladen = Date.now();
  try { titelOnline = (await rufeOnlineAuf("hole_titel")) || {}; } catch (e) { /* ohne Titel */ }
  return titelOnline;
}
function zeichneTitel() {
  const ziel = $("titelKarte");
  if (!ziel) return;
  const frei = TITEL.filter(titelFrei), an = aktuellerTitel();
  ziel.innerHTML = `<h3>🏷️ Dein Titel <small>${frei.length} / ${TITEL.length} freigeschaltet</small></h3>
    <p class="hinweis">${figurName()} <b>${an ? titelName(an) : "– noch kein Titel gewählt –"}</b>. Der Titel steht auch in der Bestenliste.</p>
    <div class="titelForm"><span>Form:</span><button type="button" class="titelFormKnopf${titelMaennlich() ? "" : " an"}" data-form="w">weiblich</button><button type="button" class="titelFormKnopf${titelMaennlich() ? " an" : ""}" data-form="m">männlich</button></div>
    <div class="titelListe">${TITEL.map(t => titelFrei(t)
      ? `<button type="button" class="titelWahl${an?.id === t.id ? " an" : ""}" data-titel="${t.id}">${titelName(t)}</button>`
      : `<span class="titelWahl zu" title="${t.wie || ""}">🔒 ${t.wie || "???"}</span>`).join("")}</div>`;
  for (const b of ziel.querySelectorAll("[data-titel]")) b.addEventListener("click", () => {
    spiel.titel = b.dataset.titel; ton.klick(); melde(`🏷️ ${figurName()} ${titelText(titelOnlineId())}`); speichern(); zeichneTitel(); meldeTitel();
  });
  for (const b of ziel.querySelectorAll("[data-form]")) b.addEventListener("click", () => {
    if ((b.dataset.form === "m") === titelMaennlich()) return;
    spiel.titelForm = b.dataset.form; ton.klick(); speichern(); zeichneTitel();
    if (spiel.titel) { melde(`🏷️ ${figurName()} ${titelText(titelOnlineId())}`); meldeTitel(); }
  });
}

// ===================== 🎉 JAHRES-EVENTS =====================
function ostersonntag(j) {   // Gaußsche Osterformel (gregorianisch)
  const a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(j, monat - 1, tag);
}
const tagPlus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const JAHRES_EVENTS = [
  { id: "ostern", name: "Eiersuche", mitArtikel: "die Eiersuche", icon: "🥚", farbe: "#b48cff", sache: "Ostereier", sacheIcon: "🥚",
    von: j => tagPlus(ostersonntag(j), -6), bis: j => tagPlus(ostersonntag(j), 2),   // Montag vor Ostern bis Ostermontag
    text: "Überall sind bunte Ostereier versteckt! Bei jeder Tätigkeit und jedem Monster kannst du eins finden.",
    laden: [{ id: "he1", art: "hut", name: "Eierkorb-Hut", preis: 40 }, { id: "re1", art: "rahmen", name: "Oster-Rahmen", preis: 40 }, { id: "ke1", art: "kleid", name: "Frühlings-Pulli", preis: 40 }, { tier: "hoppel", name: "Osterhase Hoppel", preis: 120 }] },
  { id: "sommer", name: "Sommerfest", mitArtikel: "das Sommerfest", icon: "🌻", farbe: "#ffb347", sache: "Sonnenblumen", sacheIcon: "🌻",
    von: j => new Date(j, 6, 15), bis: j => new Date(j, 7, 1),
    text: "Sommerfest im ganzen Land! Sammle Sonnenblumen bei jeder Tätigkeit und jedem Monster.",
    laden: [{ id: "hso", art: "hut", name: "Sonnenblumen-Kranz", preis: 40 }, { id: "rso", art: "rahmen", name: "Sommerfest-Rahmen", preis: 40 }, { id: "kso", art: "kleid", name: "Strand-Shirt", preis: 40 }, { tier: "sunny", name: "Seehund Sunny", preis: 120 }] },
  { id: "halloween", name: "Halloween", mitArtikel: "Halloween", icon: "🎃", farbe: "#ff8a2a", sache: "Bonbons", sacheIcon: "🍬",
    von: j => new Date(j, 9, 25), bis: j => new Date(j, 10, 1),
    text: "Süßes oder Saures! Kürbisgeister verstecken überall Bonbons – bei jeder Tätigkeit und jedem Monster.",
    laden: [{ id: "hha", art: "hut", name: "Kürbis-Mütze", preis: 40 }, { id: "rha", art: "rahmen", name: "Spinnennetz-Rahmen", preis: 40 }, { id: "kha", art: "kleid", name: "Gespenster-Kostüm", preis: 40 }, { tier: "kuerbiskatze", name: "Kürbiskatze Krümel", preis: 120 }] },
];
const EVENT_REGEL = { fundChance: 0.04, vorher: 7 };
// Welches Event läuft gerade? (und welches kommt in den nächsten 7 Tagen?)
function eventFenster(e, d = new Date(Date.now())) { const j = d.getFullYear(); return { von: e.von(j), bis: e.bis(j) }; }
const aktivesEvent = (d = new Date(Date.now())) => JAHRES_EVENTS.find(e => { const f = eventFenster(e, d); return d >= f.von && d < f.bis; }) || null;
function baldEvent(d = new Date(Date.now())) {
  for (const e of JAHRES_EVENTS) { const f = eventFenster(e, d), tage = Math.ceil((f.von - d) / 86400000); if (tage > 0 && tage <= EVENT_REGEL.vorher) return { e, tage }; }
  return null;
}
const eventStand = id => { spiel.events = spiel.events || {}; return spiel.events[id] || (spiel.events[id] = { punkte: 0, gesamt: 0 }); };
// aus fuehreAus und besiegt(): manchmal etwas fürs Event finden
function eventFund() {
  const e = aktivesEvent();
  if (!e || Math.random() >= EVENT_REGEL.fundChance) return;
  const s = eventStand(e.id), n = 1 + (Math.random() < 0.15 ? 1 : 0);
  s.punkte += n; s.gesamt += n;
}
function eventLauftext() {
  const a = aktivesEvent();
  if (a) { const tage = Math.ceil((eventFenster(a).bis - Date.now()) / 86400000); return `${a.icon} ${a.name} läuft! Sammle ${a.sache} – noch ${tage} Tag${tage === 1 ? "" : "e"}`; }
  const b = baldEvent();
  return b ? `${b.e.icon} In ${b.tage} Tag${b.tage === 1 ? "" : "en"} beginnt ${b.e.mitArtikel}!` : "";
}
function eventKaufen(e, w) {
  const s = eventStand(e.id);
  if (s.punkte < w.preis) return false;
  if (w.id) { if (besitztTeil(teilNachId(w.id))) return false; gibTeil(w.id); }
  else { if (hatHaustier(w.tier)) return false; gibHaustier(HAUSTIERE.find(h => h.id === w.tier)); }
  s.punkte -= w.preis;
  return true;
}
let eventKarteText = "";
function zeichneEventKarte() {
  const k = $("eventKarte");
  if (!k) return;
  const e = aktivesEvent();
  k.hidden = !e;
  if (!e) return;
  const s = eventStand(e.id), html = `<span class="gkIcon">${e.icon}</span><span class="gkText"><b>${e.name}!</b><small>${e.sacheIcon} ${s.punkte} ${e.sache} · Event-Laden</small></span><span class="gkLos">Hin!</span>`;
  if (html !== eventKarteText) { eventKarteText = html; k.innerHTML = html; k.style.setProperty("--farbe", e.farbe); }
}
function zeigeEvent() {
  const e = aktivesEvent();
  if (!e) return;
  const s = eventStand(e.id), bis = eventFenster(e).bis;
  $("kochbuchInhalt").innerHTML = `<div class="zirkusKopf"><span>${e.icon}</span><h2>${e.name}</h2><small>${e.sacheIcon} <b>${s.punkte}</b> ${e.sache} · bis ${tagPlus(bis, -1).toLocaleDateString("de-DE")}</small></div>
    <p class="hinweis">${e.text}</p><h3>🛒 Event-Laden</h3><ul class="offlineListe">${e.laden.map((w, i) => {
      const hat = w.id ? besitztTeil(teilNachId(w.id)) : hatHaustier(w.tier);
      return `<li>${w.id ? "👗" : "🐾"} <span class="rkName">${w.name}</span>${hat ? "✅" : `<button type="button" class="knopf kaufen" data-eventkauf="${i}" ${s.punkte >= w.preis ? "" : "disabled"}>${e.sacheIcon} ${w.preis}</button>`}</li>`;
    }).join("")}</ul><p class="hinweis">Was du nicht schaffst, gibt es nächstes Jahr wieder.</p>`;
  $("kochbuchOverlay").hidden = false;
  for (const b of $("kochbuchInhalt").querySelectorAll("[data-eventkauf]")) b.addEventListener("click", () => {
    if (!eventKaufen(e, e.laden[Number(b.dataset.eventkauf)])) { ton.nein(); return; }
    ton.stufe(); melde(`${e.icon} ${e.laden[Number(b.dataset.eventkauf)].name} gehört jetzt dir!`, "gross"); speichern(); zeichneKopf(); zeigeEvent(); zeichneEventKarte();
  });
}
// Event-Haustiere und Spind-Teile (hinten an die Listen!)
HAUSTIERE.push(
  { id: "hoppel", name: "Hoppel", tier: "Osterhase", emoji: "🐰", quelle: "🥚 Event-Laden bei der Eiersuche (Ostern)", bonus: { art: "doppelt", wert: 0.03 }, text: "+3 % doppelte Ausbeute bei allem" },
  { id: "sunny", name: "Sunny", tier: "Seehund", emoji: "🦭", quelle: "🌻 Event-Laden beim Sommerfest (Juli)", bonus: { art: "xp", wert: 0.03 }, text: "+3 % Erfahrung bei allem" },
  { id: "kuerbiskatze", name: "Krümel", tier: "Kürbiskatze", emoji: "🐱", quelle: "🎃 Event-Laden an Halloween", bonus: { art: "muenzen", wert: 0.08 }, text: "+8 % Münzen von Monstern" });
{
  const q = (e) => ({ kurz: `${e.icon} ${e.name}`, lang: `${e.icon} Gibt es im Event-Laden: ${e.name}` });
  const [o, so, ha] = JAHRES_EVENTS;
  HUETE.push({ id: "he1", name: "Eierkorb-Hut", icon: "🥚", quelle: q(o), svg: `<path d="M26 30Q26 12 50 12Q74 12 74 30Z" fill="#e8c39e" stroke="#c9a06a" stroke-width="2"/><path d="M30 18H70M28 24H72" stroke="#c9a06a" stroke-width="2"/>${[[38, 6, "#ff9fd0"], [50, 2, "#7ad7f0"], [62, 6, "#ffd54f"]].map(([x, y, f]) => `<ellipse cx="${x}" cy="${y + 6}" rx="5" ry="7" fill="${f}" stroke="#fff" stroke-width="1.5"/>`).join("")}` },
    { id: "hso", name: "Sonnenblumen-Kranz", icon: "🌻", quelle: q(so), svg: `<path d="M22 30Q50 14 78 30" stroke="#6fbf6a" stroke-width="4" fill="none"/>${[[30, 24], [50, 17], [70, 24]].map(([x, y]) => bluete(x, y, 5, "#ffd54f", "#a8693a")).join("")}` },
    { id: "hha", name: "Kürbis-Mütze", icon: "🎃", quelle: q(ha), svg: `<path d="M22 32Q20 6 50 6Q80 6 78 32Z" fill="#ff8a2a" stroke="#c95a10" stroke-width="2"/><path d="M36 10Q34 20 36 30M50 7V31M64 10Q66 20 64 30" stroke="#c95a10" stroke-width="2" fill="none"/><path d="M50 6Q52 -2 58 -2" stroke="#6fbf6a" stroke-width="3" fill="none"/>` });
  RAHMEN.push({ id: "re1", name: "Oster-Rahmen", icon: "🥚", quelle: q(o), svg: emojiRahmen("#b48cff", ["🥚", "🌷"]) },
    { id: "rso", name: "Sommerfest-Rahmen", icon: "🌻", quelle: q(so), svg: emojiRahmen("#ffb347", ["☀️", "🍉"]) },
    { id: "rha", name: "Spinnennetz-Rahmen", icon: "🕸️", quelle: q(ha), svg: emojiRahmen("#3a2f4a", ["🕸️", "🦇"]) });
  KLEIDUNG.push({ id: "ke1", name: "Frühlings-Pulli", icon: "🌷", quelle: q(o), svg: emojiKleid("#e6d6ff", ["🌷", "🥚"]) },
    { id: "kso", name: "Strand-Shirt", icon: "🏖️", quelle: q(so), svg: emojiKleid("#7ad7f0", ["🍉", "☀️"]) },
    { id: "kha", name: "Gespenster-Kostüm", icon: "👻", quelle: q(ha), svg: () => kleidSvg("#f2f2f8", `<circle cx="42" cy="88" r="3" fill="#3b2240"/><circle cx="58" cy="88" r="3" fill="#3b2240"/><ellipse cx="50" cy="96" rx="4" ry="3" fill="#3b2240"/>`, "#c9c2d6") });
}
// Event-Sachen zählen nicht zu 100 % (es gibt sie nur zu bestimmten Zeiten)
for (const id of ["he1", "hso", "hha", "re1", "rso", "rha", "ke1", "kso", "kha"]) { const t = [...HUETE, ...RAHMEN, ...KLEIDUNG].find(x => x.id === id); if (t) t.prestige = "event"; }
for (const id of ["hoppel", "sunny", "kuerbiskatze"]) HAUSTIERE.find(h => h.id === id).season = "event";

// ===================== VERDRAHTUNG =====================
function extras5Bonus(art) { return buchBonus(art); }
function richteExtras5Ein() {
  document.addEventListener("click", e => {
    if (e.target.closest("#buecherKnopf")) { ton.klick(); zeigeBuecher(); }
    if (e.target.closest("#eventKarte")) { ton.klick(); zeigeEvent(); }
  });
  jedeSekunde(() => { zeichneEventKarte(); if (typeof zeigeLauftext === "function") zeigeLauftext(); }, 30);
  if (mitglied && spiel.titel) meldeTitel();
}
function heuteExtras5(dazu) {
  const e = aktivesEvent();
  if (e) dazu("event", e.icon, `${e.name}: ${eventStand(e.id).punkte} ${e.sache} gesammelt`, () => zeigeEvent());
}
