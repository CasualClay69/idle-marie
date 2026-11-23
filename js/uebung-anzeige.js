"use strict";
// =====================================================
//  ÜBUNGS-FENSTER – für jede Tätigkeit (und jede Garten-Pflanze) die Übungs-Stufe ⭐
//  und was sie gerade bringt. Die Liste baut sich aus TAETIGKEITEN und PFLANZEN –
//  neue Tätigkeiten erscheinen also automatisch.
//  Übung bringt: alle 10 Stufen +5 % doppelte Ausbeute, mit ⭐ 99 Meister = schneller.
// =====================================================

let uebungFilter = "alle";

// Alle Dinge, die man üben kann: { id (Schlüssel in spiel.uebung), fertigkeit, name, stufe, xp, symbol, garten }
function uebungsListe() {
  const liste = [];
  for (const t of TAETIGKEITEN) {
    if (t.kleidung) continue;   // Kleidung näht man nur einmal
    liste.push({ id: t.id, fertigkeit: t.fertigkeit, name: t.name, stufe: t.stufe, xp: t.xp, symbol: Object.keys(t.gibt || {})[0] });
  }
  for (const p of PFLANZEN) liste.push({ id: `garten-${p.id}`, fertigkeit: "garten", name: p.name, stufe: p.stufe, xp: p.xp, symbol: p.ertrag, garten: true });
  // in der Reihenfolge der Fertigkeiten
  const reihe = FERTIGKEITEN.map(f => f.id);
  return liste.sort((a, b) => reihe.indexOf(a.fertigkeit) - reihe.indexOf(b.fertigkeit) || a.stufe - b.stufe);
}

const doppeltDurchUebung = l => Math.floor(l / 10) * SPIEL.uebungDoppeltProZehn;
const uePct = x => `${Math.round(x * 100)} %`;

function uebungZeile(u) {
  const xp = spiel.uebung[u.id] || 0, l = stufeAusXp(xp);
  const offen = stufe(u.fertigkeit) >= u.stufe;
  const meister = l >= SPIEL.maxStufe;
  const naechste = meister ? null : Math.min(SPIEL.maxStufe, (Math.floor(l / 10) + 1) * 10);
  const noch = naechste ? Math.max(1, Math.ceil((XP_TABELLE[naechste] - xp) / u.xp)) : 0;
  const bringt = [];
  if (doppeltDurchUebung(l)) bringt.push(`<span class="ueChip">✨ +${uePct(doppeltDurchUebung(l))} doppelt</span>`);
  if (meister && !u.garten) bringt.push(`<span class="ueChip gold">👑 ${uePct(SPIEL.meisterSchneller)} schneller</span>`);
  if (meister && u.garten) bringt.push(`<span class="ueChip gold">👑 Meister</span>`);
  let ziel = "";
  if (!offen) ziel = `🔒 ab ${wName(fertigkeit(u.fertigkeit).name)}-Stufe ${u.stufe}`;
  else if (naechste === SPIEL.maxStufe) ziel = `Nächstes Ziel: ⭐ 99 = Meister${u.garten ? "" : ` (${uePct(SPIEL.meisterSchneller)} schneller)`} · noch ~${zahl(noch)} ${u.garten ? "Ernten" : "Mal"}`;
  else if (naechste) ziel = `Nächstes Ziel: ⭐ ${naechste} = +${uePct(doppeltDurchUebung(naechste))} doppelt · noch ~${zahl(noch)} ${u.garten ? "Ernten" : "Mal"}`;
  else ziel = "Alles geschafft – du bist hier Meister!";
  return `<div class="ueZeile${offen ? "" : " zu"}${meister ? " meister" : ""}">
    ${u.symbol && GEGENSTAENDE[u.symbol] ? symbolHtml(u.symbol, "mini") : `<span class="ueLeer">${fertigkeit(u.fertigkeit).icon}</span>`}
    <div class="ueText"><b>${wName(u.name)}</b>
      <span class="ueStufe">⭐ ${l}<span class="balken duenn"><div style="width:${meister ? 100 : (fortschrittInStufe(xp) * 100).toFixed(1)}%"></div></span></span>
      ${bringt.length ? `<span class="ueBringt">${bringt.join("")}</span>` : ""}
      <small>${ziel}</small></div></div>`;
}

function zeichneUebung() {
  const alle = uebungsListe();
  const geuebt = alle.filter(u => (spiel.uebung[u.id] || 0) > 0);
  const meister = alle.filter(u => stufeAusXp(spiel.uebung[u.id] || 0) >= SPIEL.maxStufe).length;
  const hoechste = geuebt.reduce((m, u) => Math.max(m, stufeAusXp(spiel.uebung[u.id])), 0);
  const fertigkeiten = FERTIGKEITEN.filter(f => alle.some(u => u.fertigkeit === f.id));
  if (uebungFilter !== "alle" && !fertigkeiten.some(f => f.id === uebungFilter)) uebungFilter = "alle";
  const zeigen = alle.filter(u => uebungFilter === "alle" ? (spiel.uebung[u.id] || 0) > 0 : u.fertigkeit === uebungFilter);

  $("uebungInhalt").innerHTML = `
    <div class="ueUebersicht">
      <div><b>${geuebt.length}</b><small>von ${alle.length} geübt</small></div>
      <div><b>⭐ ${hoechste}</b><small>höchste Übung</small></div>
      <div><b>👑 ${meister}</b><small>Meister</small></div>
    </div>
    <details class="ueErklaerung"><summary>💡 Was bringt Übung?</summary>
      <p>Jedes Mal, wenn du etwas machst, wirst du darin geübter. Die Übung hat für jede Tätigkeit ihre eigene Stufe ⭐ (bis 99).</p>
      <p>✨ Alle 10 Übungs-Stufen gibt es <b>+${uePct(SPIEL.uebungDoppeltProZehn)}</b> Chance auf doppelte Ausbeute – bei ⭐ 90 also +${uePct(doppeltDurchUebung(90))}.</p>
      <p>👑 Mit ⭐ 99 bist du <b>Meister</b>: Die Tätigkeit geht ${uePct(SPIEL.meisterSchneller)} schneller (im Garten bleibt es beim doppelten Ernten).</p>
    </details>
    <div class="wikiChips ueFilter">
      <button type="button" data-filter="alle" class="${uebungFilter === "alle" ? "aktiv" : ""}">⭐ Geübt</button>
      ${fertigkeiten.map(f => `<button type="button" data-filter="${f.id}" class="${uebungFilter === f.id ? "aktiv" : ""}">${f.icon} ${wName(f.name)}</button>`).join("")}
    </div>
    <div class="ueListe">${zeigen.length ? zeigen.map(uebungZeile).join("") : `<p class="hinweis">Du hast noch nichts geübt. Fang einfach mit einer Tätigkeit an!</p>`}</div>`;
  for (const b of $("uebungInhalt").querySelectorAll("[data-filter]")) b.addEventListener("click", () => {
    ton.klick(); uebungFilter = b.dataset.filter; zeichneUebung();
  });
}

function zeigeUebung(filter) {
  if (filter) uebungFilter = filter;
  zeichneUebung();
  $("uebungOverlay").hidden = false;
  $("uebungInhalt").scrollTop = 0;
}

function richteUebungEin() {
  $("uebungZu").addEventListener("click", () => { ton.klick(); $("uebungOverlay").hidden = true; });
  $("uebungOverlay").addEventListener("click", e => { if (e.target.id === "uebungOverlay") $("uebungOverlay").hidden = true; });
  $("uebungIch").addEventListener("click", () => { ton.klick(); zeigeUebung("alle"); });
}
