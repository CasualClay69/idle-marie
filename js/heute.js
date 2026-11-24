"use strict";
// =====================================================
//  HEUTE FÜR DICH – kleine Übersicht oben auf der Fertigkeiten-Seite
//  Zeigt die paar Dinge, die gerade wirklich anstehen (wichtigste zuerst), als große Zeilen
//  zum Antippen. Erledigtes Tägliches bekommt ein ✅. Neue Systeme hier mit eintragen!
//  Jeder Eintrag: { id, icon, text, erledigt?, los: () => … }
// =====================================================

function heuteListe() {
  const liste = [];
  const dazu = (id, icon, text, los, erledigt = false) => liste.push({ id, icon, text, los, erledigt });
  const geh = h => () => zeigeWegHilfe(h);

  // Die Figur hat nichts zu tun
  if (!spiel.aktiv) dazu("leer", "😴", `${figurName()} macht gerade nichts – gib ihr etwas zu tun!`, () => kompass());
  // Auftrag fertig
  const q = aktuellerQuest();
  if (q && questStand(q).fertig) dazu("quest", "🎁", "Hol dir die Belohnung für deinen Auftrag ab", () => zeigeQuestFenster());
  // Glücksrad
  dazu("rad", "🎡", kannDrehen() ? "Dreh dein tägliches Glücksrad" : "Glücksrad gedreht", () => zeigeGluecksrad(), !kannDrehen());
  // Garten
  const g = gartenStand();
  const reif = g.beete.filter(b => b && beetFortschritt(b) >= 1).length, leer = g.beete.filter(b => !b).length;
  if (reif) dazu("ernten", "🧺", `${reif} Beet${reif === 1 ? "" : "e"} ernten`, geh({ fertigkeit: "garten", ziel: "#alleErnten" }));
  else if (leer) dazu("pflanzen", "🌱", `${leer} leere${leer === 1 ? "s Beet" : " Beete"} bepflanzen`, geh(gartenZiel()));
  // Season-Tagesaufgaben von heute
  if (spiel.season) {
    const heute = spiel.season.aufgaben.filter(a => a.art === "tag" && a.tag === tagText());
    const abholbar = abholbereiteAufgaben().length;
    const geschafft = heute.filter(a => a.abgeholt).length;
    if (abholbar) dazu("season", "🎟️", `${abholbar} Season-Aufgabe${abholbar === 1 ? "" : "n"} abholen`, () => zeigeSeite("seiteSeason"));
    else if (heute.length) dazu("season", "🎟️", `Tagesaufgaben: ${geschafft} von ${heute.length} geschafft`, () => zeigeSeite("seiteSeason"), geschafft === heute.length);
  }
  // Haustiere streicheln
  const streicheln = (spiel.haustiere || []).filter(id => tierStufe(id) < PFLEGE.maxStufe && streichelnIn(id) === 0).length;
  if (streicheln) dazu("tiere", "💖", `${streicheln} Haustier${streicheln === 1 ? " möchte" : "e möchten"} gestreichelt werden`, geh({ seite: "seiteIch", ichTab: "tiere", ziel: ".haustierKarte:not(.fehlt)" }));
  // Futternapf leer
  if (freundeFrei() && begleiterTier() && !napfLeckerli()) dazu("napf", "🦴", `${begleiterTier().name} hat Hunger – füll den Futternapf`, geh({ seite: "seiteIch", ichTab: "tiere", ziel: "#napfWaehlen" }));
  // Freigeschaltete Systeme
  if (dorfFrei() && spiel.dorf && !festtag() && !dorfFest().gefeiert)
    dazu("fest", "🎪", festBereit() ? "Das Dorffest kann beginnen – feier mit!" : `Die Wichtel bereiten das ${aktuellesThema().titel}-Fest vor`, geh({ fertigkeit: "dorf", ziel: festBereit() ? "#festFeiern" : ".festSpenden:not([disabled])" }));
  if (dorfFrei() && spiel.dorf && !dorfLagerLeer()) dazu("dorf", "🏘️", "Im Dorflager liegen Sachen für dich", geh({ fertigkeit: "dorf", ziel: "#dorfAbholen" }));
  if (feuerFrei() && !feuerBrennt()) dazu("feuer", "🔥", "Zünde ein großes Lagerfeuer an (mehr Erfahrung!)", geh({ fertigkeit: "feuer", ziel: ".feuerHolz:not([disabled])" }));
  if (jagdFrei() && !spiel.jagd?.auftrag) dazu("jagd", "📋", `${JAGD_JAEGERIN} hat einen neuen Monster-Auftrag`, geh({ seite: "seiteAbenteuer", abenteuerTab: "jagd", ziel: ".jagdHolen:not([disabled])" }));
  if (grabenFrei() && FUNDE.some(f => !imMuseum(f.id) && anzahl(f.id) > 0)) dazu("museum", "🏛️", "Neue Fundstücke fürs Museum", geh({ fertigkeit: "graben", ziel: "#alleSpenden" }));
  return liste;
}

let heuteText = "";
let heuteAuf = (() => { try { return localStorage.getItem("idleMarie-heuteZu") !== "1"; } catch (e) { return true; } })();
function zeichneHeute() {
  const k = $("heuteKarte");
  if (!k || aktuelleSeite !== "seiteFertigkeiten") return;
  const liste = heuteListe();
  const offen = liste.filter(x => !x.erledigt), fertig = liste.filter(x => x.erledigt);
  const zeilen = [...offen.slice(0, 6), ...fertig];
  const html = `<button type="button" class="heuteKopf" id="heuteKopf"><b>📅 Heute für dich</b>
      <small>${offen.length ? `${offen.length} Sache${offen.length === 1 ? "" : "n"} zu tun` : "Alles erledigt! 🎉"}</small><span class="heutePfeil">${heuteAuf ? "▲" : "▼"}</span></button>
    ${heuteAuf ? `<div class="heuteListe">${zeilen.map((x, i) => `<button type="button" class="heuteZeile${x.erledigt ? " erledigt" : ""}" data-nr="${liste.indexOf(x)}">
      <span class="hIcon">${x.erledigt ? "✅" : x.icon}</span><span class="hText">${x.text}</span>${x.erledigt ? "" : `<span class="hPfeil">›</span>`}</button>`).join("")}
      ${offen.length > 6 ? `<small class="heuteMehr">… und ${offen.length - 6} mehr</small>` : ""}</div>` : ""}`;
  if (html === heuteText) return;
  heuteText = html;
  k.innerHTML = html;
  k.querySelector("#heuteKopf").addEventListener("click", () => {
    ton.klick(); heuteAuf = !heuteAuf;
    try { localStorage.setItem("idleMarie-heuteZu", heuteAuf ? "0" : "1"); } catch (e) { /* egal */ }
    heuteText = ""; zeichneHeute();
  });
  for (const b of k.querySelectorAll(".heuteZeile:not(.erledigt)")) b.addEventListener("click", () => {
    ton.klick();
    const x = liste[Number(b.dataset.nr)];
    heuteText = "";
    x.los();
  });
}
function richteHeuteEin() { jedeSekunde(zeichneHeute); }
