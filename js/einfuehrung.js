"use strict";
// =====================================================
//  EINFÜHRUNG beim ersten Start: Leuchtrahmen + Sprechblase, Schritt für Schritt.
//  Ein Schritt ist fertig, wenn "fertig()" stimmt (z.B. die richtige Seite ist offen)
//  oder – wenn es kein "fertig" gibt – nach Tippen auf "Weiter".
//  Gespeichert: spiel.einfuehrung = true (dann kommt sie nicht wieder)
// =====================================================

const EINFUEHRUNG = [
  { ziel: () => document.querySelector('.fertigkeitKarte[data-id="holz"]'),
    text: () => `Hallo! Ich zeige dir kurz, wie alles geht. Tippe auf <b>🌳 Holzsammeln</b>.`,
    fertig: () => aktuelleSeite === "seiteFertigkeit" && offeneFertigkeit === "holz",
    sonst: () => { if (aktuelleSeite !== "seiteFertigkeiten") zeigeSeite("seiteFertigkeiten"); } },
  { ziel: () => document.querySelector('.taetigkeit[data-id="holz-0"]'),
    text: () => `Tippe auf den <b>Busch</b> – dann sammelt ${figurName()} Ästchen.`,
    fertig: () => spiel.aktiv?.id === "holz-0" },
  { ziel: () => $("aktivLeiste"),
    text: () => `Super! 🎉 Hier oben siehst du, was ${figurName()} gerade macht. Es geht <b>von ganz allein</b> immer weiter – sogar wenn das Spiel zu ist!` },
  { ziel: () => document.querySelector('.taetigkeit[data-id="holz-0"] .uebung'),
    text: () => `Das ist die <b>⭐ Übung</b>: Je öfter du etwas machst, desto besser wirst du darin – und bekommst öfter doppelt so viel.` },
  { ziel: () => document.querySelector('#untenNav [data-seite="seiteBank"]'),
    text: () => `Alles, was du sammelst, kommt in die <b>🏦 Bank</b>. Tippe mal drauf!`,
    fertig: () => aktuelleSeite === "seiteBank" },
  { ziel: () => document.querySelector("#bankRaster .bankFeld"),
    text: () => `Hier liegt dein Holz. Tippe etwas an, um es zu <b>verkaufen</b> – dafür gibt es Münzen 🪙.` },
  { ziel: () => document.querySelector('#untenNav [data-seite="seiteLaden"]'),
    text: () => `Mit Münzen kannst du im <b>🛒 Laden</b> einkaufen. Tippe drauf!`,
    fertig: () => aktuelleSeite === "seiteLaden" },
  { ziel: () => document.querySelector(".ladenKarte"),
    text: () => `Eine <b>Axt</b> macht dich beim Holzsammeln schneller. Spar ein bisschen und kauf dir eine!` },
  { ziel: () => document.querySelector('#untenNav [data-seite="seiteAbenteuer"]'),
    text: () => `Bei <b>⚔️ Abenteuer</b> triffst du Monster. Keine Angst – sie werden nur müde und schlafen ein 💤.` },
  { ziel: () => document.querySelector('#untenNav [data-seite="seiteIch"]'),
    text: () => `Unter <b>Ich</b> findest du deine Haustiere 🐾, Erfolge 🏆 und die Bestenliste 🏅.` },
  { ziel: () => null,
    text: () => `Das war's! 💖 Probier alles aus: Angeln, Garten, Kochen, Tränke … Viel Spaß, ${figurName()}!`, ende: true },
];

let einfuehrungSchritt = -1;
let einfuehrungUhr = null;
let einfuehrungGescrollt = false;   // pro Schritt nur einmal zum Ziel scrollen

function starteEinfuehrung() {
  einfuehrungSchritt = 0;
  $("einfuehrung").hidden = false;
  zeigeSeite("seiteFertigkeiten");
  clearInterval(einfuehrungUhr);
  einfuehrungUhr = setInterval(aktualisiereEinfuehrung, 250);
  zeigeEinfuehrungsSchritt();
}

function beendeEinfuehrung() {
  clearInterval(einfuehrungUhr);
  einfuehrungSchritt = -1;
  $("einfuehrung").hidden = true;
  spiel.einfuehrung = true;
  speichern();
}

function zeigeEinfuehrungsSchritt() {
  const s = EINFUEHRUNG[einfuehrungSchritt];
  if (!s) { beendeEinfuehrung(); return; }
  s.sonst?.();
  einfuehrungGescrollt = false;
  $("tippText").innerHTML = s.text();
  $("tippWeiter").hidden = Boolean(s.fertig);
  $("tippWeiter").textContent = s.ende ? "Los geht's! 🚀" : "Weiter ›";
  $("tippUeberspringen").hidden = Boolean(s.ende);
  $("tippZaehler").textContent = s.ende ? "" : `${einfuehrungSchritt + 1} / ${EINFUEHRUNG.length - 1}`;
  aktualisiereEinfuehrung();
}

function naechsterSchritt() {
  ton.klick();
  einfuehrungSchritt++;
  zeigeEinfuehrungsSchritt();
}

// Leuchtrahmen und Sprechblase an das Ziel heften (wandert mit, wenn sich etwas verschiebt)
function aktualisiereEinfuehrung() {
  const s = EINFUEHRUNG[einfuehrungSchritt];
  if (!s) return;
  if (s.fertig?.()) { einfuehrungSchritt++; ton.stufe(); zeigeEinfuehrungsSchritt(); return; }
  const ring = $("tippRing"), blase = $("tippBlase");
  const ziel = s.ziel();
  if (ziel && ziel.offsetParent) {
    if (!einfuehrungGescrollt) { if ($("inhalt").contains(ziel)) ziel.scrollIntoView?.({ block: "nearest" }); einfuehrungGescrollt = true; }
    const r = ziel.getBoundingClientRect(), rand = 6;
    ring.hidden = false;
    Object.assign(ring.style, { left: `${r.left - rand}px`, top: `${r.top - rand}px`, width: `${r.width + rand * 2}px`, height: `${r.height + rand * 2}px` });
    // Blase unter das Ziel – oder darüber, wenn unten kein Platz ist
    const hoehe = blase.offsetHeight;
    const unten = r.bottom + 14 + hoehe < innerHeight - 10;
    blase.style.top = unten ? `${r.bottom + 14}px` : `${Math.max(10, r.top - 14 - hoehe)}px`;
    blase.dataset.pfeil = unten ? "oben" : "unten";
    const mitte = Math.min(innerWidth - 20, Math.max(20, r.left + r.width / 2));
    blase.style.setProperty("--pfeil-x", `${mitte - blase.getBoundingClientRect().left}px`);
  } else {
    ring.hidden = true;
    blase.style.top = `${Math.max(80, innerHeight / 2 - blase.offsetHeight / 2)}px`;
    blase.dataset.pfeil = "";
  }
}

function richteEinfuehrungEin() {
  $("tippWeiter").addEventListener("click", naechsterSchritt);
  $("tippUeberspringen").addEventListener("click", () => { ton.klick(); beendeEinfuehrung(); melde("👍 Du kannst die Einführung unter „Ich“ nochmal ansehen."); });
  $("einfuehrungNochmal").addEventListener("click", () => { ton.klick(); starteEinfuehrung(); });
  addEventListener("resize", aktualisiereEinfuehrung);
}
