"use strict";
// =====================================================
//  ÜBUNGS-TOPF (wie der "Mastery Pool" in Melvor Idle)
//  Jede Fertigkeit mit Tätigkeiten hat einen Topf. Ein Viertel jeder Übungs-Erfahrung fließt hinein.
//  Ab 10 / 25 / 50 / 95 % gibt es Boni für die ganze Fertigkeit.
//  Was über der letzten erreichten Marke liegt, kann man in einzelne Tätigkeiten stecken (⭐ erhöhen).
//  spiel.topf = { fertigkeitId: Erfahrung im Topf }
// =====================================================

const TOPF = {
  anteil: 0.25,
  max: 3400000,   // so voll ist ein Topf etwa, wenn die Fertigkeit auf 99 ist (Balancing)
  marken: [
    { p: 0.10, art: "uebung",    wert: 0.05, text: "Übung steigt 5 % schneller" },
    { p: 0.25, art: "xp",        wert: 0.03, text: "+3 % Erfahrung" },
    { p: 0.50, art: "schneller", wert: 0.05, text: "5 % schneller" },
    { p: 0.95, art: "doppelt",   wert: 0.05, text: "+5 % doppelte Ausbeute" },
  ],
};

// Welche Fertigkeiten einen Topf haben (alle mit Übung)
const topfFertigkeiten = () => FERTIGKEITEN.filter(f => f.id === "garten" || TAETIGKEITEN.some(t => t.fertigkeit === f.id && !t.kleidung)).map(f => f.id);
const topfStand = fid => spiel.topf?.[fid] || 0;
const topfAnteil = fid => Math.min(1, topfStand(fid) / TOPF.max);
function topfBonus(fid, art) {
  if (!spiel.topf) return 0;
  const a = topfAnteil(fid);
  return TOPF.marken.reduce((s, m) => s + (m.art === art && a >= m.p ? m.wert : 0), 0);
}
// Unter diese Menge fällt der Topf beim Hineinstecken nie (letzte erreichte Marke)
function topfSchutz(fid) {
  const a = topfAnteil(fid);
  const marke = TOPF.marken.filter(m => a >= m.p).pop();
  return marke ? Math.ceil(marke.p * TOPF.max) : 0;
}
const topfVerfuegbar = fid => Math.max(0, topfStand(fid) - topfSchutz(fid));

// Übungs-Erfahrung geben – füllt dabei den Topf (zentrale Stelle für Tätigkeiten und Garten)
function uebungGeben(uebungsId, fid, xp) {
  const plus = xp * (1 + topfBonus(fid, "uebung"));
  spiel.uebung[uebungsId] = (spiel.uebung[uebungsId] || 0) + plus;
  spiel.topf = spiel.topf || {};
  spiel.topf[fid] = Math.min(TOPF.max, topfStand(fid) + plus * TOPF.anteil);
}

// Was kostet es, eine Tätigkeit um 1 ⭐ zu erhöhen?
function steckKosten(uebungsId) {
  const xp = spiel.uebung[uebungsId] || 0, l = stufeAusXp(xp);
  return l >= SPIEL.maxStufe ? null : Math.ceil(XP_TABELLE[l + 1] - xp);
}
function steckeInTaetigkeit(uebungsId, fid) {
  const k = steckKosten(uebungsId);
  if (!k || topfVerfuegbar(fid) < k) return false;
  spiel.topf[fid] -= k;
  spiel.uebung[uebungsId] = (spiel.uebung[uebungsId] || 0) + k;
  return true;
}

erfolg({ id: "topf-10", icon: "🫙", name: "Erster Topf", text: "Fülle einen Übungs-Topf auf 10 %", ziel: 1, muenzen: 2000,
  wert: () => topfFertigkeiten().filter(f => topfAnteil(f) >= 0.1).length });
erfolg({ id: "topf-95", icon: "🫙", name: "Randvoll", text: "Fülle einen Übungs-Topf auf 95 %", ziel: 1, muenzen: 500000,
  wert: () => topfFertigkeiten().filter(f => topfAnteil(f) >= 0.95).length });
