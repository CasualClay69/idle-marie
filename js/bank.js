"use strict";
// =====================================================
//  BANK – Unter-Reiter je Art, Seltenheits-Farben, Sortieren und Verkaufen in Massen
//  Die Reihenfolge der Bank ist die Reihenfolge in spiel.bank (Neues kommt hinten dazu).
//  "Sortieren" ordnet einmal nach Art und Seltenheit.
// =====================================================

// ----- Seltenheit (wie in Abenteuer-Rollenspielen) -----
const SELTENHEITEN = [
  { name: "Einfach",    farbe: "#9aa0a6" },
  { name: "Normal",     farbe: "#d8dbe2" },
  { name: "Gut",        farbe: "#4fc27a" },
  { name: "Selten",     farbe: "#4a8fe0" },
  { name: "Episch",     farbe: "#a05be0" },
  { name: "Legendär",   farbe: "#f08a2a" },
  { name: "Mythisch",   farbe: "#e0414f" },
  { name: "Regenbogen", farbe: "#ff7eb6", regenbogen: true },
];
function seltenheit(id) {
  const beuteNr = BEUTE.findIndex(b => b[0] === id);
  let s;
  if (beuteNr >= 0) s = Math.floor(beuteNr / 2) + 1;
  else if (/^pokal\d/.test(id)) s = Number(id.slice(5)) + 2;
  else { const m = id.match(/(\d+)$/); s = m ? Number(m[1]) : 1; }
  return Math.max(0, Math.min(SELTENHEITEN.length - 1, s));
}
function seltenheitStil(id) {
  const s = SELTENHEITEN[seltenheit(id)];
  return `--selten:${s.farbe}`;
}
const seltenKlasse = id => (SELTENHEITEN[seltenheit(id)].regenbogen ? " regenbogen" : "");

// ----- Arten (Unter-Reiter) -----
// muster: Anfang der Gegenstand-ID; die Reihenfolge der Muster ist auch die Sortier-Reihenfolge
const BANK_ARTEN = [
  { id: "holz",       name: "Holz",       icon: "🪵", muster: ["holz", "brett"] },
  { id: "fisch",      name: "Fisch",      icon: "🐟", muster: ["fisch"] },
  { id: "bergbau",    name: "Bergbau",    icon: "⛏️", muster: ["erz", "barren", "stein"] },
  { id: "essen",      name: "Essen",      icon: "🍲", muster: ["essen", "gericht"] },
  { id: "garten",     name: "Garten",     icon: "🌱", muster: ["gemuese", "kraut", "faser", "samen-gemuese", "samen-kraut", "samen-faser"] },
  { id: "basteln",    name: "Basteln",    icon: "🧸", muster: ["schnitz", "stoff", "kuschel"] },
  { id: "ausruestung", name: "Ausrüstung", icon: "⚔️", muster: ["schwert", "bogen", "stab", "helm", "schild", "ruestung", "ring", "kette", "pfeil", "perle"] },
  { id: "traenke",    name: "Tränke",     icon: "🧪", muster: ["trank"] },
  { id: "beute",      name: "Beute",      icon: "💎", muster: [] },   // alles andere
];
function bankArt(id) {
  for (const art of BANK_ARTEN) {
    const i = art.muster.findIndex(m => id.startsWith(m) && /^\d/.test(id.slice(m.length)));
    if (i >= 0) return { art, nr: i };
  }
  return { art: BANK_ARTEN[BANK_ARTEN.length - 1], nr: 0 };
}
const REIHENFOLGE = Object.keys(GEGENSTAENDE);
function sortierSchluessel(id) {
  const { art, nr } = bankArt(id);
  return [BANK_ARTEN.indexOf(art), nr, seltenheit(id), REIHENFOLGE.indexOf(id)];
}
function sortiereBank() {
  const ids = Object.keys(spiel.bank).filter(id => spiel.bank[id] > 0);
  ids.sort((a, b) => {
    const x = sortierSchluessel(a), y = sortierSchluessel(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
  });
  spiel.bank = Object.fromEntries(ids.map(id => [id, spiel.bank[id]]));
}

let bankTab = "alle";
function idsImReiter(tab = bankTab) {
  const ids = Object.keys(spiel.bank).filter(id => spiel.bank[id] > 0 && GEGENSTAENDE[id]);
  return tab === "alle" ? ids : ids.filter(id => bankArt(id).art.id === tab);
}

// ----- Anzeige -----
function zeichneBank() {
  $("bankFaecher").textContent = `${belegteFaecher()} / ${bankFaecher()} Fächer`;
  // Reiter
  const reiter = [{ id: "alle", name: "Alle", icon: "🎒" }, ...BANK_ARTEN];
  $("bankReiter").innerHTML = reiter.map(r => {
    const n = idsImReiter(r.id).length;
    return `<button type="button" data-tab="${r.id}" class="${bankTab === r.id ? "aktiv" : ""}${n ? "" : " leerReiter"}"><span>${r.icon}</span>${r.name}${r.id !== "alle" && n ? `<i>${n}</i>` : ""}</button>`;
  }).join("");
  for (const b of $("bankReiter").querySelectorAll("button")) b.addEventListener("click", () => { ton.klick(); bankTab = b.dataset.tab; zeichneBank(); });

  const ids = idsImReiter();
  const wert = ids.reduce((s, id) => s + anzahl(id) * GEGENSTAENDE[id].wert, 0);
  const ohneEinen = ids.reduce((s, id) => s + (anzahl(id) - 1) * GEGENSTAENDE[id].wert, 0);
  $("bankWert").innerHTML = ids.length
    ? `${bankTab === "alle" ? "Alles zusammen" : "Alles hier"} ist ${muenzeHtml("muenze klein")} <b>${zahl(wert)}</b> Münzen wert. Tippe etwas an, um es zu verkaufen.`
    : (bankTab === "alle" ? "Deine Bank ist noch leer. Sammle etwas!" : "Hier ist noch nichts.");
  $("bankAllesVerkaufen").disabled = !ids.length;
  $("bankAllesAusser1").disabled = ohneEinen <= 0;

  const raster = $("bankRaster");
  raster.textContent = "";
  for (const id of ids) {
    const feld = el("button", "bankFeld selten" + seltenKlasse(id), `${symbolHtml(id)}<span class="bankZahl">${zahl(anzahl(id))}</span>`);
    feld.type = "button";
    feld.style.cssText = seltenheitStil(id);
    feld.title = `${GEGENSTAENDE[id].name} (${SELTENHEITEN[seltenheit(id)].name})`;
    feld.addEventListener("click", () => { ton.klick(); zeigeGegenstand(id); });
    raster.append(feld);
  }
  if (bankTab === "alle") for (let i = ids.length; i < bankFaecher(); i++) raster.append(el("div", "bankFeld leer"));
}

// Viele Sachen auf einmal verkaufen (mit Sicherheitsfrage)
function verkaufeVieles(ausserEinem) {
  const ids = idsImReiter();
  const liste = ids.map(id => [id, anzahl(id) - (ausserEinem ? 1 : 0)]).filter(([, n]) => n > 0);
  const summe = liste.reduce((s, [id, n]) => s + n * GEGENSTAENDE[id].wert, 0);
  if (!liste.length) return;
  const ort = bankTab === "alle" ? "in deiner ganzen Bank" : `bei „${BANK_ARTEN.find(a => a.id === bankTab).name}“`;
  frage(`💰 ${ausserEinem ? "Alles außer 1 verkaufen?" : "Alles verkaufen?"}`,
    `Willst du ${ausserEinem ? "von jeder Sorte alles außer einem Stück" : "wirklich alles"} ${ort} verkaufen?<br>Du bekommst ${muenzeHtml("muenze klein")} <b>${zahl(summe)}</b> Münzen.`,
    "Ja, verkaufen", () => {
      let erloes = 0;
      for (const [id, n] of liste) erloes += verkaufe(id, n);
      ton.muenze();
      melde(`💰 Verkauft: +${zahl(erloes)} Münzen`, "gross");
      speichern(); zeichneKopf(); zeichneBank();
    });
}

// Einfache Ja/Nein-Frage
function frage(titel, text, jaText, beiJa) {
  $("frageTitel").textContent = titel;
  $("frageText").innerHTML = text;
  $("frageJa").textContent = jaText;
  $("frageJa").onclick = () => { $("frageOverlay").hidden = true; beiJa(); };
  $("frageNein").onclick = () => { ton.klick(); $("frageOverlay").hidden = true; };
  $("frageOverlay").hidden = false;
}

function richteBankEin() {
  $("bankSortieren").addEventListener("click", () => { ton.klick(); sortiereBank(); speichern(); melde("🔀 Die Bank ist sortiert – nach Art und Seltenheit."); zeichneBank(); });
  $("bankAllesVerkaufen").addEventListener("click", () => { ton.klick(); verkaufeVieles(false); });
  $("bankAllesAusser1").addEventListener("click", () => { ton.klick(); verkaufeVieles(true); });
}
