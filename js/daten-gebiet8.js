"use strict";
// =====================================================
//  8. GEBIET – DAS FINALE: der Regenbogen-Gipfel (empfohlen ab Kampfstufe 99)
//  Der Graue Nebel hat dem höchsten Berg der Welt alle Farben gestohlen.
//  Drei Nebel-Monster, Chef Nebelkönig, 8. Pfad "Regenbogenpfad" mit dem Großen Nebeldrachen.
//  Wer den Regenbogenpfad schafft, hat das große Abenteuer beendet -> Finale-Fenster mit Abspann.
// =====================================================

BEUTE.push(["nebelflocke", "Nebelflocke", "☁️"], ["farbtropfen", "Farbtropfen", "🌈"]);
BEUTE.slice(-2).forEach(([id, name, emoji]) => {
  const i = BEUTE.findIndex(b => b[0] === id);
  gegenstand(id, name, "emoji", "#c9d2e0", 4 + i * i * 3, { emoji });
});
gegenstand("pokal7", "Heldinnen-Pokal", "emoji", "#ffd54f", 200 * Math.pow(3, 7), { emoji: "🏆" });

const GIPFEL = { id: "gipfel", name: "Regenbogen-Gipfel", icon: "🌈", farbe: "#e0e4ee", ab: 99, beute: ["nebelflocke", "farbtropfen"], monster: [
  { id: "steinwaechter", name: "Grauer Stein­wächter", stufe: 118, kampfart: "nah",   aussehen: { farbe: "#a7a2b0", form: "rund", extra: "steine" } },
  { id: "wirbelwind",    name: "Nebel­wirbel",         stufe: 124, kampfart: "fern",  aussehen: { farbe: "#c9d2e0", form: "wolke", extra: "blitz" } },
  { id: "nebelgeist",    name: "Farbloser Geist",     stufe: 128, kampfart: "magie", aussehen: { farbe: "#e6e8ee", form: "geist", extra: "flocken" } },
  { id: "nebelkoenig",   name: "Nebel­könig",          stufe: 135, kampfart: "magie", chef: true, aussehen: { farbe: "#b8bfcc", form: "geist", extra: "krone" } },
] };
GEBIETE.push(GIPFEL);
const gi8 = GEBIETE.length - 1;
for (const m of GIPFEL.monster) {
  const L = m.stufe, chef = m.chef ? 1 : 0;
  Object.assign(m, {
    gebiet: GIPFEL.id,
    hp: Math.round((15 + L * 7 + L * L * 0.1) * (chef ? 2.5 : 1)),
    maxSchlag: Math.round((2 + L * 1.6) * (chef ? 1.3 : 1)),
    genauigkeit: Math.round((L + 8) * (52 + L * 0.6)),
    ausweichen: Math.round((L + 8) * (64 + L * 0.8)),
    tempo: chef ? 3.2 : 2.8,
    muenzen: [L * 2 * (chef ? 5 : 1), L * 6 * (chef ? 5 : 1)],
    beute: [
      { id: "nebelflocke", chance: 0.6, anzahl: [2, 4] },
      { id: "farbtropfen", chance: 0.3, anzahl: [1, 2] },
      { id: "fisch7", chance: 0.2, anzahl: [2, 5] },
      { id: "erz7", chance: 0.2, anzahl: [2, 5] },
      ...(chef ? [{ id: "pokal7", chance: 0.1, anzahl: [1, 1] }] : []),
    ],
  });
  MONSTER[m.id] = m;
}

PFAD_WAECHTER.gipfel = { id: "nebeldrache", name: "Großer Nebel­drache", plus: 13, aussehen: { farbe: "#8a8f9e", hoerner: true, fluegel: "drache", extra: "zacken" } };
{
  const p = { id: "p-gipfel", gebiet: "gipfel", name: "Regenbogenpfad", icon: "🌈" };
  const chef = GIPFEL.monster.find(m => m.chef), normal = GIPFEL.monster.filter(m => !m.chef), w = PFAD_WAECHTER.gipfel;
  const L = chef.stufe + w.plus;
  MONSTER[w.id] = {
    id: w.id, name: w.name, stufe: L, aussehen: w.aussehen, gebiet: "gipfel", chef: true, waechter: true, kampfart: "nah",
    hp: Math.round((15 + L * 7 + L * L * 0.1) * 3), maxSchlag: Math.round((2 + L * 1.6) * 1.35),
    genauigkeit: Math.round((L + 8) * (52 + L * 0.6)), ausweichen: Math.round((L + 8) * (64 + L * 0.8)), tempo: 3.2,
    muenzen: [L * 10, L * 30], beute: [],
  };
  Object.assign(p, { liste: [...normal.flatMap(m => [m.id, m.id]), chef.id, w.id], chef: chef.id, waechter: w.id, stufe: L, rahmenId: `rp${PFADE.length}` });
  RAHMEN.push({ id: p.rahmenId, name: `${p.name}-Rahmen`, icon: p.icon, pfad: p.name, svg: emojiRahmen("#ff9fd0", [p.icon, "🗝️"]) });
  p.truhe = { muenzen: [L * 10, L * 20], sachen: [
    { id: "nebelflocke", anzahl: [10, 20] }, { id: "farbtropfen", anzahl: [3, 6] },
    { id: "barren7", anzahl: [8, 14] }, { id: "essen7", anzahl: [10, 16] }, { id: "stein7", anzahl: [2, 4] } ] };
  PFADE.push(p);
}

// Haustier des Nebelkönigs: eine Regenbogen-Taube, die die Farben zurückbringt
HAUSTIERE.push({ id: "prisma", name: "Prisma", tier: "Regenbogen-Taube", emoji: "🕊️", chef: "nebelkoenig", bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppelte Ausbeute bei allem" });

// Belohnungen des Finales (hinten an die Listen!)
HUETE.push({ id: "hf1", name: "Regenbogen-Krone", icon: "👑", finale: true, svg: `<path d="M28 30L30 10L40 20L50 6L60 20L70 10L72 30Z" fill="#ffd54f" stroke="#c98a1a" stroke-width="2" stroke-linejoin="round"/>
  ${["#ff7a7a", "#ffb86b", "#8fcf6a", "#7ad7f0", "#b48cff"].map((f, i) => `<circle cx="${32 + i * 9}" cy="26" r="3" fill="${f}"/>`).join("")}` });
RAHMEN.push({ id: "rf1", name: "Heldinnen-Rahmen", icon: "🌈", finale: true, svg: ["#ff7a7a", "#ffb86b", "#ffd54f", "#8fcf6a", "#7ad7f0", "#b48cff"].map((f, i) =>
  `<circle cx="50" cy="50" r="${47 - i * 1.6}" fill="none" stroke="${f}" stroke-width="1.8"/>`).join("") + ringPunkte(8).map(([x, y]) => stern(x, y, 4, "#ffd54f")).join("") });

{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
  const monster = ERFOLGE.find(e => e.id === "alle-monster");
  if (monster) monster.ziel = Object.keys(MONSTER).length;
  const pfade = ERFOLGE.find(e => e.id === "pfad-alle");
  if (pfade) { pfade.ziel = PFADE.length; pfade.text = `Schaffe jeden der ${PFADE.length} Abenteuer-Pfade`; }
}
erfolg({ id: "chef-nebelkoenig", icon: GIPFEL.icon, name: `Chef von ${GIPFEL.name}`, text: "Nebelkönig schläft ein", ziel: 1, muenzen: 500 * Math.pow(4, gi8),
  wert: () => spiel.besiegt?.nebelkoenig || 0 });
erfolg({ id: "finale", icon: "🌈", name: "Heldin des Regenbogens", text: "Schaffe den Regenbogenpfad und bring die Farben zurück", ziel: 1, muenzen: 10000000,
  wert: () => spiel.pfade?.["p-gipfel"] || 0 });
