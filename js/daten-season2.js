"use strict";
// =====================================================
//  SEASON-PASS – 36 Seasons (3 Jahre). Season 1 = November 2026.
//  Jahr 1 (Season 1–12) = die Themen in daten-season.js, Jahr 2 und 3 = eigene Themen hier.
//  item.season / haustier.season = Season-Nummer (1 … 36). Danach beginnen die 36 Seasons von vorn.
//  Neue Spind-Teile und Haustiere stehen HINTEN in den Listen (die Bestenliste merkt sich Listenplätze).
// =====================================================

const seasonNrAus = (monat, jahr) => jahr * 12 + ((monat + 1) % 12) + 1;   // jahr 0, 1, 2
function seasonName(nr) {
  const i = 10 + (nr - 1);
  return `${MONATSNAMEN[((i % 12) + 12) % 12]} ${2026 + Math.floor(i / 12)}`;
}
// Hut für die neuen Seasons: Form + Farbe + Verzierung (gezeichnetes Emoji)
function seasonHut(form, farbe, deko) {
  const ton = (hex, f) => { const n = parseInt(hex.slice(1), 16), k = v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f);
    return `rgb(${k(n >> 16)},${k((n >> 8) & 255)},${k(n & 255)})`; };   // (toene() aus symbole.js gibt es hier noch nicht)
  const d = ton(farbe, -0.35), h = ton(farbe, 0.35);
  if (form === "krone") return `<path d="M28 28L30 6L40 16L50 0L60 16L70 6L72 28Z" fill="${farbe}" stroke="${d}" stroke-width="2.5" stroke-linejoin="round"/>${emojiText(deko, 50, 18, 11)}`;
  if (form === "reif") return `<path d="M24 31Q50 15 76 31" stroke="${farbe}" stroke-width="5" fill="none" stroke-linecap="round"/>${emojiText(deko, 50, 12, 16)}${emojiText(deko, 32, 22, 9)}${emojiText(deko, 68, 22, 9)}`;
  if (form === "hut") return `<ellipse cx="50" cy="27" rx="40" ry="8" fill="${farbe}" stroke="${d}" stroke-width="2"/><path d="M30 26Q31 6 50 6Q69 6 70 26Z" fill="${h}" stroke="${d}" stroke-width="2"/>
    <path d="M30 20Q50 24 70 20L70 25Q50 29 30 25Z" fill="${d}"/>${emojiText(deko, 62, 21, 10)}`;
  if (form === "hexe") return `<path d="M28 27L56 -16Q60 4 74 27Z" fill="${farbe}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="50" cy="27" rx="32" ry="6.5" fill="${d}"/>${emojiText(deko, 56, 10, 11)}`;
  return `<path d="M23 32Q22 4 50 4Q78 4 77 32Z" fill="${farbe}"/><rect x="21" y="26" width="58" height="9" rx="4.5" fill="${h}" stroke="${d}" stroke-width="1.5"/>
    <circle cx="50" cy="3" r="7" fill="${h}" stroke="${d}" stroke-width="1.5"/>${emojiText(deko, 50, 17, 11)}`;
}

const sTh = (monat, titel, icon, farben, deko, kleid, hut, monster, haustier) => ({ monat, titel, icon, farben, rahmenEmoji: deko, kleid, hutForm: hut, monster, haustier });
// Jahr 2: November 2027 – Oktober 2028
const SEASON_JAHR2 = [
  sTh(11, "Laternenzeit", "🌙", ["#fff4dc", "#f2a33a"], ["🌙", "⭐"], ["#f2c08a", ["🌙", "⭐"]], ["muetze", "#f2a33a", "🌙"], { name: "Laternen­geist", aussehen: { farbe: "#ffd27a", form: "geist", extra: "sterne" } }, { name: "Igel Pieks", tier: "Igel", emoji: "🦔", bonus: { art: "treff", wert: 0.02 }, text: "+2 % öfter treffen" }),
  sTh(12, "Wichtelwerkstatt", "🎁", ["#fff0f0", "#c9332c"], ["🎁", "🎄"], ["#c9332c", ["🎁", "⭐"], "#fff"], ["muetze", "#2f8a4a", "⭐"], { name: "Geschenke­dieb", aussehen: { farbe: "#6fbf6a", ohren: "spitz", extra: "punkte" } }, { name: "Polarfuchs Frost", tier: "Polarfuchs", emoji: "🦊", bonus: { art: "muenzen", wert: 0.05 }, text: "+5 % Münzen von Monstern" }),
  sTh(1, "Neujahrsfeuerwerk", "🎉", ["#e8e6ff", "#5a4fd6"], ["🎉", "✨"], ["#3b3f8f", ["✨", "⭐"]], ["krone", "#ffd54f", "✨"], { name: "Knaller­kobold", aussehen: { farbe: "#ff7a7a", ohren: "spitz", extra: "blitz" } }, { name: "Glückshase Hopsi", tier: "Hase", emoji: "🐰", bonus: { art: "xp", wert: 0.02 }, text: "+2 % Erfahrung bei allem" }),
  sTh(2, "Fasching", "🎈", ["#fff6d6", "#ff5fa2"], ["🎈", "🎉"], ["#ffd54f", ["🎈", "🎀"]], ["hut", "#7ad7f0", "🎀"], { name: "Konfetti­clown", aussehen: { farbe: "#ffb3d1", form: "rund", extra: "punkte" } }, { name: "Pony Tupfen", tier: "Pony", emoji: "🐴", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "bergbau", text: "+3 % doppeltes Erz" }),
  sTh(3, "Frühlingserwachen", "🌷", ["#eefbe6", "#6fbf6a"], ["🌷", "🐝"], ["#c9eccb", ["🌷", "🌼"]], ["reif", "#8fcf6a", "🌷"], { name: "Pollen­puster", aussehen: { farbe: "#fff4c2", fluegel: true, extra: "puste" } }, { name: "Laubfrosch Hüpfer", tier: "Laubfrosch", emoji: "🐸", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "garten", text: "+3 % doppelte Ernte" }),
  sTh(4, "Regenbogenregen", "🌈", ["#eef6ff", "#4aa3df"], ["💧", "🌈"], ["#9ad8f5", ["💧", "🌈"]], ["hut", "#4aa3df", "💧"], { name: "Pfützen­platscher", aussehen: { farbe: "#7ad7f0", form: "tropfen", extra: "punkte" } }, { name: "Otter Plansch", tier: "Otter", emoji: "🦦", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "angeln", text: "+3 % doppelte Fische" }),
  sTh(5, "Picknick", "🧺", ["#fff6e0", "#e8a35a"], ["🍓", "🧺"], ["#fff3c4", ["🍓", "🍰"]], ["hut", "#e9c46a", "🍓"], { name: "Ameisen­bande", aussehen: { farbe: "#a8693a", ohren: "spitz", extra: "punkte" } }, { name: "Eichhörnchen Nüsschen", tier: "Eichhörnchen", emoji: "🐿️", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "holz", text: "+3 % doppeltes Holz" }),
  sTh(6, "Zirkuszauber", "🎪", ["#fff0f0", "#e8453a"], ["🎪", "🎈"], ["#e8453a", ["⭐", "🎈"], "#fff"], ["hut", "#e8453a", "⭐"], { name: "Jongleur­geist", aussehen: { farbe: "#ffd1e6", form: "geist", extra: "sterne" } }, { name: "Panda Purzel", tier: "Panda", emoji: "🐼", bonus: { art: "schutz", wert: 0.02 }, text: "2 % weniger Schaden" }),
  sTh(7, "Schatzinsel", "🏴‍☠️", ["#fff3d6", "#c98a3a"], ["🗝️", "💰"], ["#3a2f4a", ["💰", "⚓"]], ["hut", "#3a2f4a", "⚓"], { name: "Piraten­krake", aussehen: { farbe: "#9a6bd6", extra: "punkte" } }, { name: "Papagei Polly", tier: "Papagei", emoji: "🦜", bonus: { art: "muenzen", wert: 0.05 }, text: "+5 % Münzen von Monstern" }),
  sTh(8, "Sternschnuppen", "💫", ["#e8e6ff", "#3b3f8f"], ["💫", "🌙"], ["#3b3f8f", ["⭐", "💫"]], ["reif", "#ffd54f", "💫"], { name: "Meteor­chen", aussehen: { farbe: "#ffb86b", form: "rund", extra: "flamme" } }, { name: "Eule Funkel", tier: "Eule", emoji: "🦉", bonus: { art: "xp", wert: 0.02 }, text: "+2 % Erfahrung bei allem" }),
  sTh(9, "Pilzsaison", "🍄", ["#f6efe6", "#c9532c"], ["🍄", "🍂"], ["#c9532c", ["🍄"], "#fff"], ["muetze", "#c9532c", "🍄"], { name: "Fliegenpilz­riese", aussehen: { farbe: "#e8453a", extra: "pilzhut" } }, { name: "Dachs Krümel", tier: "Dachs", emoji: "🦡", bonus: { art: "schneller", wert: 0.03 }, fertigkeit: "kochen", text: "Kochen 3 % schneller" }),
  sTh(10, "Gruselnacht", "🦇", ["#efe6ff", "#5a3a8a"], ["🦇", "🌙"], ["#3a2f4a", ["🦇", "🌙"]], ["hexe", "#3a2f4a", "🌙"], { name: "Spuk­laken", aussehen: { farbe: "#f2f2f2", form: "geist", extra: "krone" } }, { name: "Katze Mitternacht", tier: "Katze", emoji: "🐱", bonus: { art: "kraft", wert: 0.02 }, text: "+2 % stärkerer Schlag" }),
];
// Jahr 3: November 2028 – Oktober 2029
const SEASON_JAHR3 = [
  sTh(11, "Nebelwald", "🌲", ["#eef0f4", "#8a8fa8"], ["🍂", "🌲"], ["#b8bfcc", ["🍂"]], ["muetze", "#8a8fa8", "🍂"], { name: "Nebel­wolf", aussehen: { farbe: "#c9d2e0", ohren: "spitz", extra: "wuschel" } }, { name: "Reh Nebelchen", tier: "Reh", emoji: "🦌", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "holz", text: "+3 % doppeltes Holz" }),
  sTh(12, "Schneekugel", "❄️", ["#eef8ff", "#4a8fd6"], ["❄️", "⛸️"], ["#dff3ff", ["❄️"]], ["muetze", "#4a8fd6", "❄️"], { name: "Schneemann­riese", aussehen: { farbe: "#ffffff", form: "rund", extra: "flocken" } }, { name: "Pinguin Frack", tier: "Pinguin", emoji: "🐧", bonus: { art: "muenzen", wert: 0.05 }, text: "+5 % Münzen von Monstern" }),
  sTh(1, "Eisprinzessin", "👸", ["#f0f8ff", "#7ab8e0"], ["👑", "❄️"], ["#bfe3ff", ["❄️", "⭐"]], ["krone", "#dff3ff", "💎"], { name: "Eiskristall­golem", aussehen: { farbe: "#9ad8f5", form: "rund", extra: "steine" } }, { name: "Robbe Glitzer", tier: "Robbe", emoji: "🦭", bonus: { art: "schutz", wert: 0.02 }, text: "2 % weniger Schaden" }),
  sTh(2, "Kuschelzeit", "🧸", ["#fff0e6", "#e8a35a"], ["🧸", "💕"], ["#f2c08a", ["🧸", "💕"]], ["muetze", "#e8a35a", "💕"], { name: "Kissen­räuber", aussehen: { farbe: "#ffe0f0", form: "rund", extra: "herz" } }, { name: "Bär Brummel", tier: "Bär", emoji: "🐻", bonus: { art: "xp", wert: 0.02 }, text: "+2 % Erfahrung bei allem" }),
  sTh(3, "Ostergarten", "🥚", ["#f3fbe6", "#b48cff"], ["🥚", "🌸"], ["#e6d6ff", ["🥚"]], ["reif", "#b48cff", "🥚"], { name: "Schoko­hase", aussehen: { farbe: "#8a5a30", ohren: "spitz", extra: "punkte" } }, { name: "Lämmchen Flöckchen", tier: "Lamm", emoji: "🐑", bonus: { art: "schneller", wert: 0.03 }, fertigkeit: "naehen", text: "Nähen 3 % schneller" }),
  sTh(4, "Drachenfest", "🐉", ["#e8f8e8", "#3f9a5a"], ["🐉", "🔥"], ["#6fbf6a", ["🔥", "⭐"]], ["krone", "#6fbf6a", "🔥"], { name: "Wind­drache", aussehen: { farbe: "#8fcf6a", hoerner: true, fluegel: "drache", extra: "zacken" } }, { name: "Drache Zündi", tier: "Drachenbaby", emoji: "🐲", bonus: { art: "kraft", wert: 0.02 }, text: "+2 % stärkerer Schlag" }),
  sTh(5, "Blütenmeer", "🌸", ["#fff0f8", "#ff7eb6"], ["🌸", "🦋"], ["#ffd1e6", ["🌸", "🦋"]], ["reif", "#ff7eb6", "🌸"], { name: "Dornen­rose", aussehen: { farbe: "#ff9fc8", extra: "blaetter" } }, { name: "Schmetterling Blüte", tier: "Schmetterling", emoji: "🦋", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "garten", text: "+3 % doppelte Ernte" }),
  sTh(6, "Unterwasserwelt", "🐳", ["#e6f6ff", "#2a7fc0"], ["🐚", "🐟"], ["#7ac4f0", ["🐟", "🫧"]], ["krone", "#7ad7f0", "🐚"], { name: "Tiefsee­leuchter", aussehen: { farbe: "#3b5fd6", form: "tropfen", extra: "sterne" } }, { name: "Wal Blubb", tier: "Wal", emoji: "🐳", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "angeln", text: "+3 % doppelte Fische" }),
  sTh(7, "Vulkansommer", "🌋", ["#fff0e6", "#e8453a"], ["🌋", "🔥"], ["#ff8a4a", ["🔥"]], ["hut", "#e8772e", "🔥"], { name: "Magma­kröte", aussehen: { farbe: "#d9583a", form: "rund", extra: "flamme" } }, { name: "Salamander Glut", tier: "Salamander", emoji: "🦎", bonus: { art: "schneller", wert: 0.03 }, fertigkeit: "schmieden", text: "Schmieden 3 % schneller" }),
  sTh(8, "Ritterturnier", "🏰", ["#f2f0f8", "#7a6bb8"], ["🏰", "🛡️"], ["#9aa3b5", ["🛡️", "⭐"]], ["krone", "#c9d2e0", "🛡️"], { name: "Turnier­ritter", aussehen: { farbe: "#c9d2e0", form: "geist", extra: "helm" } }, { name: "Pony Lanze", tier: "Pony", emoji: "🐴", bonus: { art: "treff", wert: 0.02 }, text: "+2 % öfter treffen" }),
  sTh(9, "Waldgeister", "🌳", ["#eef8e6", "#4f8a3a"], ["🌳", "🍄"], ["#7cc36b", ["🌿", "🍄"]], ["reif", "#4f8a3a", "🌿"], { name: "Moos­troll", aussehen: { farbe: "#6e9a4a", ohren: "spitz", extra: "blaetter" } }, { name: "Waschbär Moosi", tier: "Waschbär", emoji: "🦝", bonus: { art: "schneller", wert: 0.03 }, fertigkeit: "schnitzen", text: "Schnitzen 3 % schneller" }),
  sTh(10, "Zaubernacht", "🔮", ["#f2e6ff", "#6f4fbf"], ["🔮", "🌙"], ["#6f4fbf", ["🔮", "⭐"]], ["hexe", "#6f4fbf", "⭐"], { name: "Zauber­spiegel", aussehen: { farbe: "#b48cff", form: "geist", extra: "sterne" } }, { name: "Fledermaus Mondschein", tier: "Fledermaus", emoji: "🦇", bonus: { art: "xp", wert: 0.03 }, text: "+3 % Erfahrung bei allem" }),
];

// Jahr 1 hat seine Sachen schon in daten-season.js bekommen – hier nur die Season-Nummern nachtragen
const SEASON_ALLE = [];
for (const t of SEASON_THEMEN) {
  t.nr = seasonNrAus(t.monat, 0);
  for (const teil of [HUETE.find(h => h.id === t.hut || h.id === `hs${t.monat}`), KLEIDUNG.find(k => k.id === t.kleidId), RAHMEN.find(r => r.id === t.rahmenId), HAUSTIERE.find(h => h.id === t.haustierId)])
    if (teil) teil.season = t.nr;
  SEASON_ALLE.push(t);
}
for (const [liste, jahr, b] of [[SEASON_JAHR2, 1, "B"], [SEASON_JAHR3, 2, "C"]]) {
  for (const t of liste) {
    const k = `${b}${t.monat}`;
    t.nr = seasonNrAus(t.monat, jahr);
    t.hut = `hs${k}`; t.kleidId = `ks${k}`; t.rahmenId = `rs${k}`; t.haustierId = `season${k}`;
    HUETE.push({ id: t.hut, name: `${t.titel}-Hut`, icon: t.icon, season: t.nr, svg: seasonHut(...t.hutForm) });
    KLEIDUNG.push({ id: t.kleidId, name: `${t.titel}-Pulli`, icon: t.icon, season: t.nr, svg: emojiKleid(...t.kleid) });
    RAHMEN.push({ id: t.rahmenId, name: `${t.titel}-Rahmen`, icon: t.icon, season: t.nr, svg: emojiRahmen(t.farben[1], t.rahmenEmoji) });
    HAUSTIERE.push({ id: t.haustierId, season: t.nr, ...t.haustier });
    SEASON_ALLE.push(t);
  }
}
SEASON_ALLE.sort((a, b) => a.nr - b.nr);
