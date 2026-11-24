"use strict";
// =====================================================
//  STERNENKUNDE – Anzeige: Sternbilder mit ihren Sternen (Kräfte kaufen) und die Einführung
// =====================================================

// Ein Sternbild als Bild: Nachthimmel mit verbundenen Sternen
function sternbildSvg(sb, klein = false) {
  const st = spiel.sterne?.[sb.id];
  const leuchtet = st ? st.k.reduce((a, b) => a + b, 0) + st.g : 0;
  const p = sb.punkte;
  const linien = p.slice(1).map(([x, y], i) => `<line x1="${p[i][0]}" y1="${p[i][1]}" x2="${x}" y2="${y}" stroke="#bfd0ff" stroke-opacity=".55" stroke-width="1.2"/>`).join("");
  const sterne = p.map(([x, y], i) => {
    const an = i < Math.ceil(leuchtet / 3) + 1;
    return `<circle cx="${x}" cy="${y}" r="${an ? 2.8 : 2}" fill="${an ? "#fff6b0" : "#d8e2ff"}"${an ? ` filter="url(#glimmen)"` : ""}/>`;
  }).join("");
  const funkeln = Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 37) % 100}" cy="${(i * 23) % 60}" r=".6" fill="#fff" opacity=".6"/>`).join("");
  return `<svg class="sbBild${klein ? " klein" : ""}" viewBox="0 0 100 60"><defs><radialGradient id="nacht" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#3b3f8f"/><stop offset="1" stop-color="#1c1f4a"/></radialGradient>
    <filter id="glimmen"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <rect width="100" height="60" rx="10" fill="url(#nacht)"/>${funkeln}${linien}${sterne}
    ${st?.g ? `<path d="${sternD(88, 10, 6)}" fill="#ffd54f" stroke="#fff" stroke-width=".8"/>` : ""}</svg>`;
}

function zeichneSternBereich(ziel) {
  const L = stufe("sterne");
  const splitter = anzahl("sternsplitter2"), gold = anzahl("goldsplitter5");
  let html = `<div class="karte sternKopf">
      <div class="sternVorrat"><span>${symbolHtml("sternsplitter2", "mini")} <b>${zahl(splitter)}</b> Sternsplitter</span><span>${symbolHtml("goldsplitter5", "mini")} <b>${zahl(gold)}</b> Goldsplitter</span></div>
      <p class="hinweis">Beobachte unten ein Sternbild – dann bekommst du Sternsplitter. Damit lässt du hier die Sterne leuchten: Jeder Stern macht dich für immer besser!</p>
      <button type="button" class="knopf leise" id="sternEinfuehrung">❔ Einführung nochmal ansehen</button></div>
    <h3 class="rasterTitel">✨ Sternbilder und ihre Kräfte</h3>`;
  for (const sb of STERNBILDER) {
    const st = sternStand(sb.id);
    if (L < sb.stufe) {
      html += `<div class="karte sternbildKarte zu">${sternbildSvg(sb, true)}<div><b>${sb.icon} ${sb.name}</b><small>🔒 ab Sternenkunde-Stufe ${sb.stufe} · für ${sternName(sb)}</small></div></div>`;
      continue;
    }
    const zeile = (nr, art, stufeJetzt, max, text, textNaechste, icon) => {
      const k = sternKosten(sb, nr);
      const knopf = !k ? `<span class="sternVoll">✅ voll</span>`
        : L < k.stufe ? `<span class="sternSperre">🔒 Stufe ${k.stufe}</span>`
        : `<button type="button" class="knopf kaufen sternKaufen" data-sb="${sb.id}" data-nr="${nr}" ${anzahl(k.id) < k.n ? "disabled" : ""}>${symbolHtml(k.id, "mini")} ${zahl(k.n)}</button>`;
      const punkte = Array.from({ length: max }, (_, i) => `<i class="${i < stufeJetzt ? "an" : ""}${nr === "g" ? " gold" : ""}"></i>`).join("");
      return `<div class="sternZeile${nr === "g" ? " golden" : ""}"><span class="sternIcon">${icon}</span>
        <span class="sternText"><b>${stufeJetzt ? text : textNaechste}</b><span class="sternPunkte">${punkte}</span>
        ${stufeJetzt && k ? `<small>Nächste Stufe: ${textNaechste}</small>` : ""}</span>${knopf}</div>`;
    };
    const kraefte = sb.kraefte.map((kr, i) => zeile(i, kr.art, st.k[i], STERNE.maxNormal, kraftText(sb, kr.art, st.k[i]), kraftText(sb, kr.art, st.k[i] + 1), KRAFT_ICONS[kr.art])).join("");
    const golden = zeile("g", sb.gold.art, st.g, STERNE.maxGold, goldText(sb, st.g), goldText(sb, st.g + 1), "🌟");
    html += `<div class="karte sternbildKarte" data-sternbild="${sb.id}">${sternbildSvg(sb)}
      <h3>${sb.icon} ${sb.name} <small>für ${sb.fertigkeiten.map(f => fertigkeit(f).icon).join(" ")} ${sternName(sb)}</small></h3>
      ${kraefte}${golden}</div>`;
  }
  ziel.innerHTML = html;
  ziel.querySelector("#sternEinfuehrung").addEventListener("click", () => { ton.klick(); zeigeSternEinfuehrung(); });
  for (const b of ziel.querySelectorAll(".sternKaufen")) b.addEventListener("click", () => {
    const sb = STERNBILDER.find(x => x.id === b.dataset.sb);
    const nr = b.dataset.nr === "g" ? "g" : Number(b.dataset.nr);
    if (!kaufeStern(sb, nr)) { ton.nein(); return; }
    ton.stufe();
    herzchen(b);
    melde(`🌟 Ein Stern leuchtet: ${nr === "g" ? goldText(sb, sternStand(sb.id).g) : kraftText(sb, sb.kraefte[nr].art, sternStand(sb.id).k[nr])}`, "gross");
    for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
    speichern(); zeichneKopf(); zeichneFertigkeit();
  });
}

// ===================== EINFÜHRUNG =====================
const STERN_EINFUEHRUNG = [
  { titel: "🔭 Sternenkunde", bild: () => sternbildSvg(STERNBILDER[0]),
    text: () => `Du hast deinen ersten Abenteuer-Pfad geschafft! Auf dem Heimweg schaut ${figurName()} in den Himmel – und entdeckt die Sterne. Ab jetzt gibt es eine neue Fertigkeit: <b>Sternenkunde</b>.` },
  { titel: "👀 Sternbilder beobachten", bild: () => `<div class="seBilder">${symbolHtml("sternsplitter2")}${symbolHtml("goldsplitter5")}</div>`,
    text: () => `Tippe ein Sternbild an. ${figurName()} beobachtet es dann ganz von allein – wie beim Holzsammeln. Dafür gibt es Erfahrung und <b>💫 Sternsplitter</b>. Ganz selten findest du einen <b>🌟 Goldsplitter</b>! Neue Sternbilder gibt es ab Stufe ${STUFEN.slice(1).join(", ")}.` },
  { titel: "✨ Sterne leuchten lassen", bild: () => sternbildSvg(STERNBILDER[1]),
    text: () => `Jedes Sternbild gehört zu zwei Fertigkeiten – das Eichhörnchen zum Beispiel zu Holzsammeln und Schnitzen. Mit Sternsplittern lässt du seine <b>3 Sterne</b> leuchten: ⏱️ schneller, ✨ öfter doppelt, 📈 mehr Erfahrung. Jeder Stern hat ${STERNE.maxNormal} Stufen und hilft dir für immer.` },
  { titel: "🌟 Goldene Sterne", bild: () => `<div class="seBilder">${symbolHtml("goldsplitter5")}</div>`,
    text: () => `Jedes Sternbild hat auch einen <b>goldenen Stern</b> mit einer besonderen Kraft – zum Beispiel mehr Bankfächer oder länger arbeiten, wenn das Spiel zu ist. Dafür brauchst du Goldsplitter. Höhere Stern-Stufen brauchen eine höhere Sternenkunde-Stufe. Viel Spaß beim Sternegucken!` },
];
let sternSeite = 0;
function zeichneSternEinfuehrung() {
  const s = STERN_EINFUEHRUNG[sternSeite], letzte = sternSeite === STERN_EINFUEHRUNG.length - 1;
  $("sternIntroInhalt").innerHTML = `<h2>${s.titel}</h2><div class="seBild">${s.bild()}</div><p>${s.text()}</p>
    <div class="sePunkte">${STERN_EINFUEHRUNG.map((_, i) => `<i class="${i === sternSeite ? "an" : ""}"></i>`).join("")}</div>`;
  $("sternIntroZurueck").hidden = sternSeite === 0;
  $("sternIntroWeiter").textContent = letzte ? "🔭 Los geht's!" : "Weiter ›";
}
function zeigeSternEinfuehrung() {
  sternSeite = 0;
  zeichneSternEinfuehrung();
  $("sternIntroOverlay").hidden = false;
}
// Beim ersten Freischalten automatisch zeigen (nicht über anderen Fenstern)
function pruefeSternEinfuehrung() {
  if (spiel.sternIntro || !sterneFrei()) return;
  if (document.querySelector(".overlay:not([hidden])") || !$("einfuehrung").hidden) return;
  spiel.sternIntro = true;
  speichern();
  ton.stufe();
  melde("🔭 Neue Fertigkeit: Sternenkunde!", "gross");
  zeigeSternEinfuehrung();
}
function richteSterneEin() {
  $("sternIntroWeiter").addEventListener("click", () => {
    ton.klick();
    if (sternSeite < STERN_EINFUEHRUNG.length - 1) { sternSeite++; zeichneSternEinfuehrung(); return; }
    $("sternIntroOverlay").hidden = true;
    offeneFertigkeit = "sterne"; zeigeSeite("seiteFertigkeit");
  });
  $("sternIntroZurueck").addEventListener("click", () => { ton.klick(); sternSeite = Math.max(0, sternSeite - 1); zeichneSternEinfuehrung(); });
  $("sternIntroX").addEventListener("click", () => { ton.klick(); $("sternIntroOverlay").hidden = true; });
  jedeSekunde(pruefeSternEinfuehrung, 2);
}
