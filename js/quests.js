"use strict";
// =====================================================
//  AUFTRÄGE – Logik und Anzeige
//  spiel.quest = Nummer des aktuellen Auftrags (0 = erster) · spiel.zaehler = { id: insgesamt gemacht }
// =====================================================

// Etwas zählen (wird beim Herstellen, Ernten und bei Beute aufgerufen)
function zaehle(id, n) {
  spiel.zaehler = spiel.zaehler || {};
  spiel.zaehler[id] = (spiel.zaehler[id] || 0) + n;
}

function aktuellerQuest() { return QUESTS[spiel.quest || 0] || null; }
function questStand(q) {
  let wert = 0;
  try { wert = q.wert(); } catch (e) { /* noch nicht berechenbar */ }
  return { wert: Math.min(wert, q.ziel), fertig: wert >= q.ziel };
}

function holeQuestBelohnung() {
  const q = aktuellerQuest();
  if (!q || !questStand(q).fertig) return false;
  const b = q.belohnung || {};
  spiel.muenzen += b.muenzen || 0;
  for (const [id, n] of Object.entries(b.sachen || {})) gibInBank(id, n);
  for (const id of b.aussehen || []) gibTeil(id);   // Belohnungen passen immer (auch über die Fächer hinaus)
  spiel.quest = (spiel.quest || 0) + 1;
  speichern();
  return b;
}

function belohnungText(b) {
  const teile = [];
  if (b.muenzen) teile.push(`${muenzeHtml("muenze klein")} ${zahl(b.muenzen)}`);
  for (const [id, n] of Object.entries(b.sachen || {})) teile.push(`${symbolHtml(id, "mini")} ${n}× ${GEGENSTAENDE[id].name}`);
  for (const id of b.aussehen || []) { const t = teilNachId(id); if (t) teile.push(`${t.icon} ${t.name}`); }
  return teile.join(" · ");
}
function questSymbol(q) {
  return q.symbol ? symbolHtml(q.symbol, "mini") : `<span class="questIcon">${q.icon || "📜"}</span>`;
}

// ----- Leiste oben (unter der laufenden Tätigkeit) -----
let letzterQuestText = "";
function zeichneQuestLeiste() {
  const leiste = $("questLeiste");
  const q = aktuellerQuest();
  if (!q) { leiste.hidden = true; return; }
  const s = questStand(q);
  const text = `${q.nr}|${s.wert}|${s.fertig}`;
  if (text === letzterQuestText && !leiste.hidden) return;
  letzterQuestText = text;
  leiste.hidden = false;
  leiste.classList.toggle("fertig", s.fertig);
  leiste.innerHTML = `${questSymbol(q)}
    <span class="questText"><b>${s.fertig ? "🎁 Geschafft! Belohnung abholen" : `📜 ${q.titel}`}</b>
      <span class="balken duenn"><div style="width:${(s.wert / q.ziel * 100).toFixed(1)}%"></div></span></span>
    <span class="questZahl">${s.fertig ? "›" : `${zahl(s.wert)}/${zahl(q.ziel)}`}</span>`;
}

// ----- Fenster mit dem Auftrag -----
function zeigeQuestFenster() {
  const q = aktuellerQuest();
  const ziel = $("questInhalt");
  if (!q) {
    ziel.innerHTML = `<h2>👑 Alle Aufträge geschafft!</h2><p>Du hast alles erreicht. Du bist ein echter Held!</p>`;
    $("questOverlay").hidden = false;
    return;
  }
  const s = questStand(q);
  ziel.innerHTML = `<div class="questKopf"><small>Auftrag ${q.nr} von ${QUESTS.length}</small><h2>${questSymbol(q)} ${q.titel}</h2></div>
    <p class="questTipp">${q.text}</p>
    <div class="balken dick"><div style="width:${(s.wert / q.ziel * 100).toFixed(1)}%"></div></div>
    <p class="questFortschritt">${zahl(s.wert)} / ${zahl(q.ziel)}</p>
    <p class="questBelohnung">🎁 Belohnung: ${belohnungText(q.belohnung || {})}</p>
    ${s.fertig ? `<button type="button" class="knopf" id="questAbholen">🎁 Belohnung abholen!</button>`
               : `<button type="button" class="knopf" id="questHilfe">🧭 Zeig mir wo</button>`}`;
  $("questAbholen")?.addEventListener("click", () => {
    const b = holeQuestBelohnung();
    if (!b) return;
    ton.stufe();
    herzchen($("questAbholen"));
    melde(`🎁 Belohnung: ${belohnungText(b)}`, "gross");
    zeichneKopf();
    letzterQuestText = "";
    zeichneQuestLeiste();
    zeichneSeite();
    setTimeout(zeigeQuestFenster, 350);   // gleich den nächsten Auftrag zeigen
  });
  $("questHilfe")?.addEventListener("click", () => { ton.klick(); $("questOverlay").hidden = true; zeigeQuestHilfe(q); });
  $("questOverlay").hidden = false;
}

// "Zeig mir wo": zur richtigen Seite springen und das Ziel kurz leuchten lassen
function zeigeQuestHilfe(q) {
  const h = q.hilfe || {};
  if (h.fertigkeit) { offeneFertigkeit = h.fertigkeit; zeigeSeite("seiteFertigkeit"); }
  else if (h.seite) zeigeSeite(h.seite);
  setTimeout(() => {
    const el = h.ziel && document.querySelector(h.ziel);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.remove("questZiel"); void el.offsetWidth;
    el.classList.add("questZiel");
    setTimeout(() => el.classList.remove("questZiel"), 4500);
  }, 120);
}

function richteQuestsEin() {
  $("questLeiste").addEventListener("click", () => { ton.klick(); zeigeQuestFenster(); });
  $("questZu").addEventListener("click", () => { ton.klick(); $("questOverlay").hidden = true; });
  $("questOverlay").addEventListener("click", e => { if (e.target.id === "questOverlay") $("questOverlay").hidden = true; });
  zeichneQuestLeiste();
}

// Einmal pro Sekunde: Leiste aktualisieren, beim Erreichen einmal Bescheid geben
let questGemeldet = -1;
function pruefeQuest() {
  const q = aktuellerQuest();
  zeichneQuestLeiste();
  if (q && questStand(q).fertig && questGemeldet !== q.nr) {
    questGemeldet = q.nr;
    ton.muenze();
    melde(`📜 Auftrag geschafft: ${q.titel}! Tippe oben auf 🎁`, "gross");
  }
}
