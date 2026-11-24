"use strict";
// =====================================================
//  TIER-FREUNDE (wie "Beschwören/Summoning" in Melvor Idle)
//  Frei, sobald der erste Chef (Pusteblumen-Riese) eingeschlafen ist. Neue Fertigkeit "Tierfreundschaft".
//  • Leckerli backen (Tätigkeit) aus Fisch – 8 Sorten.
//  • Leckerli in den Futternapf -> der Begleiter ist AKTIV: sein Bonus wirkt stärker und im Kampf
//    stupst er die Monster mit an. Alle 5 Aktionen/Angriffe frisst er ein Leckerli (gibt Erfahrung).
//  spiel.napf = Leckerli-ID · spiel.napfZaehler
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "naehen") + 1, 0,
  { id: "freunde", name: "Tier­freund­schaft", icon: "🐾", art: "machen", farbe: "#ffb36b", tun: "backt Leckerli" });

const FREUNDE = {
  aktionenProLeckerli: 5,
  bonusBasis: 0.5, bonusProSorte: 0.1,          // aktiver Begleiter: eigener Bonus × (1 + 0,5 … 1,2)
  stupsBasis: 0.05, stupsProSorte: 0.03, stupsProStufe: 0.01,   // Anteil vom eigenen stärksten Schlag
};
const LECKERLI = ["Knusper-Leckerli", "Forellen-Kekse", "Karpfen-Happen", "Lachs-Bällchen", "Thunfisch-Taler", "Kugelfisch-Kringel", "Tintenfisch-Törtchen", "Goldfisch-Schmaus"];
LECKERLI.forEach((name, i) => {
  gegenstand(`leckerli${i}`, name, "emoji", TIER_FARBEN[i], Math.max(1, Math.round(WERTE[i] * 0.8)), { emoji: "🦴", leckerli: i, braucht: { freunde: STUFEN[i] } });
  taetigkeit({ id: `freunde-${i}`, fertigkeit: "freunde", name: `${name} (5)`, stufe: STUFEN[i], xp: Math.round(XP[i] * 1.6), zeit: 3,
    braucht: { [`fisch${i}`]: 2 }, gibt: { [`leckerli${i}`]: 5 } });
});

HAUSTIERE.push({ id: "naschi", name: "Naschi", tier: "Waschbär", emoji: "🦝", fertigkeit: "freunde", bonus: { art: "schneller", wert: 0.05 }, text: "Leckerli 5 % schneller backen" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

// ===================== LOGIK =====================
const freundeFrei = () => (spiel.besiegt?.pusteriese || 0) > 0 || (spiel.xp?.freunde || 0) > 0;
const begleiterTier = () => HAUSTIERE.find(h => h.id === spiel.begleiter && hatHaustier(h.id)) || null;
// Leckerli im Napf, das der Begleiter fressen darf (Stufe reicht, noch welche da)
function napfLeckerli() {
  const g = spiel.napf && GEGENSTAENDE[spiel.napf];
  return g && anzahl(spiel.napf) > 0 && stufe("freunde") >= g.braucht.freunde ? g : null;
}
const begleiterAktiv = () => freundeFrei() && !!begleiterTier() && !!napfLeckerli();
// Um so viel stärker wirkt der Bonus des aktiven Begleiters (0 = nicht aktiv)
function begleiterVerstaerkung(tierId) {
  if (tierId !== spiel.begleiter || !begleiterAktiv()) return 0;
  return FREUNDE.bonusBasis + FREUNDE.bonusProSorte * napfLeckerli().leckerli;
}
// Anstupsen im Kampf: Anteil vom stärksten Schlag
function stupsAnteil() {
  if (!begleiterAktiv()) return 0;
  return FREUNDE.stupsBasis + FREUNDE.stupsProSorte * napfLeckerli().leckerli + FREUNDE.stupsProStufe * tierStufe(spiel.begleiter);
}
// Nach jeder Aktion / jedem Angriff: alle 5 Mal frisst der Begleiter ein Leckerli
function begleiterFrisst(ergebnis) {
  if (!begleiterAktiv()) return;
  spiel.napfZaehler = (spiel.napfZaehler || 0) + 1;
  if (spiel.napfZaehler < FREUNDE.aktionenProLeckerli) return;
  spiel.napfZaehler = 0;
  const g = napfLeckerli();
  nimmAusBank(g.id, 1);
  if (ergebnis?.verbraucht) ergebnis.verbraucht[g.id] = (ergebnis.verbraucht[g.id] || 0) + 1;
  spiel.xp.freunde = (spiel.xp.freunde || 0) + Math.round(XP[g.leckerli] * 2 * trankFaktorXp());
  spiel.statistik.leckerli = (spiel.statistik.leckerli || 0) + 1;
}

// ----- Erfolge -----
erfolg({ id: "freunde-1", icon: "🐾", name: "Mein Freund hilft mir", text: "Füll den Futternapf und lass deinen Begleiter mithelfen", ziel: 1, muenzen: 2000, wert: () => spiel.statistik.leckerli || 0 });
erfolg({ id: "freunde-1000", icon: "🦴", name: "Leckerli-Bäckerin", text: "Dein Begleiter hat 1.000 Leckerli gefressen", ziel: 1000, muenzen: 300000, wert: () => spiel.statistik.leckerli || 0 });
