"use strict";
// =====================================================
//  EP-WOCHENENDE – jedes erste Wochenende im Monat (Samstag + Sonntag) gibt es bei allem +50 % Erfahrung.
//  Ab Mittwoch davor wird es im Lauftext angekündigt. Wirkt über trankFaktorXp() (garten.js).
// =====================================================

const EP_WOCHENENDE = { bonus: 0.5, ankuendigenAbTag: 3 };   // 3 = Mittwoch

// Ist das (Samstag oder Sonntag) das erste Wochenende des Monats? Entscheidend ist der Samstag (1.–7.).
function epWochenendeAktiv(d = new Date()) {
  const tag = d.getDay();
  if (tag !== 6 && tag !== 0) return false;
  const samstag = new Date(d); if (tag === 0) samstag.setDate(d.getDate() - 1);
  return samstag.getDate() <= 7;
}
function epWochenendeBonus() { return epWochenendeAktiv() ? EP_WOCHENENDE.bonus : 0; }
// Kommt am nächsten Samstag ein EP-Wochenende? (für die Ankündigung Mittwoch bis Freitag)
function epWochenendeBald(d = new Date()) {
  const tag = d.getDay();
  if (tag < EP_WOCHENENDE.ankuendigenAbTag || tag > 5) return false;
  const samstag = new Date(d); samstag.setDate(d.getDate() + (6 - tag));
  return samstag.getDate() <= 7;
}
function epWochenendeText() {
  const p = Math.round(EP_WOCHENENDE.bonus * 100);
  if (epWochenendeAktiv()) return `🎉 EP-Wochenende! Bis Sonntagabend gibt es bei allem +${p} % Erfahrung – leg los!`;
  if (epWochenendeBald()) return `📅 Bald ist EP-Wochenende: Am Samstag und Sonntag gibt es bei allem +${p} % Erfahrung!`;
  return "";
}

function richteEpWochenendeEin() {
  let warAktiv = epWochenendeAktiv();
  jedeSekunde(() => {
    zeigeLauftext();
    const jetzt = epWochenendeAktiv();
    if (jetzt && !warAktiv) { ton.stufe(); melde(`🎉 Das EP-Wochenende hat begonnen: +${Math.round(EP_WOCHENENDE.bonus * 100)} % Erfahrung bei allem!`, "gross"); }
    warAktiv = jetzt;
  }, 30);
  zeigeLauftext();
}
