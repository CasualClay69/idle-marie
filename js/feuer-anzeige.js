"use strict";
// =====================================================
//  LAGERFEUER – Anzeige: großes Lagerfeuer anzünden, Restzeit, Einführung
// =====================================================

// Ein gemaltes Lagerfeuer (an oder aus)
function lagerfeuerSvg(an) {
  const flammen = an ? `<g class="flammen"><path d="M50 18Q66 38 60 52Q56 62 50 62Q44 62 40 52Q34 38 50 18Z" fill="#ff8a2a"/>
      <path d="M50 32Q60 44 56 54Q53 60 50 60Q47 60 44 54Q40 44 50 32Z" fill="#ffd54f"/><path d="M50 44Q55 50 53 56Q51 59 50 59Q49 59 47 56Q45 50 50 44Z" fill="#fff6b0"/></g>
      <circle cx="30" cy="20" r="1.6" fill="#ffd54f" class="funke"/><circle cx="70" cy="14" r="1.3" fill="#ffb347" class="funke f2"/>`
    : `<path d="M44 56Q40 48 46 44Q48 50 52 46Q56 52 52 58Z" fill="#b8b0a8" opacity=".8"/>`;
  return `<svg class="lagerfeuerBild${an ? " an" : ""}" viewBox="0 0 100 80">
    <ellipse cx="50" cy="70" rx="40" ry="7" fill="${an ? "#ffe6a8" : "#e8e0d8"}" opacity=".7"/>
    <rect x="22" y="58" width="56" height="9" rx="4.5" fill="#a8693a" transform="rotate(-14 50 62)"/>
    <rect x="22" y="58" width="56" height="9" rx="4.5" fill="#c98a5a" transform="rotate(14 50 62)"/>
    ${[18, 30, 70, 82].map((x, i) => `<circle cx="${x}" cy="${68 + (i % 2) * 3}" r="5" fill="#9aa3b5"/>`).join("")}
    ${flammen}</svg>`;
}

function feuerRestText() {
  const min = Math.ceil(Math.max(0, spiel.lagerfeuer.bis - Date.now()) / 60000);
  return min >= 60 ? `${Math.floor(min / 60)} Std. ${min % 60} Min.` : `${min} Min.`;
}

function zeichneFeuerBereich(ziel) {
  const L = stufe("feuer");
  let html;
  if (feuerBrennt()) {
    const t = spiel.lagerfeuer.tier;
    html = `<div class="karte feuerKarte an">${lagerfeuerSvg(true)}
      <div><b>🔥 Dein großes Lagerfeuer brennt!</b>
      <p>+${Math.round(feuerBonusFuer(t) * 100)} % Erfahrung bei allem · noch <b id="feuerRest">${feuerRestText()}</b></p>
      <small>Angezündet mit ${GEGENSTAENDE[`holz${t}`].name}</small></div></div>`;
  } else {
    const knoepfe = HOLZ.map((name, i) => {
      if (L < STUFEN[i]) return "";
      const id = `holz${i}`, ok = anzahl(id) >= FEUER.holz;
      return `<button type="button" class="feuerHolz" data-tier="${i}" ${ok ? "" : "disabled"}>${symbolHtml(id, "mini")}
        <span><b>${name}</b><small>+${Math.round(feuerBonusFuer(i) * 100)} % · ${FEUER.holz} Stück (${zahl(anzahl(id))})</small></span></button>`;
    }).join("");
    html = `<div class="karte feuerKarte">${lagerfeuerSvg(false)}
      <div><b>Großes Lagerfeuer</b><p>Zünde mit ${FEUER.holz} Holz ein großes Feuer an. ${FEUER.minuten} Minuten lang gibt es mehr Erfahrung bei <b>allem</b> – auch wenn das Spiel zu ist. Besseres Holz = mehr Bonus!</p></div>
      <div class="feuerHolzListe" id="lagerfeuerAn">${knoepfe}</div></div>`;
  }
  const asche = anzahl("asche0");
  html += `<div class="karte ascheKarte">${symbolHtml("asche0")}<div><b>${zahl(asche)} Asche</b>
    <small>Asche ist Dünger! Im 🌱 Garten wachsen gedüngte Beete sofort ${Math.round(FEUER.duengerSchneller * 100)} % weiter und bringen ${Math.round(FEUER.duengerMehr * 100)} % mehr Ernte.</small></div>
    <button type="button" class="knopf leise" id="feuerEinfuehrung">❔</button></div>`;
  ziel.innerHTML = html;
  for (const b of ziel.querySelectorAll(".feuerHolz")) b.addEventListener("click", () => {
    if (!zuendeAn(Number(b.dataset.tier))) { ton.nein(); return; }
    ton.stufe(); herzchen(b);
    melde(`🔥 Das große Lagerfeuer brennt! +${Math.round(feuerBonus() * 100)} % Erfahrung bei allem`, "gross");
    for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
    speichern(); zeichneTrankLeiste(); zeichneFertigkeit();
  });
  ziel.querySelector("#feuerEinfuehrung").addEventListener("click", () => { ton.klick(); zeigeFeuerEinfuehrung(); });
}

// ===================== EINFÜHRUNG =====================
const FEUER_EINFUEHRUNG = [
  { titel: "🔥 Das Lagerfeuer", bild: () => lagerfeuerSvg(true),
    text: () => `Drei Abenteuer-Pfade geschafft – jetzt wird es gemütlich! Abends am Lagerfeuer wärmt sich ${figurName()} auf. Ab jetzt gibt es eine neue Fertigkeit: <b>Lagerfeuer</b>.` },
  { titel: "🪵 Holz verbrennen", bild: () => `<div class="seBilder">${symbolHtml("holz0")}${symbolHtml("asche0")}</div>`,
    text: () => `Tippe eine Holzsorte an – ${figurName()} legt dann immer wieder Holz ins Feuer. Dafür gibt es Erfahrung und <b>Asche</b>. Bessere Holzsorten kannst du ab Stufe ${STUFEN.slice(1).join(", ")} verbrennen.` },
  { titel: "✨ Großes Lagerfeuer", bild: () => lagerfeuerSvg(true),
    text: () => `Mit ${FEUER.holz} Holz zündest du ein <b>großes Lagerfeuer</b> an. ${FEUER.minuten} Minuten lang bekommst du mehr Erfahrung bei <b>allem</b> – beim Sammeln, Herstellen und Kämpfen. Je besser das Holz, desto größer der Bonus!` },
  { titel: "🌱 Asche ist Dünger", bild: () => `<div class="seBilder">${symbolHtml("asche0")}<span class="dGrossBilder"><span>🌱</span></span></div>`,
    text: () => `Streu Asche auf deine Beete: Im Garten gibt es jetzt den Knopf <b>„Mit Asche düngen“</b>. Gedüngte Pflanzen wachsen sofort ein Stück weiter und bringen mehr Ernte. Viel Spaß am Feuer!` },
];
let feuerSeiteNr = 0;
function zeichneFeuerEinfuehrung() {
  const s = FEUER_EINFUEHRUNG[feuerSeiteNr], letzte = feuerSeiteNr === FEUER_EINFUEHRUNG.length - 1;
  $("feuerIntroInhalt").innerHTML = `<h2>${s.titel}</h2><div class="seBild">${s.bild()}</div><p>${s.text()}</p>
    <div class="sePunkte">${FEUER_EINFUEHRUNG.map((_, i) => `<i class="${i === feuerSeiteNr ? "an" : ""}"></i>`).join("")}</div>`;
  $("feuerIntroZurueck").hidden = feuerSeiteNr === 0;
  $("feuerIntroWeiter").textContent = letzte ? "🔥 Zum Lagerfeuer!" : "Weiter ›";
}
function zeigeFeuerEinfuehrung() { feuerSeiteNr = 0; zeichneFeuerEinfuehrung(); $("feuerIntroOverlay").hidden = false; }
function pruefeFeuerEinfuehrung() {
  if (spiel.feuerIntro || !feuerFrei()) return;
  if (document.querySelector(".overlay:not([hidden])") || !$("einfuehrung").hidden) return;
  spiel.feuerIntro = true;
  speichern();
  ton.stufe();
  melde("🔥 Neue Fertigkeit: Lagerfeuer!", "gross");
  zeigeFeuerEinfuehrung();
}

let letzterFeuerText = "";
function richteFeuerEin() {
  $("feuerIntroWeiter").addEventListener("click", () => {
    ton.klick();
    if (feuerSeiteNr < FEUER_EINFUEHRUNG.length - 1) { feuerSeiteNr++; zeichneFeuerEinfuehrung(); return; }
    $("feuerIntroOverlay").hidden = true;
    offeneFertigkeit = "feuer"; zeigeSeite("seiteFertigkeit");
  });
  $("feuerIntroZurueck").addEventListener("click", () => { ton.klick(); feuerSeiteNr = Math.max(0, feuerSeiteNr - 1); zeichneFeuerEinfuehrung(); });
  $("feuerIntroX").addEventListener("click", () => { ton.klick(); $("feuerIntroOverlay").hidden = true; });
  jedeSekunde(() => {
    pruefeFeuerEinfuehrung();
    // Restzeit und Leiste aktuell halten; wenn das Feuer ausgeht, Bescheid geben
    const text = feuerBrennt() ? feuerRestText() : "aus";
    if (text !== letzterFeuerText) {
      if (text === "aus" && letzterFeuerText && letzterFeuerText !== "aus") melde("🔥 Dein großes Lagerfeuer ist ausgegangen.");
      letzterFeuerText = text;
      zeichneTrankLeiste();
      if ($("feuerRest")) $("feuerRest").textContent = text;
      if (text === "aus" && aktuelleSeite === "seiteFertigkeit" && offeneFertigkeit === "feuer") zeichneFertigkeit();
    }
  });
}
