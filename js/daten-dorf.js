"use strict";
// =====================================================
//  WICHTELDORF (wie "Ortsverwaltung" in Melvor Idle)
//  Frei nach dem 2. geschafften Abenteuer-Pfad. Läuft NEBENHER in echter Zeit (auch offline):
//  Alle 10 Minuten ist ein "Dorf-Tag": Die Wichtel essen Korn, arbeiten in den Gebäuden und
//  legen, was sie herstellen, ins Dorflager. Von dort holt man es in die Bank.
//  • Bewohner: Wichtelhäuser (je 12). Jedes Arbeits-Gebäude braucht Wichtel.
//  • Gesundheit: sinkt, wenn das Korn nicht reicht – steigt mit genug Essen und Kräuterhütten.
//  • Glück: Spielplätze. Gesundheit und Glück bestimmen, wie fleißig alle sind.
//  • Die Fertigkeit "Dorf" bekommt jeden Dorf-Tag Erfahrung (je mehr fleißige Wichtel, desto mehr).
//  • Höhere Dorf-Stufe = bessere Sachen (Holz, Erz, Fisch, Kräuter in besseren Sorten).
//  spiel.dorf = { gebaeude: { id: Anzahl }, korn, gesundheit, lager: { id: n }, letzterTick, tage }
// =====================================================

FERTIGKEITEN.splice(FERTIGKEITEN.findIndex(f => f.id === "sterne") + 1, 0,
  { id: "dorf", name: "Wichtel­dorf", icon: "🏘️", art: "sammeln", farbe: "#e8a35a", tun: "kümmert sich ums Dorf" });

const DORF = {
  tickMinuten: 10,
  maxNachholTage: 7 * 24 * 6,   // höchstens eine Woche nachholen
  bewohnerProHaus: 12,
  kornProWichtel: 1,
  gesundheitPlus: 5, gesundheitMinus: 10, gesundheitMin: 20,
  xpProWichtel: 2,
  maxJeGebaeude: 12,
  startGebaeude: { haus: 1, hof: 1 },
};

// arbeiter: so viele Wichtel braucht das Gebäude · macht: was es pro Dorf-Tag herstellt
// kosten: Bretter (brett) und Barren (barren) je nach Ausbaustufe; muenzen wachsen mit jedem weiteren Gebäude
const DORF_GEBAEUDE = [
  { id: "haus",    name: "Wichtelhaus",    icon: "🏠", text: "+12 Wichtel wohnen hier",                arbeiter: 0, bretter: 10, barren: 0, muenzen: 150 },
  { id: "hof",     name: "Bauernhof",      icon: "🌾", text: "Baut 15 Korn an – davon essen die Wichtel", arbeiter: 2, bretter: 12, barren: 2, muenzen: 200, korn: 15 },
  { id: "holz",    name: "Holzfäller",     icon: "🪓", text: "Fällt 3 Holz pro Dorf-Tag",              arbeiter: 3, bretter: 15, barren: 4, muenzen: 400, macht: "holz", menge: 3 },
  { id: "mine",    name: "Wichtelmine",    icon: "⛏️", text: "Gräbt 3 Erz pro Dorf-Tag",               arbeiter: 3, bretter: 15, barren: 6, muenzen: 500, macht: "erz", menge: 3 },
  { id: "fischer", name: "Fischerhütte",   icon: "🎣", text: "Angelt 3 Fische pro Dorf-Tag",           arbeiter: 3, bretter: 15, barren: 4, muenzen: 450, macht: "fisch", menge: 3 },
  { id: "kraeuter", name: "Kräuterhütte",  icon: "🌿", text: "Sammelt 1 Kraut und macht die Wichtel gesünder (+3 Gesundheit)", arbeiter: 2, bretter: 12, barren: 3, muenzen: 600, macht: "kraut", menge: 1, gesundheit: 3 },
  { id: "markt",   name: "Marktstand",     icon: "🛒", text: "Verkauft Sachen und bringt Münzen",      arbeiter: 2, bretter: 20, barren: 5, muenzen: 800, muenzenProTag: 25 },
  { id: "spiel",   name: "Spielplatz",     icon: "🎠", text: "+8 Glück für alle Wichtel",               arbeiter: 0, bretter: 25, barren: 5, muenzen: 1000, glueck: 8 },
];

const dorfFrei = () => PFADE.filter(p => (spiel.pfade?.[p.id] || 0) > 0).length >= 2 || (spiel.xp?.dorf || 0) > 0;
function dorf() {
  if (!spiel.dorf) spiel.dorf = { gebaeude: { ...DORF.startGebaeude }, korn: 30, gesundheit: 100, lager: {}, letzterTick: Date.now(), tage: 0 };
  return spiel.dorf;
}
const dorfAnzahl = id => dorf().gebaeude[id] || 0;
const dorfGesamt = () => DORF_GEBAEUDE.reduce((s, g) => s + dorfAnzahl(g.id), 0);
const dorfPlaetze = () => 4 + stufe("dorf");             // so viele Gebäude passen ins Dorf
const dorfTier = () => Math.max(0, STUFEN.filter(s => s <= stufe("dorf")).length - 1);   // Sorte der Sachen
const dorfBewohnerPlatz = () => dorfAnzahl("haus") * DORF.bewohnerProHaus;
const dorfBewohner = () => Math.max(1, Math.round(dorfBewohnerPlatz() * (0.5 + dorf().gesundheit / 200)));
const dorfArbeiterBedarf = () => DORF_GEBAEUDE.reduce((s, g) => s + g.arbeiter * dorfAnzahl(g.id), 0);
const dorfGlueck = () => Math.min(100, DORF_GEBAEUDE.reduce((s, g) => s + (g.glueck || 0) * dorfAnzahl(g.id), 10));
// Wie fleißig: genug Arbeiter? × Gesundheit × (1 + Glück)
function dorfFleiss() {
  const bedarf = dorfArbeiterBedarf();
  const besetzt = bedarf ? Math.min(1, dorfBewohner() / bedarf) : 1;
  return { besetzt, faktor: besetzt * (dorf().gesundheit / 100) * (1 + dorfGlueck() / 100) };
}
// Was ein Gebäude pro Dorf-Tag macht (für Anzeige und Wiki)
function dorfErtragId(g) { return g.macht ? `${g.macht}${dorfTier()}` : null; }

// Ein Dorf-Tag
function dorfTick() {
  const d = dorf();
  const { faktor } = dorfFleiss();
  // Korn anbauen und essen
  d.korn += Math.round(dorfAnzahl("hof") * DORF_GEBAEUDE[1].korn * faktor);
  const hunger = dorfBewohner() * DORF.kornProWichtel;
  const kraeuter = dorfAnzahl("kraeuter") * DORF_GEBAEUDE.find(g => g.id === "kraeuter").gesundheit;
  if (d.korn >= hunger) { d.korn -= hunger; d.gesundheit = Math.min(100, d.gesundheit + DORF.gesundheitPlus + kraeuter); }
  else { d.korn = 0; d.gesundheit = Math.max(DORF.gesundheitMin, d.gesundheit - DORF.gesundheitMinus + kraeuter); }
  d.korn = Math.min(d.korn, 200 + dorfBewohnerPlatz() * 20);   // die Scheune ist nicht unendlich groß
  // Arbeiten
  for (const g of DORF_GEBAEUDE) {
    const n = dorfAnzahl(g.id);
    if (!n) continue;
    if (g.macht) {
      const menge = g.menge * n * faktor;
      const ganz = Math.floor(menge) + (Math.random() < menge % 1 ? 1 : 0);
      if (ganz) { const id = dorfErtragId(g); d.lager[id] = (d.lager[id] || 0) + ganz; }
    }
    if (g.muenzenProTag) d.lager.muenzen = (d.lager.muenzen || 0) + Math.round(g.muenzenProTag * n * (dorfTier() + 1) ** 2 * faktor);
  }
  // Erfahrung
  const xp = Math.round(dorfBewohner() * DORF.xpProWichtel * faktor * trankFaktorXp());
  spiel.xp.dorf = (spiel.xp.dorf || 0) + xp;
  d.tage++;
  return xp;
}
// Alle fälligen Dorf-Tage nachholen (auch für die Zeit, in der das Spiel zu war)
function pruefeDorf() {
  if (!dorfFrei()) return 0;
  const d = dorf(), ms = DORF.tickMinuten * 60000;
  let n = Math.floor((Date.now() - d.letzterTick) / ms);
  if (n <= 0) return 0;
  d.letzterTick += n * ms;
  n = Math.min(n, DORF.maxNachholTage);
  for (let i = 0; i < n; i++) dorfTick();
  return n;
}
const dorfLagerLeer = () => !Object.values(dorf().lager).some(n => n > 0);

// Lager -> Bank (Münzen direkt aufs Konto)
function dorfAbholen() {
  const d = dorf();
  let geholt = 0, voll = false;
  for (const [id, n] of Object.entries(d.lager)) {
    if (!n) continue;
    if (id === "muenzen") { spiel.muenzen += n; geholt += n; d.lager[id] = 0; continue; }
    if (!passtInBank(id)) { voll = true; continue; }
    gibInBank(id, n); zaehle(id, n); geholt += n; d.lager[id] = 0;
  }
  for (const id of Object.keys(d.lager)) if (!d.lager[id]) delete d.lager[id];
  if (geholt) spiel.statistik.dorfAbgeholt = (spiel.statistik.dorfAbgeholt || 0) + 1;
  return { geholt, voll };
}

// Kosten des nächsten Gebäudes dieser Art (null = schon alle gebaut)
function dorfKosten(g) {
  const n = dorfAnzahl(g.id);
  if (n >= DORF.maxJeGebaeude) return null;
  const tier = Math.min(7, Math.floor(n * 2 / 3));
  const sachen = { [`brett${tier}`]: g.bretter + n * 4 };
  if (g.barren) sachen[`barren${tier}`] = g.barren + n * 2;
  return { sachen, muenzen: Math.round(g.muenzen * Math.pow(1.6, n) / 10) * 10, stufe: STUFEN[tier] };
}
function dorfKannBauen(g) {
  const k = dorfKosten(g);
  if (!k) return "Alle gebaut";
  if (stufe("dorf") < k.stufe) return `Ab Dorf-Stufe ${k.stufe}`;
  if (dorfGesamt() >= dorfPlaetze()) return "Kein Bauplatz frei";
  if (spiel.muenzen < k.muenzen) return "Zu wenig Münzen";
  for (const [id, n] of Object.entries(k.sachen)) if (anzahl(id) < n) return `Es fehlt: ${GEGENSTAENDE[id].name}`;
  return null;
}
function dorfBaue(g) {
  if (dorfKannBauen(g)) return false;
  const k = dorfKosten(g);
  spiel.muenzen -= k.muenzen;
  for (const [id, n] of Object.entries(k.sachen)) nimmAusBank(id, n);
  dorf().gebaeude[g.id] = dorfAnzahl(g.id) + 1;
  const xp = Math.round(k.muenzen / 50 + 20);
  spiel.xp.dorf = (spiel.xp.dorf || 0) + xp;
  return xp;
}
const dorfAllesGebaut = () => DORF_GEBAEUDE.reduce((s, g) => s + Math.min(dorfAnzahl(g.id), DORF.maxJeGebaeude), 0);
const dorfAllesMax = () => DORF_GEBAEUDE.length * DORF.maxJeGebaeude;

// ----- Erfolge -----
erfolg({ id: "dorf-1", icon: "🏘️", name: "Dorfgründerin", text: "Bau dein erstes eigenes Gebäude im Wichteldorf", ziel: DORF_GEBAEUDE.reduce((s, g) => s + (DORF.startGebaeude[g.id] || 0), 0) + 1, muenzen: 2000,
  wert: () => (spiel.dorf ? dorfGesamt() : 0) });
erfolg({ id: "dorf-50", icon: "🧚", name: "Großes Dorf", text: "50 Wichtel wohnen in deinem Dorf", ziel: 50, muenzen: 100000, wert: () => (spiel.dorf ? dorfBewohnerPlatz() : 0) });
erfolg({ id: "dorf-alle", icon: "🏰", name: "Wichtelstadt", text: "Bau von jedem Gebäude 12 Stück", ziel: DORF_GEBAEUDE.length * DORF.maxJeGebaeude, muenzen: 5000000,
  wert: () => (spiel.dorf ? dorfAllesGebaut() : 0) });
