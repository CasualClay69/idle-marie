"use strict";
// =====================================================
//  NEUE INHALTE – Daten (v1.32)
//  • Bäckerei: neue Fertigkeit "backen" – Kuchen aus Gemüse und Kräutern, die eine Zeit lang wirken
//  • Haustier-Zucht: 12 Mischtiere (Haustiere mit zucht: true)
//  • Verliese: 3 Dungeons, einmal am Tag (eigene Monster)
//  Spind-Teile kommen erst in extras.js dazu (hinten an die Listen – die Bestenliste merkt sich Listenplätze!).
// =====================================================

// ===================== BÄCKEREI =====================
FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "kochen") + 1, 0,
  { id: "backen", name: "Bäckerei", icon: "🍰", art: "machen", farbe: "#e8a36a", tun: "backt" });

// art wie bei den Dauer-Boni (siehe baumhausBonus): sammeln/machen = schneller, doppelt, xp, muenzen, kampfxp, garten
const KUCHEN = [
  { name: "Karotten-Muffin",     emoji: "🍰", art: "sammeln", wert: 5,  stunden: 2, text: "Sammeln 5 % schneller" },
  { name: "Kartoffel-Brot",      emoji: "🥣", art: "machen",  wert: 5,  stunden: 2, text: "Herstellen 5 % schneller" },
  { name: "Tomaten-Tarte",       emoji: "🍰", art: "xp",      wert: 5,  stunden: 3, text: "+5 % Erfahrung bei allem" },
  { name: "Kürbis-Kuchen",       emoji: "🎂", art: "doppelt", wert: 4,  stunden: 3, text: "+4 % doppelte Ausbeute" },
  { name: "Erdbeer-Sahnetorte",  emoji: "🎂", art: "muenzen", wert: 10, stunden: 4, text: "+10 % Münzen von Monstern" },
  { name: "Melonen-Biskuitrolle", emoji: "🍧", art: "kampfxp", wert: 10, stunden: 4, text: "+10 % Kampf-Erfahrung" },
  { name: "Sternenbeeren-Torte", emoji: "🎂", art: "xp",      wert: 10, stunden: 6, text: "+10 % Erfahrung bei allem" },
  { name: "Regenbogen-Torte",    emoji: "🎂", art: "xp",      wert: 15, stunden: 8, text: "+15 % Erfahrung bei allem" },
];
KUCHEN.forEach((k, i) => {
  k.id = `kuchen${i}`;
  gegenstand(k.id, k.name, "emoji", TIER_FARBEN[i], WERTE[i] * 20 + 10, { emoji: k.emoji, kuchen: k });
  taetigkeit({ id: `backen-${i}`, fertigkeit: "backen", name: k.name, stufe: STUFEN[i], xp: Math.round(XP[i] * 2.2), zeit: 4,
    braucht: { [`gemuese${i}`]: 2, [`kraut${i}`]: 1 }, gibt: { [k.id]: 1 } });
});
HAUSTIERE.push({ id: "zimt", name: "Zimt", tier: "Backstubenmaus", emoji: "🐭", fertigkeit: "backen", bonus: { art: "schneller", wert: 0.05 }, text: "Backen 5 % schneller" });
erfolg({ id: "backen-1", icon: "🍰", name: "Frisch aus dem Ofen", text: "Iss deinen ersten Kuchen", ziel: 1, muenzen: 1000, wert: () => spiel.statistik.kuchen || 0 });
erfolg({ id: "backen-100", icon: "🎂", name: "Naschkatze", text: "Iss 100 Kuchen", ziel: 100, muenzen: 300000, wert: () => spiel.statistik.kuchen || 0 });

// ===================== HAUSTIER-ZUCHT =====================
// Zwei Haustiere auf Pflege-Stufe 10 -> nach ein paar Stunden schlüpft ein Mischtier.
// Welches, hängt von der "Art" der Eltern ab (Sammeln, Herstellen, Kampf, Glück, Season, Chef).
const ZUCHT = { stunden: 12, schonDaMuenzen: 50000 };
const MISCHTIERE = [
  { id: "zucht1",  name: "Buddelotter",      emoji: "🦦", eltern: ["sammeln", "sammeln"], bonus: { art: "doppelt", wert: 0.06 }, text: "+6 % doppelte Ausbeute bei allem" },
  { id: "zucht2",  name: "Werkelbiber",      emoji: "🦫", eltern: ["machen", "machen"],   bonus: { art: "schneller", wert: 0.06 }, text: "Alles Herstellen 6 % schneller" },
  { id: "zucht3",  name: "Mini-Greif",       emoji: "🐲", eltern: ["kampf", "kampf"],     bonus: { art: "kraft", wert: 0.05 }, text: "+5 % stärkerer Schlag" },
  { id: "zucht4",  name: "Glücksfuchs",      emoji: "🦊", eltern: ["glueck", "glueck"],   bonus: { art: "muenzen", wert: 0.15 }, text: "+15 % Münzen von Monstern" },
  { id: "zucht5",  name: "Fleißbiene",       emoji: "🐝", eltern: ["sammeln", "machen"],  bonus: { art: "xp", wert: 0.04 }, text: "+4 % Erfahrung bei allem" },
  { id: "zucht6",  name: "Waldbär",          emoji: "🐻", eltern: ["sammeln", "kampf"],   bonus: { art: "schutz", wert: 0.05 }, text: "5 % weniger Schaden" },
  { id: "zucht7",  name: "Goldhase",         emoji: "🐰", eltern: ["sammeln", "glueck"],  bonus: { art: "muenzen", wert: 0.1 }, text: "+10 % Münzen von Monstern" },
  { id: "zucht8",  name: "Schmiededrache",   emoji: "🐉", eltern: ["machen", "kampf"],    bonus: { art: "treff", wert: 0.05 }, text: "+5 % öfter treffen" },
  { id: "zucht9",  name: "Zauberkatze",      emoji: "🐱", eltern: ["machen", "glueck"],   bonus: { art: "xp", wert: 0.05 }, text: "+5 % Erfahrung bei allem" },
  { id: "zucht10", name: "Glückswaschbär",   emoji: "🦝", eltern: ["kampf", "glueck"],    bonus: { art: "treff", wert: 0.04 }, text: "+4 % öfter treffen" },
  { id: "zucht11", name: "Jahreszeiten-Einhorn", emoji: "🦄", eltern: ["season", "*"],    bonus: { art: "xp", wert: 0.06 }, text: "+6 % Erfahrung bei allem" },
  { id: "zucht12", name: "Regenbogen-Phönix", emoji: "🕊️", eltern: ["chef", "chef"],      bonus: { art: "doppelt", wert: 0.08 }, text: "+8 % doppelte Ausbeute bei allem" },
];
for (const m of MISCHTIERE) HAUSTIERE.push({ ...m, tier: "Mischtier", zucht: true });
// Zu welcher Gruppe gehört ein Haustier?
function zuchtGruppe(h) {
  if (h.season) return "season";
  if (h.chef) return "chef";
  if (h.zucht) return "glueck";
  if (["treff", "kraft", "schutz"].includes(h.bonus.art)) return "kampf";
  if (h.bonus.art === "schneller") return "machen";
  if (h.bonus.art === "doppelt") return "sammeln";
  return "glueck";
}
function mischtierFuer(a, b) {
  const g = [zuchtGruppe(a), zuchtGruppe(b)];
  if (g[0] === "chef" && g[1] === "chef") return MISCHTIERE[11];
  if (g.includes("season")) return MISCHTIERE[10];
  const n = g.map(x => (x === "chef" ? "kampf" : x)).sort();
  return MISCHTIERE.find(m => [...m.eltern].sort().join() === n.join()) || MISCHTIERE[3];
}
erfolg({ id: "zucht-1", icon: "🥚", name: "Es ist geschlüpft!", text: "Züchte dein erstes Mischtier", ziel: 1, muenzen: 20000, wert: () => (spiel.haustiere || []).filter(id => id.startsWith("zucht")).length });
erfolg({ id: "zucht-alle", icon: "🥚", name: "Zuchtmeisterin", text: "Züchte alle 12 Mischtiere", ziel: MISCHTIERE.length, muenzen: 3000000, wert: () => (spiel.haustiere || []).filter(id => id.startsWith("zucht")).length });

// ===================== VERLIESE (DUNGEONS) =====================
// Einmal am Tag je Verlies: 5 Räume und ein Endgegner, dann eine große Verlies-Truhe.
const VERLIES_REGEL = { teilChance: 0.2, tierChance: 1 / 20 };
const DUNGEONS = [
  { id: "d-keller", name: "Kobold-Keller", icon: "🔥", farbe: "#c9a27a", ab: 30, gebiet: "burg",
    raeume: [["kellerratte", "Keller­ratte", 34, "nah", { farbe: "#a7a2b0", ohren: "rund", extra: "maske" }], ["kerzenkobold", "Kerzen­kobold", 38, "magie", { farbe: "#ffd27a", form: "tropfen", extra: "flamme" }],
      ["spinnenmama", "Spinnen­mama", 42, "fern", { farbe: "#5b4a6a", extra: "punkte" }], ["fassgeist", "Fass­geist", 45, "magie", { farbe: "#c98a5a", form: "geist", extra: "helm" }],
      ["kettenkobold", "Ketten­kobold", 48, "nah", { farbe: "#9aa3b5", ohren: "spitz", extra: "steine" }]],
    boss: ["koboldkoenig", "Kobold­könig", 55, "nah", { farbe: "#8fbf5a", ohren: "spitz", extra: "krone" }],
    teil: { art: "hut", id: "hd1" } },
  { id: "d-gruft", name: "Drachengruft", icon: "🦴", farbe: "#d9583a", ab: 60, gebiet: "feuer",
    raeume: [["knochenechse", "Knochen­echse", 64, "nah", { farbe: "#f2ead8", hoerner: true, extra: "zacken" }], ["glutfledermaus", "Glut­fledermaus", 68, "fern", { farbe: "#d9583a", ohren: "spitz", fluegel: "fledermaus" }],
      ["schatzmimik", "Schatz­mimik", 72, "nah", { farbe: "#c98a3a", form: "rund", extra: "punkte" }], ["aschegeist", "Asche­geist", 75, "magie", { farbe: "#b8b0a8", form: "geist", extra: "flamme" }],
      ["drachenwaechter", "Drachen­wächter", 78, "fern", { farbe: "#e8772e", hoerner: true, extra: "helm" }]],
    boss: ["gruftdrache", "Gruft­drache", 85, "magie", { farbe: "#7a3a2a", hoerner: true, fluegel: "drache", extra: "flamme" }],
    teil: { art: "kleid", id: "kd1" } },
  { id: "d-turm", name: "Sternenturm", icon: "🌌", farbe: "#5a6fd6", ab: 95, gebiet: "wolken",
    raeume: [["sternenwaechter", "Sternen­wächter", 102, "nah", { farbe: "#7a8fe0", form: "geist", extra: "krone" }], ["kometenkatze", "Kometen­katze", 106, "fern", { farbe: "#ffb86b", ohren: "spitz", extra: "sterne" }],
      ["mondspiegel", "Mond­spiegel", 110, "magie", { farbe: "#e6e8ee", form: "rund", extra: "sterne" }], ["planetengolem", "Planeten­golem", 114, "nah", { farbe: "#9a6bd6", form: "rund", extra: "steine" }],
      ["nebelharfe", "Nebel­harfner", 118, "magie", { farbe: "#c9d2ff", form: "geist", extra: "sterne" }]],
    boss: ["turmhueterin", "Turm­hüterin", 128, "magie", { farbe: "#3b3f8f", form: "geist", extra: "krone" }],
    teil: { art: "rahmen", id: "rd1" } },
];
for (const d of DUNGEONS) {
  const baue = ([id, name, L, kampfart, aussehen], chef) => {
    MONSTER[id] = { id, name, stufe: L, kampfart, aussehen, gebiet: d.gebiet, chef, verlies: d.id,
      hp: Math.round((15 + L * 7 + L * L * 0.1) * (chef ? 3 : 1.2)), maxSchlag: Math.round((2 + L * 1.6) * (chef ? 1.35 : 1.05)),
      genauigkeit: Math.round((L + 8) * (52 + L * 0.6)), ausweichen: Math.round((L + 8) * (64 + L * 0.8)), tempo: chef ? 3.2 : 2.8,
      muenzen: [L * 3, L * 8], beute: [] };
    return id;
  };
  d.liste = [...d.raeume.map(r => baue(r, false)), baue(d.boss, true)];
  d.chef = d.boss[0];
  d.dungeon = true;
  const t = Math.min(7, Math.floor(d.ab / 15));
  d.truhe = { muenzen: [d.ab * 150, d.ab * 300], sachen: [
    { id: `barren${t}`, anzahl: [5, 12] }, { id: `essen${t}`, anzahl: [8, 15] }, { id: `stein${t}`, anzahl: [1, 3] },
    { id: "goldsplitter5", anzahl: [1, 2] }, { id: `kuchen${Math.min(7, t)}`, anzahl: [1, 2] } ] };
}
HAUSTIERE.push({ id: "gruftie", name: "Gruftie", tier: "Verlies-Fledermaus", emoji: "🦇", verlies: true, bonus: { art: "muenzen", wert: 0.08 }, text: "+8 % Münzen von Monstern" });
erfolg({ id: "verlies-1", icon: "🏰", name: "Ins Verlies!", text: "Schaffe dein erstes Verlies", ziel: 1, muenzen: 10000, wert: () => spiel.statistik.verliese || 0 });
erfolg({ id: "verlies-50", icon: "🏰", name: "Verlies-Profi", text: "Schaffe 50 Verliese", ziel: 50, muenzen: 1000000, wert: () => spiel.statistik.verliese || 0 });
erfolg({ id: "verlies-turm", icon: "🌌", name: "Ganz oben im Turm", text: "Besiege die Turmhüterin", ziel: 1, muenzen: 2000000, wert: () => spiel.besiegt?.turmhueterin || 0 });
