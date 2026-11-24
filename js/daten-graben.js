"use strict";
// =====================================================
//  AUSGRABEN & MUSEUM (wie "Archäologie" in Melvor Idle)
//  Frei nach dem 6. geschafften Abenteuer-Pfad. Neue Fertigkeit "Ausgraben".
//  • 6 Ausgrabungsorte (einer pro Gebiet). Jede Grabung = Tätigkeit: immer etwas Krimskrams,
//    mit Glück ein Fundstück: klein / mittel / groß / riesig (immer seltener).
//  • Grabe-Werkzeuge (Sieb, Kelle, Pinsel, Schaufel – je 5 Stufen) machen je eine Größe häufiger.
//  • Museum: jedes Fundstück einmal spenden. Volle Vitrine (alle 8 Funde eines Ortes) = Dauer-Bonus.
//  spiel.museum = { fundId: true } · spiel.grabWerkzeug = { sieb, kelle, pinsel, schaufel }
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "turnen") + 1, 0,
  { id: "graben", name: "Aus­graben", icon: "🦴", art: "sammeln", farbe: "#c9a06a", tun: "gräbt nach Schätzen" });

// Größen: Grund-Chance pro Grabung, Seltenheit (Ziffer am Ende der ID), Wert
const FUND_GROESSEN = [
  { id: "klein",  name: "klein",  chance: 0.05,  selten: 2, wert: 200,   werkzeug: "sieb" },
  { id: "mittel", name: "mittel", chance: 0.015, selten: 3, wert: 800,   werkzeug: "kelle" },
  { id: "gross",  name: "groß",   chance: 0.003, selten: 4, wert: 3000,  werkzeug: "pinsel" },
  { id: "riesig", name: "riesig", chance: 0.0005, selten: 6, wert: 15000, werkzeug: "schaufel" },
];
// Je Ort: 2 Funde pro Größe [Name, Bild]
const GRABUNGEN = [
  { id: "wiese", name: "Spielzeug-Wiese", icon: "🌼", stufe: 1, krams: "Tonscherbe", vitrine: { art: "offline", wert: 1, text: "+1 Std. Offline-Zeit" }, funde: [
    [["Glasmurmel", "🔮"], ["Bunter Knopf", "🎀"]], [["Blech-Kreisel", "🌀"], ["Holzflöte", "🪈"]],
    [["Spieluhr", "🎵"], ["Puppenkrone", "👑"]], [["Uralter Teddy", "🧸"], ["Schaukelpferd", "🐴"]] ] },
  { id: "wald", name: "Fossilien-Wald", icon: "🌲", stufe: 15, krams: "Versteinerter Zapfen", vitrine: { art: "doppelt", wert: 3, fuer: "sammeln", text: "+3 % doppelt bei allem Sammeln" }, funde: [
    [["Farn-Abdruck", "🌿"], ["Ammonit", "🐚"]], [["Dino-Zahn", "🦷"], ["Bernstein-Käfer", "🪲"]],
    [["Dino-Ei", "🥚"], ["Riesenknochen", "🦴"]], [["Dino-Schädel", "🦕"], ["Urzeit-Kralle", "🦴"]] ] },
  { id: "burg", name: "Ritter-Keller", icon: "🏰", stufe: 30, krams: "Rostiger Nagel", vitrine: { art: "treff", wert: 5, text: "+5 % öfter treffen" }, funde: [
    [["Alte Münze", "🪙"], ["Siegelring", "💍"]], [["Burgschlüssel", "🗝️"], ["Wappen-Schild", "🛡️"]],
    [["Ritterhelm", "⛑️"], ["Prunkschwert", "🗡️"]], [["Königskrone", "👑"], ["Goldener Pokal", "🏆"]] ] },
  { id: "feuer", name: "Drachen-Höhle", icon: "🌋", stufe: 45, krams: "Lavabrocken", vitrine: { art: "kraft", wert: 5, text: "+5 % stärkerer Schlag" }, funde: [
    [["Glutperle", "🔥"], ["Drachenschuppe", "🐉"]], [["Drachenzahn", "🦷"], ["Feuerkristall", "💎"]],
    [["Drachenei", "🥚"], ["Feuerfeder", "🪶"]], [["Drachenschädel", "🐲"], ["Vulkan-Herz", "🌋"]] ] },
  { id: "eis", name: "Eiszeit-Gletscher", icon: "❄️", stufe: 60, krams: "Eisbrocken", vitrine: { art: "herzen", wert: 5, text: "+5 % Herzen" }, funde: [
    [["Mammut-Haar", "🧶"], ["Eis-Muschel", "🐚"]], [["Säbelzahn", "🦷"], ["Frostblume", "❄️"]],
    [["Mammut-Stoßzahn", "🦴"], ["Eiszeit-Speer", "🗡️"]], [["Eiskönigs-Zepter", "🪄"], ["Kleines Mammut", "🦣"]] ] },
  { id: "wolken", name: "Sternen-Krater", icon: "☁️", stufe: 75, krams: "Sternensand", vitrine: { art: "xp", wert: 5, text: "+5 % Erfahrung bei allem" }, funde: [
    [["Meteoritenstaub", "✨"], ["Sternsplitter-Stein", "💫"]], [["Himmelskarte", "🗺️"], ["Sternenkompass", "🧭"]],
    [["Mondstein", "🌙"], ["Kometen-Stück", "☄️"]], [["Sternenkrone", "👑"], ["Himmelsharfe", "🎵"]] ] },
];
const GRABE_WERKZEUGE = [
  { id: "sieb",     name: "Sieb",     icon: "🧺", groesse: "klein" },
  { id: "kelle",    name: "Kelle",    icon: "🥄", groesse: "mittel" },
  { id: "pinsel",   name: "Pinsel",   icon: "🖌️", groesse: "gross" },
  { id: "schaufel", name: "Schaufel", icon: "⛏️", groesse: "riesig" },
];
const WERKZEUG_GRAB = { stufen: 5, plusProStufe: 0.2, ab: [1, 20, 40, 60, 80], muenzen: [5000, 25000, 100000, 400000, 1500000] };

const FUNDE = [];   // alle Fundstücke (für Museum und Wiki)
GRABUNGEN.forEach((o, i) => {
  o.nr = i;
  gegenstand(`krams${i}`, o.krams, "emoji", TIER_FARBEN[Math.min(7, i + 2)], 5 + i * 8, { emoji: "🪨" });
  o.funde.forEach((paar, g) => paar.forEach(([name, emoji], k) => {
    const gr = FUND_GROESSEN[g];
    const id = `fund-${o.id}-${"ab"[k]}${"kmgr"[g]}${gr.selten}`;   // letzte Ziffer = Seltenheit
    gegenstand(id, name, "emoji", TIER_FARBEN[Math.min(7, i + 2)], Math.round(gr.wert * (1 + i * 0.6)), { emoji, fund: { ort: o.id, groesse: gr.id } });
    FUNDE.push({ id, ort: o.id, groesse: gr.id, name, emoji });
  }));
  const xpTier = Math.min(7, i + 2);
  taetigkeit({ id: `graben-${i}`, fertigkeit: "graben", name: o.name, stufe: o.stufe, xp: Math.round(XP[xpTier] * 1.2), zeit: 4 + i * 0.3,
    gibt: { [`krams${i}`]: 1 }, grabung: o.id });
});

HAUSTIERE.push({ id: "wuehli", name: "Wühli", tier: "Feldmaus", emoji: "🐭", fertigkeit: "graben", bonus: { art: "doppelt", wert: 0.05 }, text: "+5 % doppelter Krimskrams" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

// ===================== LOGIK =====================
const grabenFrei = () => PFADE.filter(p => (spiel.pfade?.[p.id] || 0) > 0).length >= 6 || (spiel.xp?.graben || 0) > 0;
const grabWerkzeug = id => spiel.grabWerkzeug?.[id] || 0;
function fundChance(groesse) {
  const g = FUND_GROESSEN.find(x => x.id === groesse);
  return g.chance * (1 + WERKZEUG_GRAB.plusProStufe * grabWerkzeug(g.werkzeug));
}
// Nach einer Grabung: mit Glück ein Fundstück (seltenste Größe zuerst würfeln). Rückgabe: Fund-ID oder null
function grabeFund(t) {
  const ort = GRABUNGEN.find(o => o.id === t.grabung);
  for (let g = FUND_GROESSEN.length - 1; g >= 0; g--) {
    if (Math.random() < fundChance(FUND_GROESSEN[g].id) * (1 + (typeof karteFundBonus === "function" ? karteFundBonus(ort.id) : 0))) {
      const kandidaten = FUNDE.filter(f => f.ort === ort.id && f.groesse === FUND_GROESSEN[g].id);
      const f = kandidaten[Math.floor(Math.random() * kandidaten.length)];
      if (!passtInBank(f.id)) return null;
      gibInBank(f.id, 1); zaehle(f.id, 1);
      spiel.statistik.funde = (spiel.statistik.funde || 0) + 1;
      return f.id;
    }
  }
  return null;
}
const imMuseum = id => !!spiel.museum?.[id];
function spende(id) {
  if (!GEGENSTAENDE[id]?.fund || imMuseum(id) || anzahl(id) < 1) return false;
  nimmAusBank(id, 1);
  (spiel.museum = spiel.museum || {})[id] = true;
  return true;
}
const vitrineVoll = o => FUNDE.filter(f => f.ort === o.id).every(f => imMuseum(f.id));
const museumAnzahl = () => FUNDE.filter(f => imMuseum(f.id)).length;
// Boni der vollen Vitrinen: wie beim Spielplatz (je Fertigkeit über sternBonus, allgemein über baumhausBonus)
function museumBonus(art, fid = null) {
  if (!spiel.museum) return 0;
  return GRABUNGEN.filter(o => o.vitrine.art === art && vitrineVoll(o)).reduce((s, o) => {
    if (o.vitrine.fuer) return s + (fertigkeit(fid)?.art === o.vitrine.fuer ? o.vitrine.wert / 100 : 0);
    return ["treff", "kraft", "schutz", "herzen"].includes(art) ? s + o.vitrine.wert / 100 : s;
  }, 0);
}
function museumAllgemein(art) {
  if (!spiel.museum) return 0;
  const summe = GRABUNGEN.filter(o => o.vitrine.art === art && !o.vitrine.fuer && !["treff", "kraft", "schutz", "herzen"].includes(art) && vitrineVoll(o))
    .reduce((s, o) => s + o.vitrine.wert, 0);
  return ["bank", "offline"].includes(art) ? summe : summe / 100;
}
function werkzeugKosten(w) {
  const n = grabWerkzeug(w.id);
  if (n >= WERKZEUG_GRAB.stufen) return null;
  const j = GRABE_WERKZEUGE.indexOf(w);
  return { muenzen: Math.round(WERKZEUG_GRAB.muenzen[n] * (1 + j * 0.5)), sachen: { [`barren${Math.min(7, n + 3)}`]: 20 + n * 10 }, ab: WERKZEUG_GRAB.ab[n] };
}
function kannWerkzeugKaufen(w) {
  const k = werkzeugKosten(w);
  if (!k) return "Schon ganz verbessert";
  if (stufe("graben") < k.ab) return `Ab Ausgraben-Stufe ${k.ab}`;
  if (spiel.muenzen < k.muenzen) return "Zu wenig Münzen";
  for (const [id, n] of Object.entries(k.sachen)) if (anzahl(id) < n) return `Es fehlt: ${GEGENSTAENDE[id].name}`;
  return null;
}
function kaufeGrabWerkzeug(w) {
  if (kannWerkzeugKaufen(w)) return false;
  const k = werkzeugKosten(w);
  spiel.muenzen -= k.muenzen;
  for (const [id, n] of Object.entries(k.sachen)) nimmAusBank(id, n);
  (spiel.grabWerkzeug = spiel.grabWerkzeug || {})[w.id] = grabWerkzeug(w.id) + 1;
  return true;
}
const grabWerkzeugSumme = () => GRABE_WERKZEUGE.reduce((s, w) => s + grabWerkzeug(w.id), 0);
const grabWerkzeugMax = () => GRABE_WERKZEUGE.length * WERKZEUG_GRAB.stufen;

// ----- Erfolge -----
erfolg({ id: "graben-1", icon: "🦴", name: "Kleine Forscherin", text: "Finde dein erstes Fundstück", ziel: 1, muenzen: 5000, wert: () => spiel.statistik.funde || 0 });
erfolg({ id: "museum-vitrine", icon: "🏛️", name: "Erste volle Vitrine", text: "Fülle eine Vitrine im Museum mit allen 8 Funden", ziel: 1, muenzen: 200000, wert: () => (spiel.museum ? GRABUNGEN.filter(vitrineVoll).length : 0) });
erfolg({ id: "museum-alle", icon: "🏛️", name: "Museums-Direktorin", text: "Spende alle Fundstücke ans Museum", ziel: FUNDE.length, muenzen: 5000000, wert: () => (spiel.museum ? museumAnzahl() : 0) });
