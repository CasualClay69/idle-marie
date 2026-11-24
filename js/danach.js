"use strict";
// =====================================================
//  DANACH WEITERMACHEN MIT … – wenn das Material ausgeht (z. B. beim Kochen),
//  wechselt die Figur von allein zu einer vorher gewählten zweiten Tätigkeit.
//  Zur Wahl stehen Tätigkeiten ohne Material (Holz, Angeln, Bergbau …) – die gehen nie aus.
//  spiel.danach = Tätigkeits-ID (wird bei jedem neuen Start gelöscht, siehe starte() in logik.js)
// =====================================================

// Kann die laufende Tätigkeit überhaupt ausgehen? (Nur dann ist "Danach" sinnvoll)
function kannAusgehen() {
  const t = spiel.aktiv && !spiel.aktiv.kampf && taetigkeitNachId(spiel.aktiv.id);
  return !!t && Object.keys(t.braucht || {}).length > 0;
}
function danachKandidaten() {
  return TAETIGKEITEN.filter(t => !Object.keys(t.braucht || {}).length && !t.kleidung && !hindernis(t) && t.id !== spiel.aktiv?.id);
}

function aktualisiereDanachKnopf() {
  const k = $("danachKnopf");
  const zeigen = kannAusgehen();
  k.hidden = !zeigen;
  if (!zeigen) return;
  const t = spiel.danach && taetigkeitNachId(spiel.danach);
  const text = t ? `🔀 Danach: ${t.name}` : "🔀 Danach: anhalten";
  if (k.textContent !== text) k.textContent = text;
  k.classList.toggle("gewaehlt", !!t);
}

function zeigeDanachWahl() {
  const gruppen = {};
  for (const t of danachKandidaten()) (gruppen[t.fertigkeit] ||= []).push(t);
  let html = `<h2>🔀 Danach weitermachen mit …</h2>
    <p class="hinweis">Wenn bei <b>${taetigkeitNachId(spiel.aktiv.id).name}</b> das Material ausgeht, macht ${figurName()} von allein damit weiter – auch wenn du weg bist.</p>
    <div class="wahlListe"><button type="button" class="wahlZeile${spiel.danach ? "" : " aktiv"}" data-danach=""><span class="symbol">⏹️</span><span><b>Anhalten</b><small>So wie bisher: ${figurName()} macht Pause.</small></span></button></div>`;
  for (const f of FERTIGKEITEN) {
    const liste = (gruppen[f.id] || []).sort((a, b) => b.stufe - a.stufe);
    if (!liste.length) continue;
    html += `<h4 class="rasterTitel">${f.icon} ${f.name}</h4><div class="wahlListe">` + liste.map(t =>
      `<button type="button" class="wahlZeile${spiel.danach === t.id ? " aktiv" : ""}" data-danach="${t.id}">${Object.keys(t.gibt)[0] ? symbolHtml(Object.keys(t.gibt)[0]) : `<span class="symbol">${f.icon}</span>`}<span><b>${t.name}</b><small>ab Stufe ${t.stufe}</small></span></button>`).join("") + `</div>`;
  }
  $("wahlInhalt").innerHTML = html;
  for (const b of $("wahlInhalt").querySelectorAll("[data-danach]")) b.addEventListener("click", () => {
    ton.klick();
    spiel.danach = b.dataset.danach || null;
    speichern();
    aktualisiereDanachKnopf();
    $("wahlOverlay").hidden = true;
    const t = spiel.danach && taetigkeitNachId(spiel.danach);
    melde(t ? `🔀 Danach macht ${figurName()} mit ${t.name} weiter` : "⏹️ Danach macht " + figurName() + " Pause");
  });
  $("wahlOverlay").hidden = false;
}

function richteDanachEin() {
  $("danachKnopf").addEventListener("click", e => { e.stopPropagation(); if (!kannAusgehen()) return; ton.klick(); zeigeDanachWahl(); });
  jedeSekunde(aktualisiereDanachKnopf, 1);
}
