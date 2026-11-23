"use strict";
// =====================================================
//  GARTEN-SEITE (in der Fertigkeits-Ansicht von "Gärtnern") und Trank-Leiste
// =====================================================

function reifeBeete() {
  return gartenStand().beete.filter(b => b && beetFortschritt(b) >= 1).length;
}

function restText(ms) {
  const s = Math.ceil(ms / 1000);
  if (s >= 60) return `noch ${Math.ceil(s / 60)} min`;
  return `noch ${s} s`;
}

function zeichneGarten(ziel) {
  const g = gartenStand();
  const l = stufe("garten");
  const reif = g.beete.filter(b => b && beetFortschritt(b) >= 1).length;
  let html = `<div class="gartenKopf">${reif ? `<button type="button" class="knopf" id="alleErnten">🧺 Alles ernten (${reif})</button>` : ""}</div>
    <div class="beete">`;
  g.beete.forEach((b, nr) => {
    if (!b) {
      html += `<button type="button" class="beet leer" data-nr="${nr}"><span class="beetPflanze">🟫</span><b>Leeres Beet</b><small>Tippe zum Pflanzen</small></button>`;
      return;
    }
    const p = pflanze(b.pflanze), fertig = beetFortschritt(b) >= 1;
    html += `<button type="button" class="beet${fertig ? " reif" : ""}" data-nr="${nr}">
      <span class="beetPflanze" data-gross="${fertig ? 1 : 0}">${fertig ? p.emoji : "🌱"}</span><b>${p.name}</b>
      <span class="balken"><div style="width:${(beetFortschritt(b) * 100).toFixed(1)}%"></div></span>
      <small class="beetRest">${fertig ? "✨ Ernten!" : restText(beetRestMs(b))}</small>${b.geduengt ? `<span class="beetDuenger" title="gedüngt">🌫️</span>` : ""}</button>`;
  });
  html += `</div>`;
  if (feuerFrei()) {
    const bedarf = duengerBedarf(), beete = duengbareBeete().length;
    html += `<div class="ladenKarte duengerKarte">${symbolHtml("asche0")}<div class="lText"><b>Mit Asche düngen</b>
      <small>${beete ? `${beete} Beet${beete === 1 ? "" : "e"} · braucht ${bedarf} Asche (du hast ${zahl(anzahl("asche0"))})` : "Gerade wächst nichts Ungedüngtes."} · +${Math.round(FEUER.duengerMehr * 100)} % Ernte, ${Math.round(FEUER.duengerSchneller * 100)} % schneller</small></div>
      <button type="button" class="knopf kaufen" id="duengen" ${beete && anzahl("asche0") >= duengerKosten(duengbareBeete()[0]) ? "" : "disabled"}>Düngen</button></div>`;
  }
  const preis = beetPreis();
  if (preis !== undefined) {
    html += `<div class="ladenKarte"><span class="lIcon">🟫</span><div class="lText"><b>Neues Beet</b><small>Du hast ${g.beete.length} Beete.</small></div>
      <button type="button" class="knopf kaufen" id="beetKaufen" ${spiel.muenzen < preis ? "disabled" : ""}>${muenzeHtml("muenze klein")} ${zahl(preis)}</button></div>`;
  }
  // Samen-Laden
  html += `<h3 class="rasterTitel">🛍️ Samen kaufen</h3><div class="samenListe">`;
  for (const p of PFLANZEN) {
    const s = GEGENSTAENDE[p.samen];
    const gesperrt = l < p.stufe;
    html += `<div class="samenZeile${gesperrt ? " gesperrt" : ""}">${symbolHtml(p.samen)}
      <span class="lText"><b>${p.name}</b><small>${gesperrt ? `🔒 ab Stufe ${p.stufe}` : `${muenzeHtml("muenze klein")} ${zahl(s.preis)} je Samen · ⏱️ ${p.minuten} min · 🎒 ${zahl(anzahl(p.samen))}`}</small></span>
      ${gesperrt ? "" : `<button type="button" class="knopf kaufen" data-samen="${p.samen}" data-n="1" ${spiel.muenzen < s.preis ? "disabled" : ""}>1</button>
      <button type="button" class="knopf kaufen" data-samen="${p.samen}" data-n="10" ${spiel.muenzen < s.preis * 10 ? "disabled" : ""}>10</button>`}</div>`;
  }
  html += `</div><p class="hinweis">🌱 Pflanzen wachsen von ganz allein – auch wenn ${figurName()} gerade etwas anderes macht oder das Spiel zu ist. Gemüse kannst du kochen, Kräuter brauchst du für Tränke 🧪, und aus Fasern webst du beim 🧵 Nähen Stoff.</p><button type="button" class="knopf leise ueKnopf" id="gartenUebung">⭐ Übung im Garten ansehen</button>`;
  ziel.innerHTML = html;

  ziel.querySelector("#duengen")?.addEventListener("click", () => {
    const n = duengeAlle();
    if (!n) { ton.nein(); return; }
    ton.muenze(); melde(`🌱 ${n} Beet${n === 1 ? "" : "e"} gedüngt – das wächst jetzt prächtig!`);
    for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
    nachGarten();
  });
  ziel.querySelector("#gartenUebung")?.addEventListener("click", () => { ton.klick(); zeigeUebung("garten"); });
  ziel.querySelector("#alleErnten")?.addEventListener("click", () => {
    gartenStand().beete.forEach((b, nr) => { if (b && beetFortschritt(b) >= 1) ernteMitMeldung(nr); });
    nachGarten();
  });
  ziel.querySelector("#beetKaufen")?.addEventListener("click", () => {
    if (kaufeBeet()) { ton.muenze(); melde("🟫 Ein neues Beet!"); nachGarten(); }
  });
  for (const b of ziel.querySelectorAll("[data-samen]")) b.addEventListener("click", () => {
    if (kaufeSamen(b.dataset.samen, Number(b.dataset.n))) { ton.muenze(); nachGarten(); }
    else { ton.nein(); melde("🙈 Nicht genug Münzen oder kein Platz in der Bank"); }
  });
  for (const b of ziel.querySelectorAll(".beet")) b.addEventListener("click", () => {
    const nr = Number(b.dataset.nr), beet = gartenStand().beete[nr];
    if (!beet) { ton.klick(); zeigePflanzWahl(nr); return; }
    if (beetFortschritt(beet) >= 1) { ernteMitMeldung(nr); nachGarten(); return; }
    melde(`🌱 ${pflanze(beet.pflanze).name}: ${restText(beetRestMs(beet))}`);
  });
}

function ernteMitMeldung(nr) {
  const e = ernte(nr);
  if (typeof e === "string") { ton.nein(); melde(`🙈 ${e}`); return; }
  ton.muenze();
  melde(`🧺 +${e.menge} ${e.p.name}${e.samen ? " und ein Samen" : ""}!`);
  if (e.neueStufe) { ton.stufe(); melde(`🎉 🌱 Gärtnern: Stufe ${e.neueStufe}!`, "gross"); }
  if (e.haustier) zeigeHaustierFund(e.haustier);
}
function nachGarten() {
  speichern();
  zeichneKopf();
  zeichneSeite();
}

function zeigePflanzWahl(nr) {
  const l = stufe("garten");
  const moegliche = PFLANZEN.filter(p => anzahl(p.samen) > 0);
  $("wahlInhalt").innerHTML = `<h2>🌱 Was soll wachsen?</h2>
    ${moegliche.length ? "" : `<p class="hinweis">Du hast noch keine Samen. Unten auf der Garten-Seite kannst du welche kaufen!</p>`}
    <div class="wahlListe">${moegliche.map(p => `<button type="button" class="wahlZeile${l < p.stufe ? " gesperrt" : ""}" data-p="${p.id}" ${l < p.stufe ? "disabled" : ""}>
      ${symbolHtml(p.samen)}<span><b>${p.name}</b><small>${l < p.stufe ? `🔒 ab Stufe ${p.stufe}` : `⏱️ ${p.minuten} min · ×${zahl(anzahl(p.samen))}`}</small></span></button>`).join("")}</div>`;
  for (const b of $("wahlInhalt").querySelectorAll("[data-p]")) b.addEventListener("click", () => {
    if (pflanzeEin(nr, b.dataset.p)) { ton.klick(); melde(`🌱 ${pflanze(b.dataset.p).name} eingepflanzt`); }
    $("wahlOverlay").hidden = true;
    nachGarten();
  });
  $("wahlOverlay").hidden = false;
}

// Jedes Bild: Balken und Restzeit der Beete
function zeichneGartenLive() {
  if (offeneFertigkeit !== "garten" || aktuelleSeite !== "seiteFertigkeit") return;
  const beete = gartenStand().beete;
  let neuReif = false;
  for (const el of document.querySelectorAll(".beet:not(.leer)")) {
    const b = beete[el.dataset.nr];
    if (!b) continue;
    const f = beetFortschritt(b);
    el.querySelector(".balken > div").style.width = `${(f * 100).toFixed(1)}%`;
    el.querySelector(".beetRest").textContent = f >= 1 ? "✨ Ernten!" : restText(beetRestMs(b));
    if (f >= 1 && !el.classList.contains("reif")) neuReif = true;
  }
  if (neuReif) zeichneSeite();
}

// ----- Leiste mit den aktiven Tränken (unter der laufenden Tätigkeit) -----
function zeichneTrankLeiste() {
  const leiste = $("trankLeiste");
  const aktiv = aktiveTraenke();
  const feuer = feuerBrennt() ? `<span class="trankChip feuerChip" title="Großes Lagerfeuer">🔥 +${Math.round(feuerBonus() * 100)} % EP <b>${feuerRestText()}</b></span>` : "";
  leiste.hidden = !aktiv.length && !feuer;
  leiste.innerHTML = feuer + aktiv.map(t => `<span class="trankChip" title="${t.text}">${symbolHtml(t.id, "mini")} ${t.name} <b>${t.ladungen}</b></span>`).join("");
}
