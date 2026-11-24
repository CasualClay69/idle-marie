"use strict";
// =====================================================
//  7. GEBIET: das Traumschloss (Endspiel, empfohlen ab Kampfstufe 95)
//  Drei Monster (je eine Kampfart), Chefin Traumkönigin, 7. Pfad "Traumpfad" mit dem
//  Mitternachtsdrachen als Wächter. Neue Beute, Traum-Pokal, Haustier Schlafi.
//  Werte werden genauso berechnet wie in daten-kampf.js / daten-pfade.js.
// =====================================================

// ----- Beute (hinten an BEUTE, damit die Seltenheit stimmt) -----
BEUTE.push(["traumsand", "Traumsand", "💤"], ["mondperle", "Mondperle", "🌙"]);
BEUTE.slice(-2).forEach(([id, name, emoji]) => {
  const i = BEUTE.findIndex(b => b[0] === id);
  gegenstand(id, name, "emoji", "#d9c8ff", 4 + i * i * 3, { emoji });
});
gegenstand("pokal6", "Traum-Pokal", "emoji", TIER_FARBEN[7], 200 * Math.pow(3, 6), { emoji: "🏆" });

// ----- Gebiet und Monster -----
const TRAUM = { id: "traum", name: "Traumschloss", icon: "🌙", farbe: "#d9c8ff", ab: 95, beute: ["traumsand", "mondperle"], monster: [
  { id: "kissenmonster",  name: "Kissen­monster",       stufe: 104, kampfart: "nah",   aussehen: { farbe: "#ffe0f0", form: "rund", extra: "herz" } },
  { id: "traumfalter",    name: "Traum­falter",         stufe: 110, kampfart: "fern",  aussehen: { farbe: "#b48cff", fluegel: true, extra: "sterne" } },
  { id: "schlafgeist",    name: "Schlaf­mützen-Geist",  stufe: 116, kampfart: "magie", aussehen: { farbe: "#c9d2ff", form: "geist", extra: "sterne" } },
  { id: "traumkoenigin",  name: "Traum­königin",        stufe: 125, kampfart: "magie", chef: true, aussehen: { farbe: "#e8d0ff", form: "geist", extra: "krone" } },
] };
GEBIETE.push(TRAUM);
const gi7 = GEBIETE.length - 1;
for (const m of TRAUM.monster) {
  const L = m.stufe, chef = m.chef ? 1 : 0;
  Object.assign(m, {
    gebiet: TRAUM.id,
    hp: Math.round((15 + L * 7 + L * L * 0.1) * (chef ? 2.5 : 1)),
    maxSchlag: Math.round((2 + L * 1.6) * (chef ? 1.3 : 1)),
    genauigkeit: Math.round((L + 8) * (52 + L * 0.6)),
    ausweichen: Math.round((L + 8) * (64 + L * 0.8)),
    tempo: chef ? 3.2 : 2.8,
    muenzen: [L * 2 * (chef ? 5 : 1), L * 6 * (chef ? 5 : 1)],
    beute: [
      { id: "traumsand", chance: 0.6, anzahl: [2, 4] },
      { id: "mondperle", chance: 0.3, anzahl: [1, 2] },
      { id: "fisch7", chance: 0.15, anzahl: [2, 4] },
      { id: "erz7", chance: 0.15, anzahl: [2, 4] },
      ...(chef ? [{ id: "pokal6", chance: 0.1, anzahl: [1, 1] }] : []),
    ],
  });
  MONSTER[m.id] = m;
}

// ----- 7. Pfad mit Wächter -----
PFAD_WAECHTER.traum = { id: "mitternachtsdrache", name: "Mitter­nachts­drache", plus: 12, aussehen: { farbe: "#3b3f8f", hoerner: true, fluegel: "drache", extra: "sterne" } };
{
  const p = { id: "p-traum", gebiet: "traum", name: "Traumpfad", icon: "🌙" };
  const chef = TRAUM.monster.find(m => m.chef), normal = TRAUM.monster.filter(m => !m.chef), w = PFAD_WAECHTER.traum;
  const L = chef.stufe + w.plus;
  MONSTER[w.id] = {
    id: w.id, name: w.name, stufe: L, aussehen: w.aussehen, gebiet: "traum", chef: true, waechter: true, kampfart: "nah",
    hp: Math.round((15 + L * 7 + L * L * 0.1) * 3), maxSchlag: Math.round((2 + L * 1.6) * 1.35),
    genauigkeit: Math.round((L + 8) * (52 + L * 0.6)), ausweichen: Math.round((L + 8) * (64 + L * 0.8)), tempo: 3.2,
    muenzen: [L * 10, L * 30], beute: [],
  };
  Object.assign(p, { liste: [...normal.flatMap(m => [m.id, m.id]), chef.id, w.id], chef: chef.id, waechter: w.id, stufe: L, rahmenId: `rp${PFADE.length}` });
  RAHMEN.push({ id: p.rahmenId, name: `${p.name}-Rahmen`, icon: p.icon, pfad: p.name, svg: emojiRahmen(TRAUM.farbe, [p.icon, "🗝️"]) });
  p.truhe = { muenzen: [L * 8, L * 16], sachen: [
    { id: "traumsand", anzahl: [10, 20] }, { id: "mondperle", anzahl: [3, 6] },
    { id: "barren7", anzahl: [5, 10] }, { id: "essen7", anzahl: [8, 14] }, { id: "stein7", anzahl: [1, 3] } ] };
  PFADE.push(p);
}

// ----- Haustier der Chefin -----
HAUSTIERE.push({ id: "schlafi", name: "Schlafi", tier: "Panda", emoji: "🐼", chef: "traumkoenigin", bonus: { art: "xp", wert: 0.05 }, text: "+5 % Erfahrung bei allem" });

// ----- Erfolge anpassen und dazu -----
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
  const monster = ERFOLGE.find(e => e.id === "alle-monster");
  if (monster) monster.ziel = Object.keys(MONSTER).length;
  const pfade = ERFOLGE.find(e => e.id === "pfad-alle");
  if (pfade) { pfade.ziel = PFADE.length; pfade.text = `Schaffe jeden der ${PFADE.length} Abenteuer-Pfade`; }
}
erfolg({ id: "chef-traumkoenigin", icon: TRAUM.icon, name: `Chef von ${TRAUM.name}`, text: "Traumkönigin schläft ein", ziel: 1, muenzen: 500 * Math.pow(4, gi7),
  wert: () => spiel.besiegt?.traumkoenigin || 0 });
erfolg({ id: "traum-drache", icon: "🌙", name: "Gute Nacht, Drache!", text: "Lass den Mitternachtsdrachen einschlafen", ziel: 1, muenzen: 5000000,
  wert: () => spiel.besiegt?.mitternachtsdrache || 0 });
