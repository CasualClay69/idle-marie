"use strict";
// =====================================================
//  IKONEN – alle Bilder im Spiel sind gezeichnet, es gibt keine Emojis.
//  Im Code stehen weiter Emojis als "Platzhalter" (kurz und gut lesbar). Dieser Übersetzer
//  ersetzt sie beim Anzeigen automatisch durch die passende Zeichnung aus IKONEN
//  (ikonen-natur.js, ikonen-dinge.js, ikonen-tiere.js) – auch in Texten, die später dazukommen.
//  Unbekannte Emojis werden als kleiner Stern gezeichnet (und in der Konsole gemeldet).
// =====================================================

const IKONEN = {};
const EMOJI_MUSTER = /(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{2190}-\u{21FF}\u{2122}\u{2139}\u{24C2}\u{3030}\u{303D}\u{3297}\u{3299}\u{00A9}\u{00AE}\u{203C}\u{2049}](?:️)?(?:‍[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}](?:️)?)*)/gu;
// Zeichen, die keine Emojis sind, aber im selben Bereich liegen (bleiben Text)
const KEIN_EMOJI = new Set(["←", "→", "↑", "↓", "↔", "⇒"]);

// ----- Bausteine (alles im 32×32-Raster) -----
const umriss = f => (/^#f[ef]f/i.test(f) ? "#a08cb0" : f.startsWith("#") ? toene(f, -0.45) : "#5b2a4f");
const B = {
  p: (d, f, z = "") => `<path d="${d}" fill="${f}" stroke="${umriss(f)}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" ${z}/>`,
  k: (x, y, r, f, z = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${umriss(f)}" stroke-width="1.5" ${z}/>`,
  e: (x, y, rx, ry, f, z = "") => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${umriss(f)}" stroke-width="1.5" ${z}/>`,
  r: (x, y, w, h, rr, f, z = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rr}" fill="${f}" stroke="${umriss(f)}" stroke-width="1.5" ${z}/>`,
  l: (d, f, w = 1.8) => `<path d="${d}" fill="none" stroke="${f}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
  // ohne Umriss
  fp: (d, f, z = "") => `<path d="${d}" fill="${f}" ${z}/>`,
  fk: (x, y, r, f, z = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${z}/>`,
  glanz: (x, y, r = 1.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".75"/>`,
  augen: (x1, x2, y, r = 1.4) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="#3b2240"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#3b2240"/>
    <circle cx="${x1 + 0.45}" cy="${y - 0.5}" r="${r * 0.4}" fill="#fff"/><circle cx="${x2 + 0.45}" cy="${y - 0.5}" r="${r * 0.4}" fill="#fff"/>`,
  backen: (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="1.8" ry="1.1" fill="#ff9ec4" opacity=".7"/><ellipse cx="${x2}" cy="${y}" rx="1.8" ry="1.1" fill="#ff9ec4" opacity=".7"/>`,
  mund: (x, y) => `<path d="M${x - 1.6} ${y}Q${x} ${y + 1.6} ${x + 1.6} ${y}" fill="none" stroke="#3b2240" stroke-width="1" stroke-linecap="round"/>`,
};
const HERZ_D = "M16 27C6.5 20.5 3 15 5.6 10C8 5.6 13 5.6 16 9.6C19 5.6 24 5.6 26.4 10C29 15 25.5 20.5 16 27Z";
const sternD = (x, y, r, spitzen = 5, innen = 0.45) => {
  const p = [];
  for (let i = 0; i < spitzen * 2; i++) {
    const w = Math.PI / spitzen * i - Math.PI / 2, rr = i % 2 ? r * innen : r;
    p.push(`${(x + rr * Math.cos(w)).toFixed(1)} ${(y + rr * Math.sin(w)).toFixed(1)}`);
  }
  return `M${p.join(" L")}Z`;
};

function ikon(name, f) { IKONEN[name] = f; }

// Das Bild zu einem Emoji (fertiges <svg>)
function ikonSvg(emoji, klasse = "ik") {
  const schluessel = emoji.replace(/️/g, "");
  let inhalt = IKONEN[schluessel];
  if (inhalt === undefined) {
    if (!ikonSvg.gemeldet.has(schluessel)) { ikonSvg.gemeldet.add(schluessel); console.warn("Kein gezeichnetes Bild für", schluessel); }
    inhalt = B.p(sternD(16, 16, 11), "#ffd54f") + B.glanz(13, 12);
  }
  return `<svg class="${klasse}" viewBox="0 0 32 32" aria-hidden="true">${inhalt}</svg>`;
}
ikonSvg.gemeldet = new Set();

// Text mit Emojis -> HTML mit Zeichnungen (für Stellen, die selbst HTML bauen)
function mitIkonen(text) {
  return String(text).replace(EMOJI_MUSTER, e => (KEIN_EMOJI.has(e) ? e : ikonSvg(e)));
}

// ===================== DER ÜBERSETZER =====================
const SVG_NS = "http://www.w3.org/2000/svg";
function enthaeltEmoji(text) {
  EMOJI_MUSTER.lastIndex = 0;
  const m = text.match(EMOJI_MUSTER);
  return m && m.some(e => !KEIN_EMOJI.has(e));
}

// Ein Text-Knoten im normalen HTML
function ersetzeTextKnoten(knoten) {
  const text = knoten.nodeValue;
  if (!text || !enthaeltEmoji(text)) return;
  const eltern = knoten.parentNode;
  if (!eltern || eltern.closest?.(".ik")) return;
  const tag = eltern.nodeName.toLowerCase();
  if (tag === "script" || tag === "style" || tag === "textarea") return;
  // In Auswahllisten und Fenstertiteln geht kein Bild -> Emoji einfach weglassen
  if (tag === "option" || tag === "title") { knoten.nodeValue = text.replace(EMOJI_MUSTER, "").replace(/^\s+/, ""); return; }
  // Text in einer SVG-Zeichnung (z.B. Samentüte, Rahmen)
  if (eltern.namespaceURI === SVG_NS) { ersetzeSvgText(eltern); return; }
  const vorlage = document.createElement("span");
  vorlage.innerHTML = mitIkonen(text.replace(/[&<>]/g, z => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[z])));
  const stueck = document.createDocumentFragment();
  while (vorlage.firstChild) stueck.append(vorlage.firstChild);
  eltern.replaceChild(stueck, knoten);
}

// <text> in einer Zeichnung -> eingebettete Zeichnung an derselben Stelle
function ersetzeSvgText(textEl) {
  if (textEl.nodeName.toLowerCase() !== "text") textEl = textEl.closest?.("text") || textEl;
  const emoji = (textEl.textContent.match(EMOJI_MUSTER) || [])[0];
  if (!emoji) return;
  const groesse = parseFloat(textEl.getAttribute("font-size")) || 16;
  let x = parseFloat(textEl.getAttribute("x")) || 0;
  let y = parseFloat(textEl.getAttribute("y")) || 0;
  if (textEl.getAttribute("text-anchor") === "middle") x -= groesse / 2;
  if (textEl.getAttribute("dominant-baseline") === "central") y -= groesse / 2;
  else y -= groesse * 0.85;
  const g = document.createElementNS(SVG_NS, "g");
  g.innerHTML = ikonSvg(emoji).replace("<svg ", `<svg x="${x}" y="${y}" width="${groesse}" height="${groesse}" `);
  textEl.replaceWith(g);
}

function uebersetze(wurzel) {
  if (!wurzel) return;
  if (wurzel.nodeType === 3) { ersetzeTextKnoten(wurzel); return; }
  if (wurzel.nodeType !== 1 || wurzel.classList?.contains("ik")) return;
  const laeufer = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
  const liste = [];
  while (laeufer.nextNode()) liste.push(laeufer.currentNode);
  for (const k of liste) ersetzeTextKnoten(k);
}

function starteIkonen() {
  if (starteIkonen.laeuft) return;
  starteIkonen.laeuft = true;
  uebersetze(document.body);
  new MutationObserver(aenderungen => {
    for (const a of aenderungen) {
      if (a.type === "characterData") ersetzeTextKnoten(a.target);
      else for (const k of a.addedNodes) uebersetze(k);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
