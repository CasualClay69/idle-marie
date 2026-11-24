"use strict";
// =====================================================
//  TIER-FREUNDE – Anzeige: Futternapf (Ich → Tiere), Leckerli wählen, Einführung
// =====================================================

function zeichneFutternapf() {
  const ziel = $("futternapf");
  if (!ziel) return;
  if (!freundeFrei()) { ziel.innerHTML = ""; return; }
  const tier = begleiterTier(), g = napfLeckerli(), aktiv = begleiterAktiv();
  const vorrat = spiel.napf && GEGENSTAENDE[spiel.napf] ? anzahl(spiel.napf) : 0;
  let text;
  if (!tier) text = `<b>🦴 Futternapf</b><small>Wähl zuerst ein Haustier als Begleiter (Tier antippen → „Begleiter“). Dann kannst du es mit Leckerli füttern.</small>`;
  else if (aktiv) {
    const bonusPlus = Math.round(begleiterVerstaerkung(tier.id) * 100), stups = Math.round(stupsAnteil() * 100);
    text = `<b>${tier.name} hilft dir mit! <span class="an">● aktiv</span></b>
      <small>Bonus ${bonusPlus} % stärker · stupst im Kampf mit (${stups} % von deinem Schlag)</small>
      <small>${symbolHtml(g.id, "mini")} ${g.name}: noch ${zahl(vorrat)} · alle ${FREUNDE.aktionenProLeckerli} Aktionen eins</small>`;
  } else {
    text = `<b>${tier.name} hat Hunger</b><small>Leg Leckerli in den Napf – dann hilft ${tier.name} dir richtig mit! Leckerli backst du bei 🐾 Tierfreundschaft.</small>`;
  }
  ziel.innerHTML = `<div class="napfKarte${aktiv ? " aktiv" : ""}"><span class="napfTier">${tier ? tier.emoji : "🐾"}</span>
    <div class="napfText">${text}</div>
    ${tier ? `<button type="button" class="knopf kaufen" id="napfWaehlen">🦴 ${aktiv ? "Ändern" : "Füllen"}</button>` : ""}</div>`;
  ziel.querySelector("#napfWaehlen")?.addEventListener("click", () => { ton.klick(); zeigeNapfWahl(); });
}

function zeigeNapfWahl() {
  const ids = LECKERLI.map((_, i) => `leckerli${i}`).filter(id => anzahl(id) > 0);
  let html = `<h2>🦴 Futternapf</h2>`;
  if (!ids.length) html += `<p class="hinweis">Du hast noch keine Leckerli. Back welche bei 🐾 Tierfreundschaft aus Fisch!</p>`;
  html += `<div class="wahlListe">${ids.map(id => {
    const g = GEGENSTAENDE[id], ok = stufe("freunde") >= g.braucht.freunde;
    return `<button type="button" class="wahlZeile${ok ? "" : " gesperrt"}${spiel.napf === id ? " aktiv" : ""}" data-id="${id}" ${ok ? "" : "disabled"}>${symbolHtml(id)}
      <span><b>${g.name}</b><small>Bonus +${Math.round((FREUNDE.bonusBasis + FREUNDE.bonusProSorte * g.leckerli) * 100)} % · ×${zahl(anzahl(id))}${ok ? "" : ` · 🔒 Tierfreundschaft ${g.braucht.freunde}`}</small></span></button>`;
  }).join("")}</div>`;
  if (spiel.napf) html += `<button type="button" class="knopf leise" id="napfLeeren">Napf leeren</button>`;
  $("wahlInhalt").innerHTML = html;
  for (const b of $("wahlInhalt").querySelectorAll(".wahlZeile")) b.addEventListener("click", () => {
    ton.klick(); spiel.napf = b.dataset.id; spiel.napfZaehler = 0; nachWahl();
    melde(`🐾 ${begleiterTier()?.name || "Dein Begleiter"} freut sich über ${GEGENSTAENDE[spiel.napf].name}!`);
  });
  $("wahlInhalt").querySelector("#napfLeeren")?.addEventListener("click", () => { ton.klick(); spiel.napf = null; nachWahl(); });
  $("wahlOverlay").hidden = false;
}

// ===================== EINFÜHRUNG =====================
const FREUNDE_EINFUEHRUNG = [
  { titel: "🐾 Tierfreundschaft", bild: () => `<div class="seBilder dGrossBilder"><span>${begleiterTier()?.emoji || "🐶"}</span><span>💖</span></div>`,
    text: () => `Der Pusteblumen-Riese schläft! Deine Haustiere haben gesehen, wie mutig du bist – jetzt wollen sie dir helfen. Ab heute gibt es die <b>Tierfreundschaft</b>.` },
  { titel: "🦴 Leckerli backen", bild: () => `<div class="seBilder">${symbolHtml("fisch0")}${symbolHtml("leckerli0")}</div>`,
    text: () => `Bei 🐾 Tierfreundschaft backst du aus Fisch <b>Leckerli</b> – aus 2 Fischen werden 5 Leckerli. Bessere Sorten gibt es ab Stufe ${STUFEN.slice(1).join(", ")}.` },
  { titel: "🥣 Der Futternapf", bild: () => `<div class="seBilder dGrossBilder"><span>🥣</span><span>${begleiterTier()?.emoji || "🐶"}</span></div>`,
    text: () => `Unter 👤 Ich → 🐾 Tiere steht der <b>Futternapf</b>. Leg Leckerli hinein – dann ist dein Begleiter <b>aktiv</b>: Sein Bonus wird viel stärker, und im Kampf stupst er die Monster mit an!` },
  { titel: "💖 Gute Freunde", bild: () => `<div class="seBilder dGrossBilder"><span>⭐</span><span>🐾</span><span>⭐</span></div>`,
    text: () => `Alle ${FREUNDE.aktionenProLeckerli} Aktionen frisst dein Begleiter ein Leckerli – dafür bekommst du Erfahrung. Je besser die Leckerli und je höher die Pflege-Stufe deines Tieres, desto mehr hilft es dir. Viel Spaß mit deinem Freund!` },
];
let freundeSeiteNr = 0;
function zeichneFreundeEinfuehrung() {
  const s = FREUNDE_EINFUEHRUNG[freundeSeiteNr], letzte = freundeSeiteNr === FREUNDE_EINFUEHRUNG.length - 1;
  $("freundeIntroInhalt").innerHTML = `<h2>${s.titel}</h2><div class="seBild">${s.bild()}</div><p>${s.text()}</p>
    <div class="sePunkte">${FREUNDE_EINFUEHRUNG.map((_, i) => `<i class="${i === freundeSeiteNr ? "an" : ""}"></i>`).join("")}</div>`;
  $("freundeIntroZurueck").hidden = freundeSeiteNr === 0;
  $("freundeIntroWeiter").textContent = letzte ? "🐾 Leckerli backen!" : "Weiter ›";
}
function zeigeFreundeEinfuehrung() { freundeSeiteNr = 0; zeichneFreundeEinfuehrung(); $("freundeIntroOverlay").hidden = false; }
function pruefeFreundeEinfuehrung() {
  if (spiel.freundeIntro || !freundeFrei()) return;
  if (document.querySelector(".overlay:not([hidden])") || !$("einfuehrung").hidden) return;
  spiel.freundeIntro = true;
  speichern();
  ton.stufe();
  melde("🐾 Neue Fertigkeit: Tierfreundschaft!", "gross");
  zeigeFreundeEinfuehrung();
}
function richteFreundeEin() {
  $("freundeIntroWeiter").addEventListener("click", () => {
    ton.klick();
    if (freundeSeiteNr < FREUNDE_EINFUEHRUNG.length - 1) { freundeSeiteNr++; zeichneFreundeEinfuehrung(); return; }
    $("freundeIntroOverlay").hidden = true;
    offeneFertigkeit = "freunde"; zeigeSeite("seiteFertigkeit");
  });
  $("freundeIntroZurueck").addEventListener("click", () => { ton.klick(); freundeSeiteNr = Math.max(0, freundeSeiteNr - 1); zeichneFreundeEinfuehrung(); });
  $("freundeIntroX").addEventListener("click", () => { ton.klick(); $("freundeIntroOverlay").hidden = true; });
  jedeSekunde(pruefeFreundeEinfuehrung, 2);
}
