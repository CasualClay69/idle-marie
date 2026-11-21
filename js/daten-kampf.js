"use strict";
// =====================================================
//  ABENTEUER-DATEN: Kampf-Fertigkeiten, Ausrüstung, Gebiete und Monster
//  Kindgerecht: Monster werden müde und schlafen ein 💤 – niemand wird verletzt.
//  Wer keine Herzen mehr hat, geht einfach nach Hause und ruht sich aus (man verliert nichts).
// =====================================================

FERTIGKEITEN.push(
  { id: "mut",    name: "Mut",    icon: "⚔️", art: "kampf", farbe: "#ff7a7a", tun: "kämpft", text: "Triffst du öfter?" },
  { id: "kraft",  name: "Kraft",  icon: "💪", art: "kampf", farbe: "#ffa94d", tun: "kämpft", text: "Wie stark ist dein Schlag?" },
  { id: "schutz", name: "Schutz", icon: "🛡️", art: "kampf", farbe: "#6fa8ff", tun: "kämpft", text: "Weichst du besser aus?" },
  { id: "herzen", name: "Herzen", icon: "❤️", art: "kampf", farbe: "#ff5f8f", tun: "kämpft", text: "Wie viele Lebens-Herzen hast du?" },
);

const KAMPF = {
  herzenStartXp: 1154,     // Herzen beginnen auf Stufe 10
  hpProStufe: 10,          // Lebenspunkte = Herzen-Stufe × 10
  xpProSchaden: 0.5,       // Erfahrung für den gewählten Kampfstil je Schadenspunkt
  herzenXpProSchaden: 0.133,
  essenUnter: 0.5,         // isst automatisch, wenn weniger als 50 % Herzen übrig sind
  pauseNachSieg: 1.5,      // Sekunden, bis das nächste Monster kommt
  ohneWaffeTempo: 2.2,
  verschnaufen: 0.1,       // nach jedem eingeschlafenen Monster: +10 % Herzen
};

const KAMPFSTILE = [
  { id: "mut",    name: "Mutig",      icon: "⚔️", text: "übt Mut" },
  { id: "kraft",  name: "Kräftig",    icon: "💪", text: "übt Kraft" },
  { id: "schutz", name: "Vorsichtig", icon: "🛡️", text: "übt Schutz" },
];

// ----- Ausrüstung (aus Barren geschmiedet) -----
const PLAETZE = [
  { id: "waffe",   name: "Waffe",   icon: "🗡️" },
  { id: "helm",    name: "Helm",    icon: "⛑️" },
  { id: "schild",  name: "Schild",  icon: "🛡️" },
  { id: "ruestung", name: "Rüstung", icon: "🦺" },
];
const AUSRUESTUNG_ARTEN = [
  { art: "schwert",  platz: "waffe",    name: "Schwert",  barren: 1, plus: 2, braucht: "mut",
    treff: [4, 10, 18, 28, 40, 55, 72, 90], kraft: [3, 8, 15, 24, 35, 48, 63, 80] },
  { art: "helm",     platz: "helm",     name: "Helm",     barren: 2, plus: 4, braucht: "schutz",
    abwehr: [2, 5, 9, 14, 20, 27, 35, 44], weniger: [0, 1, 1, 2, 3, 3, 4, 5] },
  { art: "schild",   platz: "schild",   name: "Schild",   barren: 3, plus: 6, braucht: "schutz",
    abwehr: [3, 7, 12, 19, 27, 36, 46, 58], weniger: [1, 1, 2, 3, 4, 5, 6, 7] },
  { art: "ruestung", platz: "ruestung", name: "Rüstung",  barren: 5, plus: 8, braucht: "schutz",
    abwehr: [5, 12, 20, 30, 42, 56, 72, 90], weniger: [1, 2, 3, 4, 6, 8, 10, 12] },
];
for (const a of AUSRUESTUNG_ARTEN) {
  ERZE.forEach((erz, i) => {
    const id = `${a.art}${i}`;
    gegenstand(id, `${erz}-${a.name}`, a.art, TIER_FARBEN[i], WERTE[i] * 4 * a.barren + 5, {
      platz: a.platz, braucht: { [a.braucht]: STUFEN[i] },
      bonus: { treff: a.treff?.[i] || 0, kraft: a.kraft?.[i] || 0, abwehr: a.abwehr?.[i] || 0, weniger: a.weniger?.[i] || 0 },
    });
    taetigkeit({ id: `schmieden-${id}`, fertigkeit: "schmieden", name: `${erz}-${a.name}`, stufe: Math.min(99, STUFEN[i] + a.plus),
      xp: Math.round(XP[i] * (i < 2 ? 1.2 : 2.2) * a.barren), zeit: 3 + a.barren * 0.3,
      braucht: { [`barren${i}`]: a.barren }, gibt: { [id]: 1 } });
  });
}

// Essen heilt im Kampf (Herzen = Lebenspunkte)
[30, 60, 90, 130, 180, 240, 300, 400].forEach((h, i) => { GEGENSTAENDE[`essen${i}`].heilt = h; });

// ----- Beute (zum Verkaufen, später auch für Zaubertränke) -----
const BEUTE = [
  ["bluete", "Blütenblatt", "🌸"], ["honig", "Honigtropfen", "🍯"],
  ["pilz", "Waldpilz", "🍄"], ["feder", "Eulenfeder", "🪶"],
  ["zahnrad", "Altes Zahnrad", "⚙️"], ["glitzer", "Glitzerstein", "💎"],
  ["glut", "Glutstein", "🔥"], ["schuppe", "Drachenschuppe", "🐉"],
  ["eis", "Eiskristall", "❄️"], ["schneeflocke", "Zauberflocke", "🌨️"],
  ["sternenstaub", "Sternenstaub", "✨"], ["regenbogenfeder", "Regenbogenfeder", "🌈"],
];
BEUTE.forEach(([id, name, emoji], i) => gegenstand(id, name, "emoji", TIER_FARBEN[Math.floor(i / 2) + 1] || "#ffd54f", 4 + i * i * 3, { emoji }));
const POKALE = ["Wiesen-Pokal", "Wald-Pokal", "Burg-Pokal", "Feuer-Pokal", "Eis-Pokal", "Wolken-Pokal"];
POKALE.forEach((n, i) => gegenstand(`pokal${i}`, n, "emoji", TIER_FARBEN[i + 2], 200 * Math.pow(3, i), { emoji: "🏆" }));

// ----- Gebiete & Monster -----
// aussehen: siehe monsterSvg in symbole.js (farbe, form, ohren, hoerner, fluegel, extra)
const GEBIETE = [
  { id: "wiese", name: "Blumenwiese", icon: "🌼", farbe: "#a8e08f", ab: 1, beute: ["bluete", "honig"], monster: [
    { id: "schleimchen", name: "Schleim­chen", stufe: 1, aussehen: { farbe: "#8fe07a", form: "tropfen" } },
    { id: "brummhummel", name: "Brumm­hummel", stufe: 4, aussehen: { farbe: "#ffd54f", fluegel: true, extra: "streifen" } },
    { id: "frechdachs", name: "Frech­dachs", stufe: 8, aussehen: { farbe: "#b8b0a8", ohren: "rund", extra: "maske" } },
    { id: "pusteriese", name: "Puste­blumen-Riese", stufe: 12, chef: true, aussehen: { farbe: "#fff4c2", form: "rund", extra: "puste" } },
  ] },
  { id: "wald", name: "Flüsterwald", icon: "🌲", farbe: "#6fbf8a", ab: 10, beute: ["pilz", "feder"], monster: [
    { id: "pilzmann", name: "Pilz­männchen", stufe: 15, aussehen: { farbe: "#f3e3c8", extra: "pilzhut" } },
    { id: "wuschelwolf", name: "Wuschel­wolf", stufe: 20, aussehen: { farbe: "#9aa3b5", ohren: "spitz", extra: "wuschel" } },
    { id: "eulenwaechter", name: "Eulen­wächter", stufe: 25, aussehen: { farbe: "#b08a62", ohren: "feder", fluegel: true, extra: "eule" } },
    { id: "baumgeist", name: "Alter Baumgeist", stufe: 30, chef: true, aussehen: { farbe: "#8b6b4a", extra: "blaetter" } },
  ] },
  { id: "burg", name: "Ruinenburg", icon: "🏰", farbe: "#b9a8d9", ab: 25, beute: ["zahnrad", "glitzer"], monster: [
    { id: "ruestungsgeist", name: "Rüstungs­geist", stufe: 32, aussehen: { farbe: "#c9d2e0", form: "geist", extra: "helm" } },
    { id: "steinkobold", name: "Stein­kobold", stufe: 37, aussehen: { farbe: "#a7a2b0", ohren: "spitz", extra: "steine" } },
    { id: "fledermausbande", name: "Fleder­maus­bande", stufe: 42, aussehen: { farbe: "#8a7bb0", ohren: "spitz", fluegel: "fledermaus" } },
    { id: "burggespenst", name: "Burg­gespenst", stufe: 48, chef: true, aussehen: { farbe: "#efeaff", form: "geist", extra: "krone" } },
  ] },
  { id: "feuer", name: "Feuerberg", icon: "🌋", farbe: "#ff9a6a", ab: 40, beute: ["glut", "schuppe"], monster: [
    { id: "flammenwichtel", name: "Flammen­wichtel", stufe: 50, aussehen: { farbe: "#ff8a4a", form: "tropfen", extra: "flamme" } },
    { id: "lavakroete", name: "Lavakröte", stufe: 56, aussehen: { farbe: "#d9583a", form: "rund", extra: "punkte" } },
    { id: "glutechse", name: "Glut­echse", stufe: 62, aussehen: { farbe: "#ff6f5a", hoerner: true, extra: "zacken" } },
    { id: "feuerdrache", name: "Feuer­drache", stufe: 68, chef: true, aussehen: { farbe: "#e8453a", hoerner: true, fluegel: "drache", extra: "zacken" } },
  ] },
  { id: "eis", name: "Eispalast", icon: "❄️", farbe: "#9ad8f5", ab: 60, beute: ["eis", "schneeflocke"], monster: [
    { id: "schneegeist", name: "Schnee­geist", stufe: 70, aussehen: { farbe: "#f2fbff", form: "geist", extra: "flocken" } },
    { id: "frostyeti", name: "Frostyeti", stufe: 76, aussehen: { farbe: "#e6f2ff", ohren: "rund", extra: "wuschel" } },
    { id: "eisigel", name: "Eis­zapfen-Igel", stufe: 82, aussehen: { farbe: "#8fd0f0", extra: "stacheln" } },
    { id: "frostkoenig", name: "Frost­könig", stufe: 88, chef: true, aussehen: { farbe: "#7ab8f0", hoerner: true, extra: "krone" } },
  ] },
  { id: "wolken", name: "Wolkenreich", icon: "☁️", farbe: "#c9b8ff", ab: 80, beute: ["sternenstaub", "regenbogenfeder"], monster: [
    { id: "donnerwolke", name: "Donner­wölkchen", stufe: 92, aussehen: { farbe: "#b8c2d9", form: "wolke", extra: "blitz" } },
    { id: "sternenfuchs", name: "Sternen­fuchs", stufe: 97, aussehen: { farbe: "#ffb86b", ohren: "spitz", extra: "sterne" } },
    { id: "mondeule", name: "Mondeule", stufe: 103, aussehen: { farbe: "#7a6bb8", ohren: "feder", fluegel: true, extra: "eule" } },
    { id: "regenbogendrache", name: "Regen­bogen­drache", stufe: 115, chef: true, aussehen: { farbe: "#ff9fd0", hoerner: true, fluegel: "drache", extra: "regenbogen" } },
  ] },
];

// Werte eines Monsters aus seiner Stufe
const MONSTER = {};
GEBIETE.forEach((g, gi) => g.monster.forEach(m => {
  const L = m.stufe;
  const chef = m.chef ? 1 : 0;
  Object.assign(m, {
    gebiet: g.id,
    hp: Math.round((15 + L * 7 + L * L * 0.1) * (chef ? 2.5 : 1)),
    maxSchlag: Math.round((2 + L * 1.6) * (chef ? 1.3 : 1)),
    genauigkeit: Math.round((L + 8) * (52 + L * 0.6)),
    ausweichen: Math.round((L + 8) * (64 + L * 0.8)),
    tempo: chef ? 3.2 : 2.8,
    muenzen: [L * 2 * (chef ? 5 : 1), L * 6 * (chef ? 5 : 1)],
    beute: [
      { id: g.beute[0], chance: 0.5, anzahl: [1, 2] },
      { id: g.beute[1], chance: 0.2, anzahl: [1, 1] },
      { id: `fisch${Math.min(7, gi + 1)}`, chance: 0.15, anzahl: [1, 3] },
      { id: `erz${Math.min(7, gi + 1)}`, chance: 0.15, anzahl: [1, 3] },
      ...(chef ? [{ id: `pokal${gi}`, chance: 0.1, anzahl: [1, 1] }] : []),
    ],
  });
  MONSTER[m.id] = m;
}));
