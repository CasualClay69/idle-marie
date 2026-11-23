"use strict";
// =====================================================
//  WIKI – Texte und Guide-Daten
//
//  Die meisten Wiki-Seiten (Fertigkeiten, Gegenstände, Monster, Haustiere, Baumhaus, Aussehen,
//  Erfolge, Season) baut wiki-anzeige.js AUTOMATISCH aus den Spieldaten – neuer Inhalt
//  erscheint dort also von selbst.
//
//  Von Hand gepflegt werden hier:
//   1. WIKI_REGELN  – die Erklär-Artikel ("Spielregeln"). Neue Spielsysteme hier erklären!
//   2. guideVervollstaendigen() – die Guide-Schritte NACH der Auftrags-Kette bis 100 %.
//      (Die Kette selbst steht in daten-quests.js und ist automatisch Teil des Guides.)
// =====================================================

// ===================== 1. SPIELREGELN =====================
// text ist eine Funktion, damit immer die aktuellen Zahlen aus den Spieldaten drinstehen
const WIKI_REGELN = [
  { id: "start", icon: "🌟", titel: "So spielst du", text: () => `
    <p>In <b>Hannah Idle</b> arbeitet deine Figur von ganz allein: Du tippst eine Tätigkeit an – zum Beispiel einen Baum bei 🌳 Holzsammeln – und deine Figur macht das immer weiter, bis du etwas anderes auswählst.</p>
    <p>Mit jeder Tätigkeit bekommst du <b>Erfahrung (EP)</b> und steigst in der Fertigkeit auf. Höhere Stufen schalten neue Sachen frei. Was du sammelst oder herstellst, landet in der 🏦 Bank.</p>
    <p>Deine Figur kann immer nur <b>eine</b> Sache gleichzeitig machen. Nur der 🌱 Garten wächst nebenher.</p>` },
  { id: "kompass", icon: "🧭", titel: "Guide und Kompass", text: () => `
    <p>Der <b>Guide</b> hier in der Wiki ist der beste Weg vom Spielstart bis 100 %. Erledigte Schritte werden automatisch abgehakt ✅ – auch wenn du sie früher oder in anderer Reihenfolge schaffst.</p>
    <p>Der runde <b>🧭 Kompass-Knopf</b> unten rechts zeigt dir jederzeit den nächsten Schritt: Er springt zur richtigen Stelle im Spiel und lässt das Ziel leuchten. Darunter steht, wie viel Prozent du schon geschafft hast.</p>
    <p>Hast du einen 📜 Auftrag geschafft, zeigt der Kompass dir zuerst die Belohnung zum Abholen.</p>` },
  { id: "stufen", icon: "📈", titel: "Fertigkeiten und Stufen", text: () => `
    <p>Es gibt ${FERTIGKEITEN.length} Fertigkeiten. Jede geht bis Stufe ${SPIEL.maxStufe}. Alle Stufen zusammen sind deine <b>Gesamtstufe</b> (höchstens ${zahl(FERTIGKEITEN.length * SPIEL.maxStufe)}).</p>
    <p><b>Sammeln</b> (${FERTIGKEITEN.filter(f => f.art === "sammeln").map(f => f.name).join(", ")}) holt Rohstoffe. <b>Herstellen</b> (${FERTIGKEITEN.filter(f => f.art === "machen").map(f => f.name).join(", ")}) macht daraus neue Sachen. <b>Kampf</b> (${FERTIGKEITEN.filter(f => f.art === "kampf").map(f => f.name).join(", ")}) übst du im ⚔️ Abenteuer.</p>
    <p>Die meisten Materialien gibt es in 8 Sorten. Neue Sorten gibt es ab Stufe ${STUFEN.join(", ")}.</p>` },
  { id: "uebung", icon: "⭐", titel: "Übung und doppelte Ausbeute", text: () => `
    <p>Jede einzelne Tätigkeit hat ihre eigene <b>Übungs-Stufe ⭐</b> (bis 99). Je öfter du sie machst, desto besser wirst du darin.</p>
    <p>Alle 10 Übungs-Stufen gibt es ${Math.round(SPIEL.uebungDoppeltProZehn * 100)} % mehr Chance auf <b>doppelte Ausbeute</b>. Bei ⭐ 99 bist du Meister und ${Math.round(SPIEL.meisterSchneller * 100)} % schneller.</p>
    <p>Doppelte Ausbeute gibt es außerdem durch Haustiere, Tränke, Schmuck (Smaragd) und das Regal im Baumhaus.</p>` },
  { id: "offline", icon: "🌙", titel: "Wenn das Spiel zu ist", text: () => `
    <p>Deine Figur arbeitet weiter, auch wenn das Spiel zu ist – bis zu ${SPIEL.offlineMaxStunden} Stunden. Mit dem 🛏️ Bett im Baumhaus wird diese Zeit länger.</p>
    <p>Der Garten wächst sowieso immer weiter. Wenn du zurückkommst, zeigt dir ein Fenster, was in der Zeit alles passiert ist.</p>
    <p><b>Tipp:</b> Bevor du das Spiel zumachst, wähle eine lange Tätigkeit, für die du genug Material hast (oder eine Sammel-Tätigkeit – die braucht gar kein Material).</p>` },
  { id: "bank", icon: "🏦", titel: "Bank, Seltenheit und Verkaufen", text: () => `
    <p>In der Bank liegt alles, was du hast. Jede Sorte braucht ein Fach. Neue Fächer gibt es im 🛒 Laden und mit der Plattform im Baumhaus.</p>
    <p>Die Rahmen-Farbe zeigt die <b>Seltenheit</b>: ${SELTENHEITEN.map(s => s.name).join(" → ")}.</p>
    <p>Tippe etwas an, um es zu verkaufen, zu trinken oder anzulegen. „Sortieren“ ordnet alles nach Art und Seltenheit. „Alle außer 1“ verkauft alles bis auf ein Stück.</p>
    <p><b>Tipp:</b> Verkaufe nichts, was du noch zum Herstellen brauchst. Was wofür gebraucht wird, steht in der Wiki unter 🎒 Gegenstände.</p>` },
  { id: "laden", icon: "🛒", titel: "Laden und Werkzeuge", text: () => `
    <p>Im Laden kaufst du Werkzeuge: ${Object.values(WERKZEUGE).map(w => `${w.icon} ${w.name}`).join(", ")}. Jede Werkzeug-Stufe macht die passende Sammel-Fertigkeit ${Math.round(WERKZEUG_BONUS * 100)} % schneller.</p>
    <p>Stufen: ${WERKZEUG_STUFEN.map(w => `${w.name} (ab Stufe ${w.stufe}, ${zahl(w.preis)} Münzen)`).join(", ")}.</p>` },
  { id: "auftraege", icon: "📜", titel: "Aufträge", text: () => `
    <p>Oben steht immer dein aktueller Auftrag. Es gibt ${QUESTS.length} Aufträge, die dich Schritt für Schritt durchs Spiel führen. Für jeden gibt es eine Belohnung – manchmal Kleidung oder ein Haustier!</p>
    <p>Ist ein Auftrag geschafft, tippe auf die Leiste und hol dir die Belohnung ab. Erst dann kommt der nächste.</p>` },
  { id: "kampf", icon: "⚔️", titel: "Kämpfen im Abenteuer", text: () => `
    <p>Im Abenteuer tippst du ein Monster an. Deine Figur schubst es so lange, bis es müde wird und einschläft 💤. Niemand wird verletzt.</p>
    <p><b>Kampfstil:</b> „Mutig“ übt Mut (öfter treffen), „Kräftig“ übt Kraft (stärker schlagen), „Vorsichtig“ übt Schutz (seltener getroffen werden). ❤️ Herzen steigen immer mit.</p>
    <p>Wenn deine Herzen unter ${Math.round(KAMPF.essenUnter * 100)} % fallen, isst deine Figur automatisch das gewählte Essen. Nach jedem eingeschlafenen Monster gibt es +${Math.round(KAMPF.verschnaufen * 100)} % Herzen zurück.</p>
    <p>Sind alle Herzen weg, geht deine Figur nach Hause und ruht sich aus – du verlierst nichts.</p>
    <p>Deine <b>Kampfstufe</b> ist der Durchschnitt aus Mut, Kraft, Schutz und Herzen. Jedes Gebiet zeigt, ab welcher Kampfstufe es empfohlen ist.</p>` },
  { id: "ausruestung", icon: "🛡️", titel: "Ausrüstung", text: () => `
    <p>Schwert, Helm, Schild und Rüstung schmiedest du beim 🔨 Schmieden aus Barren. Zum Anlegen brauchst du Mut (Schwert) oder Schutz (Rest) auf der Stufe des Materials.</p>
    <p>Dazu kommen 💍 Ring und 📿 Kette vom Goldschmieden – jeder Edelstein hat eine andere Kraft.</p>` },
  { id: "traenke", icon: "🧪", titel: "Tränke", text: () => `
    <p>Tränke braust du aus einem Kraut aus dem Garten und einer Beute aus dem Abenteuer. Trinken kannst du sie in der Bank.</p>
    <p>Ein Trank wirkt eine bestimmte Anzahl Male (Ladungen). Oben siehst du, welche Tränke gerade wirken.</p>` },
  { id: "garten", icon: "🌱", titel: "Garten", text: () => `
    <p>Kauf Samen, pflanze sie in ein Beet – und sie wachsen in echter Zeit, auch wenn das Spiel zu ist. Reife Beete erntest du mit einem Tipp.</p>
    <p>Du startest mit ${GARTEN.startBeete} Beeten. Beim Ernten bekommst du mit ${Math.round(GARTEN.samenZurueck * 100)} % Glück einen Samen zurück.</p>
    <p><b>Tipp:</b> Schau 2–3 Mal am Tag in den Garten und pflanze alles neu – das ist der schnellste Weg zu Gärtnern 99.</p>` },
  { id: "haustiere", icon: "🐾", titel: "Haustiere", text: () => `
    <p>Haustiere findest du ganz selten beim Arbeiten, beim Ernten, bei Chefs oder in Schatztruhen. Jedes Haustier, das du hast, hilft dir für immer – auch wenn es nicht dein Begleiter ist.</p>
    <p>Streicheln (alle ${PFLEGE.streichelPauseMin / 60} Stunden) und Füttern lässt es bis Stufe ${PFLEGE.maxStufe} wachsen. Jede Stufe macht seinen Bonus ${Math.round(PFLEGE.bonusProStufe * 100)} % stärker.</p>` },
  { id: "baumhaus", icon: "🏡", titel: "Baumhaus", text: () => `
    <p>Beim 🔨 Bauen sägst du Bretter. Damit richtest du im Baumhaus ${BAUPLAETZE.length} Plätze ein. Zuerst muss die Plattform stehen.</p>
    <p>Jeder Platz hat 5 Stufen (${BAU_STUFEN.map(s => s.vorsilbe).join(", ")}). Jede Stufe gibt einen Bonus für immer.</p>` },
  { id: "naehen", icon: "🧵", titel: "Nähen", text: () => `
    <p>Fasern wachsen im Garten. Beim Nähen webst du daraus Stoff – und aus Stoff werden Kuscheltiere (gut zum Verkaufen) oder Kleidung für deinen Kleiderschrank.</p>
    <p>Jedes Kleidungsstück nähst du nur einmal, es landet sofort im Schrank.</p>` },
  { id: "schmuck", icon: "💍", titel: "Goldschmieden", text: () => `
    <p>Beim ⛏️ Bergbau findest du mit ${Math.round(SCHMUCK.edelsteinChance * 100)} % Glück einen Edelstein (je nach Erz-Sorte). Edelsteine gibt es auch in den Schatztruhen der Pfade.</p>
    <p>Aus Barren und Edelsteinen werden Ringe und Ketten. Ketten sind stärker, brauchen aber mehr.</p>` },
  { id: "pfade", icon: "🗺️", titel: "Abenteuer-Pfade", text: () => `
    <p>Ein Pfad ist eine Reihe von Monstern ohne Ausruhen. Am Ende kommen der Chef des Gebiets und ein starker Wächter. Danach öffnest du eine 🧰 Schatztruhe.</p>
    <p>Ein Pfad öffnet sich, sobald der Chef seines Gebiets einmal eingeschlafen ist. In den Truhen: Münzen, Beute, Barren, Essen, Edelsteine – mit Glück ein Pfad-Rahmen (${Math.round(PFAD_REGEL.rahmenChance * 100)} %) oder Papagei Kiki.</p>` },
  { id: "season", icon: "🎟️", titel: "Season-Pass", text: () => `
    <p>Jeden Monat gibt es eine neue Season mit eigenem Thema. Erledige jeden Tag ${SEASON.tagesAufgaben} Tagesaufgaben (je ${SEASON.tagesPunkte} Punkte) und jede Woche ${SEASON.wochenAufgaben} Wochenaufgaben (je ${SEASON.wochenPunkte} Punkte). Jedes Season-Monster gibt ${SEASON.monsterPunkte} Punkte.</p>
    <p>${SEASON.punkteProStufe} Punkte = 1 Stufe. Bei ${SEASON.stufen} Stufen gibt es Rahmen, Kleidung, Hut und am Ende ein Season-Haustier.</p>
    <p>Die Season zählt nicht zu den 100 % im Guide – sie ist ein Extra für jeden Monat.</p>` },
  { id: "online", icon: "🏅", titel: "Bestenliste, Codes und Sichern", text: () => `
    <p>In der Bestenliste unter 👤 Ich kannst du mit einem Spitznamen mitmachen. Es zählt die Gesamtstufe und die Erfahrung der Woche.</p>
    <p>Mit einem Belohnungs-Code bekommst du Geschenke. Unter ⚙️ Optionen kannst du deinen Spielstand als Code oder Datei sichern – heb ihn gut auf!</p>` },
];

// ===================== 2. GUIDE NACH DEN AUFTRÄGEN =====================
// Jeder Schritt: id (bleibt gleich!), kapitel, icon, titel, text, ziel, wert(), hilfe
// hilfe: { seite, fertigkeit, ziel (CSS-Auswahl), ichTab, abenteuerTab }
// Diese Schritte stehen im Guide vor dem allerletzten Auftrag („Werde Meister in allem“).
function guideVervollstaendigen() {
  const s = [];
  const schritt = x => s.push(x);

  // --- Alles verbessern ---
  const K1 = "Alles verbessern";
  for (const [art, w] of Object.entries(WERKZEUGE)) {
    schritt({ id: `w:${art}`, kapitel: K1, icon: w.icon, titel: `${WERKZEUG_STUFEN[WERKZEUG_STUFEN.length - 1].name}-${w.name}`,
      text: `Kauf im 🛒 Laden alle ${w.name}-Stufen. Jede macht ${fertigkeit(w.fertigkeit).name.replaceAll("­", "")} ${Math.round(WERKZEUG_BONUS * 100)} % schneller.`,
      ziel: WERKZEUG_STUFEN.length, wert: () => spiel.werkzeuge?.[art] || 0, hilfe: { seite: "seiteLaden" } });
  }
  const alleBeete = GARTEN.startBeete + GARTEN.beetPreise.length + 3;
  schritt({ id: "g:beete", kapitel: K1, icon: "🟫", titel: `Alle ${alleBeete} Beete`,
    text: "Mehr Beete = mehr Ernte. Kauf neue Beete im 🌱 Garten. Die letzten 3 bekommst du mit dem 🌷 Blumenkasten im Baumhaus.",
    ziel: alleBeete, wert: () => gartenStand().beete.length, hilfe: { fertigkeit: "garten", ziel: "#beetKaufen" } });

  // --- Alles sammeln ---
  const K2 = "Alles sammeln";
  const tiere = () => HAUSTIERE.filter(h => !h.season);
  schritt({ id: "t:alle", kapitel: K2, icon: "🐾", titel: "Finde alle Haustiere",
    text: "In der Wiki unter 🐾 Haustiere steht genau, wo du jedes Haustier findest. Das 🔭 Teleskop im Baumhaus hilft!",
    ziel: tiere().length, wert: () => tiere().filter(h => hatHaustier(h.id)).length, hilfe: { seite: "seiteIch", ichTab: "tiere" } });
  schritt({ id: "t:pflege", kapitel: K2, icon: "💖", titel: `Alle Haustiere auf Stufe ${PFLEGE.maxStufe}`,
    text: `Streichle jedes Haustier, so oft es geht (alle ${PFLEGE.streichelPauseMin / 60} Stunden), und füttere es mit gekochtem Essen.`,
    ziel: tiere().length, wert: () => tiere().filter(h => hatHaustier(h.id) && tierStufe(h.id) >= PFLEGE.maxStufe).length, hilfe: { seite: "seiteIch", ichTab: "tiere" } });
  const monster = () => Object.keys(MONSTER).filter(id => id !== "season");
  schritt({ id: "m:alle", kapitel: K2, icon: "💤", titel: "Jedes Monster einmal",
    text: "Lass jedes Monster mindestens einmal einschlafen – auch die Pfad-Wächter. In der Wiki unter ⚔️ Abenteuer siehst du, welche dir noch fehlen.",
    ziel: monster().length, wert: () => monster().filter(id => (spiel.besiegt?.[id] || 0) > 0).length, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "gebiete" } });
  const teile = () => alleTeile().filter(t => !t.season);
  schritt({ id: "a:alle", kapitel: K2, icon: "👗", titel: "Kleiderschrank komplett",
    text: "Kauf, näh und finde alle Hüte, Kleider und Rahmen (ohne Season-Sachen). Was woher kommt, steht in der Wiki unter 👗 Aussehen.",
    ziel: teile().length, wert: () => teile().filter(besitztTeil).length, hilfe: { seite: "seiteIch", ichTab: "figur", ziel: "#schrankRaster" } });

  // --- Meister in allem: jede Fertigkeit auf 99 (Sammeln und Herstellen zuerst, Kampf zum Schluss) ---
  const K3 = "Meister in allem";
  const reihe = [...FERTIGKEITEN.filter(f => f.art !== "kampf"), ...FERTIGKEITEN.filter(f => f.art === "kampf")];
  for (const f of reihe) {
    const kampf = f.art === "kampf";
    schritt({ id: `f:${f.id}:99`, kapitel: K3, icon: f.icon, titel: `${f.name.replaceAll("­", "")} Stufe ${SPIEL.maxStufe}`, fertigkeitId: f.id,
      text: kampf ? "Kämpfe gegen die stärksten Monster, die du gut schaffst. Der Kompass zeigt dir das beste." :
        f.id === "garten" ? "Halte alle Beete voll und ernte oft." : "Mach immer die beste Tätigkeit, die du schon kannst. Der Kompass zeigt sie dir.",
      ziel: SPIEL.maxStufe, wert: () => stufe(f.id), hilfe: kampf ? { seite: "seiteAbenteuer" } : { fertigkeit: f.id } });
  }

  // --- Zum Schluss ---
  const K4 = "Das große Finale";
  const erfolge = () => ERFOLGE.filter(e => !e.id.startsWith("season"));
  schritt({ id: "e:alle", kapitel: K4, icon: "🏆", titel: "Alle Erfolge (ohne Season)",
    text: "Schau unter 👤 Ich → 🏆 Erfolge, welche dir noch fehlen.",
    ziel: erfolge().length, wert: () => erfolge().filter(erfolgErreicht).length, hilfe: { seite: "seiteIch", ichTab: "erfolge" } });
  return s;
}
