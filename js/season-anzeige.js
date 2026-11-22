"use strict";
// =====================================================
//  SEASON-PASS – Anzeige: Banner auf der Fertigkeiten-Seite und eigene Season-Seite
// =====================================================

function belohnungKurz(b) {
  if (b.muenzen) return `${muenzeHtml("muenze klein")} ${zahl(b.muenzen)}`;
  if (b.aussehen) { const t = teilNachId(b.aussehen); return `${t.icon} ${t.name}`; }
  if (b.haustier) { const h = HAUSTIERE.find(x => x.id === b.haustier); return `${h.emoji} ${h.name}`; }
  if (b.sachen) return Object.entries(b.sachen).map(([id, n]) => `${symbolHtml(id, "mini")} ${n}× ${GEGENSTAENDE[id].name}`).join(" · ");
  if (b.samen) return "🌱 Samen-Paket";
  if (b.essen) return "🍽️ Essens-Paket";
  return "";
}

// ----- Banner (oben auf der Fertigkeiten-Seite) -----
function zeichneSeasonBanner() {
  const t = aktuellesThema(), s = spiel.season;
  if (!s) return;
  const st = seasonStufe(), fertig = abholbereiteAufgaben().length;
  const anteil = st >= SEASON.stufen ? 1 : (s.punkte % SEASON.punkteProStufe) / SEASON.punkteProStufe;
  const b = $("seasonBanner");
  b.style.setProperty("--s1", t.farben[0]);
  b.style.setProperty("--s2", t.farben[1]);
  b.innerHTML = `<span class="sbIcon">${t.icon}</span>
    <span class="sbText"><b>Season: ${t.titel}</b><small>Stufe ${st} / ${SEASON.stufen} · noch ${seasonTageUebrig()} Tage</small>
      <span class="balken duenn"><div style="width:${(anteil * 100).toFixed(1)}%"></div></span></span>
    ${fertig ? `<span class="sbMarke">🎁 ${fertig}</span>` : `<span class="sbPfeil">›</span>`}`;
}

// ----- Season-Seite -----
function zeichneSeason() {
  const t = aktuellesThema(), s = spiel.season;
  const st = seasonStufe();
  const naechste = st >= SEASON.stufen ? null : (st + 1) * SEASON.punkteProStufe;
  const kopf = `<div class="seasonKopf" style="--s1:${t.farben[0]};--s2:${t.farben[1]}">
      <span class="skIcon">${t.icon}</span>
      <div><small>Season ${MONATSNAMEN[Number(s.id.slice(5)) - 1]} · noch ${seasonTageUebrig()} Tage</small><h2>${t.titel}</h2>
      <div class="skStufe">Stufe <b>${st}</b> / ${SEASON.stufen}</div>
      <div class="balken dick"><div style="width:${naechste ? ((s.punkte % SEASON.punkteProStufe) / SEASON.punkteProStufe * 100).toFixed(1) : 100}%"></div></div>
      <small>${naechste ? `${zahl(s.punkte)} / ${zahl(naechste)} Season-Punkte` : `🎉 Alle Stufen geschafft! Jede weiteren 100 Punkte bringen Münzen.`}</small></div></div>`;

  const aufgabeHtml = a => {
    const z = aufgabeStand(a);
    const alt = a.art === "tag" && a.tag !== tagText() ? `<span class="altMarke">von ${Number(a.tag.slice(8))}.${Number(a.tag.slice(5, 7))}.</span>` : "";
    return `<div class="aufgabe${a.abgeholt ? " erledigt" : ""}${z.fertig && !a.abgeholt ? " fertig" : ""}">
      <span class="aText"><b>${a.text} ${alt}</b><span class="balken duenn"><div style="width:${(z.wert / a.ziel * 100).toFixed(1)}%"></div></span>
        <small>${zahl(z.wert)} / ${zahl(a.ziel)} · ⭐ ${a.punkte} Punkte</small></span>
      ${a.abgeholt ? `<span class="aHaken">✓</span>` : z.fertig ? `<button type="button" class="knopf kaufen" data-aufgabe="${a.id}">Abholen</button>` : ""}</div>`;
  };
  const tag = s.aufgaben.filter(a => a.art === "tag").sort((x, y) => (x.abgeholt - y.abgeholt) || y.tag.localeCompare(x.tag));
  const woche = s.aufgaben.filter(a => a.art === "woche");

  const m = MONSTER.season;
  const monster = `<div class="karte seasonMonster"><span class="mBild">${monsterSvg(m.aussehen)}</span>
    <div><b>${m.name}</b><small>Das Season-Monster passt sich deiner Kampfstufe an (jetzt Stufe ${m.stufe}). Jedes Mal, wenn es einschläft: ⭐ ${SEASON.monsterPunkte} Punkte.</small>
    <button type="button" class="knopf kaufen" id="zumSeasonMonster">⚔️ Zum Monster</button></div></div>`;

  const stufen = Array.from({ length: SEASON.stufen }, (_, i) => i + 1).map(n => {
    const b = stufenBelohnung(n), besonders = b.aussehen || b.haustier;
    return `<li class="${n <= st ? "erreicht" : ""}${n === st + 1 ? " naechste" : ""}${besonders ? " besonders" : ""}">
      <span class="stNr">${n <= st ? "✓" : n}</span>
      ${b.aussehen ? `<span class="stBild">${figurSvg(spiel.figur, { ...aussehen(), [teilNachId(b.aussehen).kategorie]: b.aussehen })}</span>` : ""}
      ${b.haustier ? `<span class="stBild stTier">${HAUSTIERE.find(x => x.id === b.haustier).emoji}</span>` : ""}
      <span class="stText">${belohnungKurz(b)}</span></li>`;
  }).join("");

  $("seasonInhalt").innerHTML = `${kopf}
    <div class="karte"><h3>☀️ Tagesaufgaben <small>jeden Tag 3 neue</small></h3>${tag.map(aufgabeHtml).join("")}
      <p class="hinweis">Verpasst? Nicht schlimm – Tagesaufgaben bleiben eine Woche lang offen.</p></div>
    <div class="karte"><h3>📅 Wochenaufgaben <small>neu jeden Montag</small></h3>${woche.map(aufgabeHtml).join("")}</div>
    ${monster}
    <div class="karte"><h3>🎁 Belohnungen</h3><ol class="seasonStufen">${stufen}</ol>
      <p class="hinweis">Season-Sachen kommen im nächsten Jahr wieder – du verpasst also nichts für immer.</p></div>`;

  for (const b of $("seasonInhalt").querySelectorAll("[data-aufgabe]")) b.addEventListener("click", () => {
    const a = spiel.season.aufgaben.find(x => x.id === b.dataset.aufgabe);
    const neu = holeAufgabe(a);
    if (!neu) return;
    ton.muenze();
    herzchen(b);
    melde(`⭐ +${a.punkte} Season-Punkte!`);
    zeigeSeasonStufen(neu);
    speichern();
    zeichneKopf();
    zeichneSeason();
    zeichneSeasonBanner();
  });
  $("zumSeasonMonster").addEventListener("click", () => {
    ton.klick();
    aktualisiereSeasonMonster();
    starteKampf("season");
    speichern();
    zeichneAktivLeiste();
    abenteuerTab = "kampf";
    zeigeSeite("seiteAbenteuer");
  });
}

// Neue Stufen feiern (Meldungen; Haustier mit großem Fenster)
function zeigeSeasonStufen(neu) {
  for (const { stufe: n, belohnung } of neu) {
    ton.stufe();
    melde(`🎟️ Season-Stufe ${n}! ${belohnungKurz(belohnung)}`, "gross");
    if (belohnung.neuesHaustier) zeigeHaustierFund(belohnung.neuesHaustier);
  }
}

function richteSeasonEin() {
  aktualisiereSeasonMonster();
  pruefeSeasonWechsel();
  $("seasonBanner").addEventListener("click", () => { ton.klick(); zeigeSeite("seiteSeason"); });
  $("seasonZurueck").addEventListener("click", () => { ton.klick(); zeigeSeite("seiteFertigkeiten"); });
}
