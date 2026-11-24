"use strict";
// =====================================================
//  HAUSTIERE & ERFOLGE – Logik
//  spiel.haustiere = [ids] · spiel.begleiter = id · spiel.erfolge = { id: Zeitpunkt }
// =====================================================

baueStufenErfolge();

const hatHaustier = id => (spiel.haustiere || []).includes(id);

// Summe der Boni aller Haustiere, die man hat
function haustierBonus(art, fertigkeitId = null) {
  return HAUSTIERE.filter(h => hatHaustier(h.id) && h.bonus.art === art && (!fertigkeitId || !h.fertigkeit || h.fertigkeit === fertigkeitId))
    .reduce((s, h) => s + h.bonus.wert * tierBonusFaktor(h.id) * (1 + begleiterVerstaerkung(h.id)), 0);   // aktiver Begleiter: stärker
}

function gibHaustier(h) {
  if (!h || hatHaustier(h.id)) return null;
  spiel.haustiere = (spiel.haustiere || []).concat(h.id);
  if (!spiel.begleiter) spiel.begleiter = h.id;
  return h;
}
// Nach einer Tätigkeit: vielleicht taucht das Haustier dieser Fertigkeit auf?
function vielleichtHaustierBeiArbeit(fertigkeitId, sekunden) {
  const h = HAUSTIERE.find(x => x.fertigkeit === fertigkeitId);
  if (!h || hatHaustier(h.id)) return null;
  return Math.random() < sekunden / HAUSTIER_REGEL.sekundenProFund * (1 + baumhausBonus("tier")) ? gibHaustier(h) : null;
}
function vielleichtHaustierBeiErnte() {
  const h = HAUSTIERE.find(x => x.fertigkeit === "garten");
  return !hatHaustier(h.id) && Math.random() < HAUSTIER_REGEL.gartenChance * (1 + baumhausBonus("tier")) ? gibHaustier(h) : null;
}
function vielleichtHaustierBeiChef(monsterId) {
  const h = HAUSTIERE.find(x => x.chef === monsterId);
  return h && !hatHaustier(h.id) && Math.random() < HAUSTIER_REGEL.chefChance * (1 + baumhausBonus("tier")) ? gibHaustier(h) : null;
}

// ----- Erfolge -----
function erfolgErreicht(e) { return !!spiel.erfolge?.[e.id]; }
// Neue Erfolge eintragen und belohnen. Rückgabe: Liste der neuen
function pruefeErfolge() {
  spiel.erfolge = spiel.erfolge || {};
  const neu = [];
  for (const e of ERFOLGE) {
    if (spiel.erfolge[e.id]) continue;
    let wert = 0;
    try { wert = e.wert(); } catch (x) { continue; }
    if (wert >= e.ziel) {
      spiel.erfolge[e.id] = Date.now();
      spiel.muenzen += e.muenzen;
      neu.push(e);
    }
  }
  return neu;
}
function anzahlErfolge() { return ERFOLGE.filter(erfolgErreicht).length; }
