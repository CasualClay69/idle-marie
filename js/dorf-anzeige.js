"use strict";
// =====================================================
//  WICHTELDORF – Anzeige (eigene Seite statt Tätigkeiten) und Einführung
// =====================================================

function dorfUhrText() {
  const rest = Math.max(0, dorf().letzterTick + DORF.tickMinuten * 60000 - Date.now());
  const s = Math.ceil(rest / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Das Dorf als Bild: jedes Gebäude ein Häuschen auf der Wiese, freie Bauplätze gestrichelt
function dorfBildHtml() {
  const kacheln = [];
  for (const g of DORF_GEBAEUDE) for (let i = 0; i < dorfAnzahl(g.id); i++) kacheln.push(`<span class="dKachel" title="${g.name}">${g.icon}</span>`);
  const frei = Math.max(0, dorfPlaetze() - kacheln.length);
  const zeigeFrei = Math.min(frei, Math.max(0, 24 - kacheln.length));
  for (let i = 0; i < zeigeFrei; i++) kacheln.push(`<span class="dKachel frei"></span>`);
  const fest = festtag() ? `<div class="dWimpel">${"🎉🎈🎀".repeat(3)}</div>` : "";
  return `<div class="dorfBild${festtag() ? " fest" : ""}"><div class="dorfHimmel"><span class="dSonne">☀️</span>${fest}<span class="dWolke">☁️</span></div>
    <div class="dorfWiese">${kacheln.join("")}</div>
    <small>${dorfGesamt()} Gebäude · ${frei} Bauplätze frei${frei > zeigeFrei ? ` (+${frei - zeigeFrei} weitere)` : ""}</small></div>`;
}

function zeichneDorf(ziel) {
  if (!dorfFrei()) {
    ziel.innerHTML = `<div class="karte dorfZu"><span class="dGross">🏘️</span><p>Das Wichteldorf öffnet sich, wenn du <b>zwei Abenteuer-Pfade</b> geschafft hast.</p></div>`;
    return;
  }
  const d = dorf(), fl = dorfFleiss();
  const kornPlus = Math.round(dorfAnzahl("hof") * DORF_GEBAEUDE[1].korn * fl.faktor), hunger = dorfBewohner() * DORF.kornProWichtel;
  const warnungen = [];
  if (fl.besetzt < 1) warnungen.push(`🧚 Es fehlen Wichtel! Die Gebäude brauchen ${dorfArbeiterBedarf()}, es wohnen aber nur ${dorfBewohner()} im Dorf. Bau mehr Wichtelhäuser.`);
  if (kornPlus < hunger) warnungen.push(`🌽 Das Korn reicht nicht (${kornPlus} wächst, ${hunger} wird gegessen). Bau einen Bauernhof, sonst werden die Wichtel schlapp.`);
  const lager = Object.entries(d.lager).filter(([, n]) => n > 0);
  const lagerHtml = lager.length ? lager.map(([id, n]) => id === "muenzen"
      ? `<span class="dLagerDing">${muenzeHtml("muenze klein")} <b>${zahl(n)}</b></span>`
      : `<span class="dLagerDing">${symbolHtml(id, "mini")} <b>${zahl(n)}</b> ${GEGENSTAENDE[id].name}</span>`).join("")
    : `<span class="hinweis">Noch leer – die Wichtel arbeiten fleißig.</span>`;
  const werte = [
    ["🧚", "Wichtel", `${dorfBewohner()} / ${dorfBewohnerPlatz()}`],
    ["👷", "Arbeit", `${Math.round(fl.besetzt * 100)} %`],
    ["❤️", "Gesundheit", `${Math.round(d.gesundheit)} %`],
    ["🙂", "Glück", `${dorfGlueck()} %`],
    ["🌽", "Korn", `${zahl(d.korn)} (${kornPlus - hunger >= 0 ? "+" : ""}${kornPlus - hunger})`],
    ["✨", "Fleiß", `${Math.round(fl.faktor * 100)} %`],
  ].map(([i, n, w]) => `<div class="dWert"><span>${i}</span><b>${w}</b><small>${n}</small></div>`).join("");

  const gebaeude = DORF_GEBAEUDE.map(g => {
    const n = dorfAnzahl(g.id), k = dorfKosten(g), grund = dorfKannBauen(g);
    const ertrag = g.macht ? `${symbolHtml(dorfErtragId(g), "mini")} ${g.menge * n} ${GEGENSTAENDE[dorfErtragId(g)].name} pro Dorf-Tag`
      : g.muenzenProTag ? `${muenzeHtml("muenze klein")} ${zahl(g.muenzenProTag * n * (dorfTier() + 1) ** 2)} pro Dorf-Tag`
      : g.korn ? `🌽 ${g.korn * n} Korn pro Dorf-Tag` : g.glueck ? `🙂 +${g.glueck * n} Glück` : `🧚 Platz für ${n * DORF.bewohnerProHaus} Wichtel`;
    const kosten = k ? `${Object.entries(k.sachen).map(([id, m]) => `<span class="braucht${anzahl(id) < m ? " fehlt" : ""}">${symbolHtml(id, "mini")} ${m}</span>`).join("")}
      <span class="braucht${spiel.muenzen < k.muenzen ? " fehlt" : ""}">${muenzeHtml("muenze klein")} ${zahl(k.muenzen)}</span>` : "";
    return `<div class="karte dGebaeude" data-gebaeude="${g.id}"><span class="dIcon">${g.icon}</span>
      <div class="dText"><b>${g.name} <small>${n} / ${DORF.maxJeGebaeude}</small></b><small>${g.text}${g.arbeiter ? ` · braucht ${g.arbeiter} Wichtel` : ""}</small>
        ${n ? `<small class="dErtrag">${ertrag}</small>` : ""}
        ${k ? `<span class="dKosten">${kosten}</span>` : ""}</div>
      ${k ? `<button type="button" class="knopf kaufen dorfBauen" data-id="${g.id}" ${grund ? "disabled" : ""}>Bauen</button>` : `<span class="sternVoll">✅ alle</span>`}
      ${k && grund ? `<small class="dGrund">${grund}</small>` : ""}</div>`;
  }).join("");

  ziel.innerHTML = `<div class="dorfSeite">
    ${dorfBildHtml()}
    ${dorfFestHtml()}
    <div class="karte"><div class="dWerte">${werte}</div>
      <p class="dUhr">⏳ Nächster Dorf-Tag in <b id="dorfUhr">${dorfUhrText()}</b> · schon ${zahl(d.tage)} Dorf-Tage</p>
      ${warnungen.map(w => `<p class="dreieckHinweis schlecht">${w}</p>`).join("")}</div>
    <div class="karte"><h3>📦 Dorflager</h3><div class="dLager">${lagerHtml}</div>
      <button type="button" class="knopf" id="dorfAbholen" ${lager.length ? "" : "disabled"}>🧺 Alles abholen</button></div>
    <h3 class="rasterTitel">🔨 Gebäude <small>${dorfGesamt()} / ${dorfPlaetze()} Bauplätze · Sachen in Sorte „${GEGENSTAENDE[`holz${dorfTier()}`].name}“-Stufe</small></h3>
    ${gebaeude}
    <button type="button" class="knopf leise" id="dorfEinfuehrung">❔ Einführung nochmal ansehen</button>
    <p class="hinweis">🏘️ Alle ${DORF.tickMinuten} Minuten ist ein Dorf-Tag – auch wenn das Spiel zu ist. Mit höherer Dorf-Stufe gibt es mehr Bauplätze und bessere Sachen.</p></div>`;

  verdrahteDorfFest(ziel);
  ziel.querySelector("#dorfAbholen").addEventListener("click", () => {
    const r = dorfAbholen();
    if (r.geholt) { ton.muenze(); melde("🧺 Alles aus dem Dorflager abgeholt!"); }
    if (r.voll) melde("🏦 Die Bank ist voll – manches bleibt im Dorflager.");
    speichern(); zeichneKopf(); zeichneFertigkeit();
  });
  for (const b of ziel.querySelectorAll(".dorfBauen")) b.addEventListener("click", () => {
    const g = DORF_GEBAEUDE.find(x => x.id === b.dataset.id);
    const xp = dorfBaue(g);
    if (!xp) { ton.nein(); return; }
    ton.stufe(); herzchen(b);
    melde(`🏘️ ${g.name} gebaut! +${zahl(xp)} EP`, "gross");
    for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
    speichern(); zeichneKopf(); zeichneFertigkeit();
  });
  ziel.querySelector("#dorfEinfuehrung").addEventListener("click", () => { ton.klick(); zeigeDorfEinfuehrung(); });
}

// ===================== EINFÜHRUNG =====================
const DORF_EINFUEHRUNG = [
  { titel: "🏘️ Das Wichteldorf", bild: () => dorfBildHtml(),
    text: () => `Du hast schon zwei Abenteuer-Pfade geschafft! Das hat sich herumgesprochen: Kleine Wichtel möchten in deiner Nähe wohnen. Gründe mit ihnen dein eigenes <b>Wichteldorf</b>!` },
  { titel: "🔨 Gebäude bauen", bild: () => `<div class="seBilder dGrossBilder"><span>🏠</span><span>🪓</span><span>⛏️</span><span>🎣</span></div>`,
    text: () => `Mit Brettern, Barren und Münzen baust du Gebäude. In <b>Wichtelhäusern</b> wohnen die Wichtel. Im <b>Holzfäller</b>, in der <b>Mine</b> und in der <b>Fischerhütte</b> arbeiten sie – dafür braucht jedes Gebäude genug Wichtel.` },
  { titel: "🌽 Korn, Gesundheit und Glück", bild: () => `<div class="seBilder dGrossBilder"><span>🌾</span><span>❤️</span><span>🎠</span></div>`,
    text: () => `Wichtel essen jeden Dorf-Tag Korn vom <b>Bauernhof</b>. Reicht das Korn nicht, werden sie schlapp und arbeiten langsamer. Die <b>Kräuterhütte</b> macht sie gesund, der <b>Spielplatz</b> glücklich – glückliche Wichtel sind fleißiger!` },
  { titel: "📦 Dorf-Tag und Dorflager", bild: () => `<div class="seBilder dGrossBilder"><span>⏳</span><span>📦</span><span>🧺</span></div>`,
    text: () => `Alle ${DORF.tickMinuten} Minuten ist ein <b>Dorf-Tag</b> – auch wenn das Spiel zu ist. Dann legen die Wichtel Holz, Erz, Fisch, Kräuter und Münzen ins <b>Dorflager</b>. Hol alles ab, so oft du magst. Mit jedem Dorf-Tag wächst auch deine Dorf-Stufe!` },
];
let dorfSeiteNr = 0;
function zeichneDorfEinfuehrung() {
  const s = DORF_EINFUEHRUNG[dorfSeiteNr], letzte = dorfSeiteNr === DORF_EINFUEHRUNG.length - 1;
  $("dorfIntroInhalt").innerHTML = `<h2>${s.titel}</h2><div class="seBild">${s.bild()}</div><p>${s.text()}</p>
    <div class="sePunkte">${DORF_EINFUEHRUNG.map((_, i) => `<i class="${i === dorfSeiteNr ? "an" : ""}"></i>`).join("")}</div>`;
  $("dorfIntroZurueck").hidden = dorfSeiteNr === 0;
  $("dorfIntroWeiter").textContent = letzte ? "🏘️ Zum Dorf!" : "Weiter ›";
}
function zeigeDorfEinfuehrung() { dorfSeiteNr = 0; zeichneDorfEinfuehrung(); $("dorfIntroOverlay").hidden = false; }
function pruefeDorfEinfuehrung() {
  if (spiel.dorfIntro || !dorfFrei()) return;
  if (document.querySelector(".overlay:not([hidden])") || !$("einfuehrung").hidden) return;
  spiel.dorfIntro = true;
  dorf();
  speichern();
  ton.stufe();
  melde("🏘️ Neu: Dein Wichteldorf!", "gross");
  zeigeDorfEinfuehrung();
}

function richteDorfEin() {
  $("dorfIntroWeiter").addEventListener("click", () => {
    ton.klick();
    if (dorfSeiteNr < DORF_EINFUEHRUNG.length - 1) { dorfSeiteNr++; zeichneDorfEinfuehrung(); return; }
    $("dorfIntroOverlay").hidden = true;
    offeneFertigkeit = "dorf"; zeigeSeite("seiteFertigkeit");
  });
  $("dorfIntroZurueck").addEventListener("click", () => { ton.klick(); dorfSeiteNr = Math.max(0, dorfSeiteNr - 1); zeichneDorfEinfuehrung(); });
  $("dorfIntroX").addEventListener("click", () => { ton.klick(); $("dorfIntroOverlay").hidden = true; });
  pruefeDorf();
  jedeSekunde(() => {
    pruefeDorfEinfuehrung();
    if (pruefeDorf() && aktuelleSeite === "seiteFertigkeit" && offeneFertigkeit === "dorf") zeichneFertigkeit();
    const uhr = $("dorfUhr");
    if (uhr && spiel.dorf) uhr.textContent = dorfUhrText();
  });
}
