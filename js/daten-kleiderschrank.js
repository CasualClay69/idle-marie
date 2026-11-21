"use strict";
// =====================================================
//  KLEIDERSCHRANK – Hüte, Kleidung und Rahmen für die Figur
//
//  Jedes Teil: id, name, icon (für Listen), svg (Zeichnung) und woher man es bekommt:
//    preis   = im Kleiderschrank mit Münzen kaufen
//    quest   = Belohnung für einen Auftrag (wird in kleiderschrank.js an den Auftrag gehängt)
//    season  = kommt mit einem Season-Pass (noch gesperrt)
//  Koordinaten: wie die Figuren (viewBox 0–100, Kopf-Mitte 50/52, Kopf-Oberkante ≈ 21).
//  Hüte werden mit der Figur etwas kleiner gezeichnet, damit oben Platz ist.
// =====================================================

const stern = (x, y, r, farbe) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const w = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    p.push(`${(x + rr * Math.cos(w)).toFixed(1)} ${(y + rr * Math.sin(w)).toFixed(1)}`);
  }
  return `<path d="M${p.join(" L")} Z" fill="${farbe}"/>`;
};
const herz = (x, y, s, farbe) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 4C-5 0 -6 -3 -3 -5C-1.5 -6 0 -5 0 -3.5C0 -5 1.5 -6 3 -5C6 -3 5 0 0 4Z" fill="${farbe}"/>`;
const bluete = (x, y, r, farbe, mitte = "#ffd54f") =>
  [0, 72, 144, 216, 288].map(w => `<circle cx="${(x + r * Math.cos(w * Math.PI / 180)).toFixed(1)}" cy="${(y + r * Math.sin(w * Math.PI / 180)).toFixed(1)}" r="${r * 0.75}" fill="${farbe}"/>`).join("")
  + `<circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="${mitte}"/>`;

// ===================== HÜTE =====================
const HUETE = [
  { id: "h0", name: "Ohne Hut", icon: "🙂", svg: "", gratis: true },
  { id: "h1", name: "Strohhut", icon: "👒", preis: 200, svg: `<ellipse cx="50" cy="27" rx="38" ry="8" fill="#e9c46a" stroke="#c49a3a" stroke-width="2"/>
    <path d="M29 27Q30 6 50 6Q70 6 71 27Z" fill="#f4d58d" stroke="#c49a3a" stroke-width="2"/><path d="M30 20Q50 24 70 20L71 26Q50 30 29 26Z" fill="#ff7eb6"/>
    ${bluete(66, 22, 4, "#fff")}` },
  { id: "h2", name: "Schleife", icon: "🎀", preis: 300, svg: `<path d="M50 22L30 10Q24 22 30 32Z M50 22L70 10Q76 22 70 32Z" fill="#ff5fa2" stroke="#d63384" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="50" cy="22" r="6" fill="#ff8fc4" stroke="#d63384" stroke-width="2"/>` },
  { id: "h3", name: "Wollmütze", icon: "🧶", preis: 600, svg: `<path d="M23 32Q22 4 50 4Q78 4 77 32Z" fill="#5fb7e8"/><path d="M32 10V30M41 6V30M50 5V30M59 6V30M68 10V30" stroke="#4a9bd0" stroke-width="2"/>
    <rect x="21" y="25" width="58" height="11" rx="5.5" fill="#e8f6ff" stroke="#b9d6ea" stroke-width="1.5"/><circle cx="50" cy="3" r="7" fill="#fff" stroke="#d6e8f5" stroke-width="1.5"/>` },
  { id: "h4", name: "Katzenohren", icon: "🐱", preis: 1000, svg: `<path d="M24 30Q50 16 76 30" stroke="#5b2a4f" stroke-width="4" fill="none"/>
    <path d="M26 30L28 6L44 22Z M74 30L72 6L56 22Z" fill="#5b4a5a"/><path d="M30 25L31 13L39 21Z M70 25L69 13L61 21Z" fill="#ff9ec4"/>` },
  { id: "h5", name: "Partyhütchen", icon: "🥳", preis: 1500, svg: `<g transform="rotate(-12 50 24)"><path d="M36 28L52 -10L66 28Z" fill="#7ad7f0" stroke="#4aa3df" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="48" cy="10" r="3" fill="#ff5fa2"/><circle cx="56" cy="18" r="3" fill="#ffd54f"/><circle cx="46" cy="22" r="3" fill="#8fcf6a"/><circle cx="52" cy="-10" r="5" fill="#ffd54f"/></g>` },
  { id: "h6", name: "Kochmütze", icon: "👨‍🍳", quest: "Karotten-Suppe", svg: `<g fill="#fff" stroke="#d8d2e0" stroke-width="2"><circle cx="36" cy="10" r="11"/><circle cx="50" cy="4" r="12"/><circle cx="64" cy="10" r="11"/></g>
    <rect x="30" y="10" width="40" height="20" fill="#fff"/><rect x="28" y="22" width="44" height="10" rx="3" fill="#fff" stroke="#d8d2e0" stroke-width="2"/>` },
  { id: "h7", name: "Blumenkranz", icon: "🌸", quest: "Ernte dein erstes Beet", svg: `<path d="M22 30Q50 14 78 30" stroke="#6fbf6a" stroke-width="4" fill="none"/>
    ${[[24, 29, "#ff9fd0"], [33, 23, "#fff"], [42, 20, "#ffd54f"], [50, 19, "#ff7eb6"], [58, 20, "#b48cff"], [67, 23, "#fff"], [76, 29, "#ff9fd0"]].map(([x, y, f]) => bluete(x, y, 3.6, f)).join("")}` },
  { id: "h8", name: "Zauberhut", icon: "🧙", quest: "Braue einen Waldgeist-Trank", svg: `<path d="M28 27L58 -16Q60 4 74 27Z" fill="#8e6bd6" stroke="#6f4fbf" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="50" cy="27" rx="32" ry="6.5" fill="#6f4fbf"/>${stern(46, 10, 5, "#ffd54f")}${stern(60, 18, 3.5, "#fff6b0")}${stern(55, -2, 3, "#fff6b0")}` },
  { id: "h9", name: "Ritterhelm", icon: "⛑️", quest: "Volle Eisen-Ausrüstung", svg: `<path d="M22 36Q20 4 50 4Q80 4 78 36Z" fill="#c9d2e0" stroke="#7d8798" stroke-width="2.5"/>
    <path d="M50 4V36M24 26H76" stroke="#9aa3b5" stroke-width="2.5"/><path d="M50 4Q56 -10 70 -6Q62 0 58 8" fill="#ff5fa2"/>` },
  { id: "h10", name: "Krone", icon: "👑", quest: "Erreiche Gesamtstufe 250", svg: `<path d="M28 28L30 6L40 16L50 0L60 16L70 6L72 28Z" fill="#ffd54f" stroke="#c98a1a" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="28" y="24" width="44" height="7" rx="2" fill="#f5b942" stroke="#c98a1a" stroke-width="2"/>
    <circle cx="50" cy="14" r="3.5" fill="#ff5fa2"/><circle cx="38" cy="27" r="2.5" fill="#7ad7f0"/><circle cx="62" cy="27" r="2.5" fill="#8fcf6a"/>` },
  { id: "h11", name: "Piratenhut", icon: "🏴‍☠️", preis: 5000, svg: `<path d="M16 30Q22 4 50 8Q78 4 84 30Q50 18 16 30Z" fill="#3a2f4a" stroke="#241c30" stroke-width="2"/>
    <path d="M18 29Q50 20 82 29" stroke="#ffd54f" stroke-width="2.5" fill="none"/>${herz(50, 16, 1.4, "#ff5fa2")}` },
  { id: "h12", name: "Sternenreif", icon: "🌟", preis: 20000, svg: `<path d="M23 31Q50 15 77 31" stroke="#ffd54f" stroke-width="4" fill="none"/>
    <circle cx="50" cy="8" r="12" fill="#fff6b0" opacity=".5"/>${stern(50, 8, 10, "#ffd54f")}${stern(30, 20, 4, "#fff6b0")}${stern(70, 20, 4, "#fff6b0")}` },
  { id: "h13", name: "Regenbogen-Mütze", icon: "🌈", preis: 100000, svg: `<clipPath id="imMuetze"><path d="M23 32Q22 4 50 4Q78 4 77 32Z"/></clipPath>
    <g clip-path="url(#imMuetze)">${["#ff7a7a", "#ffb86b", "#ffd54f", "#8fcf6a", "#7ad7f0", "#b48cff"].map((f, i) => `<rect x="20" y="${4 + i * 5}" width="60" height="5" fill="${f}"/>`).join("")}</g>
    <rect x="21" y="27" width="58" height="9" rx="4.5" fill="#fff"/><circle cx="50" cy="3" r="7" fill="#ff9fd0"/>` },
  { id: "h14", name: "Weihnachtsmütze", icon: "🎅", season: "winter", svg: `<path d="M24 30Q28 2 56 2Q80 6 86 30L74 30Q70 16 66 18Z" fill="#e53946"/>
    <rect x="21" y="25" width="58" height="10" rx="5" fill="#fff"/><circle cx="84" cy="32" r="7" fill="#fff"/>` },
  { id: "h15", name: "Hasenohren", icon: "🐰", season: "ostern", svg: `<path d="M24 31Q50 17 76 31" stroke="#ff9fd0" stroke-width="4" fill="none"/>
    <ellipse cx="38" cy="2" rx="7" ry="20" fill="#fff" stroke="#e6d8e6" stroke-width="2" transform="rotate(-10 38 20)"/><ellipse cx="38" cy="4" rx="3.5" ry="14" fill="#ffc2d9" transform="rotate(-10 38 20)"/>
    <ellipse cx="62" cy="2" rx="7" ry="20" fill="#fff" stroke="#e6d8e6" stroke-width="2" transform="rotate(10 62 20)"/><ellipse cx="62" cy="4" rx="3.5" ry="14" fill="#ffc2d9" transform="rotate(10 62 20)"/>` },
];

// ===================== KLEIDUNG =====================
// muster: Zeichnung, die auf die Schultern geklebt wird (abgeschnitten an der Schulter-Form)
const SCHULTER_FORM = "M14 100Q16 80 50 78Q84 80 86 100Z";
function kleidSvg(farbe, muster = "", kragen = "#fff") {
  return `<clipPath id="imSchulter"><path d="${SCHULTER_FORM}"/></clipPath>
    <path d="${SCHULTER_FORM}" fill="${farbe}"/><g clip-path="url(#imSchulter)">${muster}</g>
    <path d="M40 79L50 88L60 79Q50 82 40 79Z" fill="${kragen}"/>`;
}
const punkte = (farbe) => [[24, 92], [34, 86], [44, 94], [56, 92], [66, 86], [76, 94], [30, 98], [62, 99], [50, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${farbe}"/>`).join("");
const streifen = (farbe) => [82, 88, 94, 100].map(y => `<rect x="10" y="${y}" width="80" height="3" fill="${farbe}"/>`).join("");

const KLEIDUNG = [
  { id: "k0", name: "Lieblings-Pulli", icon: "👕", gratis: true },   // die Farbe der Figur
  { id: "k1", name: "Rosa", icon: "🩷", preis: 300, svg: () => kleidSvg("#ff9fc8") },
  { id: "k2", name: "Himmelblau", icon: "🩵", preis: 300, svg: () => kleidSvg("#7ac4f0") },
  { id: "k3", name: "Mintgrün", icon: "💚", preis: 300, svg: () => kleidSvg("#8fdcb0") },
  { id: "k4", name: "Sonnengelb", icon: "💛", preis: 300, svg: () => kleidSvg("#ffd54f") },
  { id: "k5", name: "Lavendel", icon: "💜", preis: 300, svg: () => kleidSvg("#c4a6f5") },
  { id: "k6", name: "Erdbeere", icon: "🍓", preis: 1500, svg: () => kleidSvg("#ff6b81", punkte("#fff"), "#8fcf6a") },
  { id: "k7", name: "Matrose", icon: "⚓", preis: 2500, svg: () => kleidSvg("#fff", streifen("#3f7fd6"), "#3f7fd6") },
  { id: "k8", name: "Herzchen", icon: "💕", preis: 4000, svg: () => kleidSvg("#ffd1e6", [[26, 92], [40, 86], [54, 95], [68, 88], [78, 96], [46, 99]].map(([x, y]) => herz(x, y, 0.9, "#ff5fa2")).join("")) },
  { id: "k9", name: "Sternenhimmel", icon: "🌌", quest: "Alter Baumgeist", svg: () => kleidSvg("#3b3f8f", [[24, 92], [38, 86], [52, 94], [66, 87], [78, 95], [44, 99]].map(([x, y]) => stern(x, y, 3, "#ffd54f")).join(""), "#ffd54f") },
  { id: "k10", name: "Regenbogen", icon: "🌈", quest: "Regenbogendrache", svg: () => kleidSvg("#fff", ["#ff7a7a", "#ffb86b", "#ffd54f", "#8fcf6a", "#7ad7f0", "#b48cff"].map((f, i) => `<rect x="10" y="${78 + i * 4}" width="80" height="4" fill="${f}"/>`).join("")) },
  { id: "k11", name: "Goldglanz", icon: "✨", preis: 250000, svg: () => kleidSvg("#f5c542", punkte("#fff6b0") + `<path d="M20 96Q50 84 80 96" stroke="#fff6b0" stroke-width="2" fill="none"/>`, "#fff6b0") },
];

// ===================== RAHMEN =====================
// ein Ring ganz außen um das Bild, mit kleinen Verzierungen
const ring = (farbe, breite = 4, extra = "") => `<circle cx="50" cy="50" r="${48 - breite / 2}" fill="none" stroke="${farbe}" stroke-width="${breite}"/>${extra}`;
const ringPunkte = (n, r = 46) => Array.from({ length: n }, (_, i) => {
  const w = Math.PI * 2 / n * i - Math.PI / 2;
  return [50 + r * Math.cos(w), 50 + r * Math.sin(w)];
});
const RAHMEN = [
  { id: "r0", name: "Ohne Rahmen", icon: "⚪", svg: "", gratis: true },
  { id: "r1", name: "Herzen", icon: "💗", preis: 500, svg: ring("#ff9fc8", 4, ringPunkte(6).map(([x, y]) => herz(x, y, 1.2, "#ff5fa2")).join("")) },
  { id: "r2", name: "Blumen", icon: "🌼", preis: 1500, svg: ring("#8fcf6a", 4, ringPunkte(8).map(([x, y], i) => bluete(x, y, 3, ["#fff", "#ffd1e6", "#fff6b0"][i % 3])).join("")) },
  { id: "r3", name: "Herbstblätter", icon: "🍂", preis: 3000, svg: ring("#e8a35a", 4, ringPunkte(8).map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="5.5" fill="${["#e8772e", "#f2b33d", "#c9532c"][i % 3]}" transform="rotate(${i * 45} ${x} ${y})"/>`).join("")) },
  { id: "r4", name: "Wolken", icon: "☁️", preis: 6000, svg: ring("#bfe3ff", 5, ringPunkte(7).map(([x, y]) => `<circle cx="${x - 2}" cy="${y}" r="4" fill="#fff"/><circle cx="${x + 2.5}" cy="${y - 1}" r="4.5" fill="#fff"/>`).join("")) },
  { id: "r5", name: "Sterne", icon: "⭐", quest: "Pusteblumen-Riese", svg: ring("#4a4fa8", 4, ringPunkte(8).map(([x, y]) => stern(x, y, 4, "#ffd54f")).join("")) },
  { id: "r6", name: "Gold", icon: "🥇", quest: "Burggespenst", svg: ring("#f5b942", 5, ringPunkte(4).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${["#ff5fa2", "#7ad7f0", "#8fcf6a", "#b48cff"][i]}" stroke="#c98a1a" stroke-width="1.5"/>`).join("")) },
  { id: "r7", name: "Diamant", icon: "💎", preis: 150000, svg: ring("#7ad7f0", 4, ringPunkte(10).map(([x, y]) => `<path d="M${x} ${y - 4}L${x + 3} ${y}L${x} ${y + 4}L${x - 3} ${y}Z" fill="#fff" stroke="#4aa3df" stroke-width="1"/>`).join("")) },
  { id: "r8", name: "Regenbogen", icon: "🌈", quest: "Regenbogendrache", svg: ["#ff7a7a", "#ffb86b", "#ffd54f", "#8fcf6a", "#7ad7f0", "#b48cff"].map((f, i) => {
      const a = Math.PI * 2 / 6 * i - Math.PI / 2, b = a + Math.PI * 2 / 6;
      const p = w => `${(50 + 46 * Math.cos(w)).toFixed(1)} ${(50 + 46 * Math.sin(w)).toFixed(1)}`;
      return `<path d="M${p(a)} A46 46 0 0 1 ${p(b)}" fill="none" stroke="${f}" stroke-width="5"/>`;
    }).join("") },
  { id: "r9", name: "Schneeflocken", icon: "❄️", season: "winter", svg: ring("#bfe3ff", 4, ringPunkte(8).map(([x, y]) => `<path d="M${x} ${y - 4}V${y + 4}M${x - 3.5} ${y - 2}L${x + 3.5} ${y + 2}M${x - 3.5} ${y + 2}L${x + 3.5} ${y - 2}" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`).join("")) },
];

const KLEIDERSCHRANK = [
  { id: "hut", name: "Hüte", icon: "👒", teile: HUETE },
  { id: "kleid", name: "Kleidung", icon: "👕", teile: KLEIDUNG },
  { id: "rahmen", name: "Rahmen", icon: "🖼️", teile: RAHMEN },
];
