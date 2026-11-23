"use strict";
// =====================================================
//  LAGERFEUER (wie "Feuermachen" in Melvor Idle)
//  Frei nach dem 3. geschafften Abenteuer-Pfad.
//  • Holz verbrennen = normale Tätigkeit -> Erfahrung + Asche
//  • Großes Lagerfeuer: kostet viel Holz, brennt 60 Minuten in echter Zeit (auch offline)
//    und gibt solange mehr Erfahrung bei ALLEM (besseres Holz = mehr Bonus)
//  • Asche ist Dünger für den Garten: gedüngte Beete wachsen schneller und bringen mehr
//  spiel.lagerfeuer = { bis: Zeitpunkt, tier }
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "kochen") + 1, 0,
  { id: "feuer", name: "Lager­feuer", icon: "🔥", art: "machen", farbe: "#ff8a4a", tun: "macht Feuer" });

const FEUER = {
  minuten: 60,                 // so lange brennt ein großes Lagerfeuer
  holz: 25,                    // so viel Holz kostet es
  bonusBasis: 0.05,            // +5 % Erfahrung …
  bonusProSorte: 0.01,         // … +1 % je bessere Holzsorte (Regenbogenholz: +12 %)
  duengerSchneller: 0.3,       // Dünger: Beet ist sofort 30 % weiter
  duengerMehr: 0.25,           // und bringt 25 % mehr Ernte
};

gegenstand("asche0", "Asche", "emoji", "#b8b0a8", 1, { emoji: "🌫️" });
HOLZ.forEach((name, i) => {
  taetigkeit({ id: `feuer-${i}`, fertigkeit: "feuer", name: `${name} verbrennen`, stufe: STUFEN[i], xp: Math.round(XP[i] * 1.5), zeit: 2.5,
    braucht: { [`holz${i}`]: 1 }, gibt: { asche0: 1 } });
});

HAUSTIERE.push({ id: "glimmi", name: "Glimmi", tier: "Glühwürmchen", emoji: "🪲", fertigkeit: "feuer", bonus: { art: "schneller", wert: 0.05 }, text: "Lagerfeuer 5 % schneller" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

// ===================== LOGIK =====================
const feuerFrei = () => PFADE.filter(p => (spiel.pfade?.[p.id] || 0) > 0).length >= 3 || (spiel.xp?.feuer || 0) > 0;
const feuerBrennt = () => (spiel.lagerfeuer?.bis || 0) > Date.now();
const feuerBonusFuer = tier => FEUER.bonusBasis + FEUER.bonusProSorte * tier;
// Erfahrungs-Bonus des großen Lagerfeuers (steckt in trankFaktorXp – gilt also überall)
function feuerBonus() { return feuerBrennt() ? feuerBonusFuer(spiel.lagerfeuer.tier) : 0; }
function zuendeAn(tier) {
  const id = `holz${tier}`;
  if (feuerBrennt() || stufe("feuer") < STUFEN[tier] || anzahl(id) < FEUER.holz) return false;
  nimmAusBank(id, FEUER.holz);
  spiel.lagerfeuer = { bis: Date.now() + FEUER.minuten * 60000, tier };
  spiel.statistik.lagerfeuer = (spiel.statistik.lagerfeuer || 0) + 1;
  return true;
}

// ----- Dünger für den Garten -----
const pflanzenTier = p => Math.max(0, STUFEN.indexOf(p.stufe));
const duengerKosten = beet => pflanzenTier(pflanze(beet.pflanze)) + 1;
function duengbareBeete() { return gartenStand().beete.filter(b => b && !b.geduengt && beetFortschritt(b) < 1); }
function duengerBedarf() { return duengbareBeete().reduce((s, b) => s + duengerKosten(b), 0); }
// Düngt so viele wachsende Beete, wie die Asche reicht. Rückgabe: Anzahl gedüngter Beete
function duengeAlle() {
  let n = 0;
  for (const b of duengbareBeete()) {
    const k = duengerKosten(b);
    if (anzahl("asche0") < k) break;
    nimmAusBank("asche0", k);
    b.start -= wachsMs(b) * FEUER.duengerSchneller;
    b.geduengt = true;
    n++;
  }
  spiel.statistik.geduengt = (spiel.statistik.geduengt || 0) + n;
  return n;
}

// ----- Erfolge -----
erfolg({ id: "feuer-1", icon: "🔥", name: "Lagerfeuer-Romantik", text: "Zünde dein erstes großes Lagerfeuer an", ziel: 1, muenzen: 1500, wert: () => spiel.statistik.lagerfeuer || 0 });
erfolg({ id: "feuer-100", icon: "🔥", name: "Feuerwache", text: "Zünde 100 große Lagerfeuer an", ziel: 100, muenzen: 200000, wert: () => spiel.statistik.lagerfeuer || 0 });
erfolg({ id: "duenger-100", icon: "🌱", name: "Grüner Daumen", text: "Dünge 100 Beete mit Asche", ziel: 100, muenzen: 50000, wert: () => spiel.statistik.geduengt || 0 });
