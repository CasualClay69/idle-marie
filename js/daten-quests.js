"use strict";
// =====================================================
//  AUFTRÄGE (Quests) – eine Kette, die Schritt für Schritt auf dem besten Weg durchs Spiel führt.
//  Immer nur EIN Auftrag ist aktiv. Ist er geschafft, holt man die Belohnung ab -> der nächste kommt.
//
//  Jeder Auftrag: titel, text (Tipp), ziel (Zahl), wert() (aktueller Stand),
//                 hilfe (wohin "Zeig mir wo" springt), belohnung { muenzen, sachen: { id: anzahl } }
//  Gezählt wird mit spiel.zaehler (wie viel man insgesamt hergestellt/gesammelt hat).
// =====================================================

const gemacht = id => spiel.zaehler?.[id] || 0;
const schlafend = id => spiel.besiegt?.[id] || 0;
const ruestungsStufe = platz => {
  const id = spiel.ausruestung?.[platz];
  return id ? Number(id.replace(/\D/g, "")) : -1;
};
const vollAusgeruestet = tier => PLAETZE.every(p => ruestungsStufe(p.id) >= tier);

const QUESTS = [];
function quest(q) { QUESTS.push(q); }

// Bausteine für häufige Aufträge
const sammle = (id, n, fertigkeitId, taetigkeitId, text, belohnung) => quest({
  titel: `${GEGENSTAENDE[id].name}: ${n} Stück`, text, ziel: n, wert: () => gemacht(id),
  hilfe: { fertigkeit: fertigkeitId, ziel: `.taetigkeit[data-id="${taetigkeitId}"]` }, symbol: id, belohnung });
const stufeQuest = (fid, l, text, belohnung) => quest({
  titel: `${fertigkeit(fid).name} Stufe ${l}`, text, ziel: l, wert: () => stufe(fid),
  hilfe: ["mut", "kraft", "schutz", "herzen"].includes(fid) ? { seite: "seiteAbenteuer" } : { fertigkeit: fid }, icon: fertigkeit(fid).icon, belohnung });
const monsterQuest = (mid, n, text, belohnung) => quest({
  titel: `${MONSTER[mid].name.replaceAll("­", "")}: ${n}× einschlafen lassen`, text, ziel: n, wert: () => schlafend(mid),
  hilfe: { seite: "seiteAbenteuer", ziel: `.monsterKarte[data-monster="${mid}"]` }, icon: "💤", belohnung });
const werkzeugQuest = (art, st, text, belohnung) => quest({
  titel: `Kaufe: ${WERKZEUG_STUFEN[st - 1].name}-${WERKZEUGE[art].name}`, text, ziel: st, wert: () => spiel.werkzeuge?.[art] || 0,
  hilfe: { seite: "seiteLaden" }, icon: WERKZEUGE[art].icon, belohnung });
const tragQuest = (platz, tier, text, belohnung) => quest({
  titel: `Trag: ${GEGENSTAENDE[`${platz === "waffe" ? "schwert" : platz}${tier}`].name}`, text, ziel: 1, wert: () => ruestungsStufe(platz) >= tier ? 1 : 0,
  hilfe: { seite: "seiteAbenteuer", ziel: `.platz[data-platz="${platz}"]` }, symbol: `${platz === "waffe" ? "schwert" : platz}${tier}`, belohnung });
const volleRuestung = (tier, text, belohnung) => quest({
  titel: `Volle ${ERZE[tier]}-Ausrüstung`, text: `${text ? text + " " : ""}Schmiede Schwert, Helm, Schild und Rüstung aus ${ERZE[tier]} und leg alles im ⚔️ Abenteuer an.`, ziel: 4,
  wert: () => PLAETZE.filter(p => ruestungsStufe(p.id) >= tier).length,
  hilfe: { fertigkeit: "schmieden" }, symbol: `ruestung${tier}`, belohnung });

// Vorbereitung für neue Ausrüstung: Erz finden, schmieden können, und stark genug sein, sie zu tragen
function ruestungsKapitel(tier, belohnung) {
  const L = STUFEN[tier];
  stufeQuest("bergbau", L, `Ab Bergbau-Stufe ${L} findest du ${GEGENSTAENDE[`erz${tier}`].name}.`, { muenzen: Math.round(belohnung.muenzen / 4) });
  stufeQuest("schmieden", Math.min(99, L + 8), `Ab Schmieden-Stufe ${Math.min(99, L + 8)} kannst du die ganze ${ERZE[tier]}-Ausrüstung schmieden.`, { muenzen: Math.round(belohnung.muenzen / 4) });
  stufeQuest("mut", L, `Um ein ${ERZE[tier]}-Schwert zu tragen, brauchst du Mut-Stufe ${L}. Tipp: Wähle im Abenteuer den Kampfstil „⚔️ Mutig“.`, { muenzen: Math.round(belohnung.muenzen / 4) });
  stufeQuest("schutz", L, `Für Helm, Schild und Rüstung aus ${ERZE[tier]} brauchst du Schutz-Stufe ${L}. Tipp: Wähle den Kampfstil „🛡️ Vorsichtig“.`, { muenzen: Math.round(belohnung.muenzen / 4) });
  volleRuestung(tier, "", belohnung);
}

// ===================== DIE KETTE =====================
// --- Teil 1: Die ersten Schritte ---
sammle("holz0", 10, "holz", "holz-0", "Tippe bei 🌳 Holzsammeln auf den Busch. Deine Figur sammelt dann ganz von allein.", { muenzen: 20 });
quest({ titel: "Verdiene 30 Münzen", text: "Geh in die 🏦 Bank, tippe dein Holz an und verkaufe es.", ziel: 30, wert: () => spiel.statistik.verdient || 0,
  hilfe: { seite: "seiteBank" }, icon: "🪙", belohnung: { muenzen: 30 } });
werkzeugQuest("axt", 1, "Im 🛒 Laden gibt es eine Kupfer-Axt. Mit ihr sammelst du 5 % schneller.", { muenzen: 30, sachen: { holz0: 10 } });
stufeQuest("holz", 5, "Sammle weiter Holz, bis du Stufe 5 erreichst. Tipp: Das geht auch, wenn das Spiel zu ist!", { muenzen: 50 });
sammle("fisch0", 10, "angeln", "angeln-0", "Probier mal 🎣 Angeln! Fang ein paar Stichlinge.", { muenzen: 40 });
sammle("essen0", 10, "kochen", "kochen-0", "Fische kann man bei 🍳 Kochen zubereiten. Gekochtes Essen brauchst du später im Abenteuer.", { muenzen: 50, sachen: { fisch0: 10 } });
werkzeugQuest("angel", 1, "Eine Kupfer-Angel macht das Angeln schneller.", { muenzen: 40 });
sammle("erz0", 15, "bergbau", "bergbau-0", "Bei ⛏️ Bergbau findest du Kupfererz.", { muenzen: 50 });
sammle("barren0", 10, "schmieden", "schmieden-0", "Beim 🔨 Schmieden machst du aus Erz glänzende Barren.", { muenzen: 60, sachen: { erz0: 10 } });
quest({ titel: "Schmiede ein Kupfer-Schwert", text: "Aus einem Kupferbarren wird beim 🔨 Schmieden ein Schwert.", ziel: 1, wert: () => gemacht("schwert0"),
  hilfe: { fertigkeit: "schmieden", ziel: '.taetigkeit[data-id="schmieden-schwert0"]' }, symbol: "schwert0", belohnung: { muenzen: 50 } });
tragQuest("waffe", 0, "Im ⚔️ Abenteuer tippst du auf den Platz „Waffe“ und wählst dein Schwert.", { muenzen: 50 });
quest({ titel: "Nimm Essen mit ins Abenteuer", text: "Tippe im ⚔️ Abenteuer auf „Essen wählen“. Wenn deine Herzen knapp werden, isst deine Figur ganz von allein.",
  ziel: 1, wert: () => (spiel.essen && anzahl(spiel.essen) ? 1 : 0), hilfe: { seite: "seiteAbenteuer", ziel: '.platz[data-platz="essen"]' }, icon: "🍽️",
  belohnung: { muenzen: 30, sachen: { essen0: 10 } } });
quest({ titel: "Zieh dir etwas Schönes an", text: "Unter 👤 Ich gibt es einen Kleiderschrank mit Hüten, Kleidung und Rahmen. Kauf dir etwas Hübsches!",
  ziel: 1, wert: () => (spiel.garderobe || []).length, hilfe: { seite: "seiteIch", ziel: "#kleiderschrankKarte" }, icon: "👗", belohnung: { muenzen: 150 } });
monsterQuest("schleimchen", 10, "Jetzt geht's los! Tippe auf der Blumenwiese das Schleimchen an. Es wird müde und schläft ein 💤.", { muenzen: 100 });

// --- Teil 2: Stärker werden ---
werkzeugQuest("hacke", 1, "Eine Kupfer-Spitzhacke macht den Bergbau schneller.", { muenzen: 50 });
stufeQuest("schmieden", 9, "Ab Schmieden-Stufe 9 kannst du Helm, Schild und Rüstung aus Kupfer schmieden.", { muenzen: 80 });
volleRuestung(0, "Mit Rüstung wirst du seltener getroffen!", { muenzen: 200, sachen: { barren0: 10 } });
monsterQuest("brummhummel", 15, "Die Brummhummeln auf der Blumenwiese sind etwas stärker.", { muenzen: 150 });
quest({ titel: "Ernte dein erstes Beet", text: "Bei 🌱 Gärtnern kaufst du Samen und pflanzt sie ein. Sie wachsen von allein – auch wenn du etwas anderes machst!",
  ziel: 1, wert: () => spiel.statistik.geerntet || 0, hilfe: { fertigkeit: "garten" }, icon: "🧺",
  belohnung: { muenzen: 50, sachen: { "samen-kraut0": 5, "samen-gemuese0": 5 } } });
sammle("schnitz0", 5, "schnitzen", "schnitzen-0", "Beim 🪚 Schnitzen machst du aus Holz schöne Sachen – die bringen viele Münzen.", { muenzen: 80 });
stufeQuest("holz", 10, "Ab Stufe 10 kannst du Birken fällen.", { muenzen: 150 });
sammle("holz1", 30, "holz", "holz-1", "Birkenholz ist mehr wert als Ästchen.", { muenzen: 150 });
stufeQuest("angeln", 10, "Ab Stufe 10 beißen Forellen an.", { muenzen: 150 });
stufeQuest("bergbau", 10, "Ab Stufe 10 findest du Eisenerz.", { muenzen: 150 });
stufeQuest("schmieden", 12, "Ab Schmieden-Stufe 12 kannst du Eisenbarren und ein Eisen-Schwert schmieden.", { muenzen: 150 });
sammle("barren1", 15, "schmieden", "schmieden-1", "Eisen ist viel härter als Kupfer!", { muenzen: 200, sachen: { erz1: 10 } });
stufeQuest("mut", 10, "Für ein Eisen-Schwert brauchst du Mut-Stufe 10. Tipp: Wähle im Abenteuer den Kampfstil „⚔️ Mutig“.", { muenzen: 150 });
tragQuest("waffe", 1, "Schmiede ein Eisen-Schwert und leg es an.", { muenzen: 250 });
monsterQuest("frechdachs", 20, "Die Frechdachse sind schlau – mit dem Eisen-Schwert klappt's!", { muenzen: 300, sachen: { essen1: 10 } });

// --- Teil 3: Garten, Tränke und der erste Chef ---
sammle("kraut0", 10, "garten", "", "Pflanze Minze im 🌱 Garten. Kräuter brauchst du für Tränke.", { muenzen: 150, sachen: { "samen-kraut0": 5 } });
quest({ titel: "Braue einen Waldgeist-Trank", text: "Bei 🧪 Tränke mischst du Minze mit einem Blütenblatt von der Blumenwiese.", ziel: 1, wert: () => gemacht("trank0"),
  hilfe: { fertigkeit: "traenke", ziel: '.taetigkeit[data-id="traenke-0"]' }, symbol: "trank0", belohnung: { muenzen: 150, sachen: { bluete: 3 } } });
quest({ titel: "Trink einen Trank", text: "Tippe in der 🏦 Bank auf den Trank und dann auf „Trinken“. Oben siehst du, wie lange er noch wirkt.",
  ziel: 1, wert: () => spiel.statistik.getrunken || 0, hilfe: { seite: "seiteBank" }, icon: "🧪", belohnung: { muenzen: 150 } });
stufeQuest("schutz", 10, "Für Eisen-Helm, -Schild und -Rüstung brauchst du Schutz-Stufe 10. Tipp: Kampfstil „🛡️ Vorsichtig“.", { muenzen: 200 });
stufeQuest("schmieden", 18, "Ab Schmieden-Stufe 18 kannst du auch die Eisen-Rüstung schmieden.", { muenzen: 200 });
volleRuestung(1, "Zeit für Eisen!", { muenzen: 500, sachen: { essen1: 20 } });
monsterQuest("pusteriese", 1, "Der Chef der Blumenwiese! Nimm genug Essen mit.", { muenzen: 800, sachen: { "trank7": 1 } });
quest({ titel: "Erreiche Gesamtstufe 100", text: "Alle Fertigkeiten zählen zusammen. Probier ruhig alles aus!", ziel: 100, wert: () => gesamtStufe(),
  hilfe: { seite: "seiteFertigkeiten" }, icon: "🌟", belohnung: { muenzen: 1000 } });

// --- Teil 4: Flüsterwald und Silber ---
werkzeugQuest("axt", 2, "Eine Eisen-Axt – noch schneller!", { muenzen: 300 });
stufeQuest("garten", 10, "Ab Gärtnern-Stufe 10 kannst du Karotten pflanzen.", { muenzen: 300, sachen: { "samen-gemuese1": 5 } });
stufeQuest("kochen", 13, "Ab Kochen-Stufe 13 kannst du Karotten-Suppe kochen.", { muenzen: 300 });
sammle("gericht1", 10, "kochen", "kochen-gericht1", "Karotten aus dem Garten werden zu Karotten-Suppe – die heilt mehr als Fisch!", { muenzen: 400, sachen: { "samen-gemuese1": 10 } });
monsterQuest("pilzmann", 25, "Willkommen im Flüsterwald! Die Pilzmännchen warten schon.", { muenzen: 800 });
ruestungsKapitel(2, { muenzen: 1500, sachen: { essen2: 20 } });
monsterQuest("wuschelwolf", 30, "Die Wuschelwölfe sind flink – bleib dran!", { muenzen: 1500 });
monsterQuest("eulenwaechter", 30, "Die Eulenwächter lassen Eulenfedern fallen – die brauchst du für den Fleiß-Trank.", { muenzen: 2000 });
monsterQuest("baumgeist", 1, "Der Chef des Flüsterwaldes. Ein Mut- oder Kraft-Trank hilft!", { muenzen: 4000, sachen: { trank7: 2 } });

// --- Teil 5: Ruinenburg und Gold ---
quest({ titel: "Erreiche Gesamtstufe 250", text: "Du wirst immer besser!", ziel: 250, wert: () => gesamtStufe(), hilfe: { seite: "seiteFertigkeiten" }, icon: "🌟", belohnung: { muenzen: 5000 } });
ruestungsKapitel(3, { muenzen: 8000, sachen: { essen3: 30 } });
monsterQuest("ruestungsgeist", 30, "In der Ruinenburg spuken freundliche Rüstungsgeister.", { muenzen: 6000 });
monsterQuest("fledermausbande", 30, "Die Fledermausbande ist ganz schön frech!", { muenzen: 8000 });
monsterQuest("burggespenst", 1, "Das Burggespenst ist der Chef der Ruinenburg.", { muenzen: 15000, sachen: { trank7: 3 } });

// --- Teil 6: Feuerberg ---
ruestungsKapitel(4, { muenzen: 25000, sachen: { essen4: 30 } });
monsterQuest("flammenwichtel", 30, "Am Feuerberg wird es heiß!", { muenzen: 20000 });
monsterQuest("glutechse", 30, "Glutechsen lassen manchmal Drachenschuppen fallen.", { muenzen: 25000 });
monsterQuest("feuerdrache", 1, "Der Feuerdrache! Nimm einen Schutz-Trank mit.", { muenzen: 50000, sachen: { trank7: 3 } });

// --- Teil 7: Eispalast ---
quest({ titel: "Erreiche Gesamtstufe 500", text: "Wow, du bist richtig gut!", ziel: 500, wert: () => gesamtStufe(), hilfe: { seite: "seiteFertigkeiten" }, icon: "🌟", belohnung: { muenzen: 50000 } });
ruestungsKapitel(5, { muenzen: 80000, sachen: { essen5: 40 } });
monsterQuest("schneegeist", 30, "Im Eispalast ist es kalt – zieh dich warm an!", { muenzen: 60000 });
monsterQuest("frostkoenig", 1, "Der Frostkönig regiert den Eispalast.", { muenzen: 150000, sachen: { trank7: 5 } });

// --- Teil 8: Wolkenreich ---
ruestungsKapitel(6, { muenzen: 250000, sachen: { essen6: 50 } });
monsterQuest("donnerwolke", 30, "Hoch oben im Wolkenreich grummeln die Donnerwölkchen.", { muenzen: 200000 });
monsterQuest("sternenfuchs", 30, "Sternenfüchse funkeln wie der Nachthimmel.", { muenzen: 250000 });
ruestungsKapitel(7, { muenzen: 600000, sachen: { essen7: 50 } });
monsterQuest("regenbogendrache", 1, "Das größte Abenteuer: der Regenbogendrache!", { muenzen: 1000000, sachen: { trank7: 10 } });
quest({ titel: "Werde Meister in allem", text: "Bring alle Fertigkeiten auf Stufe 99. Das ist das allergrößte Ziel!", ziel: FERTIGKEITEN.length * 99,
  wert: () => gesamtStufe(), hilfe: { seite: "seiteFertigkeiten" }, icon: "👑", belohnung: { muenzen: 10000000 } });

QUESTS.forEach((q, i) => { q.nr = i + 1; });
