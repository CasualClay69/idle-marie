"use strict";
// =====================================================
//  AUSRÜSTUNGS-SETS – drei gespeicherte Ausrüstungen, mit einem Tipp gewechselt
//  Ein Set merkt sich: alle Ausrüstungsplätze, Pfeile/Zauberperlen und das Essen.
//  spiel.sets = [ { ausruestung, munition, essen } | null, … ]
// =====================================================

const SET_ANZAHL = 3;
const sets = () => (spiel.sets = spiel.sets || Array(SET_ANZAHL).fill(null));

function setName(s) {
  const w = s?.ausruestung?.waffe && GEGENSTAENDE[s.ausruestung.waffe];
  if (!s) return "leer";
  return w ? w.name : "ohne Waffe";
}
function setIcon(s) {
  const art = GEGENSTAENDE[s?.ausruestung?.waffe]?.kampfart || "nah";
  return s ? KAMPFARTEN[art].icon : "➕";
}
function speichereSet(i) {
  sets()[i] = { ausruestung: { ...spiel.ausruestung }, munition: { ...(spiel.munition || {}) }, essen: spiel.essen || null };
}
// Set anlegen. Rückgabe: Liste der Sachen, die fehlen (nicht in der Bank)
function legeSetAn(i) {
  const s = sets()[i];
  if (!s) return null;
  const fehlt = [];
  for (const p of PLAETZE.map(x => x.id)) {
    const ziel = s.ausruestung[p] || null, jetzt = spiel.ausruestung[p] || null;
    if (ziel === jetzt) continue;
    if (!ziel) { legeAb(p); continue; }
    if (anzahl(ziel) < 1 || !ruesteAus(ziel)) fehlt.push(GEGENSTAENDE[ziel]?.name || ziel);
  }
  spiel.munition = { ...(spiel.munition || {}), ...s.munition };
  if (s.essen) spiel.essen = s.essen;
  return fehlt;
}
const setArt = s => GEGENSTAENDE[s?.ausruestung?.waffe]?.kampfart || "nah";
const aktivesSet = () => sets().findIndex(s => s && PLAETZE.every(p => (s.ausruestung[p.id] || null) === (spiel.ausruestung[p.id] || null)));

// ----- Anzeige -----
// gross = Karte im Reiter Ausrüstung; sonst die kleine Schnellwahl im Kampf-Reiter
function setsHtml(gross) {
  const aktiv = aktivesSet();
  const knoepfe = sets().map((s, i) => `<div class="setPlatz${aktiv === i ? " an" : ""}${s ? "" : " leer"}">
      <button type="button" class="setAnlegen" data-set="${i}" ${s ? "" : "disabled"}>
        <span class="setIcon">${s?.ausruestung?.waffe ? symbolHtml(s.ausruestung.waffe, "mini") : setIcon(s)}</span>
        <span class="setText"><b>${i + 1}. ${setName(s)}</b>${gross && s ? `<small>${KAMPFARTEN[setArt(s)].name}${aktiv === i ? " · angelegt" : ""}</small>` : ""}</span></button>
      ${gross ? `<button type="button" class="setSpeichern" data-set="${i}" title="Jetzige Ausrüstung hier speichern">💾</button>` : ""}</div>`).join("");
  if (!gross) return sets().some(Boolean) ? `<div class="setLeiste"><small>🎒 Schnell wechseln:</small>${knoepfe}</div>` : "";
  return `<div class="karte"><h3>🎒 Ausrüstungs-Sets</h3><div class="setListe">${knoepfe}</div>
    <p class="hinweis">Mit 💾 speicherst du deine jetzige Ausrüstung (mit Munition und Essen) in einem Set. Ein Tipp auf das Set legt alles wieder an – praktisch zum Wechseln zwischen Schwert, Bogen und Zauberstab!</p></div>`;
}
function verdrahteSets(seite) {
  for (const b of seite.querySelectorAll(".setAnlegen")) b.addEventListener("click", () => {
    const fehlt = legeSetAn(Number(b.dataset.set));
    if (fehlt === null) return;
    ton.klick();
    melde(fehlt.length ? `🎒 Set angelegt – es fehlt: ${fehlt.join(", ")}` : `🎒 Set ${Number(b.dataset.set) + 1} angelegt!`);
    speichern(); zeichneAbenteuer();
  });
  for (const b of seite.querySelectorAll(".setSpeichern")) b.addEventListener("click", () => {
    const i = Number(b.dataset.set);
    const los = () => { speichereSet(i); ton.stufe(); melde(`💾 Ausrüstung in Set ${i + 1} gespeichert`); speichern(); zeichneAbenteuer(); };
    if (sets()[i]) frage("💾 Set überschreiben?", `In Set ${i + 1} ist schon <b>${setName(sets()[i])}</b> gespeichert. Mit deiner jetzigen Ausrüstung überschreiben?`, "Ja, speichern", los);
    else los();
  });
}
