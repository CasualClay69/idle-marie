"use strict";
// =====================================================
//  BIBLIOTHEK – neue Fertigkeit "Lesen" (v1.36)
//  • In 8 Bücherregalen lesen = normale Tätigkeit (braucht nichts) -> Erfahrung
//  • Beim Lesen findet man manchmal eine Seite eines der 12 Geschichtenbücher.
//    Hat ein Buch alle 5 Seiten, ist es fertig: Es erzählt ein Kapitel der großen Geschichte
//    und gibt einen kleinen Bonus für immer.
//  spiel.buecher = { buchId: Anzahl gefundener Seiten }
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "sterne") + 1, 0,
  { id: "lesen", name: "Lesen", icon: "📚", art: "sammeln", farbe: "#8a6fd6", tun: "liest" });

const LESEN = { seitenChance: 0.08, seitenProBuch: 5 };
const REGALE = ["Bilderbücher", "Märchenbücher", "Tierbücher", "Abenteuer-Romane", "Zauber-Lexikon", "Sternenatlas", "Uralte Chroniken", "Das Buch der Wunder"];
REGALE.forEach((name, i) => {
  taetigkeit({ id: `lesen-${i}`, fertigkeit: "lesen", name, stufe: STUFEN[i], xp: Math.round(XP[i] * (STUFEN[i] >= 45 ? 0.7 : 1) * 1.2), zeit: ZEIT[i] + 1.5,
    gibt: {}, regal: i, ort: ["🖼️", "🧚", "🐾", "🗺️", "🪄", "🌌", "📜", "🌈"][i] });
});

// Die 12 Geschichtenbücher – zusammen eine Geschichte über die Welt von Hannah Idle
// bonus.art wie bei den Dauer-Boni (xp, sammeln, machen, doppelt, muenzen, heilen, tier, garten, offline, bank, kampfxp)
const GESCHICHTEN = [
  { id: "b1",  titel: "Wie alles begann",            regal: 0, bonus: { art: "xp", wert: 1 },       text: "Vor langer Zeit war die Blumenwiese ganz grau. Dann pflanzte ein kleines Mädchen den allerersten Busch – und mit ihm kamen die Farben." },
  { id: "b2",  titel: "Das Geheimnis der Fische",    regal: 0, bonus: { art: "doppelt", wert: 1 },  text: "Die Fische im See erzählen sich nachts Geschichten. Wer leise am Ufer sitzt, kann sie blubbern hören – und fängt am nächsten Tag doppelt so viele." },
  { id: "b3",  titel: "Der Pusteblumen-Riese",       regal: 1, bonus: { art: "sammeln", wert: 2 },  text: "Der Pusteblumen-Riese war gar nicht böse. Er war nur sehr müde – seit hundert Jahren hatte ihm niemand ein Gute-Nacht-Lied gesungen." },
  { id: "b4",  titel: "Die Wichtel ziehen ein",      regal: 1, bonus: { art: "machen", wert: 2 },   text: "Die Wichtel lebten früher unter den Wurzeln des Flüsterwaldes. Als sie Hannahs Baumhaus sahen, wussten sie sofort: Hier wollen wir ein Dorf bauen!" },
  { id: "b5",  titel: "Freunde mit Fell",            regal: 2, bonus: { art: "tier", wert: 5 },     text: "Jedes Haustier sucht sich seinen Menschen selbst aus. Es wartet, bis jemand freundlich ist, geduldig – und gute Leckerli backt." },
  { id: "b6",  titel: "Die Ruinenburg",              regal: 3, bonus: { art: "muenzen", wert: 3 },  text: "In der Ruinenburg wohnte einst eine Königin, die Gespenster zum Lachen brachte. Ihr Schatz ist bis heute versteckt – sagt man." },
  { id: "b7",  titel: "Feuer und Glut",              regal: 3, bonus: { art: "kampfxp", wert: 3 },  text: "Der Feuerdrache hütet den Feuerberg, damit die Glut nie ausgeht. Ohne ihn wären die Winter im Land eisig kalt." },
  { id: "b8",  titel: "Das Zauberbuch der Tränke",   regal: 4, bonus: { art: "heilen", wert: 5 },   text: "Die erste Zauberin mischte aus Minze und Mondlicht einen Trank, der Lachen machte. Alle anderen Tränke stammen von diesem einen ab." },
  { id: "b9",  titel: "Sterne lesen",                regal: 5, bonus: { art: "garten", wert: 3 },   text: "Jedes Sternbild beschützt zwei Dinge, die Menschen gern tun. Wer die Sterne kennt, dem wächst sogar der Garten schneller." },
  { id: "b10", titel: "Das Traumschloss",            regal: 5, bonus: { art: "offline", wert: 1 },  text: "Das Traumschloss ist aus allen Träumen gebaut, die je geträumt wurden. Die Traumkönigin passt auf, dass keiner verloren geht." },
  { id: "b11", titel: "Der Graue Nebel",             regal: 6, bonus: { art: "xp", wert: 2 },       text: "Der Graue Nebel war einmal ein Regenbogen, der vergessen hatte, wie man lacht. Nur wer mutig genug ist, kann ihn daran erinnern." },
  { id: "b12", titel: "Hannahs großes Abenteuer",    regal: 7, bonus: { art: "bank", wert: 5 },     text: "Und so wurde aus dem kleinen Mädchen mit dem ersten Busch die größte Abenteurerin des Landes. Aber das ist nicht das Ende – jeden Tag beginnt ein neues Kapitel." },
];
const BONUS_NAMEN = { xp: w => `+${w} % Erfahrung bei allem`, doppelt: w => `+${w} % doppelte Ausbeute`, sammeln: w => `Sammeln ${w} % schneller`, machen: w => `Herstellen ${w} % schneller`,
  tier: w => `Haustiere ${w} % öfter finden`, muenzen: w => `+${w} % Münzen von Monstern`, kampfxp: w => `+${w} % Kampf-Erfahrung`, heilen: w => `Essen heilt ${w} % mehr`,
  garten: w => `Garten wächst ${w} % schneller`, offline: w => `+${w} Std. Offline-Zeit`, bank: w => `+${w} Bankfächer` };
GESCHICHTEN.forEach(b => { b.bonusText = BONUS_NAMEN[b.bonus.art](b.bonus.wert); });

HAUSTIERE.push({ id: "professor", name: "Professor Eulalia", tier: "Brillen-Eule", emoji: "🦉", fertigkeit: "lesen", bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppelte Seiten beim Lesen" });
erfolg({ id: "buch-1", icon: "📖", name: "Bücherwurm", text: "Lies dein erstes Geschichtenbuch zu Ende", ziel: 1, muenzen: 5000, wert: () => GESCHICHTEN.filter(b => (spiel.buecher?.[b.id] || 0) >= LESEN.seitenProBuch).length });
erfolg({ id: "buch-alle", icon: "📚", name: "Die ganze Geschichte", text: "Lies alle 12 Geschichtenbücher", ziel: GESCHICHTEN.length, muenzen: 3000000, wert: () => GESCHICHTEN.filter(b => (spiel.buecher?.[b.id] || 0) >= LESEN.seitenProBuch).length });
