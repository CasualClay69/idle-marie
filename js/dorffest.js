"use strict";
// =====================================================
//  DORFFESTE – jeden Monat feiert das Wichteldorf ein Fest zum Season-Thema
//  Die Wichtel wünschen sich 3 Sachen (aus der Bank spenden). Ist alles da: "Fest feiern!"
//  -> 24 Stunden Festtag: doppelter Fleiß im Dorf, +20 Glück. Dazu Münzen und Season-Punkte.
//  spiel.dorfFest = { monat, spenden: [n, n, n], gefeiert, festBis }
// =====================================================

const DORFFEST = { stunden: 24, fleiss: 2, glueck: 20, seasonPunkte: 100 };
// Woraus die 3 Wünsche gewürfelt werden (Sorte passt zur Dorf-Stufe)
const FEST_WUENSCHE = [
  { art: "holz",    menge: 60, text: "Holz fürs Festfeuer" },
  { art: "fisch",   menge: 40, text: "Fisch fürs Festessen" },
  { art: "essen",   menge: 25, text: "Gekochtes für das Buffet" },
  { art: "brett",   menge: 30, text: "Bretter für die Bühne" },
  { art: "barren",  menge: 20, text: "Barren für die Laternen" },
  { art: "stoff",   menge: 15, text: "Stoff für die Wimpel" },
  { art: "gemuese", menge: 40, text: "Gemüse für die Suppe" },
  { art: "kraut",   menge: 30, text: "Kräuter für die Blumenkränze" },
];

const festMonat = () => seasonId();
// Die Wünsche dieses Monats (immer gleich für denselben Monat)
function festWuensche() {
  const m = festMonat(), t = Math.min(7, dorfTier());
  let s = Number(m.replace("-", "")) * 7919;
  const zufallZahl = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pool = [...FEST_WUENSCHE];
  const wahl = [];
  while (wahl.length < 3) wahl.push(pool.splice(Math.floor(zufallZahl() * pool.length), 1)[0]);
  return wahl.map(w => ({ ...w, id: `${w.art}${t}`, menge: Math.round(w.menge * (1 + t * 0.5)) }));
}
function dorfFest() {
  if (!spiel.dorfFest || spiel.dorfFest.monat !== festMonat()) spiel.dorfFest = { monat: festMonat(), spenden: [0, 0, 0], gefeiert: false, festBis: spiel.dorfFest?.festBis || 0 };
  return spiel.dorfFest;
}
const festtag = () => (spiel.dorfFest?.festBis || 0) > Date.now();
const festBereit = () => { const f = dorfFest(); return !f.gefeiert && festWuensche().every((w, i) => f.spenden[i] >= w.menge); };
function festSpende(i) {
  const w = festWuensche()[i], f = dorfFest();
  const n = Math.min(anzahl(w.id), w.menge - f.spenden[i]);
  if (n <= 0 || f.gefeiert) return 0;
  nimmAusBank(w.id, n);
  f.spenden[i] += n;
  return n;
}
function festFeiern() {
  if (!festBereit()) return null;
  const f = dorfFest(), t = Math.min(7, dorfTier());
  f.gefeiert = true;
  f.festBis = Date.now() + DORFFEST.stunden * 3600000;
  const muenzen = 3000 * (t + 1) * (t + 1);
  spiel.muenzen += muenzen;
  const neu = gibSeasonPunkte(DORFFEST.seasonPunkte);
  spiel.statistik.dorffeste = (spiel.statistik.dorffeste || 0) + 1;
  return { muenzen, neu };
}

erfolg({ id: "fest-1", icon: "🎪", name: "Erstes Dorffest", text: "Feier ein Fest im Wichteldorf", ziel: 1, muenzen: 5000, wert: () => spiel.statistik.dorffeste || 0 });
erfolg({ id: "fest-12", icon: "🎪", name: "Ein ganzes Festjahr", text: "Feier 12 Dorffeste", ziel: 12, muenzen: 1000000, wert: () => spiel.statistik.dorffeste || 0 });

// ===================== ANZEIGE (oben auf der Dorf-Seite) =====================
function dorfFestHtml() {
  const th = aktuellesThema(), f = dorfFest(), w = festWuensche();
  if (festtag()) {
    const min = Math.ceil((f.festBis - Date.now()) / 60000);
    return `<div class="karte festKarte an" style="--s1:${th.farben[0]};--s2:${th.farben[1]}"><span class="festIcon">${th.icon}</span>
      <div><b>🎉 Festtag im Wichteldorf!</b><small>Die Wichtel feiern ${th.titel}: doppelt so fleißig und +${DORFFEST.glueck} Glück – noch ${min >= 60 ? `${Math.floor(min / 60)} Std. ${min % 60} Min.` : `${min} Min.`}</small></div></div>`;
  }
  if (f.gefeiert) return `<div class="karte festKarte"><span class="festIcon">${th.icon}</span><div><b>${th.titel}-Fest gefeiert ✅</b><small>Nächsten Monat gibt es ein neues Fest!</small></div></div>`;
  const zeilen = w.map((x, i) => {
    const fertig = f.spenden[i] >= x.menge;
    return `<div class="festWunsch${fertig ? " fertig" : ""}">${symbolHtml(x.id, "mini")}<span class="fwText"><b>${x.text}</b>
      <span class="balken duenn"><div style="width:${(Math.min(1, f.spenden[i] / x.menge) * 100).toFixed(1)}%"></div></span>
      <small>${zahl(f.spenden[i])} / ${zahl(x.menge)} ${GEGENSTAENDE[x.id].name} · du hast ${zahl(anzahl(x.id))}</small></span>
      ${fertig ? `<span class="sternVoll">✅</span>` : `<button type="button" class="knopf kaufen festSpenden" data-i="${i}" ${anzahl(x.id) ? "" : "disabled"}>Spenden</button>`}</div>`;
  }).join("");
  return `<div class="karte festKarte" style="--s1:${th.farben[0]};--s2:${th.farben[1]}"><div class="festKopf"><span class="festIcon">${th.icon}</span>
      <div><b>🎪 ${th.titel}-Fest im Wichteldorf</b><small>Die Wichtel wünschen sich drei Sachen für ihr Fest. Bring sie vorbei!</small></div></div>
    ${zeilen}
    ${festBereit() ? `<button type="button" class="knopf" id="festFeiern">🎉 Fest feiern!</button>` : ""}
    <small class="festBelohnung">🎁 Belohnung: ${DORFFEST.stunden} Std. doppelter Fleiß, +${DORFFEST.glueck} Glück, Münzen und ⭐ ${DORFFEST.seasonPunkte} Season-Punkte</small></div>`;
}
function verdrahteDorfFest(ziel) {
  for (const b of ziel.querySelectorAll(".festSpenden")) b.addEventListener("click", () => {
    const n = festSpende(Number(b.dataset.i));
    if (!n) { ton.nein(); return; }
    ton.muenze(); herzchen(b); melde(`🎪 Danke! ${n} Sachen fürs Fest gespendet.`);
    speichern(); zeichneFertigkeit();
  });
  ziel.querySelector("#festFeiern")?.addEventListener("click", () => {
    const r = festFeiern();
    if (!r) return;
    ton.stufe(); melde(`🎉 Das Fest beginnt! +${zahl(r.muenzen)} Münzen und ⭐ ${DORFFEST.seasonPunkte} Season-Punkte`, "gross");
    if (r.neu.length) setTimeout(() => zeigeSeasonStufen(r.neu), 1200);
    for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
    speichern(); zeichneKopf(); zeichneFertigkeit();
  });
}
