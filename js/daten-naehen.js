"use strict";
// =====================================================
//  NÄHEN – Daten
//  Im Garten wachsen Fasern -> beim Nähen daraus Stoff weben -> aus Stoff Kuscheltiere
//  (zum Verkaufen) und Kleidung, Hüte und einen Rahmen für den Kleiderschrank nähen.
//  Kleidung wird nur einmal genäht und landet direkt im Kleiderschrank.
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "bauen") + 1, 0,
  { id: "naehen", name: "Nähen", icon: "🧵", art: "machen", farbe: "#ff9fd0", tun: "näht" });

// ----- Fasern im Garten -----
const FASERN = [
  ["Baumwolle", "☁️"], ["Flachs", "🌾"], ["Bambus", "🎋"], ["Seidenblume", "🪷"],
  ["Wolkenwolle", "🌥️"], ["Glitzerfaser", "✨"], ["Mondfaden", "🌛"], ["Regenbogenfaser", "🌈"],
];
FASERN.forEach(([name, emoji], i) => {
  gegenstand(`faser${i}`, name, "emoji", TIER_FARBEN[i], Math.round(WERTE[i] * 1.5), { emoji });
  gegenstand(`samen-faser${i}`, `${name}-Samen`, "samen", TIER_FARBEN[i], Math.max(1, Math.round(SAMEN_PREIS[i] / 4)), { emoji, preis: SAMEN_PREIS[i] });
  PFLANZEN.push({ id: `faser${i}`, samen: `samen-faser${i}`, ertrag: `faser${i}`, name, emoji, art: "faser",
    stufe: STUFEN[i], minuten: Math.round(WACHSZEIT[i] * 1.1), xp: XP[i] * 24, menge: [12, 18] });
});

// ----- Stoff weben -----
const STOFFE = ["Baumwollstoff", "Leinen", "Bambusstoff", "Seide", "Wolkenstoff", "Glitzerstoff", "Mondstoff", "Regenbogenstoff"];
STOFFE.forEach((name, i) => {
  gegenstand(`stoff${i}`, name, "stoff", TIER_FARBEN[i], WERTE[i] * 4);
  taetigkeit({ id: `naehen-stoff${i}`, fertigkeit: "naehen", name, stufe: STUFEN[i], xp: Math.round(XP[i] * 1.3), zeit: 3,
    braucht: { [`faser${i}`]: 1 }, gibt: { [`stoff${i}`]: 1 } });
});

// ----- Kuscheltiere (bringen beim Verkaufen viele Münzen) -----
const KUSCHELTIERE = [["Stoffhase", "🐰"], ["Teddy", "🧸"], ["Stoffkatze", "🐱"], ["Stoffhund", "🐶"],
  ["Plüsch-Einhorn", "🦄"], ["Kuschelwal", "🐳"], ["Plüschfuchs", "🦊"], ["Plüschdrache", "🐉"]];
KUSCHELTIERE.forEach(([name, emoji], i) => {
  gegenstand(`kuschel${i}`, name, "emoji", TIER_FARBEN[i], WERTE[i] * 22, { emoji });
  taetigkeit({ id: `naehen-kuschel${i}`, fertigkeit: "naehen", name, stufe: Math.min(99, STUFEN[i] + 4), xp: Math.round(XP[i] * 3), zeit: 4,
    braucht: { [`stoff${i}`]: 3 }, gibt: { [`kuschel${i}`]: 1 } });
});

// ----- Kleidung, Hüte und ein Rahmen zum Selbernähen -----
const latzhose = () => kleidSvg("#5a8fd6", `<rect x="34" y="84" width="32" height="20" rx="3" fill="#4a7cc0"/><path d="M34 84L40 78M66 84L60 78" stroke="#4a7cc0" stroke-width="4"/>
  <circle cx="38" cy="87" r="2" fill="#ffd54f"/><circle cx="62" cy="87" r="2" fill="#ffd54f"/><rect x="44" y="90" width="12" height="8" rx="2" fill="#3f6aa8"/>`, "#ffe08a");
const KLEIDUNG_GENAEHT = [
  { id: "k20", name: "Latzhose", icon: "👖", stoff: 0, menge: 5, svg: latzhose },
  { id: "k21", name: "Blümchenkleid", icon: "🌼", stoff: 1, menge: 8, svg: () => kleidSvg("#fff3c4", [[26, 92], [40, 86], [54, 95], [68, 88], [78, 97], [46, 99]].map(([x, y], i) => bluete(x, y, 2.4, ["#ff9fd0", "#b48cff", "#7ad7f0"][i % 3])).join("")) },
  { id: "k22", name: "Ringelpulli", icon: "🌈", stoff: 2, menge: 10, svg: () => kleidSvg("#fff", ["#ff7a7a", "#ffd54f", "#7ad7f0", "#8fcf6a", "#b48cff"].map((f, i) => `<rect x="10" y="${80 + i * 5}" width="80" height="2.6" fill="${f}"/>`).join("")) },
  { id: "k23", name: "Kuschelpulli", icon: "🧶", stoff: 3, menge: 12, svg: () => kleidSvg("#e8c39e", [30, 42, 58, 70].map(x => `<path d="M${x} 80L${x + 3} 85L${x} 90L${x + 3} 95L${x} 100" stroke="#c99a6a" stroke-width="2.4" fill="none"/>`).join(""), "#f6e2c8") },
  { id: "k24", name: "Feenkleid", icon: "🧚", stoff: 4, menge: 15, svg: () => kleidSvg("#bff0d8", [[26, 92], [40, 86], [56, 94], [70, 88], [46, 99]].map(([x, y]) => stern(x, y, 2.6, "#fff")).join("") + `<path d="M20 96Q50 86 80 96" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>`) },
  { id: "k25", name: "Ballkleid", icon: "👗", stoff: 5, menge: 20, svg: () => kleidSvg("#c79bff", punkte("#ffe08a") + `<path d="M44 82L50 88L56 82L50 85Z" fill="#ff5fa2"/>`, "#ffe08a") },
  { id: "k26", name: "Mondmantel", icon: "🌙", stoff: 6, menge: 25, svg: () => kleidSvg("#3f4a8a", `<path d="M36 90A7 7 0 1 0 44 98A5.5 5.5 0 1 1 36 90Z" fill="#ffe08a"/>` + [[60, 88], [72, 94], [26, 96]].map(([x, y]) => stern(x, y, 2.4, "#fff")).join(""), "#c9d2e0") },
  { id: "k27", name: "Prinzessinnenkleid", icon: "👑", stoff: 7, menge: 30, svg: () => kleidSvg("#ff9fd0", [[30, 90], [50, 96], [70, 90]].map(([x, y]) => `<path d="M${x - 5} ${y + 3}L${x - 4} ${y - 3}L${x - 1.5} ${y}L${x} ${y - 4}L${x + 1.5} ${y}L${x + 4} ${y - 3}L${x + 5} ${y + 3}Z" fill="#ffd54f"/>`).join("") + punkte("#fff"), "#ffd54f") },
];
const HUETE_GENAEHT = [
  { id: "h20", name: "Haarband", icon: "🎗️", stoff: 0, menge: 3, svg: `<path d="M23 31Q50 15 77 31" stroke="#ff7eb6" stroke-width="6" fill="none" stroke-linecap="round"/>${bluete(68, 22, 4, "#fff", "#ff7eb6")}` },
  { id: "h21", name: "Bommelmütze", icon: "🧢", stoff: 2, menge: 6, svg: `<path d="M23 32Q22 4 50 4Q78 4 77 32Z" fill="#e8453a"/><path d="M24 16H76M23 24H77" stroke="#fff" stroke-width="3" opacity=".8"/>
      <rect x="21" y="26" width="58" height="10" rx="5" fill="#fff" stroke="#f0d0d0" stroke-width="1.5"/><circle cx="50" cy="2" r="8" fill="#fff" stroke="#f0d0d0" stroke-width="1.5"/>` },
  { id: "h22", name: "Schlapphut", icon: "👒", stoff: 4, menge: 10, svg: `<path d="M8 30Q20 22 30 26Q32 6 50 6Q68 6 70 26Q80 22 92 30Q86 38 70 32Q50 38 30 32Q14 38 8 30Z" fill="#c4a6f5" stroke="#8e6bd6" stroke-width="2"/>
      <path d="M30 24Q50 28 70 24L70 28Q50 32 30 28Z" fill="#ff9fd0"/><path d="M70 26Q80 32 76 40" stroke="#ff9fd0" stroke-width="3" fill="none"/>` },
  { id: "h23", name: "Prinzessinnen-Hut", icon: "👸", stoff: 6, menge: 15, svg: `<path d="M34 28L52 -18L68 28Z" fill="#ff9fd0" stroke="#d63384" stroke-width="2" stroke-linejoin="round"/>
      <path d="M52 -18Q72 0 78 30" stroke="#e8f6ff" stroke-width="6" fill="none" opacity=".8" stroke-linecap="round"/>
      <rect x="32" y="24" width="38" height="6" rx="3" fill="#ffd54f"/>${stern(52, 8, 3.5, "#fff")}${stern(48, 18, 2.5, "#fff")}` },
];
const RAHMEN_GENAEHT = [
  { id: "r20", name: "Kreuzstich", icon: "🪡", stoff: 3, menge: 8, svg: ring("#ffe0ec", 5, ringPunkte(16, 47.5).map(([x, y], i) =>
      `<path d="M${x - 2} ${y - 2}L${x + 2} ${y + 2}M${x + 2} ${y - 2}L${x - 2} ${y + 2}" stroke="${["#ff5fa2", "#7ad7f0", "#8fcf6a", "#b48cff"][i % 4]}" stroke-width="1.6"/>`).join("")) },
];

for (const [liste, ziel, art] of [[KLEIDUNG_GENAEHT, KLEIDUNG, "kleid"], [HUETE_GENAEHT, HUETE, "hut"], [RAHMEN_GENAEHT, RAHMEN, "rahmen"]]) {
  for (const t of liste) {
    const naehStufe = t.stoff ? Math.min(99, STUFEN[t.stoff] + 3) : 1;   // die ersten Sachen gehen sofort
    ziel.push({ id: t.id, name: t.name, icon: t.icon, svg: t.svg, naehen: naehStufe });
    taetigkeit({ id: `naehen-${t.id}`, fertigkeit: "naehen", name: t.name, stufe: naehStufe, xp: Math.round(XP[t.stoff] * 12), zeit: 6,
      braucht: { [`stoff${t.stoff}`]: t.menge }, gibt: {}, kleidung: t.id, kategorie: art });
  }
}

// ----- Neues Haustier fürs Nähen -----
HAUSTIERE.push({ id: "wolli", name: "Wolli", tier: "Schäfchen", emoji: "🐑", fertigkeit: "naehen", bonus: { art: "schneller", wert: 0.05 }, text: "Nähen 5 % schneller" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}
erfolg({ id: "naehen-schrank", icon: "🧵", name: "Kleine Schneiderin", text: "Näh alle 13 Kleidungsstücke, Hüte und Rahmen selbst", ziel: 13, muenzen: 500000,
  wert: () => [...KLEIDUNG_GENAEHT, ...HUETE_GENAEHT, ...RAHMEN_GENAEHT].filter(t => (spiel.garderobe || []).includes(t.id)).length });
