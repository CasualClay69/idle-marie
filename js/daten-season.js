"use strict";
// =====================================================
//  SEASON-PASS – Daten. Jeden Monat eine Season mit eigenem Thema (wie in Marie Clicker).
//  Die Themen wiederholen sich jedes Jahr – wer etwas verpasst, bekommt es im nächsten Jahr.
//
//  Je Season: Season-Monster (passt sich der Kampfstufe an), Season-Haustier (Stufe 30),
//  Hut (Stufe 25), Kleidung (Stufe 20) und Rahmen (Stufe 10) für den Kleiderschrank.
//  Season-Punkte gibt es für Tages- und Wochenaufgaben und für das Season-Monster.
// =====================================================

const SEASON = {
  stufen: 30,
  punkteProStufe: 100,
  tagesAufgaben: 3, tagesPunkte: 40,
  wochenAufgaben: 3, wochenPunkte: 150,
  monsterPunkte: 5,
  aufholTage: 7,       // verpasste Tagesaufgaben bleiben so lange offen
};
const MONATSNAMEN = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

// Kleine Emoji-Verzierungen für Rahmen und Kleidung
const emojiText = (e, x, y, g) => `<text x="${x}" y="${y}" font-size="${g}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
const emojiRahmen = (farbe, emojis) => ring(farbe, 4, ringPunkte(6).map(([x, y], i) => emojiText(emojis[i % emojis.length], x, y, 9)).join(""));
const emojiKleid = (farbe, emojis, kragen) => () => kleidSvg(farbe, [[26, 91], [42, 86], [58, 94], [72, 87], [36, 99], [66, 99]].map(([x, y], i) => emojiText(emojis[i % emojis.length], x, y, 7)).join(""), kragen);

// Neue Hüte für die Seasons (gezeichnet wie die anderen Hüte)
const SEASON_HUETE = {
  1: { name: "Eis-Diadem", icon: "💎", svg: `<path d="M24 30Q50 14 76 30" stroke="#bfe3ff" stroke-width="4" fill="none"/>
      <path d="M34 26L38 12L44 22L50 4L56 22L62 12L66 26Z" fill="#dff3ff" stroke="#7ab8e0" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="18" r="3" fill="#7ad7f0"/>` },
  2: { name: "Herz-Haarreif", icon: "💞", svg: `<path d="M24 31Q50 15 76 31" stroke="#ff5fa2" stroke-width="4" fill="none"/>${herz(50, 12, 3, "#ff5fa2")}${herz(34, 21, 1.6, "#ff9fd0")}${herz(66, 21, 1.6, "#ff9fd0")}` },
  4: { name: "Schmetterlings-Spange", icon: "🦋", svg: `<path d="M24 31Q50 15 76 31" stroke="#b48cff" stroke-width="4" fill="none"/>
      <ellipse cx="60" cy="12" rx="9" ry="7" fill="#ff9fd0" transform="rotate(-25 60 12)"/><ellipse cx="76" cy="12" rx="9" ry="7" fill="#ff9fd0" transform="rotate(25 76 12)"/>
      <ellipse cx="62" cy="24" rx="6" ry="5" fill="#ffd54f"/><ellipse cx="74" cy="24" rx="6" ry="5" fill="#ffd54f"/><rect x="66.5" y="8" width="3" height="20" rx="1.5" fill="#5b2a4f"/>` },
  5: { name: "Einhorn-Horn", icon: "🦄", svg: `<path d="M24 31Q50 15 76 31" stroke="#ff9fd0" stroke-width="4" fill="none"/>
      <path d="M43 22L50 -10L57 22Z" fill="#ffe08a" stroke="#d9a521" stroke-width="2" stroke-linejoin="round"/><path d="M45 14L55 10M46 6L54 3M47 -2L53 -5" stroke="#d9a521" stroke-width="1.6"/>
      ${bluete(36, 22, 3, "#b48cff")}${bluete(64, 22, 3, "#7ad7f0")}` },
  6: { name: "Feen-Blütenkrone", icon: "🧚", svg: `<path d="M22 30Q50 14 78 30" stroke="#8fcf6a" stroke-width="4" fill="none"/>
      ${[[26, 27, "#ffd1e6"], [37, 21, "#b48cff"], [50, 18, "#ff9fd0"], [63, 21, "#7ad7f0"], [74, 27, "#ffd1e6"]].map(([x, y, f]) => bluete(x, y, 4.5, f, "#fff6b0")).join("")}
      <ellipse cx="50" cy="6" rx="5" ry="9" fill="#e8f6ff" opacity=".8"/>` },
  7: { name: "Sonnenhut", icon: "👒", svg: `<ellipse cx="50" cy="27" rx="42" ry="9" fill="#ff9fd0" stroke="#d63384" stroke-width="2"/>
      <path d="M30 27Q31 8 50 8Q69 8 70 27Z" fill="#ffc2dc" stroke="#d63384" stroke-width="2"/><path d="M30 21Q50 25 70 21L70 26Q50 30 30 26Z" fill="#ffd54f"/>
      ${bluete(70, 22, 4.5, "#fff", "#ff7a7a")}` },
  8: { name: "Muschel-Krönchen", icon: "🐚", svg: `<path d="M24 31Q50 16 76 31" stroke="#7ad7f0" stroke-width="4" fill="none"/>
      <path d="M50 22L36 6Q50 -4 64 6Z" fill="#ffd1e6" stroke="#e68ab0" stroke-width="2"/><path d="M50 22L42 4M50 22V0M50 22L58 4" stroke="#e68ab0" stroke-width="1.6"/>
      <circle cx="34" cy="24" r="3" fill="#fff"/><circle cx="66" cy="24" r="3" fill="#fff"/>` },
  9: { name: "Drachenhörnchen", icon: "🐲", svg: `<path d="M24 31Q50 16 76 31" stroke="#8fcf6a" stroke-width="4" fill="none"/>
      <path d="M34 24Q28 8 36 2Q38 14 42 22Z M66 24Q72 8 64 2Q62 14 58 22Z" fill="#fff4d6" stroke="#c9a86a" stroke-width="2"/>
      <path d="M44 22L47 14L50 21L53 14L56 22" fill="#6fbf6a"/>` },
  10: { name: "Kürbis-Hexenhut", icon: "🎃", svg: `<path d="M28 27L56 -16Q60 4 74 27Z" fill="#3a2f4a" stroke="#241c30" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="50" cy="27" rx="32" ry="6.5" fill="#241c30"/><path d="M31 23Q50 27 71 23L72 27Q50 31 30 27Z" fill="#ff8a2a"/>
      <circle cx="58" cy="12" r="5" fill="#ff8a2a"/><path d="M58 7V4" stroke="#6fbf6a" stroke-width="2"/>` },
  11: { name: "Erntekranz", icon: "🌾", svg: `<path d="M22 30Q50 14 78 30" stroke="#c98a3a" stroke-width="4" fill="none"/>
      ${[[26, 26, -50], [36, 20, -25], [50, 17, 0], [64, 20, 25], [74, 26, 50]].map(([x, y, w], i) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="7" fill="${["#e8772e", "#f2b33d", "#c9532c"][i % 3]}" transform="rotate(${w} ${x} ${y})"/>`).join("")}
      <circle cx="43" cy="22" r="2.4" fill="#a0461c"/><circle cx="57" cy="22" r="2.4" fill="#a0461c"/>` },
};

const SEASON_THEMEN = [
  { monat: 1,  titel: "Winterwunderland", icon: "⛸️", farben: ["#dff3ff", "#7ab8e0"], hut: "hs1", rahmenEmoji: ["❄️", "⛸️"], kleid: ["#bfe3ff", ["❄️"]],
    monster: { name: "Schneeball­monster", aussehen: { farbe: "#f2fbff", form: "rund", extra: "flocken" } },
    haustier: { name: "Pinguinchen Polo", tier: "Pinguin", emoji: "🐧", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "angeln", text: "+3 % doppelte Fische" } },
  { monat: 2,  titel: "Valentinstag", icon: "💝", farben: ["#ffe0ec", "#ff5fa2"], hut: "hs2", rahmenEmoji: ["💗", "💌"], kleid: ["#ffd1e6", ["💗"]],
    monster: { name: "Kuschel­herz", aussehen: { farbe: "#ff9fc8", form: "rund", extra: "herz" } },
    haustier: { name: "Teddy Knuddel", tier: "Teddybär", emoji: "🧸", bonus: { art: "xp", wert: 0.02 }, text: "+2 % Erfahrung bei allem" } },
  { monat: 3,  titel: "Ostern", icon: "🐰", farben: ["#f3fbe6", "#8fcf6a"], hut: "h15", rahmenEmoji: ["🥚", "🌷"], kleid: ["#fff3b0", ["🥚", "🌷"]],
    monster: { name: "Eier­dieb-Hase", aussehen: { farbe: "#f3e9d9", ohren: "spitz", extra: "punkte" } },
    haustier: { name: "Küken Piep", tier: "Küken", emoji: "🐥", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "garten", text: "+3 % doppelte Ernte" } },
  { monat: 4,  titel: "Schmetterlingsgarten", icon: "🦋", farben: ["#f6ecff", "#b48cff"], hut: "hs4", rahmenEmoji: ["🦋", "🌸"], kleid: ["#e6d6ff", ["🦋"]],
    monster: { name: "Flatter­wind", aussehen: { farbe: "#c9a6f5", fluegel: true, extra: "sterne" } },
    haustier: { name: "Falterchen Flatti", tier: "Schmetterling", emoji: "🦋", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "holz", text: "+3 % doppeltes Holz" } },
  { monat: 5,  titel: "Einhornwiese", icon: "🦄", farben: ["#fff0f8", "#ff9fd0"], hut: "hs5", rahmenEmoji: ["🦄", "🌈"], kleid: ["#ffe0f0", ["🌈", "⭐"]],
    monster: { name: "Glitzer­pony", aussehen: { farbe: "#ffd1e6", hoerner: true, extra: "regenbogen" } },
    haustier: { name: "Igelchen Stupsi", tier: "Igel", emoji: "🦔", bonus: { art: "schutz", wert: 0.02 }, text: "2 % weniger Schaden" } },
  { monat: 6,  titel: "Feenwald", icon: "🧚", farben: ["#e8f8e8", "#6fbf6a"], hut: "hs6", rahmenEmoji: ["🍄", "✨"], kleid: ["#c9eccb", ["🍄", "✨"]],
    monster: { name: "Pilzfee", aussehen: { farbe: "#bfe8c0", fluegel: true, extra: "pilzhut" } },
    haustier: { name: "Rehkitz Tupfi", tier: "Rehkitz", emoji: "🦌", bonus: { art: "doppelt", wert: 0.03 }, fertigkeit: "bergbau", text: "+3 % doppeltes Erz" } },
  { monat: 7,  titel: "Sommer & Meer", icon: "🏖️", farben: ["#fff6d6", "#ffb347"], hut: "hs7", rahmenEmoji: ["☀️", "🍉"], kleid: ["#ffe08a", ["🍉", "☀️"]],
    monster: { name: "Sonnen­klecks", aussehen: { farbe: "#ffd54f", form: "tropfen", extra: "sterne" } },
    haustier: { name: "Schildi", tier: "Schildkröte", emoji: "🐢", bonus: { art: "schneller", wert: 0.03 }, fertigkeit: "kochen", text: "Kochen 3 % schneller" } },
  { monat: 8,  titel: "Meerjungfrauen", icon: "🧜‍♀️", farben: ["#dff6fb", "#4aa3df"], hut: "hs8", rahmenEmoji: ["🐚", "🫧"], kleid: ["#9ad8f5", ["🐚", "🫧"]],
    monster: { name: "Qualle­rich", aussehen: { farbe: "#9ad8f5", form: "geist", extra: "punkte" } },
    haustier: { name: "Robbe Kuller", tier: "Robbe", emoji: "🦭", bonus: { art: "treff", wert: 0.02 }, text: "+2 % öfter treffen" } },
  { monat: 9,  titel: "Wind & Drachen", icon: "🪁", farben: ["#e6f4ff", "#7ab8e0"], hut: "hs9", rahmenEmoji: ["🪁", "🍃"], kleid: ["#cfe9ff", ["🪁", "🍃"]],
    monster: { name: "Wind­geist", aussehen: { farbe: "#d6ecff", form: "wolke", extra: "blitz" } },
    haustier: { name: "Drachi", tier: "Drachenbaby", emoji: "🐉", bonus: { art: "kraft", wert: 0.02 }, text: "+2 % stärkerer Schlag" } },
  { monat: 10, titel: "Halloween", icon: "🎃", farben: ["#fff0e0", "#ff8a2a"], hut: "hs10", rahmenEmoji: ["🎃", "🦇"], kleid: ["#ffb86b", ["🎃", "🦇"]],
    monster: { name: "Kürbis­geist", aussehen: { farbe: "#ffa94d", form: "rund", extra: "kuerbis" } },
    haustier: { name: "Fledi", tier: "Fledermaus", emoji: "🦇", bonus: { art: "muenzen", wert: 0.05 }, text: "+5 % Münzen von Monstern" } },
  { monat: 11, titel: "Thanksgiving", icon: "🦃", farben: ["#fff0dc", "#e8772e"], hut: "hs11", rahmenEmoji: ["🍂", "🌽"], kleid: ["#f2c08a", ["🍂", "🌽"]],
    monster: { name: "Blätter­wirbel", aussehen: { farbe: "#e8a35a", extra: "blaetter" } },
    haustier: { name: "Truthahn Gobbel", tier: "Truthahn", emoji: "🦃", bonus: { art: "schneller", wert: 0.03 }, fertigkeit: "schnitzen", text: "Schnitzen 3 % schneller" } },
  { monat: 12, titel: "Weihnachten", icon: "🎅", farben: ["#fff0f0", "#e53946"], hut: "h14", rahmen: "r9", kleid: ["#e53946", ["⭐", "🎄"], "#fff"],
    monster: { name: "Leb­kuchen-Monster", aussehen: { farbe: "#c98a5a", extra: "punkte" } },
    haustier: { name: "Rentier Rudi", tier: "Rentier", emoji: "🦌", bonus: { art: "schneller", wert: 0.03 }, fertigkeit: "schmieden", text: "Schmieden 3 % schneller" } },
];

// Kleiderschrank und Haustiere um die Season-Sachen erweitern
for (const t of SEASON_THEMEN) {
  const m = t.monat;
  if (SEASON_HUETE[m]) HUETE.push({ id: `hs${m}`, season: m, ...SEASON_HUETE[m] });
  else HUETE.find(h => h.id === t.hut).season = m;
  KLEIDUNG.push({ id: `ks${m}`, name: `${t.titel}-Pulli`, icon: t.icon, season: m, svg: emojiKleid(...t.kleid) });
  if (t.rahmen) { RAHMEN.find(r => r.id === t.rahmen).season = m; t.rahmenId = t.rahmen; }
  else { RAHMEN.push({ id: `rs${m}`, name: `${t.titel}-Rahmen`, icon: t.icon, season: m, svg: emojiRahmen(t.farben[1], t.rahmenEmoji) }); t.rahmenId = `rs${m}`; }
  t.kleidId = `ks${m}`;
  t.haustierId = `season${m}`;
  HAUSTIERE.push({ id: t.haustierId, season: m, ...t.haustier });
}
