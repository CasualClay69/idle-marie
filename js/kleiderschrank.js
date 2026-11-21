"use strict";
// =====================================================
//  KLEIDERSCHRANK – Logik und Anzeige (auf der Seite "Ich")
//  spiel.aussehen = { hut, kleid, rahmen } · spiel.garderobe = [ids, die man besitzt]
// =====================================================

const alleTeile = () => KLEIDERSCHRANK.flatMap(k => k.teile.map(t => ({ ...t, kategorie: k.id })));
const teilNachId = id => alleTeile().find(t => t.id === id);

function aussehen() {
  if (!spiel.aussehen) spiel.aussehen = { hut: "h0", kleid: "k0", rahmen: "r0" };
  return spiel.aussehen;
}
function besitztTeil(t) { return t.gratis || (spiel.garderobe || []).includes(t.id); }
function gibTeil(id) {
  spiel.garderobe = spiel.garderobe || [];
  if (!spiel.garderobe.includes(id)) spiel.garderobe.push(id);
}
function kaufeTeil(t) {
  if (besitztTeil(t) || !t.preis || spiel.muenzen < t.preis) return false;
  spiel.muenzen -= t.preis;
  gibTeil(t.id);
  return true;
}

// Teile, die es für Aufträge gibt, an den passenden Auftrag hängen
for (const t of KLEIDERSCHRANK.flatMap(k => k.teile).filter(t => t.quest)) {   // die Originale, keine Kopien
  const q = QUESTS.find(q => q.titel.replaceAll("­", "").includes(t.quest));
  if (!q) { console.warn("Kein Auftrag für", t.name); continue; }
  q.belohnung = q.belohnung || {};
  q.belohnung.aussehen = (q.belohnung.aussehen || []).concat(t.id);
  t.questNr = q.nr;
}

// Für die Bestenliste: Figur + Aussehen in einem kurzen Text, z.B. "hannah.12.11.9"
// Nummer = Platz in der Liste (Listen werden nur hinten erweitert; für die alten Teile ist es dieselbe Zahl wie früher)
function aussehenCode() {
  const a = aussehen(), nr = (liste, id) => Math.max(0, liste.findIndex(t => t.id === id));
  return `${spiel.figur || "hannah"}.${nr(HUETE, a.hut)}.${nr(KLEIDUNG, a.kleid)}.${nr(RAHMEN, a.rahmen)}`;
}
function leseAussehenCode(code) {
  const [figur, h, k, r] = String(code || "hannah").split(".");
  if (h === undefined) return { figur, look: {} };
  return { figur, look: { hut: HUETE[Number(h)]?.id, kleid: KLEIDUNG[Number(k)]?.id, rahmen: RAHMEN[Number(r)]?.id } };
}

// ----- Anzeige -----
let schrankTab = "hut";
function zeichneKleiderschrank() {
  const a = aussehen();
  $("figurVorschau").innerHTML = figurSvg(spiel.figur);
  $("schrankTabs").innerHTML = KLEIDERSCHRANK.map(k => `<button type="button" data-tab="${k.id}" class="${schrankTab === k.id ? "aktiv" : ""}">${k.icon} ${k.name}</button>`).join("");
  for (const b of $("schrankTabs").querySelectorAll("button")) b.addEventListener("click", () => { ton.klick(); schrankTab = b.dataset.tab; zeichneKleiderschrank(); });

  const kat = KLEIDERSCHRANK.find(k => k.id === schrankTab);
  $("schrankRaster").innerHTML = kat.teile.map(t => {
    const hat = besitztTeil(t), an = a[kat.id] === t.id;
    let status;
    if (an) status = "✓ Angezogen";
    else if (hat) status = "Anziehen";
    else if (t.preis) status = `${muenzeHtml("muenze klein")} ${zahl(t.preis)}`;
    else if (t.questNr) status = `📜 Auftrag ${t.questNr}`;
    else if (t.naehen) status = `🧵 Nähen ${t.naehen}`;
    else if (t.pfad) status = "🧰 Schatztruhe";
    else status = `🎟️ ${MONATSNAMEN[t.season - 1]}`;
    const vorschau = figurSvg(spiel.figur, { ...a, [kat.id]: t.id });
    return `<button type="button" class="schrankTeil${an ? " an" : ""}${hat ? "" : " zu"}${!hat && t.preis && spiel.muenzen < t.preis ? " teuer" : ""}" data-id="${t.id}">
      <span class="schrankBild">${vorschau}</span><b>${t.name}</b><small>${status}</small></button>`;
  }).join("");
  for (const b of $("schrankRaster").querySelectorAll(".schrankTeil")) b.addEventListener("click", () => {
    const t = kat.teile.find(x => x.id === b.dataset.id);
    if (besitztTeil(t)) {
      ton.klick();
      a[kat.id] = t.id;
    } else if (t.preis) {
      if (!kaufeTeil(t)) { ton.nein(); melde(`🙈 Dafür brauchst du ${zahl(t.preis)} Münzen`); return; }
      ton.stufe();
      a[kat.id] = t.id;
      herzchen(b);
      melde(`🎉 ${t.name} gekauft und angezogen!`, "gross");
    } else if (t.pfad) {
      ton.nein(); melde(`🧰 ${t.name} liegt manchmal in der Schatztruhe vom ${t.pfad}`); return;
    } else if (t.naehen) {
      ton.nein(); melde(`🧵 ${t.name} kannst du selbst nähen – ab Nähen-Stufe ${t.naehen}`); return;
    } else if (t.questNr) {
      ton.nein(); melde(`📜 ${t.name} gibt es als Belohnung für Auftrag ${t.questNr}`); return;
    } else {
      ton.nein(); melde(`🎟️ ${t.name} gibt es in der Season im ${MONATSNAMEN[t.season - 1]}`); return;
    }
    speichern();
    zeichneKopf();
    zeichneAktivLeiste();
    zeichneKleiderschrank();
  });
}
