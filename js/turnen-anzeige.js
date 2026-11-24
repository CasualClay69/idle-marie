"use strict";
// =====================================================
//  ABENTEUER-SPIELPLATZ – Anzeige (eigene Seite) und Einführung
// =====================================================

// Der Parcours als Bild: ein Weg mit 8 Stationen (gebaut = bunt, frei = gestrichelt, gesperrt = Schloss)
function parcoursSvg() {
  const punkte = PARCOURS.map((_, i) => [14 + i * 24.5, i % 2 ? 26 : 54]);
  const weg = `M${punkte.map(([x, y]) => `${x} ${y}`).join(" L")}`;
  const stationen = PARCOURS.map((s, i) => {
    const [x, y] = punkte[i], o = stationOption(i), frei = stufe("turnen") >= s.stufe;
    return `<g><circle cx="${x}" cy="${y}" r="11" fill="${o ? "#fff" : frei ? "#ffffffaa" : "#e8e0ef"}" stroke="${o ? "#ff7eb6" : "#c9b8d8"}" stroke-width="2.5" ${o ? "" : 'stroke-dasharray="3 2"'}/>
      <text x="${x}" y="${y + 1}" font-size="13" text-anchor="middle" dominant-baseline="central">${o ? s.icon : frei ? "➕" : "🔒"}</text></g>`;
  }).join("");
  const podest = spiel.parcours?.podest ? `<text x="196" y="12" font-size="14" text-anchor="middle" dominant-baseline="central">🏆</text>` : "";
  return `<svg class="parcoursBild" viewBox="0 0 210 80"><rect width="210" height="80" rx="14" fill="#c9eeb8"/>
    <path d="${weg}" fill="none" stroke="#e8c39e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${weg}" fill="none" stroke="#fff3dc" stroke-width="2" stroke-dasharray="4 4"/>${stationen}${podest}</svg>`;
}

function zeichneTurnen(ziel) {
  if (!turnenFrei()) {
    ziel.innerHTML = `<div class="karte dorfZu"><span class="dGross">🤸</span><p>Der Abenteuer-Spielplatz öffnet sich, wenn du <b>fünf Abenteuer-Pfade</b> geschafft hast.</p></div>`;
    return;
  }
  const t = taetigkeitNachId("turnen-0"), n = gebauteStationen().length, laeuft = spiel.aktiv?.id === t.id;
  const lauf = `<button type="button" class="taetigkeit parcoursLauf${laeuft ? " laeuft" : ""}" data-id="${t.id}" ${n ? "" : "disabled"}>
    <span class="plIcon">🤸</span><span class="tName">${laeuft ? "⏸️ Parcours läuft – tippen zum Anhalten" : "▶ Parcours laufen"}</span>
    <span class="tWerte">${n ? `✨ ${t.xp} EP · ${muenzeHtml("muenze klein")} ${rundenMuenzen()} · ⏱️ ${sekunden(dauer(t))} pro Runde (${n} Hindernis${n === 1 ? "" : "se"})` : "Bau zuerst ein Hindernis!"}</span>
    <span class="uebung" title="Übung">⭐ ${uebungStufe(t.id)} <span class="balken duenn"><div style="width:${(fortschrittInStufe(spiel.uebung[t.id] || 0) * 100).toFixed(1)}%"></div></span></span>
    <span class="balken aktion"><div></div></span></button>`;

  const stationen = PARCOURS.map((s, i) => {
    const gesperrt = stufe("turnen") < s.stufe, jetzt = parcours().stationen[i];
    if (gesperrt) return `<div class="karte station zu"><span class="sternIcon">${s.icon}</span><div><b>${i + 1}. ${s.name}</b><small>🔒 ab Turnen-Stufe ${s.stufe}</small></div></div>`;
    const kosten = `${Object.entries(s.kosten).map(([id, m]) => `<span class="braucht${anzahl(id) < m ? " fehlt" : ""}">${symbolHtml(id, "mini")} ${m}</span>`).join("")}
      <span class="braucht${spiel.muenzen < s.muenzen ? " fehlt" : ""}">${muenzeHtml("muenze klein")} ${zahl(s.muenzen)}</span>`;
    const optionen = s.optionen.map((o, nr) => {
      const an = jetzt === nr, grund = kannStationBauen(i, nr);
      return `<div class="option${an ? " an" : ""}"><span class="optText"><b>${an ? "✅ " : ""}${o.name}</b><small>${bonusText(o.bonus)}</small></span>
        ${an ? `<span class="sternVoll">steht</span>` : `<button type="button" class="knopf kaufen stationBauen" data-i="${i}" data-nr="${nr}" ${grund ? "disabled" : ""}>${jetzt === null ? "Bauen" : "Umbauen"}</button>`}</div>`;
    }).join("");
    return `<div class="karte station" data-station="${i}"><h3>${s.icon} ${i + 1}. ${s.name} <small>✨ ${s.xp} EP · ${muenzeHtml("muenze klein")} ${s.gold} pro Runde</small></h3>
      ${optionen}<div class="dKosten">${kosten}</div>
      <small class="stHinweis">Pro Station steht immer nur ein Hindernis – du kannst es jederzeit umbauen (kostet neu).</small></div>`;
  }).join("");

  const pGrund = kannPodestBauen();
  const podest = `<div class="karte station podest${spiel.parcours?.podest ? " an" : ""}"><h3>${PODEST.icon} ${PODEST.name}</h3>
    <p class="hinweis">Die Krönung, wenn alle 8 Stationen stehen: ${PODEST.bonus.map(bonusText).join(" und ")}.</p>
    ${spiel.parcours?.podest ? `<span class="sternVoll">✅ Das Siegerpodest steht!</span>`
      : `<div class="dKosten">${Object.entries(PODEST.kosten).map(([id, m]) => `<span class="braucht${anzahl(id) < m ? " fehlt" : ""}">${symbolHtml(id, "mini")} ${m}</span>`).join("")}
         <span class="braucht${spiel.muenzen < PODEST.muenzen ? " fehlt" : ""}">${muenzeHtml("muenze klein")} ${zahl(PODEST.muenzen)}</span></div>
         <button type="button" class="knopf kaufen" id="podestBauen" ${pGrund ? "disabled" : ""}>Bauen</button>${pGrund ? `<small class="dGrund">${pGrund}</small>` : ""}`}</div>`;

  ziel.innerHTML = `<div class="dorfSeite">${parcoursSvg()}${lauf}
    <h3 class="rasterTitel">🛝 Stationen <small>${n} / ${PARCOURS.length} gebaut</small></h3>${stationen}${podest}
    <button type="button" class="knopf leise" id="turnenEinfuehrung">❔ Einführung nochmal ansehen</button></div>`;

  ziel.querySelector(".parcoursLauf").addEventListener("click", () => tippeTaetigkeit(t));
  for (const b of ziel.querySelectorAll(".stationBauen")) b.addEventListener("click", () => {
    const i = Number(b.dataset.i), nr = Number(b.dataset.nr);
    const umbau = parcours().stationen[i] !== null;
    const los = () => {
      if (!baueStation(i, nr)) { ton.nein(); return; }
      ton.stufe(); herzchen(b);
      melde(`🛝 ${PARCOURS[i].optionen[nr].name} gebaut: ${bonusText(PARCOURS[i].optionen[nr].bonus)}`, "gross");
      for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
      speichern(); zeichneKopf(); zeichneFertigkeit();
    };
    if (umbau) frage("🛝 Umbauen?", `Das alte Hindernis <b>${stationOption(i).name}</b> wird abgebaut. Der Umbau kostet noch einmal Material und Münzen.`, "Ja, umbauen", los);
    else los();
  });
  ziel.querySelector("#podestBauen")?.addEventListener("click", () => {
    if (!bauePodest()) { ton.nein(); return; }
    ton.stufe(); melde("🏆 Das Siegerpodest steht! Du bist ein echter Turn-Champion!", "gross");
    for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
    speichern(); zeichneKopf(); zeichneFertigkeit();
  });
  ziel.querySelector("#turnenEinfuehrung").addEventListener("click", () => { ton.klick(); zeigeTurnenEinfuehrung(); });
}

// ===================== EINFÜHRUNG =====================
const TURNEN_EINFUEHRUNG = [
  { titel: "🤸 Der Abenteuer-Spielplatz", bild: () => parcoursSvg(),
    text: () => `Fünf Abenteuer-Pfade geschafft – du bist richtig fit! Hinter dem Wichteldorf entsteht jetzt ein riesiger <b>Abenteuer-Spielplatz</b>. Ab jetzt gibt es die neue Fertigkeit <b>Turnen</b>.` },
  { titel: "🛝 Hindernisse bauen", bild: () => `<div class="seBilder dGrossBilder"><span>🪵</span><span>🧗</span><span>🪜</span><span>🛝</span></div>`,
    text: () => `Der Parcours hat <b>8 Stationen</b>. An jeder Station wählst du <b>eins von drei Hindernissen</b> und baust es mit Brettern, Barren und Münzen. Jedes Hindernis hilft dir für immer – zum Beispiel macht es das Holzsammeln schneller.` },
  { titel: "▶ Parcours laufen", bild: () => `<div class="seBilder dGrossBilder"><span>🤸</span><span>⏱️</span><span>✨</span></div>`,
    text: () => `Tippe auf <b>„Parcours laufen“</b> – ${figurName()} turnt dann Runde um Runde über alle Hindernisse, auch wenn das Spiel zu ist. Je mehr Hindernisse stehen, desto mehr Erfahrung und Münzen gibt jede Runde.` },
  { titel: "🏆 Das Siegerpodest", bild: () => `<div class="seBilder dGrossBilder"><span>🏆</span></div>`,
    text: () => `Neue Stationen gibt es ab Turnen-Stufe ${STUFEN.slice(1).join(", ")}. Stehen alle 8, kannst du das <b>Siegerpodest</b> bauen – mit einem großen Extra-Bonus. Überleg gut, welches Hindernis du wählst – umbauen geht aber jederzeit!` },
];
let turnenSeiteNr = 0;
function zeichneTurnenEinfuehrung() {
  const s = TURNEN_EINFUEHRUNG[turnenSeiteNr], letzte = turnenSeiteNr === TURNEN_EINFUEHRUNG.length - 1;
  $("turnenIntroInhalt").innerHTML = `<h2>${s.titel}</h2><div class="seBild">${s.bild()}</div><p>${s.text()}</p>
    <div class="sePunkte">${TURNEN_EINFUEHRUNG.map((_, i) => `<i class="${i === turnenSeiteNr ? "an" : ""}"></i>`).join("")}</div>`;
  $("turnenIntroZurueck").hidden = turnenSeiteNr === 0;
  $("turnenIntroWeiter").textContent = letzte ? "🤸 Zum Spielplatz!" : "Weiter ›";
}
function zeigeTurnenEinfuehrung() { turnenSeiteNr = 0; zeichneTurnenEinfuehrung(); $("turnenIntroOverlay").hidden = false; }
function pruefeTurnenEinfuehrung() {
  if (spiel.turnenIntro || !turnenFrei()) return;
  if (document.querySelector(".overlay:not([hidden])") || !$("einfuehrung").hidden) return;
  spiel.turnenIntro = true;
  parcours();
  speichern();
  ton.stufe();
  melde("🤸 Neu: Der Abenteuer-Spielplatz!", "gross");
  zeigeTurnenEinfuehrung();
}
function richteTurnenEin() {
  $("turnenIntroWeiter").addEventListener("click", () => {
    ton.klick();
    if (turnenSeiteNr < TURNEN_EINFUEHRUNG.length - 1) { turnenSeiteNr++; zeichneTurnenEinfuehrung(); return; }
    $("turnenIntroOverlay").hidden = true;
    offeneFertigkeit = "turnen"; zeigeSeite("seiteFertigkeit");
  });
  $("turnenIntroZurueck").addEventListener("click", () => { ton.klick(); turnenSeiteNr = Math.max(0, turnenSeiteNr - 1); zeichneTurnenEinfuehrung(); });
  $("turnenIntroX").addEventListener("click", () => { ton.klick(); $("turnenIntroOverlay").hidden = true; });
  jedeSekunde(pruefeTurnenEinfuehrung, 2);
}
