"use strict";
// =====================================================
//  GUIDE – FEINE STUFEN-SCHRITTE
//  Für jede Fertigkeit eine Leiter aus kleinen Schritten (Stufe 3, 5, 7, 10, 15 … 95, 99),
//  jeweils mit Tipp: welche Tätigkeit / welches Monster / welche Pflanze gerade am meisten bringt,
//  was man dafür braucht und was als Nächstes freigeschaltet wird.
//  route() in wiki.js sortiert die Schritte ein: immer direkt VOR den ersten Auftrag, der diese
//  Stufe braucht. Was kein Auftrag braucht, kommt ins Kapitel „Meister in allem“ (nach Stufe sortiert).
//  IDs: "l:<fertigkeit>:<stufe>" – Stufe 99 behält die alte ID "f:<fertigkeit>:99".
// =====================================================

const GUIDE_LEITER = [3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];
const STIL_FUER = { mut: "⚔️ Mutig", kraft: "💪 Kräftig", schutz: "🛡️ Vorsichtig", fernkampf: "🏹 Schießen", magie: "🪄 Zaubern" };
const ohneTrenner = t => String(t).replaceAll("­", "");

// Woher bekommt man einen Gegenstand? (für „braucht …“)
function guideHerkunft(id) {
  const f = typeof herkunftVon === "function" ? herkunftVon(id) : null;
  if (f) { const fe = fertigkeit(f); return fe ? ` (${fe.icon} ${ohneTrenner(fe.name)})` : ""; }
  if (BEUTE.some(b => b[0] === id)) return " (Beute aus dem ⚔️ Abenteuer)";
  return "";
}
const guideBraucht = t => Object.entries(t.braucht || {}).map(([id, n]) => `${n}× ${GEGENSTAENDE[id]?.name || id}${guideHerkunft(id)}`).join(" und ");

// Die beste normale Tätigkeit einer Fertigkeit bei einer bestimmten Stufe (meiste EP pro Sekunde)
function guideTaetigkeiten(fid) {
  return TAETIGKEITEN.filter(t => t.fertigkeit === fid && !t.kleidung && !t.parcours && !t.karte);
}
function guideBeste(fid, L) {
  const liste = guideTaetigkeiten(fid).filter(t => t.stufe <= L);
  const xps = t => (typeof t.xp === "number" ? t.xp : 0) / (typeof t.zeit === "number" ? t.zeit : 3);
  return liste.sort((a, b) => xps(b) - xps(a))[0] || null;
}
const guideNeu = (fid, von, bis) => guideTaetigkeiten(fid).filter(t => t.stufe > von && t.stufe <= bis).sort((a, b) => a.stufe - b.stufe);

// Tipp-Text und "Zeig mir wo" für einen Leiter-Schritt
function guideLeiterTipp(f, von, bis) {
  const name = ohneTrenner(f.name);
  // --- Kampf ---
  if (f.art === "kampf") {
    if (f.id === "jagd") return { text: `Hol dir bei der Jägerin im ⚔️ Abenteuer → 📋 Aufträge einen Monster-Auftrag und erfüll ihn. Jedes Auftrags-Monster gibt Jagd-Erfahrung – „schwer“ gibt am meisten.`, hilfe: { seite: "seiteAbenteuer", abenteuerTab: "jagd" } };
    const passend = GEBIETE.flatMap(g => g.monster.map(m => ({ m, g }))).filter(x => !x.m.chef && x.m.stufe <= Math.max(1, von + 2)).sort((a, b) => b.m.stufe - a.m.stufe)[0]
      || { m: GEBIETE[0].monster[0], g: GEBIETE[0] };
    const stil = STIL_FUER[f.id];
    const was = f.id === "herzen" ? "Herzen bekommst du bei jedem Kampf ganz von allein dazu – kämpf einfach weiter."
      : f.id === "fernkampf" ? "Leg einen 🏹 Bogen an, wähl Pfeile und den Kampfstil „🏹 Schießen“."
      : f.id === "magie" ? "Leg einen 🪄 Zauberstab an, wähl Zauberperlen und den Kampfstil „🪄 Zaubern“."
      : `Wähl im Abenteuer den Kampfstil „${stil}“ – dann bekommt ${name} die Erfahrung.`;
    return { text: `${was} Gute Gegner gerade: <b>${ohneTrenner(passend.m.name)}</b> (${passend.g.icon} ${passend.g.name}, Stufe ${passend.m.stufe}). Nimm genug Essen mit!`,
      hilfe: { seite: "seiteAbenteuer", ziel: `.monsterKarte[data-monster="${passend.m.id}"]` } };
  }
  // --- Garten: beste Pflanze ---
  if (f.id === "garten") {
    const p = PFLANZEN.filter(x => x.stufe <= von).sort((a, b) => b.xp / b.minuten - a.xp / a.minuten)[0] || PFLANZEN[0];
    const neu = PFLANZEN.filter(x => x.stufe > von && x.stufe <= bis).map(x => `${x.emoji} ${x.name}`);
    return { text: `Halte alle Beete voll und ernte, sobald etwas reif ist. Am meisten Erfahrung gerade: <b>${p.emoji} ${p.name}</b> (Samen im Garten-Laden).${neu.length ? ` Ab den nächsten Stufen neu: ${neu.join(", ")}.` : ""}`,
      hilfe: { fertigkeit: "garten" } };
  }
  // --- Fertigkeiten, die nebenher wachsen ---
  if (f.id === "dorf") return { text: "Das Wichteldorf wächst von allein: Bau mehr Gebäude (vor allem Wichtelhäuser und Höfe), halte die Wichtel gesund und glücklich und hol oft das Dorflager ab.", hilfe: { fertigkeit: "dorf", ziel: ".dorfBauen:not([disabled])" } };
  if (f.id === "turnen") return { text: "Tippe auf „Parcours laufen“. Je mehr Hindernisse stehen, desto mehr Erfahrung gibt jede Runde – bau neue, sobald du kannst.", hilfe: { fertigkeit: "turnen" } };
  if (f.id === "karte") return { text: "Erkunde weiter Felder auf der Insel. Weiter außen gibt es mehr Erfahrung – Aussichtspunkte machen die Felder rundherum schneller.", hilfe: { fertigkeit: "karte", ziel: ".kartenLauf" } };
  // --- normale Tätigkeiten ---
  const t = guideBeste(f.id, von);
  const neu = guideNeu(f.id, von, bis);
  if (!t) return { text: `Mach Tätigkeiten bei ${f.icon} ${name}.`, hilfe: { fertigkeit: f.id } };
  const braucht = guideBraucht(t);
  let text = `Tippe bei ${f.icon} ${name} auf <b>${ohneTrenner(t.name)}</b> – das gibt gerade am meisten Erfahrung.`;
  if (braucht) text += ` Dafür brauchst du ${braucht}.`;
  if (neu.length) text += ` Neu ab Stufe ${neu[0].stufe}: <b>${neu.slice(0, 3).map(x => ohneTrenner(x.name)).join(", ")}</b> – dann wechseln!`;
  return { text, hilfe: { fertigkeit: f.id, ziel: `.taetigkeit[data-id="${t.id}"]` } };
}

// Alle Leiter-Schritte (noch ohne Kapitel)
function guideLeiterSchritte() {
  const schritte = [];
  for (const f of FERTIGKEITEN) {
    let von = f.id === "herzen" ? 10 : 1;
    for (const L of GUIDE_LEITER) {
      if (L <= von) continue;
      const tipp = guideLeiterTipp(f, von, L);
      schritte.push({ id: L === 99 ? `f:${f.id}:99` : `l:${f.id}:${L}`, leiter: { fid: f.id, stufe: L }, icon: f.icon, fertigkeitId: f.id,
        titel: `${ohneTrenner(f.name)} auf Stufe ${L}`, text: tipp.text, ziel: L, wert: () => stufe(f.id), hilfe: tipp.hilfe });
      von = L;
    }
  }
  return schritte;
}

// Welche Stufen braucht ein Auftrag? { fertigkeit: Stufe }
function guideAuftragBraucht(q) {
  const b = {};
  const setze = (fid, L) => { if (fid && L > (b[fid] || 0)) b[fid] = L; };
  if (q.fertigkeitId && typeof q.ziel === "number" && q.ziel <= 99) setze(q.fertigkeitId, q.ziel);
  const sym = q.symbol && GEGENSTAENDE[q.symbol];
  if (sym?.braucht) for (const [fid, L] of Object.entries(sym.braucht)) setze(fid, L);
  const m = /data-id="([^"]+)"/.exec(q.hilfe?.ziel || "");
  const t = m && TAETIGKEITEN.find(x => x.id === m[1]);
  if (t) setze(t.fertigkeit, t.stufe);
  return b;
}
