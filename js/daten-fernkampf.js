"use strict";
// =====================================================
//  FERNKAMPF & MAGIE – Daten
//  Die Waffe bestimmt die Kampfart:  Schwert = ⚔️ Nahkampf · Bogen = 🏹 Fernkampf · Zauberstab = 🪄 Magie
//  • Bogen braucht Pfeile (Köcher, wie Essen gewählt) – manche Pfeile kann man wieder aufsammeln.
//  • Zauberstab braucht Zauberperlen – jeder Zauber verbraucht eine.
//  • Kampf-Dreieck: ⚔️ stark gegen 🏹-Monster, 🏹 stark gegen 🪄-Monster, 🪄 stark gegen ⚔️-Monster.
//  Bögen und Pfeile: Schnitzen. Zauberstäbe und Zauberperlen: Goldschmieden.
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "schutz"), 0,
  { id: "fernkampf", name: "Fern­kampf", icon: "🏹", art: "kampf", farbe: "#6fbf5a", tun: "schießt", text: "Wie gut triffst du mit Pfeil und Bogen?" },
  { id: "magie",     name: "Magie",      icon: "🪄", art: "kampf", farbe: "#a77bff", tun: "zaubert", text: "Wie stark sind deine Zauber?" });

const KAMPFARTEN = {
  nah:   { name: "Nahkampf",  icon: "⚔️", stark: "fern",  fertigkeit: "mut",       waffe: "Schwert",    munition: null },
  fern:  { name: "Fernkampf", icon: "🏹", stark: "magie", fertigkeit: "fernkampf", waffe: "Bogen",      munition: "pfeile" },
  magie: { name: "Magie",     icon: "🪄", stark: "nah",   fertigkeit: "magie",     waffe: "Zauberstab", munition: "perlen" },
};
Object.assign(KAMPF, {
  dreieckStark: 0.25,     // gegen die "schwache" Monster-Art: +25 % Treffer und Schlag
  dreieckSchwach: 0.15,   // gegen die "starke" Monster-Art: −15 %
  pfeilZurueck: 0.4,      // so oft kann man einen Pfeil wieder aufsammeln
});
KAMPFSTILE.forEach(s => { s.kampfart = s.id === "schutz" ? "alle" : "nah"; });
KAMPFSTILE.push(
  { id: "fernkampf", name: "Schießen", icon: "🏹", text: "übt Fernkampf", kampfart: "fern" },
  { id: "magie",     name: "Zaubern",  icon: "🪄", text: "übt Magie",     kampfart: "magie" });

// ----- Waffen und Munition (Werte wie beim Schwert; die Munition gibt einen Teil der Kraft) -----
const SCHWERT = AUSRUESTUNG_ARTEN.find(a => a.art === "schwert");
const BOEGEN = ["Kurzbogen", "Birkenbogen", "Kirschbogen", "Ahornbogen", "Eichenbogen", "Zauberbogen", "Sternenbogen", "Regenbogen-Bogen"];
const STAEBE = ["Ast-Zauberstab", "Birken-Zauberstab", "Kirsch-Zauberstab", "Ahorn-Zauberstab", "Eichen-Zauberstab", "Feen-Zauberstab", "Sternen-Zauberstab", "Regenbogen-Zauberstab"];
const ohneBonus = { treff: 0, kraft: 0, abwehr: 0, weniger: 0 };
for (let i = 0; i < 8; i++) {
  const waffenBonus = { ...ohneBonus, treff: SCHWERT.treff[i], kraft: Math.round(SCHWERT.kraft[i] * 0.6) };
  const munBonus = { ...ohneBonus, kraft: Math.round(SCHWERT.kraft[i] * 0.5) };
  // Bogen + Pfeile (Schnitzen)
  gegenstand(`bogen${i}`, BOEGEN[i], "emoji", TIER_FARBEN[i], WERTE[i] * 25 + 10, { emoji: "🏹", platz: "waffe", kampfart: "fern", braucht: { fernkampf: STUFEN[i] }, bonus: waffenBonus });
  taetigkeit({ id: `schnitzen-bogen${i}`, fertigkeit: "schnitzen", name: BOEGEN[i], stufe: Math.min(99, STUFEN[i] + 4), xp: Math.round(XP[i] * 5), zeit: 4,
    braucht: { [`holz${i}`]: 3 }, gibt: { [`bogen${i}`]: 1 } });
  gegenstand(`pfeil${i}`, `${ERZE[i]}-Pfeil`, "emoji", TIER_FARBEN[i], Math.max(1, Math.round(WERTE[i] * 0.6)), { emoji: "➳", munition: "pfeile", braucht: { fernkampf: STUFEN[i] }, bonus: munBonus });
  taetigkeit({ id: `schnitzen-pfeil${i}`, fertigkeit: "schnitzen", name: `${ERZE[i]}-Pfeile (15)`, stufe: Math.min(99, STUFEN[i] + 2), xp: Math.round(XP[i] * 2.5), zeit: 3.5,
    braucht: { [`holz${i}`]: 1, [`barren${i}`]: 1 }, gibt: { [`pfeil${i}`]: 15 } });
  // Zauberstab + Zauberperlen (Goldschmieden)
  gegenstand(`stab${i}`, STAEBE[i], "emoji", TIER_FARBEN[i], WERTE[i] * 40 + 20, { emoji: "🪄", platz: "waffe", kampfart: "magie", braucht: { magie: STUFEN[i] }, bonus: waffenBonus });
  taetigkeit({ id: `schmuck-stab${i}`, fertigkeit: "schmuck", name: STAEBE[i], stufe: Math.min(99, STUFEN[i] + 4), xp: Math.round(XP[i] * 6), zeit: 4,
    braucht: { [`holz${i}`]: 2, [`stein${i}`]: 1 }, gibt: { [`stab${i}`]: 1 } });
  gegenstand(`perle${i}`, `${ERZE[i]}-Zauberperle`, "emoji", TIER_FARBEN[i], Math.max(1, Math.round(WERTE[i] * 0.8)), { emoji: "🔮", munition: "perlen", braucht: { magie: STUFEN[i] }, bonus: munBonus });
  taetigkeit({ id: `schmuck-perle${i}`, fertigkeit: "schmuck", name: `${ERZE[i]}-Zauberperlen (15)`, stufe: Math.min(99, STUFEN[i] + 2), xp: Math.round(XP[i] * 1.5), zeit: 3,
    braucht: { [`erz${i}`]: 1 }, gibt: { [`perle${i}`]: 15 } });
}

// ----- Kampfart jedes Monsters (jedes Gebiet hat alle drei) -----
const MONSTER_KAMPFART = {
  schleimchen: "nah", brummhummel: "fern", frechdachs: "nah", pusteriese: "magie", hummelkoenigin: "fern",
  pilzmann: "magie", wuschelwolf: "nah", eulenwaechter: "fern", baumgeist: "magie", eichenriese: "nah",
  ruestungsgeist: "nah", steinkobold: "fern", fledermausbande: "fern", burggespenst: "magie", gespensterkoenigin: "magie",
  flammenwichtel: "magie", lavakroete: "nah", glutechse: "fern", feuerdrache: "magie", lavagolem: "nah",
  schneegeist: "magie", frostyeti: "nah", eisigel: "fern", frostkoenig: "magie", eisdrache: "fern",
  donnerwolke: "magie", sternenfuchs: "fern", mondeule: "magie", regenbogendrache: "nah", sternenwal: "magie",
};
for (const m of Object.values(MONSTER)) m.kampfart = MONSTER_KAMPFART[m.id] || "nah";
const monsterArt = m => m?.kampfart || "nah";

// ----- Erfolge -----
erfolg({ id: "fern-100", icon: "🏹", name: "Meisterschützin", text: "Lass 100 Monster mit Pfeil und Bogen einschlafen", ziel: 100, muenzen: 20000, wert: () => spiel.statistik.besiegtFern || 0 });
erfolg({ id: "magie-100", icon: "🪄", name: "Kleine Zauberin", text: "Lass 100 Monster mit Magie einschlafen", ziel: 100, muenzen: 20000, wert: () => spiel.statistik.besiegtMagie || 0 });
erfolg({ id: "dreieck", icon: "🔺", name: "Alle drei Kampfarten", text: "Lass je ein Monster mit Schwert, Bogen und Zauberstab einschlafen", ziel: 3, muenzen: 5000,
  wert: () => ["besiegtNah", "besiegtFern", "besiegtMagie"].filter(k => (spiel.statistik[k] || 0) > 0).length });
