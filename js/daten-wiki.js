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
    <p>Der runde <b>🧭 Kompass-Knopf</b> unten rechts zeigt dir jederzeit den nächsten Schritt: Er springt zur richtigen Stelle im Spiel und lässt das Ziel leuchten. Darunter steht, wie viel Prozent vom ganzen Spiel du schon geschafft hast. Wie sich diese Zahl zusammensetzt, zeigt das 🏁 Fortschritts-Fenster (oben auf der Fertigkeiten-Seite oder unter 👤 Ich → 📊 Statistik).</p>
    <p>Hast du einen 📜 Auftrag geschafft, zeigt der Kompass dir zuerst die Belohnung zum Abholen.</p>` },
  { id: "stufen", icon: "📈", titel: "Fertigkeiten und Stufen", text: () => `
    <p>Es gibt ${FERTIGKEITEN.length} Fertigkeiten. Jede geht bis Stufe ${SPIEL.maxStufe}. Alle Stufen zusammen sind deine <b>Gesamtstufe</b> (höchstens ${zahl(FERTIGKEITEN.length * SPIEL.maxStufe)}).</p>
    <p><b>Sammeln</b> (${FERTIGKEITEN.filter(f => f.art === "sammeln").map(f => f.name).join(", ")}) holt Rohstoffe. <b>Herstellen</b> (${FERTIGKEITEN.filter(f => f.art === "machen").map(f => f.name).join(", ")}) macht daraus neue Sachen. <b>Kampf</b> (${FERTIGKEITEN.filter(f => f.art === "kampf").map(f => f.name).join(", ")}) übst du im ⚔️ Abenteuer.</p>
    <p>Die meisten Materialien gibt es in 8 Sorten. Neue Sorten gibt es ab Stufe ${STUFEN.join(", ")}.</p>` },
  { id: "uebung", icon: "⭐", titel: "Übung und doppelte Ausbeute", text: () => `
    <p>Jede einzelne Tätigkeit hat ihre eigene <b>Übungs-Stufe ⭐</b> (bis 99). Je öfter du sie machst, desto besser wirst du darin.</p>
    <p>Alle 10 Übungs-Stufen gibt es ${Math.round(SPIEL.uebungDoppeltProZehn * 100)} % mehr Chance auf <b>doppelte Ausbeute</b>. Bei ⭐ 99 bist du Meister und ${Math.round(SPIEL.meisterSchneller * 100)} % schneller.</p>
    <p>Doppelte Ausbeute gibt es außerdem durch Haustiere, Tränke, Schmuck (Smaragd) und das Regal im Baumhaus.</p>
    <p><b>🫙 Übungs-Topf:</b> Jede Fertigkeit hat einen Topf, in den ${Math.round(TOPF.anteil * 100)} % jeder Übungs-Erfahrung fließt. Boni ab ${TOPF.marken.map(m => `${Math.round(m.p * 100)} % (${m.text})`).join(", ")}. Was über der letzten erreichten Marke liegt, kannst du in einzelne Tätigkeiten stecken.</p>
    <p>Deine Übung bei allem siehst du im Übungs-Fenster: unten auf jeder Fertigkeits-Seite oder unter 👤 Ich → 📊 Statistik.</p>` },
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
    <p>Deine <b>Kampfstufe</b> zählt deine beste Angriffs-Art (Mut und Kraft, Fernkampf oder Magie) doppelt, dazu Schutz und Herzen. Jedes Gebiet zeigt, ab welcher Kampfstufe es empfohlen ist.</p>` },
  { id: "kampfarten", icon: "🏹", titel: "Nahkampf, Fernkampf und Magie", text: () => `
    <p>Die <b>Waffe</b> bestimmt, wie du kämpfst: 🗡️ Schwert = ⚔️ Nahkampf (übt Mut oder Kraft), 🏹 Bogen = Fernkampf, 🪄 Zauberstab = Magie.</p>
    <p>Der <b>Bogen</b> braucht Pfeile (beim 🪚 Schnitzen aus Holz und Barren). ${Math.round(KAMPF.pfeilZurueck * 100)} % der Pfeile sammelst du wieder auf. Der <b>Zauberstab</b> braucht Zauberperlen (beim 💍 Goldschmieden aus Erz) – jeder Zauber verbraucht eine. Ohne Munition bist du ganz schwach!</p>
    <p><b>Kampf-Dreieck:</b> Jedes Monster kämpft auf seine Art. ⚔️ ist stark gegen 🏹-Monster, 🏹 stark gegen 🪄-Monster, 🪄 stark gegen ⚔️-Monster. Stark = +${Math.round(KAMPF.dreieckStark * 100)} % Treffer und Schlag, schwach = −${Math.round(KAMPF.dreieckSchwach * 100)} %.</p>
    <p>Fernkampf und Magie sind je <b>eine</b> Fertigkeit für Treffen und Schlag. Schutz und Herzen helfen bei jeder Kampfart.</p>` },
  { id: "ausruestung", icon: "🛡️", titel: "Ausrüstung", text: () => `
    <p>Schwert, Helm, Schild und Rüstung schmiedest du beim 🔨 Schmieden aus Barren. Zum Anlegen brauchst du Mut (Schwert) oder Schutz (Rest) auf der Stufe des Materials.</p>
    <p>Dazu kommen 💍 Ring und 📿 Kette vom Goldschmieden – jeder Edelstein hat eine andere Kraft.</p>
    <p><b>🎒 Ausrüstungs-Sets:</b> Im Reiter Ausrüstung speicherst du bis zu ${SET_ANZAHL} Ausrüstungen (mit Munition und Essen) und legst sie mit einem Tipp wieder an – auch über die Schnellwahl im Kampf-Reiter.</p>` },
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
    <p><b>Tipp:</b> Tippe eine Aufgabe an – dann bringt dich das Spiel direkt zur richtigen Stelle und lässt sie leuchten.</p>
    <p>${SEASON.punkteProStufe} Punkte = 1 Stufe. Bei ${SEASON.stufen} Stufen gibt es Rahmen, Kleidung, Hut und am Ende ein Season-Haustier.</p>
    <p>Die Season zählt nicht zu den 100 % im Guide – sie ist ein Extra für jeden Monat.</p>` },
  { id: "sternenkunde", icon: "🔭", titel: "Sternenkunde", text: () => `
    <p>Die Sternenkunde öffnet sich, sobald du deinen <b>ersten Abenteuer-Pfad</b> geschafft hast. Dann beobachtest du Sternbilder – wie beim Holzsammeln. Dafür gibt es Erfahrung und 💫 Sternsplitter, ganz selten (${(STERNE.goldChance * 100).toLocaleString("de-DE")} %) einen 🌟 Goldsplitter.</p>
    <p>Es gibt ${STERNBILDER.length} Sternbilder (ab Stufe ${STUFEN.join(", ")}). Jedes gehört zu zwei Fertigkeiten. Mit Sternsplittern lässt du seine 3 Sterne leuchten (je ${STERNE.maxNormal} Stufen, jede Stufe +${Math.round(STERNE.proStufe * 100)} %). Mit Goldsplittern den goldenen Stern (${STERNE.maxGold} Stufen) mit einer besonderen Kraft.</p>
    <p>Höhere Stern-Stufen brauchen eine höhere Sternenkunde-Stufe. Alle Sternbilder und Kräfte stehen in der Wiki unter 🔭 Sterne.</p>` },
  { id: "dorf", icon: "🏘️", titel: "Wichteldorf", text: () => `
    <p>Das Wichteldorf öffnet sich, sobald du <b>zwei Abenteuer-Pfade</b> geschafft hast. Es läuft nebenher – wie der Garten.</p>
    <p>Alle ${DORF.tickMinuten} Minuten ist ein <b>Dorf-Tag</b> (auch wenn das Spiel zu ist, bis zu einer Woche): Die Wichtel essen Korn, arbeiten in den Gebäuden und legen Holz, Erz, Fisch, Kräuter und Münzen ins Dorflager. Von dort holst du alles in die Bank.</p>
    <p>In jedem Wichtelhaus wohnen ${DORF.bewohnerProHaus} Wichtel. Arbeits-Gebäude brauchen Wichtel – fehlen welche, wird langsamer gearbeitet. Reicht das Korn nicht, sinkt die <b>Gesundheit</b>. Der Spielplatz macht <b>glücklich</b>. Gesundheit und Glück bestimmen den Fleiß.</p>
    <p><b>Dorffeste:</b> Jeden Monat feiert das Dorf ein Fest zum Season-Thema. Spende die 3 gewünschten Sachen, dann gibt es ${DORFFEST.stunden} Stunden Festtag (doppelter Fleiß, +${DORFFEST.glueck} Glück), Münzen und ${DORFFEST.seasonPunkte} Season-Punkte.</p>
    <p>Mit jedem Dorf-Tag steigt die Dorf-Stufe: mehr Bauplätze (${4} + Stufe) und bessere Sorten. Von jedem Gebäude kannst du ${DORF.maxJeGebaeude} Stück bauen – jedes weitere kostet mehr.</p>` },
  { id: "lagerfeuer", icon: "🔥", titel: "Lagerfeuer", text: () => `
    <p>Das Lagerfeuer gibt es, sobald du <b>drei Abenteuer-Pfade</b> geschafft hast. Du verbrennst Holz und bekommst dafür Erfahrung und <b>Asche</b>.</p>
    <p><b>Großes Lagerfeuer:</b> Mit ${FEUER.holz} Holz brennt es ${FEUER.minuten} Minuten lang (auch wenn das Spiel zu ist). Solange gibt es mehr Erfahrung bei allem: +${Math.round(FEUER.bonusBasis * 100)} % mit Ästchen bis +${Math.round(feuerBonusFuer(7) * 100)} % mit Regenbogenholz.</p>
    <p><b>Asche ist Dünger:</b> Im Garten düngst du wachsende Beete (je nach Pflanze 1–8 Asche). Sie sind sofort ${Math.round(FEUER.duengerSchneller * 100)} % weiter und bringen ${Math.round(FEUER.duengerMehr * 100)} % mehr Ernte.</p>` },
  { id: "jagd", icon: "📋", titel: "Monster-Aufträge", text: () => `
    <p>Sobald du <b>vier Abenteuer-Pfade</b> geschafft hast, hat die Wichtel-Jägerin ${JAGD_JAEGERIN} Aufträge für dich (⚔️ Abenteuer → 📋 Aufträge). Zum Beispiel: „Lass 30× Wuschelwolf einschlafen“.</p>
    <p>Es gibt <b>leichte</b>, <b>mittlere</b> (ab Jagd-Stufe ${JAGD.arten[1].stufe}) und <b>schwere</b> Aufträge (ab Jagd-Stufe ${JAGD.arten[2].stufe}). Für jedes Monster aus dem Auftrag gibt es 🏅 Jagd-Münzen und Jagd-Erfahrung, am Ende +${Math.round(JAGD.bonusAmEnde * 100)} % Bonus. Mit Glück (1 von ${Math.round(1 / JAGD.haustierChance)}) kommt der Igel Stups zu dir.</p>
    <p>Im <b>Jagd-Laden</b>: ${JAGD_LADEN.map(x => `${x.icon} ${x.name}`).join(", ")}. Einen Auftrag tauschen kostet ${JAGD.tauschenKostet} Jagd-Münzen (gratis, wenn du weniger hast).</p>` },
  { id: "turnen", icon: "🤸", titel: "Abenteuer-Spielplatz", text: () => `
    <p>Der Abenteuer-Spielplatz öffnet sich, sobald du <b>fünf Abenteuer-Pfade</b> geschafft hast. Neue Fertigkeit: Turnen.</p>
    <p>Der Parcours hat ${PARCOURS.length} Stationen (ab Turnen-Stufe ${STUFEN.join(", ")}). An jeder baust du <b>eins von drei Hindernissen</b> – jedes gibt einen Dauer-Bonus. Umbauen geht jederzeit, kostet aber neu.</p>
    <p><b>Parcours laufen</b> ist eine Tätigkeit: Eine Runde dauert länger, je mehr Hindernisse stehen, und bringt dafür mehr Erfahrung und Münzen. Stehen alle Stationen, gibt es das <b>Siegerpodest</b>: ${PODEST.bonus.map(bonusText).join(" und ")}.</p>` },
  { id: "graben", icon: "🦴", titel: "Ausgraben und Museum", text: () => `
    <p>Ausgraben gibt es, sobald du <b>sechs Abenteuer-Pfade</b> geschafft hast. Es gibt ${GRABUNGEN.length} Ausgrabungsorte (ab Ausgraben-Stufe ${GRABUNGEN.map(o => o.stufe).join(", ")}).</p>
    <p>Jede Grabung bringt Krimskrams und Erfahrung – und mit Glück ein Fundstück: ${FUND_GROESSEN.map(g => `${g.name} (${(g.chance * 100).toLocaleString("de-DE")} %)`).join(", ")}. Die Grabe-Werkzeuge (${GRABE_WERKZEUGE.map(w => `${w.icon} ${w.name}`).join(", ")}) machen je eine Größe ${Math.round(WERKZEUG_GRAB.plusProStufe * 100)} % pro Stufe häufiger.</p>
    <p>Im <b>Museum</b> spendest du jedes Fundstück einmal. Eine volle Vitrine (alle 8 Funde eines Ortes) gibt einen Bonus für immer: ${GRABUNGEN.map(o => `${o.icon} ${o.vitrine.text}`).join(", ")}.</p>` },
  { id: "freunde", icon: "🐾", titel: "Tier-Freunde und Futternapf", text: () => `
    <p>Sobald der <b>Pusteblumen-Riese</b> eingeschlafen ist, beginnt die <b>Tierfreundschaft</b>. Du backst Leckerli aus Fisch (${LECKERLI.length} Sorten, ab Stufe ${STUFEN.join(", ")}).</p>
    <p>Leg Leckerli in den <b>Futternapf</b> (👤 Ich → 🐾 Tiere). Dann ist dein Begleiter <b>aktiv</b>: Sein Bonus wirkt ${Math.round(FREUNDE.bonusBasis * 100)}–${Math.round((FREUNDE.bonusBasis + FREUNDE.bonusProSorte * 7) * 100)} % stärker, und im Kampf stupst er die Monster mit an. Alle ${FREUNDE.aktionenProLeckerli} Aktionen frisst er ein Leckerli – dafür gibt es Tierfreundschafts-Erfahrung.</p>
    <p>Bessere Leckerli = mehr Hilfe. Je höher die Pflege-Stufe deines Begleiters, desto fester stupst er.</p>` },
  { id: "karte", icon: "🗺️", titel: "Entdecker-Karte", text: () => `
    <p>Die Entdecker-Karte gibt es, sobald du <b>sieben Abenteuer-Pfade</b> geschafft hast. Eine Insel aus ${alleFelder()} Feldern liegt im Nebel – nur dein Lager in der Mitte ist frei.</p>
    <p>Tipp ein Feld neben dem Entdeckten an und lass ${figurName()} es erkunden. Weiter außen dauert es länger und braucht eine höhere Entdecken-Stufe (${KARTE.stufeFuerAbstand.slice(1).join(", ")}). Hast du kein Feld gewählt, nimmt sie das nächste günstige.</p>
    <p>Zu finden: ${["schatz", "kristall", "aussicht", "quelle", "schatzkarte", "nest", "geheim"].map(a => `${FELD_ARTEN[a].icon} ${FELD_ARTEN[a].name}`).join(", ")}.</p>` },
  { id: "advent", icon: "🎄", titel: "Adventskalender", text: () => `
    <p>Vom 1. bis 24. Dezember darfst du jeden Tag ein Türchen öffnen – die Karte dafür steht im Dezember oben auf der 🌟 Fertigkeiten-Seite. Verpasste Türchen kannst du bis Silvester nachholen.</p>
    <p>Hinter den Türchen: Münzen, Leckerli, Essen, Samen, Tränke, Edelsteine, Season-Punkte, ein 🦌 Rentier-Geweih, ein 🎄 Adventskranz-Rahmen – und hinter Türchen 24 Eisbär Flocke. Jedes Jahr gibt es den Kalender neu.</p>` },
  { id: "finale", icon: "🌈", titel: "Das große Finale", text: () => `
    <p>Das letzte Gebiet ist der <b>Regenbogen-Gipfel</b> (empfohlen ab Kampfstufe 99). Der Graue Nebel hat ihm alle Farben gestohlen. Besiege den Nebelkönig – dann öffnet sich der <b>Regenbogenpfad</b>.</p>
    <p>Am Ende des Regenbogenpfads wartet der Große Nebeldrache. Wer ihn schafft, bringt die Farben zurück und hat das große Abenteuer beendet: Es gibt ein Finale mit 👑 Regenbogen-Krone und 🌈 Heldinnen-Rahmen.</p>
    <p>Danach geht es weiter: Übungs-Töpfe, Haustiere, Museum, Insel – bis 100 %!</p>` },
  { id: "epwochenende", icon: "🎉", titel: "EP-Wochenende", text: () => `
    <p>Jedes <b>erste Wochenende im Monat</b> (Samstag und Sonntag) ist EP-Wochenende: Bei allem gibt es <b>+${Math.round(EP_WOCHENENDE.bonus * 100)} % Erfahrung</b> – beim Sammeln, Herstellen, Kämpfen, im Garten und im Dorf.</p>
    <p>Ab Mittwoch davor steht es im Lauftext über dem Logo. Am besten lässt du am Wochenende deine schwierigsten Fertigkeiten laufen!</p>` },
  { id: "danach", icon: "🔀", titel: "Danach weitermachen mit …", text: () => `
    <p>Braucht eine Tätigkeit Material (zum Beispiel 🍳 Kochen), steht in der Leiste oben ein kleiner Knopf <b>„Danach: …“</b>. Dort wählst du, womit deine Figur weitermachen soll, wenn das Material ausgeht – zum Beispiel Holzsammeln oder Angeln.</p>
    <p>So steht sie nachts nicht herum. Die Wahl gilt einmal und nur für die Tätigkeit, die gerade läuft.</p>` },
  { id: "gluecksrad", icon: "🎁", titel: "Tägliches Glücksrad", text: () => `
    <p>Jeden Tag darfst du einmal am Glücksrad drehen – die Karte dafür ist oben auf der 🌟 Fertigkeiten-Seite. Jeder ${GLUECKSRAD.serieBonus}. Tag in Folge bringt ein <b>doppeltes</b> Geschenk.</p>
    <p>Mögliche Geschenke: ${GLUECKSRAD.felder.map(f => `${f.icon} ${f.name}`).join(", ")}. Die Geschenke wachsen mit deiner Gesamtstufe mit.</p>` },
  { id: "online", icon: "🏅", titel: "Bestenliste, Codes und Sichern", text: () => `
    <p>In der Bestenliste unter 👤 Ich kannst du mit einem Spitznamen mitmachen. Es zählt die Gesamtstufe und die Erfahrung der Woche.</p>
    <p>Mit einem Belohnungs-Code bekommst du Geschenke. Unter ⚙️ Optionen kannst du deinen Spielstand als Code oder Datei sichern – heb ihn gut auf!</p>` },
];

// ===================== 2a. EINSCHÜBE IN DIE AUFTRAGS-KETTE =====================
// Zusätzliche Guide-Schritte direkt NACH einem bestimmten Auftrag (Titel). So ändert sich die
// Nummerierung der Aufträge nicht (spiel.quest zählt mit Nummern!).
const GUIDE_EINSCHUEBE = [
  { nach: "Verdiene 30 Münzen", schritt: { id: "rad:1", icon: "🎁", titel: "Dreh das Glücksrad",
    text: "Oben auf der 🌟 Fertigkeiten-Seite wartet jeden Tag ein Geschenk. Dreh das Glücksrad – am besten jeden Tag!",
    ziel: 1, wert: () => spiel.gluecksrad?.gedreht || 0, hilfe: { seite: "seiteFertigkeiten", ziel: "#gluecksKarte" } } },
  { nach: "Trink einen Trank", schritt: { id: "fern:1", icon: "🏹", titel: "Schnitze einen Kurzbogen",
    text: "Beim 🪚 Schnitzen machst du aus 3 Ästchen einen Kurzbogen. Mit Pfeil und Bogen kämpfst du aus der Ferne!",
    ziel: 1, wert: () => gemacht("bogen0"), hilfe: { fertigkeit: "schnitzen", ziel: '.taetigkeit[data-id="schnitzen-bogen0"]' } } },
  { nach: "Trink einen Trank", schritt: { id: "fern:2", icon: "➳", titel: "Schnitze 30 Kupfer-Pfeile",
    text: "Pfeile schnitzt du aus Holz und einem Barren – 15 Stück auf einmal.",
    ziel: 30, wert: () => gemacht("pfeil0"), hilfe: { fertigkeit: "schnitzen", ziel: '.taetigkeit[data-id="schnitzen-pfeil0"]' } } },
  { nach: "Trink einen Trank", schritt: { id: "fern:3", icon: "🏹", titel: "10 Monster mit Pfeil und Bogen",
    text: "Leg den Bogen an, wähle die Pfeile und lass 10 Monster einschlafen. Tipp: Bogen ist stark gegen 🪄-Monster!",
    ziel: 10, wert: () => spiel.statistik.besiegtFern || 0, fertigkeitId: "fernkampf", hilfe: { seite: "seiteAbenteuer" } } },
  { nach: "Schaffe den Flüsterpfad", schritt: { id: "magie:1", icon: "🪄", titel: "Mach dir einen Zauberstab",
    text: "Beim 💍 Goldschmieden wird aus 2 Ästchen und einem Bernstein ein Zauberstab.",
    ziel: 1, wert: () => gemacht("stab0"), hilfe: { fertigkeit: "schmuck", ziel: '.taetigkeit[data-id="schmuck-stab0"]' } } },
  { nach: "Schaffe den Flüsterpfad", schritt: { id: "magie:2", icon: "🔮", titel: "Mach 30 Zauberperlen",
    text: "Zauberperlen machst du beim 💍 Goldschmieden aus Erz – 15 Stück auf einmal. Jeder Zauber braucht eine.",
    ziel: 30, wert: () => gemacht("perle0"), hilfe: { fertigkeit: "schmuck", ziel: '.taetigkeit[data-id="schmuck-perle0"]' } } },
  { nach: "Schaffe den Flüsterpfad", schritt: { id: "magie:3", icon: "🪄", titel: "10 Monster mit Magie",
    text: "Leg den Zauberstab an, wähle die Perlen und lass 10 Monster einschlafen. Tipp: Magie ist stark gegen ⚔️-Monster!",
    ziel: 10, wert: () => spiel.statistik.besiegtMagie || 0, fertigkeitId: "magie", hilfe: { seite: "seiteAbenteuer" } } },
  { nach: "Schaffe den Flüsterpfad", schritt: { id: "dorf:1", icon: "🏘️", titel: "Bau ein Gebäude im Wichteldorf",
    text: "Nach deinem zweiten Pfad ziehen Wichtel zu dir! Bau im 🏘️ Wichteldorf ein Wichtelhaus oder einen Holzfäller.",
    ziel: 1, wert: () => (spiel.dorf ? dorfGesamt() - 2 : 0), hilfe: { fertigkeit: "dorf", ziel: ".dorfBauen:not([disabled])" } } },
  { nach: "Schaffe den Flüsterpfad", schritt: { id: "dorf:2", icon: "📦", titel: "Hol Sachen aus dem Dorflager",
    text: "Alle 10 Minuten legen die Wichtel Sachen ins Dorflager. Tippe auf „Alles abholen“.",
    ziel: 1, wert: () => spiel.statistik.dorfAbgeholt || 0, hilfe: { fertigkeit: "dorf", ziel: "#dorfAbholen" } } },
  { nach: "Schaffe den Flüsterpfad", schritt: { id: "dorf:fest", icon: "🎪", titel: "Feier ein Dorffest",
    text: "Jeden Monat wünschen sich die Wichtel drei Sachen für ihr Fest. Spende sie auf der Dorf-Seite und feier mit!",
    ziel: 1, wert: () => spiel.statistik.dorffeste || 0, hilfe: { fertigkeit: "dorf", ziel: ".festSpenden:not([disabled]), #festFeiern" } } },
  { nach: "Schaffe den Flüsterpfad", schritt: { id: "dorf:3", icon: "🧚", titel: "24 Wichtel im Dorf",
    text: "Bau ein zweites Wichtelhaus – mehr Wichtel können mehr arbeiten. Vergiss den Bauernhof nicht!",
    ziel: 24, wert: () => (spiel.dorf ? dorfBewohnerPlatz() : 0), hilfe: { fertigkeit: "dorf", ziel: '.dGebaeude[data-gebaeude="haus"]' } } },
  { nach: "Schaffe den Spukgang", schritt: { id: "feuer:1", icon: "🔥", titel: "Verbrenne 30 Ästchen",
    text: "Nach deinem dritten Pfad gibt es das 🔥 Lagerfeuer. Leg Holz ins Feuer – dafür gibt es Erfahrung und Asche.",
    ziel: 30, wert: () => spiel.zaehler?.asche0 || 0, hilfe: { fertigkeit: "feuer" } } },
  { nach: "Schaffe den Spukgang", schritt: { id: "feuer:2", icon: "✨", titel: "Zünde ein großes Lagerfeuer an",
    text: "Mit 25 Holz brennt ein großes Lagerfeuer 60 Minuten lang – und du bekommst mehr Erfahrung bei allem!",
    ziel: 1, wert: () => spiel.statistik.lagerfeuer || 0, hilfe: { fertigkeit: "feuer", ziel: ".feuerHolz:not([disabled])" } } },
  { nach: "Schaffe den Spukgang", schritt: { id: "feuer:3", icon: "🌱", titel: "Dünge 5 Beete mit Asche",
    text: "Im 🌱 Garten gibt es den Knopf „Mit Asche düngen“. Gedüngte Beete wachsen schneller und bringen mehr Ernte.",
    ziel: 5, wert: () => spiel.statistik.geduengt || 0, hilfe: { fertigkeit: "garten", ziel: "#duengen" } } },
  { nach: "Pusteblumen-Riese: 1× einschlafen lassen", schritt: { id: "freunde:1", icon: "🦴", titel: "Back 20 Leckerli",
    text: "Bei 🐾 Tierfreundschaft backst du aus Stichlingen Leckerli für deinen Begleiter.",
    ziel: 20, wert: () => gemacht("leckerli0"), hilfe: { fertigkeit: "freunde", ziel: '.taetigkeit[data-id="freunde-0"]' } } },
  { nach: "Pusteblumen-Riese: 1× einschlafen lassen", schritt: { id: "freunde:2", icon: "🐾", titel: "Füll den Futternapf",
    text: "Unter 👤 Ich → 🐾 Tiere steht der Futternapf. Mit Leckerli hilft dein Begleiter richtig mit!",
    ziel: 1, wert: () => spiel.statistik.leckerli || 0, hilfe: { seite: "seiteIch", ichTab: "tiere", ziel: "#napfWaehlen" } } },
  { nach: "Schaffe den Glutpfad", schritt: { id: "jagd:1", icon: "📋", titel: "Hol dir einen Monster-Auftrag",
    text: "Nach deinem vierten Pfad hat die Wichtel-Jägerin Pia Aufträge für dich – im ⚔️ Abenteuer unter „📋 Aufträge“.",
    ziel: 1, wert: () => (spiel.jagd?.auftrag || spiel.statistik.jagdAuftraege ? 1 : 0), hilfe: { jagd: true } } },
  { nach: "Schaffe den Glutpfad", schritt: { id: "jagd:2", icon: "📋", titel: "Schaffe 3 Monster-Aufträge",
    text: "Für jedes Monster aus deinem Auftrag gibt es Jagd-Münzen – und am Ende einen Bonus.",
    ziel: 3, wert: () => spiel.statistik.jagdAuftraege || 0, hilfe: { jagd: true } } },
  { nach: "Schaffe den Glutpfad", schritt: { id: "jagd:3", icon: "🏅", titel: "Kauf etwas im Jagd-Laden",
    text: "Der Jäger-Köcher spart Pfeile, das Perlen-Täschchen Zauberperlen – oder gönn dir den Jägerhut!",
    ziel: 1, wert: () => (spiel.jagd ? jagdLadenSumme() : 0), hilfe: { seite: "seiteAbenteuer", abenteuerTab: "jagd", ziel: ".jagdKaufen:not([disabled])" } } },
  { nach: "Schaffe den Frostpfad", schritt: { id: "turnen:1", icon: "🛝", titel: "Bau dein erstes Hindernis",
    text: "Nach deinem fünften Pfad gibt es den 🤸 Abenteuer-Spielplatz. Bau an der ersten Station ein Hindernis.",
    ziel: 1, wert: () => (spiel.parcours ? gebauteStationen().length : 0), hilfe: { fertigkeit: "turnen", ziel: ".stationBauen:not([disabled])" } } },
  { nach: "Schaffe den Frostpfad", schritt: { id: "turnen:2", icon: "🤸", titel: "Lauf 20 Runden Parcours",
    text: "Tippe auf „Parcours laufen“ – jede Runde bringt Erfahrung und Münzen.",
    ziel: 20, wert: () => spiel.statistik.aktionenNach?.turnen || 0, hilfe: { fertigkeit: "turnen", ziel: ".parcoursLauf" } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "graben:1", icon: "🦴", titel: "Finde dein erstes Fundstück",
    text: "Nach deinem sechsten Pfad gibt es die Fertigkeit 🦴 Ausgraben. Grab auf der Spielzeug-Wiese, bis du ein Fundstück findest.",
    ziel: 1, wert: () => spiel.statistik.funde || 0, hilfe: { fertigkeit: "graben" } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "graben:2", icon: "🏛️", titel: "Spende 3 Fundstücke ans Museum",
    text: "Unter den Ausgrabungsorten steht dein Museum. Tippe ein Fundstück mit ➕ an, um es zu spenden.",
    ziel: 3, wert: () => (spiel.museum ? museumAnzahl() : 0), hilfe: { fertigkeit: "graben", ziel: ".spenden, #alleSpenden" } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "graben:3", icon: "🧺", titel: "Verbessere ein Grabe-Werkzeug",
    text: "Mit einem besseren Sieb findest du öfter kleine Fundstücke.",
    ziel: 1, wert: () => grabWerkzeugSumme(), hilfe: { fertigkeit: "graben", ziel: ".grabWerkzeug:not([disabled])" } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "traum:1", icon: "🌙", titel: "Kissenmonster: 30× einschlafen lassen",
    text: "Hinter dem Wolkenreich liegt das 🌙 Traumschloss – das schwerste Gebiet. Tipp: Der Zauberstab ist stark gegen die Kissenmonster!",
    ziel: 30, wert: () => spiel.besiegt?.kissenmonster || 0, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "gebiete", ziel: '.monsterKarte[data-monster="kissenmonster"]' } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "traum:2", icon: "👑", titel: "Traumkönigin einschlafen lassen",
    text: "Die Chefin des Traumschlosses. Nimm viel gutes Essen mit – und mit Glück wohnt danach Panda Schlafi bei dir!",
    ziel: 1, wert: () => spiel.besiegt?.traumkoenigin || 0, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "gebiete", ziel: '.monsterKarte[data-monster="traumkoenigin"]' } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "traum:3", icon: "🧰", titel: "Schaffe den Traumpfad",
    text: "Der allerschwerste Pfad: Am Ende wartet der Mitternachtsdrache!",
    ziel: 1, wert: () => spiel.pfade?.["p-traum"] || 0, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "pfade", ziel: '.pfadKarte[data-pfad="p-traum"]' } } },
  { nach: "Erreiche Gesamtstufe 100", schritt: { id: "topf:1", icon: "🫙", titel: "Ein Übungs-Topf auf 10 %",
    text: "Jede Übung füllt den Übungs-Topf der Fertigkeit. Ab 10 % steigt die Übung dort schneller! Du siehst den Topf oben auf jeder Fertigkeits-Seite.",
    ziel: 1, wert: () => topfFertigkeiten().filter(f => topfAnteil(f) >= 0.1).length, hilfe: { seite: "seiteFertigkeiten" } } },
  { nach: "Trink einen Trank", schritt: { id: "sets:1", icon: "🎒", titel: "Speichere ein Ausrüstungs-Set",
    text: "Im ⚔️ Abenteuer unter 🎒 Ausrüstung kannst du deine Ausrüstung in einem Set speichern – so wechselst du später mit einem Tipp zwischen Schwert und Bogen.",
    ziel: 1, wert: () => (spiel.sets || []).filter(Boolean).length, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "ausruestung", ziel: ".setSpeichern" } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "karte:1", icon: "🗺️", titel: "Entdecke 5 Felder der Insel",
    text: "Nach deinem siebten Pfad gibt es die 🗺️ Entdecker-Karte. Tipp ein Feld neben deinem Lager an und erkunde die Insel!",
    ziel: 5, wert: () => (spiel.karte ? offeneFelder() - 1 : 0), hilfe: { fertigkeit: "karte", ziel: ".kartenLauf" } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "karte:2", icon: "✨", titel: "Finde eine Zauberquelle",
    text: "Irgendwo auf der Insel sprudeln Zauberquellen – jede gibt dir für immer mehr Erfahrung.",
    ziel: 1, wert: () => kartenAnzahl("quelle"), hilfe: { fertigkeit: "karte", ziel: ".kartenLauf" } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "gipfel:1", icon: "🌈", titel: "Grauer Steinwächter: 30× einschlafen lassen",
    text: "Ganz oben, über den Wolken, liegt der Regenbogen-Gipfel. Der Graue Nebel hat ihm alle Farben gestohlen – hol sie zurück!",
    ziel: 30, wert: () => spiel.besiegt?.steinwaechter || 0, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "gebiete", ziel: '.monsterKarte[data-monster="steinwaechter"]' } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "gipfel:2", icon: "👑", titel: "Nebelkönig einschlafen lassen",
    text: "Der Nebelkönig herrscht über den grauen Gipfel. Nimm dein bestes Essen und deine stärksten Tränke mit!",
    ziel: 1, wert: () => spiel.besiegt?.nebelkoenig || 0, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "gebiete", ziel: '.monsterKarte[data-monster="nebelkoenig"]' } } },
  { nach: "Schaffe den Sternenpfad", schritt: { id: "gipfel:3", icon: "🌈", titel: "Das große Finale: der Regenbogenpfad",
    text: "Der allerletzte Pfad. Am Ende wartet der Große Nebeldrache – schaffst du ihn, kehren die Farben zurück!",
    ziel: 1, wert: () => spiel.pfade?.["p-gipfel"] || 0, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "pfade", ziel: '.pfadKarte[data-pfad="p-gipfel"]' } } },
  { nach: "Schaffe den Pusteblumen-Pfad", schritt: { id: "sterne:1", icon: "🔭", titel: "Beobachte die Sterne",
    text: "Nach deinem ersten Pfad öffnet sich die 🔭 Sternenkunde. Beobachte das Eichhörnchen-Sternbild und sammle 30 Sternsplitter.",
    ziel: 30, wert: () => spiel.zaehler?.sternsplitter2 || 0, hilfe: { fertigkeit: "sterne" } } },
  { nach: "Schaffe den Pusteblumen-Pfad", schritt: { id: "sterne:2", icon: "🌟", titel: "Lass deinen ersten Stern leuchten",
    text: "Kauf bei der Sternenkunde mit Sternsplittern einen Stern – er hilft dir für immer.",
    ziel: 1, wert: () => sternStufenSumme(), hilfe: { fertigkeit: "sterne", ziel: ".sternKaufen" } } },
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

  schritt({ id: "sterne:alle", kapitel: K1, icon: "✨", titel: "Der ganze Himmel leuchtet",
    text: "Bring alle Sterne aller Sternbilder auf die höchste Stufe. Höhere Stufen brauchen eine höhere Sternenkunde-Stufe.",
    ziel: sternStufenMax(), wert: () => sternStufenSumme(), hilfe: { fertigkeit: "sterne", ziel: ".sternKaufen" } });

  schritt({ id: "dorf:alle", kapitel: K1, icon: "🏰", titel: "Die Wichtelstadt",
    text: `Bau von jedem Gebäude im Wichteldorf ${DORF.maxJeGebaeude} Stück. Mehr Bauplätze gibt es mit höherer Dorf-Stufe.`,
    ziel: dorfAllesMax(), wert: () => (spiel.dorf ? dorfAllesGebaut() : 0), hilfe: { fertigkeit: "dorf", ziel: ".dorfBauen:not([disabled])" } });

  schritt({ id: "jagd:laden", kapitel: K1, icon: "🏅", titel: "Alles aus dem Jagd-Laden",
    text: "Kauf alle Verbesserungen und die Kleidung im Jagd-Laden. Höhere Stufen brauchen eine höhere Jagd-Stufe.",
    ziel: jagdLadenMax(), wert: () => (spiel.jagd ? jagdLadenSumme() : 0), hilfe: { seite: "seiteAbenteuer", abenteuerTab: "jagd", ziel: ".jagdKaufen:not([disabled])" } });

  schritt({ id: "turnen:alle", kapitel: K1, icon: "🏆", titel: "Spielplatz mit Siegerpodest",
    text: "Bau an allen 8 Stationen ein Hindernis und dann das Siegerpodest.",
    ziel: PARCOURS.length + 1, wert: () => (spiel.parcours ? gebauteStationen().length + (spiel.parcours.podest ? 1 : 0) : 0), hilfe: { fertigkeit: "turnen", ziel: ".stationBauen:not([disabled])" } });

  schritt({ id: "graben:werkzeug", kapitel: K1, icon: "⛏️", titel: "Alle Grabe-Werkzeuge",
    text: "Verbessere Sieb, Kelle, Pinsel und Schaufel ganz.",
    ziel: grabWerkzeugMax(), wert: () => grabWerkzeugSumme(), hilfe: { fertigkeit: "graben", ziel: ".grabWerkzeug:not([disabled])" } });

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

  schritt({ id: "karte:alle", kapitel: K2, icon: "🗺️", titel: "Die ganze Insel entdeckt",
    text: "Erkunde jedes Feld der Entdecker-Insel – ganz außen in der Ecke wartet die geheime Regenbogen-Insel!",
    ziel: alleFelder(), wert: () => (spiel.karte ? offeneFelder() : 0), hilfe: { fertigkeit: "karte", ziel: ".kartenLauf" } });

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
  schritt({ id: "museum:alle", kapitel: K4, icon: "🏛️", titel: "Das ganze Museum",
    text: "Spende jedes Fundstück ans Museum. Die riesigen Funde sind ganz selten – die Schaufel hilft!",
    ziel: FUNDE.length, wert: () => (spiel.museum ? museumAnzahl() : 0), hilfe: { fertigkeit: "graben", ziel: ".spenden, #alleSpenden" } });
  schritt({ id: "topf:alle", kapitel: K4, icon: "🫙", titel: "Alle Übungs-Töpfe auf 95 %",
    text: "Fülle den Übungs-Topf jeder Fertigkeit bis zur letzten Marke.",
    ziel: topfFertigkeiten().length, wert: () => topfFertigkeiten().filter(f => topfAnteil(f) >= 0.95).length, hilfe: { seite: "seiteFertigkeiten" } });
  schritt({ id: "e:alle", kapitel: K4, icon: "🏆", titel: "Alle Erfolge (ohne Season)",
    text: "Schau unter 👤 Ich → 🏆 Erfolge, welche dir noch fehlen.",
    ziel: erfolge().length, wert: () => erfolge().filter(erfolgErreicht).length, hilfe: { seite: "seiteIch", ichTab: "erfolge" } });
  return s;
}
