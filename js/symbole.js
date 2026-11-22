"use strict";
// =====================================================
//  GEZEICHNETE SYMBOLE für Gegenstände (Holz, Fisch, Erz, Barren, Essen)
//  und die beiden Figuren (Hannah und Marie).
//  Alles als kleine SVG-Zeichnung, damit die Farben pro Material passen.
// =====================================================

// Farbe heller/dunkler machen (anteil -1 … 1)
function toene(hex, anteil) {
  const n = parseInt(hex.slice(1), 16);
  const kanal = (v) => Math.round(anteil < 0 ? v * (1 + anteil) : v + (255 - v) * anteil);
  const r = kanal(n >> 16), g = kanal((n >> 8) & 255), b = kanal(n & 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const SYMBOL_BAU = {
  holz: (f) => `<rect x="10" y="30" width="72" height="40" rx="20" fill="${toene(f, -0.25)}"/>
    <rect x="14" y="34" width="64" height="32" rx="16" fill="${f}"/>
    <ellipse cx="78" cy="50" rx="14" ry="20" fill="${toene(f, 0.35)}" stroke="${toene(f, -0.35)}" stroke-width="3"/>
    <ellipse cx="78" cy="50" rx="7" ry="10" fill="none" stroke="${toene(f, -0.2)}" stroke-width="2"/>
    <path d="M22 44H50M28 56H58" stroke="${toene(f, -0.3)}" stroke-width="3" stroke-linecap="round"/>`,
  fisch: (f) => `<path d="M12 50Q38 20 70 42L90 28V72L70 58Q38 80 12 50Z" fill="${f}" stroke="${toene(f, -0.35)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M30 50Q42 40 56 46" stroke="${toene(f, 0.4)}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="27" cy="45" r="5" fill="#fff"/><circle cx="28" cy="45" r="2.6" fill="#3b2240"/>
    <path d="M44 56Q50 62 56 56" stroke="${toene(f, -0.3)}" stroke-width="2.5" fill="none"/>`,
  essen: (f) => `<ellipse cx="50" cy="64" rx="40" ry="16" fill="#e8eef5" stroke="#b9c6d6" stroke-width="3"/>
    <ellipse cx="50" cy="61" rx="30" ry="10" fill="#fff"/>
    <path d="M24 56Q42 36 64 50L78 42V66L64 60Q42 72 24 56Z" fill="${toene(f, -0.1)}" stroke="${toene(f, -0.45)}" stroke-width="2.5"/>
    <path d="M34 54L40 60M44 50L50 58M54 50L60 58" stroke="${toene(f, -0.45)}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M40 30Q36 24 40 18M52 30Q48 24 52 18" stroke="#c9b6c4" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  erz: (f) => `<path d="M14 70L22 36L46 22L74 30L88 58L72 80H30Z" fill="#a8a2b0" stroke="#7d7686" stroke-width="3" stroke-linejoin="round"/>
    <path d="M22 36L46 44L74 30M46 44L50 78" stroke="#8f889a" stroke-width="2.5" fill="none"/>
    <path d="M30 52L38 48L42 56L34 60Z M58 48L66 46L68 54L60 56Z M54 64L62 62L60 70Z M38 30L44 28L46 34Z" fill="${f}" stroke="${toene(f, -0.4)}" stroke-width="1.5"/>`,
  barren: (f) => `<path d="M10 68L24 40H76L90 68Z" fill="${toene(f, -0.2)}" stroke="${toene(f, -0.45)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 40L32 28H68L76 40Z" fill="${toene(f, 0.3)}" stroke="${toene(f, -0.45)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M34 50H50" stroke="${toene(f, 0.5)}" stroke-width="4" stroke-linecap="round"/>`,
  samen: (f, g) => `<path d="M24 22H76L80 88H20Z" fill="${toene(f, 0.55)}" stroke="${toene(f, -0.4)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 22L30 14H70L76 22" fill="${toene(f, 0.2)}" stroke="${toene(f, -0.4)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M30 20L34 16M42 20L46 16M54 20L58 16M66 20L70 16" stroke="${toene(f, -0.3)}" stroke-width="2"/>
    <circle cx="50" cy="56" r="25" fill="#fff"/><text x="50" y="69" font-size="36" text-anchor="middle">${g?.emoji || ""}</text>`,
  trank: (f) => `<path d="M40 10H60V34Q82 44 80 66Q78 90 50 90Q22 90 20 66Q18 44 40 34Z" fill="#f4f8ff" stroke="#8a93a8" stroke-width="3" stroke-linejoin="round"/>
    <path d="M23 60Q50 52 77 60Q78 86 50 87Q22 86 23 60Z" fill="${f}"/>
    <circle cx="40" cy="70" r="4" fill="#fff" opacity=".7"/><circle cx="56" cy="76" r="2.6" fill="#fff" opacity=".7"/>
    <rect x="37" y="6" width="26" height="9" rx="3" fill="#c98a5a" stroke="#8a5a30" stroke-width="2"/>
    <path d="M30 44Q34 40 38 40" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  stoff: (f) => `<path d="M14 34Q30 26 50 34T86 34V74Q70 66 50 74T14 74Z" fill="${f}" stroke="${toene(f, -0.4)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 46Q30 38 50 46T86 46M14 60Q30 52 50 60T86 60" stroke="${toene(f, 0.45)}" stroke-width="3" fill="none"/>
    <path d="M24 30V78M76 30V78" stroke="${toene(f, -0.25)}" stroke-width="2" stroke-dasharray="3 3"/>`,
  edelstein: (f) => `<path d="M30 30H70L86 46L50 86L14 46Z" fill="${f}" stroke="${toene(f, -0.45)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 46H86M30 30L40 46L50 30L60 46L70 30M40 46L50 86L60 46" stroke="${toene(f, -0.3)}" stroke-width="2" fill="none"/>
    <path d="M34 36L40 44" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
  ring: (f) => `<ellipse cx="50" cy="62" rx="28" ry="24" fill="none" stroke="#f5b942" stroke-width="9"/><ellipse cx="50" cy="62" rx="28" ry="24" fill="none" stroke="#ffe08a" stroke-width="3"/>
    <path d="M38 30H62L70 38L50 56L30 38Z" fill="${f}" stroke="${toene(f, -0.45)}" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 34L44 38" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  kette: (f) => `<path d="M18 14Q50 70 82 14" fill="none" stroke="#f5b942" stroke-width="5" stroke-dasharray="6 3"/>
    <path d="M50 52L64 66L50 90L36 66Z" fill="${f}" stroke="${toene(f, -0.45)}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="50" cy="50" r="5" fill="#f5b942"/>
    <path d="M45 64L49 60" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  muenze: () => `<circle cx="50" cy="50" r="38" fill="#f5b942" stroke="#c98a1a" stroke-width="5"/><circle cx="50" cy="50" r="26" fill="none" stroke="#ffd98a" stroke-width="4"/>
    <path d="M50 36C44 30 34 34 36 42C38 50 50 58 50 58C50 58 62 50 64 42C66 34 56 30 50 36Z" fill="#ff7eb6"/>`,
};

// Symbol eines Gegenstands als HTML (SVG oder Emoji auf farbigem Kreis)
function symbolHtml(id, klasse = "symbol") {
  const g = GEGENSTAENDE[id];
  if (!g) return "";
  if (g.art === "emoji") return `<span class="${klasse} emojiSymbol" style="--tier:${g.farbe}">${g.emoji}</span>`;
  return `<span class="${klasse}" style="--tier:${g.farbe}"><svg viewBox="0 0 100 100" aria-hidden="true">${SYMBOL_BAU[g.art](g.farbe, g)}</svg></span>`;
}
function muenzeHtml(klasse = "muenze") {
  return `<span class="${klasse}"><svg viewBox="0 0 100 100" aria-hidden="true">${SYMBOL_BAU.muenze()}</svg></span>`;
}

// =====================================================
//  FIGUREN – Kopf und Schultern, im Stil von Marie Clicker
// =====================================================
const HAUT = "#ffdcc2";
function gesicht({ augen = "#3b2240", brille = false } = {}) {
  return `<ellipse cx="38" cy="54" rx="5" ry="6.2" fill="${augen}"/><ellipse cx="62" cy="54" rx="5" ry="6.2" fill="${augen}"/>
    <circle cx="39.8" cy="51.8" r="1.9" fill="#fff"/><circle cx="63.8" cy="51.8" r="1.9" fill="#fff"/>
    <ellipse cx="31" cy="64" rx="5.5" ry="3.4" fill="#ff9ec4" opacity=".6"/><ellipse cx="69" cy="64" rx="5.5" ry="3.4" fill="#ff9ec4" opacity=".6"/>
    <path d="M44 66Q50 71 56 66" stroke="#b0476f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${brille ? `<g fill="none" stroke="#5a3a24" stroke-width="2.6"><rect x="28" y="46" width="19" height="15" rx="6"/><rect x="53" y="46" width="19" height="15" rx="6"/><path d="M47 52Q50 50 53 52"/></g>` : ""}`;
}
function schultern(farbe, kragen = "#fff") {
  return `<path d="M14 100Q16 80 50 78Q84 80 86 100Z" fill="${farbe}"/><path d="M40 79L50 88L60 79Q50 82 40 79Z" fill="${kragen}"/>`;
}

const FIGUREN = [
  { id: "hannah", kleid: "#b48cff", kragen: "#fff", name: "Hannah", svg: `
    <path d="M18 46Q6 64 12 84Q20 76 24 60Z M82 46Q94 64 88 84Q80 76 76 60Z" fill="#e3b14f"/>
    %SCHULTERN%
    <rect x="43" y="68" width="14" height="14" fill="${HAUT}"/>
    <ellipse cx="50" cy="52" rx="27" ry="28" fill="${HAUT}"/>
    <path d="M22 52Q22 22 50 20Q78 22 78 52Q72 36 50 34Q30 36 22 52Z" fill="#fbe39a"/>
    <path d="M40 34Q46 42 56 36" stroke="#e3b14f" stroke-width="2" fill="none"/>
    <circle cx="20" cy="46" r="5" fill="#a77bff"/><circle cx="80" cy="46" r="5" fill="#a77bff"/>
    ${gesicht({ augen: "#2f4f8f" })}` },
  { id: "marie", kleid: "#ff7eb6", kragen: "#fff", name: "Marie", svg: `
    <path d="M20 54Q14 22 50 18Q86 22 80 54L82 84Q70 92 66 80L34 80Q30 92 18 84Z" fill="#b07d4f"/>
    %SCHULTERN%
    <rect x="43" y="68" width="14" height="14" fill="${HAUT}"/>
    <ellipse cx="50" cy="52" rx="27" ry="28" fill="${HAUT}"/>
    <path d="M22 50Q24 24 50 22Q76 24 78 50Q70 38 58 36Q54 42 44 40Q34 40 22 50Z" fill="#d4a373"/>
    <path d="M58 36Q64 30 70 34" stroke="#b07d4f" stroke-width="2" fill="none"/>
    <circle cx="74" cy="30" r="6" fill="#ff5fa2"/><circle cx="80" cy="34" r="4" fill="#ff9fd0"/>
    ${gesicht()}` },
];

// Figur zeichnen – mit Kleidung, Hut und Rahmen (siehe daten-kleiderschrank.js).
// look = { hut, kleid, rahmen }; ohne Angabe: bei der eigenen Figur das eigene Aussehen
function figurSvg(id, look) {
  const f = FIGUREN.find(x => x.id === id) || FIGUREN[0];
  if (look === undefined) look = (typeof spiel !== "undefined" && id === spiel.figur) ? spiel.aussehen : null;
  const l = look || {};
  const kleid = typeof KLEIDUNG !== "undefined" && KLEIDUNG.find(k => k.id === l.kleid);
  const hut = typeof HUETE !== "undefined" && HUETE.find(h => h.id === l.hut);
  const rahmen = typeof RAHMEN !== "undefined" && RAHMEN.find(r => r.id === l.rahmen);
  let inner = f.svg.replace("%SCHULTERN%", kleid?.svg ? kleid.svg(f) : schultern(f.kleid, f.kragen));
  if (hut?.svg) inner = `<g transform="translate(9 15) scale(.82)">${inner}${hut.svg}</g>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${inner}${rahmen?.svg || ""}</svg>`;
}
