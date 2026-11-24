"use strict";
// =====================================================
//  AUSGRABEN & MUSEUM – Anzeige (unter den Ausgrabungsorten) und Einführung
// =====================================================

// Das Museum als kleines gemaltes Gebäude
function museumSvg() {
  const voll = GRABUNGEN.filter(vitrineVoll).length;
  return `<svg class="museumBild" viewBox="0 0 120 70">
    <path d="M10 26L60 6L110 26Z" fill="#ffd9a8" stroke="#c9a06a" stroke-width="2" stroke-linejoin="round"/>
    <rect x="12" y="26" width="96" height="5" fill="#f2e6d0" stroke="#c9a06a" stroke-width="1.5"/>
    ${[22, 40, 58, 76, 94].map(x => `<rect x="${x - 4}" y="31" width="8" height="28" rx="2" fill="#fff8ee" stroke="#c9a06a" stroke-width="1.5"/>`).join("")}
    <rect x="8" y="59" width="104" height="6" rx="2" fill="#e8d5b5" stroke="#c9a06a" stroke-width="1.5"/>
    ${GRABUNGEN.map((o, i) => `<circle cx="${30 + i * 12}" cy="18" r="3" fill="${vitrineVoll(o) ? "#ffd54f" : "#fff"}" stroke="#c9a06a" stroke-width="1"/>`).join("")}
    <text x="60" y="68.5" font-size="0" fill="none">${voll}</text></svg>`;
}

function zeichneGrabBereich(ziel) {
  if (!grabenFrei()) { ziel.innerHTML = ""; return; }
  const L = stufe("graben");
  const chancen = FUND_GROESSEN.map(g => `<span class="fundChance">${g.name}: <b>${(fundChance(g.id) * 100).toLocaleString("de-DE", { maximumFractionDigits: 2 })} %</b></span>`).join("");
  const werkzeuge = GRABE_WERKZEUGE.map(w => {
    const n = grabWerkzeug(w.id), k = werkzeugKosten(w), grund = kannWerkzeugKaufen(w);
    const punkte = Array.from({ length: WERKZEUG_GRAB.stufen }, (_, i) => `<i class="${i < n ? "an" : ""}"></i>`).join("");
    return `<div class="jagdWare"><span class="sternIcon">${w.icon}</span><span class="sternText"><b>${w.name} <small>für ${FUND_GROESSEN.find(g => g.id === w.groesse).name}e Funde</small></b>
      <span class="sternPunkte">${punkte}</span><small>+${Math.round(WERKZEUG_GRAB.plusProStufe * 100)} % mehr ${FUND_GROESSEN.find(g => g.id === w.groesse).name}e Funde je Stufe
      ${k ? ` · ${Object.entries(k.sachen).map(([id, m]) => `${symbolHtml(id, "mini")} ${m}`).join(" ")} ${muenzeHtml("muenze klein")} ${zahl(k.muenzen)}` : ""}</small></span>
      ${!k ? `<span class="sternVoll">✅ voll</span>` : L < k.ab ? `<span class="sternSperre">🔒 Stufe ${k.ab}</span>`
        : `<button type="button" class="knopf kaufen grabWerkzeug" data-id="${w.id}" ${grund ? "disabled" : ""}>Verbessern</button>`}</div>`;
  }).join("");
  const spendbar = FUNDE.filter(f => !imMuseum(f.id) && anzahl(f.id) > 0).length;
  const vitrinen = GRABUNGEN.map(o => {
    const funde = FUNDE.filter(f => f.ort === o.id), drin = funde.filter(f => imMuseum(f.id)).length, voll = drin === funde.length;
    const offen = L >= o.stufe;
    return `<div class="vitrine${voll ? " voll" : ""}"><b>${o.icon} ${o.name} <small>${drin} / ${funde.length}</small></b>
      <div class="vitrineFaecher">${funde.map(f => imMuseum(f.id) ? `<span class="vFach drin seltenRahmen" style="${seltenheitStil(f.id)}" title="${f.name}">${symbolHtml(f.id, "mini")}</span>`
        : anzahl(f.id) > 0 ? `<button type="button" class="vFach spenden" data-id="${f.id}" title="${f.name} spenden">${symbolHtml(f.id, "mini")}<i>➕</i></button>`
        : `<span class="vFach leer" title="${offen ? f.name : "?"}">${offen ? "❔" : "🔒"}</span>`).join("")}</div>
      <small class="vBonus${voll ? " an" : ""}">${voll ? "✅ " : "🎁 Volle Vitrine: "}${o.vitrine.text}</small></div>`;
  }).join("");
  ziel.innerHTML = `<div class="karte"><h3>🍀 Fund-Chancen pro Grabung</h3><div class="fundChancen">${chancen}</div>
      <p class="hinweis">Jede Grabung bringt Krimskrams – und mit Glück ein Fundstück. Je seltener, desto wertvoller!</p></div>
    <div class="karte"><h3>🧰 Grabe-Werkzeuge</h3>${werkzeuge}</div>
    <div class="karte museumKarte"><div class="museumKopf">${museumSvg()}<div><h3>🏛️ Dein Museum</h3>
      <small>${museumAnzahl()} / ${FUNDE.length} Funde ausgestellt · ${GRABUNGEN.filter(vitrineVoll).length} volle Vitrinen</small>
      ${spendbar ? `<button type="button" class="knopf" id="alleSpenden">🏛️ Alles Neue spenden (${spendbar})</button>` : ""}</div></div>
      ${vitrinen}
      <p class="hinweis">Tippe ein Fundstück mit ➕ an, um es zu spenden. Jedes Stück nur einmal – doppelte kannst du in der Bank verkaufen.
      <button type="button" class="linkKnopf" id="grabenEinfuehrung">❔ Einführung nochmal ansehen</button></p></div>`;

  const nach = () => { for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross"); speichern(); zeichneKopf(); zeichneFertigkeit(); };
  const spendeMitMeldung = id => {
    const o = GRABUNGEN.find(x => x.id === GEGENSTAENDE[id].fund.ort), vorher = vitrineVoll(o);
    if (!spende(id)) return false;
    if (!vorher && vitrineVoll(o)) { ton.stufe(); melde(`🏛️ Die Vitrine „${o.name}“ ist voll! ${o.vitrine.text}`, "gross"); }
    return true;
  };
  for (const b of ziel.querySelectorAll(".spenden")) b.addEventListener("click", () => {
    const id = b.dataset.id;
    if (!spendeMitMeldung(id)) { ton.nein(); return; }
    ton.muenze(); herzchen(b); melde(`🏛️ ${GEGENSTAENDE[id].name} steht jetzt im Museum!`);
    nach();
  });
  ziel.querySelector("#alleSpenden")?.addEventListener("click", () => {
    let n = 0;
    for (const f of FUNDE) if (!imMuseum(f.id) && anzahl(f.id) > 0 && spendeMitMeldung(f.id)) n++;
    ton.muenze(); melde(`🏛️ ${n} Fundstück${n === 1 ? "" : "e"} gespendet!`);
    nach();
  });
  for (const b of ziel.querySelectorAll(".grabWerkzeug")) b.addEventListener("click", () => {
    const w = GRABE_WERKZEUGE.find(x => x.id === b.dataset.id);
    if (!kaufeGrabWerkzeug(w)) { ton.nein(); return; }
    ton.stufe(); herzchen(b); melde(`${w.icon} ${w.name} verbessert!`);
    nach();
  });
  ziel.querySelector("#grabenEinfuehrung").addEventListener("click", () => { ton.klick(); zeigeGrabenEinfuehrung(); });
}

// ===================== EINFÜHRUNG =====================
const GRABEN_EINFUEHRUNG = [
  { titel: "🦴 Ausgraben", bild: () => `<div class="seBilder dGrossBilder"><span>🦕</span><span>🦴</span><span>🏺</span></div>`,
    text: () => `Alle sechs Abenteuer-Pfade geschafft – du bist eine echte Abenteurerin! Auf deinen Reisen hast du überall alte Spuren gesehen. Jetzt wird gegraben: die neue Fertigkeit <b>Ausgraben</b>.` },
  { titel: "⛏️ Ausgrabungsorte", bild: () => `<div class="seBilder dGrossBilder">${GRABUNGEN.slice(0, 4).map(o => `<span>${o.icon}</span>`).join("")}</div>`,
    text: () => `Es gibt ${GRABUNGEN.length} Ausgrabungsorte – einen in jedem Gebiet. Tippe einen an, und ${figurName()} gräbt ganz von allein. Jede Grabung bringt Krimskrams und Erfahrung – und mit Glück ein <b>Fundstück</b>: klein, mittel, groß oder sogar riesig!` },
  { titel: "🧰 Grabe-Werkzeuge", bild: () => `<div class="seBilder dGrossBilder">${GRABE_WERKZEUGE.map(w => `<span>${w.icon}</span>`).join("")}</div>`,
    text: () => `Mit Sieb, Kelle, Pinsel und Schaufel findest du öfter Fundstücke. Jedes Werkzeug hilft bei einer Größe – die Schaufel bei den ganz seltenen riesigen Funden!` },
  { titel: "🏛️ Dein Museum", bild: () => museumSvg(),
    text: () => `Spende jedes Fundstück einmal an dein <b>Museum</b>. Hast du alle 8 Funde eines Ortes, ist die Vitrine voll – und du bekommst einen Bonus für immer. Kannst du das ganze Museum füllen?` },
];
let grabenSeiteNr = 0;
function zeichneGrabenEinfuehrung() {
  const s = GRABEN_EINFUEHRUNG[grabenSeiteNr], letzte = grabenSeiteNr === GRABEN_EINFUEHRUNG.length - 1;
  $("grabenIntroInhalt").innerHTML = `<h2>${s.titel}</h2><div class="seBild">${s.bild()}</div><p>${s.text()}</p>
    <div class="sePunkte">${GRABEN_EINFUEHRUNG.map((_, i) => `<i class="${i === grabenSeiteNr ? "an" : ""}"></i>`).join("")}</div>`;
  $("grabenIntroZurueck").hidden = grabenSeiteNr === 0;
  $("grabenIntroWeiter").textContent = letzte ? "🦴 Los geht's!" : "Weiter ›";
}
function zeigeGrabenEinfuehrung() { grabenSeiteNr = 0; zeichneGrabenEinfuehrung(); $("grabenIntroOverlay").hidden = false; }
function pruefeGrabenEinfuehrung() {
  if (spiel.grabenIntro || !grabenFrei()) return;
  if (document.querySelector(".overlay:not([hidden])") || !$("einfuehrung").hidden) return;
  spiel.grabenIntro = true;
  speichern();
  ton.stufe();
  melde("🦴 Neue Fertigkeit: Ausgraben!", "gross");
  zeigeGrabenEinfuehrung();
}
function richteGrabenEin() {
  $("grabenIntroWeiter").addEventListener("click", () => {
    ton.klick();
    if (grabenSeiteNr < GRABEN_EINFUEHRUNG.length - 1) { grabenSeiteNr++; zeichneGrabenEinfuehrung(); return; }
    $("grabenIntroOverlay").hidden = true;
    offeneFertigkeit = "graben"; zeigeSeite("seiteFertigkeit");
  });
  $("grabenIntroZurueck").addEventListener("click", () => { ton.klick(); grabenSeiteNr = Math.max(0, grabenSeiteNr - 1); zeichneGrabenEinfuehrung(); });
  $("grabenIntroX").addEventListener("click", () => { ton.klick(); $("grabenIntroOverlay").hidden = true; });
  setInterval(pruefeGrabenEinfuehrung, 1500);
}
