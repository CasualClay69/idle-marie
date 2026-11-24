"use strict";
// =====================================================
//  HAUSTIERE & ERFOLGE – Anzeige (auf der Seite "Ich")
// =====================================================

function haustierHerkunft(h) {
  const wo = { holz: "beim Holzsammeln", angeln: "beim Angeln", bergbau: "im Bergbau", garten: "beim Ernten im Garten",
    kochen: "beim Kochen", schmieden: "beim Schmieden", schnitzen: "beim Schnitzen", traenke: "beim Tränke-Brauen", bauen: "beim Bretter-Sägen", naehen: "beim Nähen",
    schmuck: "beim Goldschmieden", sterne: "beim Sternegucken", feuer: "am Lagerfeuer", turnen: "auf dem Abenteuer-Spielplatz", graben: "beim Ausgraben" };
  if (h.start) return "kommt als Belohnung für einen Auftrag";
  if (h.truhe) return "versteckt sich in den Schatztruhen der Abenteuer-Pfade";
  if (h.season) return `Belohnung der Season im ${MONATSNAMEN[h.season - 1]}`;
  if (h.jagd) return "kommt manchmal am Ende eines Monster-Auftrags zu dir";
  if (h.karte) return "wohnt in einem Nest auf der Entdecker-Insel";
  if (h.advent) return "wartet hinter Türchen 24 im Adventskalender";
  if (h.fertigkeit) return `taucht ${wo[h.fertigkeit] || `bei ${(fertigkeit(h.fertigkeit)?.name || "der Arbeit").replaceAll("­", "")}`} auf`;
  const m = MONSTER[h.chef];
  if (!m) return "ist irgendwo da draußen versteckt";
  return `wohnt bei ${m.name.replaceAll("­", "")} (${GEBIETE.find(g => g.id === m.gebiet)?.name || "einem Gebiet"})`;
}

function zeichneHaustiere() {
  const ziel = $("haustierListe");
  $("haustierZahl").textContent = `${(spiel.haustiere || []).length} / ${HAUSTIERE.length}`;
  const karte = h => {
    const da = hatHaustier(h.id);
    return `<button type="button" class="haustierKarte${da ? "" : " fehlt"}${spiel.begleiter === h.id ? " begleiter" : ""}" data-id="${h.id}" ${da ? "" : "disabled"}>
      <span class="hEmoji">${da ? h.emoji : "❔"}</span>
      <b>${da ? h.name : "???"}</b>${da ? `<span class="tierStufeKlein"><span class="tSterne">${"★".repeat(tierStufe(h.id))}</span><i>Stufe ${tierStufe(h.id)}</i></span>` : ""}
      <small>${da ? `${h.tier} · ${h.text}` : haustierHerkunft(h)}</small>
      ${spiel.begleiter === h.id ? `<span class="begleiterMarke">💖 Begleiter</span>` : ""}</button>`;
  };
  ziel.innerHTML = HAUSTIERE.filter(h => !h.season).map(karte).join("")
    + `<h4 class="rasterTitel">🎟️ Season-Haustiere</h4>` + HAUSTIERE.filter(h => h.season).map(karte).join("");
  for (const b of ziel.querySelectorAll(".haustierKarte:not(.fehlt)")) b.addEventListener("click", () => { ton.klick(); zeigeTierFenster(b.dataset.id); });
  aktualisiereStreichelMarken();

}

// Tiere, die man gerade streicheln darf, leuchten und bekommen ein Schild "Streicheln!"
const darfGestreicheltWerden = id => hatHaustier(id) && tierStufe(id) < PFLEGE.maxStufe && streichelnIn(id) === 0;
function aktualisiereStreichelMarken() {
  for (const k of document.querySelectorAll("#haustierListe .haustierKarte:not(.fehlt)")) k.classList.toggle("streichelbar", darfGestreicheltWerden(k.dataset.id));
}
function richteTierMarkenEin() {
  jedeSekunde(() => { if (aktuelleSeite === "seiteIch" && ichTab === "tiere") aktualisiereStreichelMarken(); }, 3);
}

// Kleine Herzen, die aus einem Element aufsteigen
function herzchen(el) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const h = document.createElement("span");
    h.className = "flugHerz";
    h.textContent = "💖";
    h.style.left = `${r.left + r.width / 2 + (Math.random() - 0.5) * r.width * 0.6}px`;
    h.style.top = `${r.top + r.height / 3}px`;
    h.style.animationDelay = `${i * 0.08}s`;
    document.body.append(h);
    setTimeout(() => h.remove(), 1400);
  }
}

function zeichneErfolge() {
  $("erfolgZahl").textContent = `${anzahlErfolge()} / ${ERFOLGE.length}`;
  const zeilen = ERFOLGE.map(e => {
    let wert = 0;
    try { wert = e.wert(); } catch (x) { /* noch nicht berechenbar */ }
    const fertig = erfolgErreicht(e);
    return { e, fertig, anteil: fertig ? 1 : Math.min(1, wert / e.ziel), wert };
  });
  // Erst die, die bald fertig sind, dann die erreichten
  zeilen.sort((a, b) => (a.fertig - b.fertig) || (b.anteil - a.anteil));
  const zeigeAlle = $("erfolgListe").dataset.alle === "1";
  const sichtbar = zeigeAlle ? zeilen : zeilen.slice(0, 8);
  $("erfolgListe").innerHTML = sichtbar.map(({ e, fertig, anteil, wert }) => `<div class="erfolgZeile${fertig ? " fertig" : ""}">
      <span class="eIcon">${fertig ? "🏆" : e.icon}</span>
      <span class="eText"><b>${e.name}</b><small>${e.text}</small>
        ${fertig ? "" : `<span class="balken duenn"><div style="width:${(anteil * 100).toFixed(1)}%"></div></span><small>${zahl(Math.min(wert, e.ziel))} / ${zahl(e.ziel)}</small>`}</span>
      <span class="eLohn">${fertig ? "✓" : `${muenzeHtml("muenze klein")} ${zahl(e.muenzen)}`}</span></div>`).join("")
    + `<button type="button" class="knopf leise" id="erfolgeAlle">${zeigeAlle ? "Weniger zeigen" : `Alle ${ERFOLGE.length} Erfolge zeigen`}</button>`;
  $("erfolgeAlle").addEventListener("click", () => {
    ton.klick();
    $("erfolgListe").dataset.alle = zeigeAlle ? "0" : "1";
    zeichneErfolge();
  });
}

// Großes Fenster, wenn ein Haustier gefunden wurde
const haustierWarteschlange = [];
function zeigeHaustierFund(h) {
  haustierWarteschlange.push(h);
  if (!$("haustierOverlay").hidden) return;
  zeigeNaechstesHaustier();
}
function zeigeNaechstesHaustier() {
  const h = haustierWarteschlange.shift();
  if (!h) { $("haustierOverlay").hidden = true; return; }
  ton.stufe();
  $("haustierFundEmoji").textContent = h.emoji;
  $("haustierFundText").innerHTML = `<b>${h.name}</b> (${h.tier}) möchte bei ${figurName()} wohnen!<br><small>${h.text} – für immer.</small>`;
  $("haustierOverlay").hidden = false;
}
