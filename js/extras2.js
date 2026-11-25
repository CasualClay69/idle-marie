"use strict";
// =====================================================
//  KOCHBUCH & WETTER (v1.33)
//  📖 Kochbuch: Jedes Gericht, jeder Trank und jeder Kuchen kommt beim ersten Herstellen ins Kochbuch.
//     Volle Seiten geben Dauer-Boni. spiel.kochbuch = { gegenstandId: Zeitpunkt }
//  ☀️ Wetter: wechselt alle 4 Stunden – für alle Spieler gleich (aus der Uhrzeit berechnet).
//     Jedes Wetter gibt einen kleinen Bonus. Beides steckt in zusatzAllgemein() -> baumhausBonus().
// =====================================================

// ===================== 📖 KOCHBUCH =====================
const KOCHBUCH_SEITEN = [
  { id: "fisch",   name: "Fisch-Gerichte",  icon: "🐟", rezepte: Array.from({ length: 8 }, (_, i) => `essen${i}`),   bonus: { art: "heilen",  wert: 10 }, text: "Essen heilt 10 % mehr" },
  { id: "gemuese", name: "Gemüse-Gerichte", icon: "🥗", rezepte: Array.from({ length: 8 }, (_, i) => `gericht${i}`), bonus: { art: "garten",  wert: 5 },  text: "Der Garten wächst 5 % schneller" },
  { id: "traenke", name: "Zaubertränke",    icon: "🧪", rezepte: Array.from({ length: 8 }, (_, i) => `trank${i}`),   bonus: { art: "xp",      wert: 3 },  text: "+3 % Erfahrung bei allem" },
  { id: "kuchen",  name: "Kuchen & Torten", icon: "🍰", rezepte: Array.from({ length: 8 }, (_, i) => `kuchen${i}`),  bonus: { art: "doppelt", wert: 3 },  text: "+3 % doppelte Ausbeute" },
];
const KOCHBUCH_VOLL = { art: "muenzen", wert: 10, text: "+10 % Münzen von Monstern" };   // wenn alle Seiten voll sind
const ALLE_REZEPTE = KOCHBUCH_SEITEN.flatMap(s => s.rezepte);

function kochbuch() {
  if (!spiel.kochbuch) {   // beim ersten Mal: alles eintragen, was schon einmal gemacht wurde
    spiel.kochbuch = {};
    for (const id of ALLE_REZEPTE) if ((spiel.zaehler?.[id] || 0) > 0) spiel.kochbuch[id] = Date.now();
  }
  return spiel.kochbuch;
}
const rezeptBekannt = id => !!kochbuch()[id];
const seiteVoll = s => s.rezepte.every(rezeptBekannt);
const rezepteAnzahl = () => ALLE_REZEPTE.filter(rezeptBekannt).length;
// aus fuehreAus: ein neues Rezept? -> eintragen und melden
function lerneRezept(id) {
  if (!ALLE_REZEPTE.includes(id) || rezeptBekannt(id)) return;
  kochbuch()[id] = Date.now();
  const s = KOCHBUCH_SEITEN.find(x => x.rezepte.includes(id));
  if (typeof melde === "function") {
    melde(`📖 Neu im Kochbuch: ${GEGENSTAENDE[id].name}!`);
    if (seiteVoll(s)) melde(`📖 Die Seite „${s.name}“ ist voll: ${s.text} – für immer!`, "gross");
  }
}
function kochbuchBonus(art) {
  let summe = 0;
  for (const s of KOCHBUCH_SEITEN) if (s.bonus.art === art && seiteVoll(s)) summe += s.bonus.wert;
  if (KOCHBUCH_VOLL.art === art && KOCHBUCH_SEITEN.every(seiteVoll)) summe += KOCHBUCH_VOLL.wert;
  return summe / 100;
}
function zeigeKochbuch() {
  $("kochbuchInhalt").innerHTML = `<div class="zirkusKopf"><span>📖</span><h2>Dein Kochbuch</h2><small><b>${rezepteAnzahl()}</b> von ${ALLE_REZEPTE.length} Rezepten</small></div>
    <p class="hinweis">Alles, was du kochst, braust oder backst, kommt beim ersten Mal ins Kochbuch. Ist eine Seite voll, bekommst du ihren Bonus für immer.</p>
    ${KOCHBUCH_SEITEN.map(s => `<div class="kochSeite${seiteVoll(s) ? " voll" : ""}"><h3>${s.icon} ${s.name} <small>${s.rezepte.filter(rezeptBekannt).length} / ${s.rezepte.length}</small></h3>
      <div class="kochRezepte">${s.rezepte.map(id => rezeptBekannt(id)
        ? `<span class="kochRezept">${symbolHtml(id, "mini")}<small>${GEGENSTAENDE[id].name}</small></span>`
        : `<span class="kochRezept zu">❔<small>???</small></span>`).join("")}</div>
      <p class="hinweis">${seiteVoll(s) ? "✅" : "🔒"} Volle Seite: <b>${s.text}</b></p></div>`).join("")}
    <p class="hinweis">${KOCHBUCH_SEITEN.every(seiteVoll) ? "✅" : "🔒"} Ganzes Kochbuch voll: <b>${KOCHBUCH_VOLL.text}</b></p>`;
  $("kochbuchOverlay").hidden = false;
}
erfolg({ id: "kochbuch-seite", icon: "📖", name: "Eine volle Seite", text: "Mach eine Seite im Kochbuch voll", ziel: 1, muenzen: 20000, wert: () => KOCHBUCH_SEITEN.filter(seiteVoll).length });
erfolg({ id: "kochbuch-voll", icon: "📖", name: "Meisterköchin", text: `Sammle alle ${ALLE_REZEPTE.length} Rezepte im Kochbuch`, ziel: ALLE_REZEPTE.length, muenzen: 2000000, wert: () => rezepteAnzahl() });

// ===================== ☀️ WETTER =====================
const WETTER_STUNDEN = 4;
const WETTER = [
  { id: "sonne",     name: "Sonnenschein", icon: "☀️", gewicht: 30, art: "sammeln", wert: 5,  text: "Sammeln 5 % schneller" },
  { id: "regen",     name: "Regen",        icon: "🌧️", gewicht: 22, art: "garten",  wert: 15, text: "Der Garten wächst 15 % schneller" },
  { id: "wolken",    name: "Wolkig",       icon: "☁️", gewicht: 20, art: "machen",  wert: 5,  text: "Herstellen 5 % schneller" },
  { id: "gewitter",  name: "Gewitter",     icon: "⛈️", gewicht: 10, art: "kampfxp", wert: 15, text: "+15 % Kampf-Erfahrung" },
  { id: "nebel",     name: "Nebel",        icon: "🌫️", gewicht: 10, art: "doppelt", wert: 5,  text: "+5 % doppelte Ausbeute" },
  { id: "schnee",    name: "Schnee",       icon: "🌨️", gewicht: 18, winter: true, art: "muenzen", wert: 15, text: "+15 % Münzen von Monstern" },
  { id: "regenbogen", name: "Regenbogen",  icon: "🌈", gewicht: 4,  art: "xp",      wert: 15, text: "+15 % Erfahrung bei allem" },
];
const wetterAbschnitt = (t = Date.now()) => Math.floor(t / (WETTER_STUNDEN * 3600000));
// Gleiches Wetter für alle: aus der Nummer des 4-Stunden-Abschnitts berechnet
function wetterFuer(abschnitt) {
  const monat = new Date(abschnitt * WETTER_STUNDEN * 3600000).getMonth();
  const winter = [10, 11, 0, 1].includes(monat);
  const moeglich = WETTER.filter(w => !w.winter || winter);
  let s = Math.imul((abschnitt | 0) ^ 0x9e3779b9, 0x85ebca6b);   // gut gemischte Zufallszahl aus der Abschnitt-Nummer
  s ^= s >>> 13; s = Math.imul(s, 0xc2b2ae35); s ^= s >>> 16;
  const z = (s >>> 0) / 4294967296 * moeglich.reduce((a, w) => a + w.gewicht, 0);
  let summe = 0;
  for (const w of moeglich) { summe += w.gewicht; if (z < summe) return w; }
  return moeglich[0];
}
const wetterJetzt = () => wetterFuer(wetterAbschnitt(Date.now()));
function wetterBonus(art) { const w = wetterJetzt(); return w.art === art ? w.wert / 100 : 0; }
function wetterRestText() {
  const ende = (wetterAbschnitt(Date.now()) + 1) * WETTER_STUNDEN * 3600000, min = Math.max(1, Math.ceil((ende - Date.now()) / 60000));
  return min >= 60 ? `${Math.floor(min / 60)} Std. ${min % 60} Min.` : `${min} Min.`;
}
function wetterChip() {
  const w = wetterJetzt();
  return `<button type="button" class="trankChip wetterChip" id="wetterChip" title="${w.text}">${w.icon} ${w.name}: ${w.text} <b>${wetterRestText()}</b></button>`;
}
// Vorhersage: die nächsten Abschnitte
function zeigeWetter() {
  const jetzt = wetterAbschnitt(Date.now());
  const zeile = (a, i) => {
    const w = wetterFuer(a), von = new Date(a * WETTER_STUNDEN * 3600000);
    const uhr = `${String(von.getHours()).padStart(2, "0")}:00`;
    return `<li>${w.icon} <span class="rkName">${i === 0 ? "<b>Jetzt</b>" : `ab ${uhr} Uhr`}: ${w.name} <small class="sanft">${w.text}</small></span></li>`;
  };
  $("kochbuchInhalt").innerHTML = `<div class="zirkusKopf"><span>${wetterJetzt().icon}</span><h2>Wetter</h2><small>wechselt alle ${WETTER_STUNDEN} Stunden – für alle gleich</small></div>
    <h3>🔮 Vorhersage</h3><ul class="offlineListe">${[0, 1, 2, 3, 4, 5].map(i => zeile(jetzt + i, i)).join("")}</ul>
    <p class="hinweis">Jedes Wetter hilft dir ein bisschen – plane ruhig danach! Schnee gibt es nur von November bis Februar, und ganz selten zeigt sich ein Regenbogen.</p>`;
  $("kochbuchOverlay").hidden = false;
  spiel.statistik.regenbogen = Math.max(spiel.statistik.regenbogen || 0, wetterJetzt().id === "regenbogen" ? 1 : 0);
}
erfolg({ id: "wetter-regenbogen", icon: "🌈", name: "Regenbogen-Glück", text: "Sei dabei, wenn das Wetter einen Regenbogen zeigt", ziel: 1, muenzen: 50000,
  wert: () => Math.max(spiel.statistik.regenbogen || 0, wetterJetzt().id === "regenbogen" ? 1 : 0) });

// Zwei Wetter-Bilder, die es noch nicht gab
ikon("🌧", B.p("M8 17Q4 17 4 13Q4 9 9 9Q10 4 16 4Q22 4 23 9Q28 9 28 13Q28 17 24 17Z", "#b8c6d9") + B.l("M10 21L8 26M16 21L14 26M22 21L20 26", "#4aa3df", 2));
ikon("⛈", B.p("M8 16Q4 16 4 12Q4 8 9 8Q10 3 16 3Q22 3 23 8Q28 8 28 12Q28 16 24 16Z", "#8a93a8") + B.p("M17 16L12 23H16L13 30L21 21H17L19 16Z", "#ffd54f"));

function richteExtras2Ein() {
  $("kochbuchZu").addEventListener("click", () => { ton.klick(); $("kochbuchOverlay").hidden = true; });
  document.addEventListener("click", e => { if (e.target.closest("#wetterChip")) { ton.klick(); zeigeWetter(); } });
}
