"use strict";
// =====================================================
//  MONSTER-AUFTRÄGE – Anzeige (Abenteuer → Reiter "Aufträge") und Einführung
// =====================================================

// Die Jägerin Pia (gezeichnet, im Stil der Figuren)
function jaegerinSvg() {
  return `<svg class="jaegerinBild" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="#e8f6dc"/>
    <path d="M18 100Q20 76 50 74Q80 76 82 100Z" fill="#6fae5a"/><path d="M42 74L50 86L58 74Z" fill="#c98a5a"/>
    <circle cx="50" cy="50" r="22" fill="#ffdcc2"/>
    <path d="M27 50Q26 26 50 26Q74 26 73 50Q66 36 50 36Q34 36 27 50Z" fill="#c97a3a"/>
    <path d="M28 46Q26 66 32 76M72 46Q74 66 68 76" stroke="#c97a3a" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M24 34Q24 16 50 14Q76 16 76 34Z" fill="#5fae6a"/><ellipse cx="50" cy="34" rx="30" ry="5" fill="#4f9a5a"/>
    <path d="M68 30Q80 10 88 8Q82 20 72 32Z" fill="#ff5f8f"/>
    <circle cx="42" cy="52" r="3" fill="#3b2240"/><circle cx="58" cy="52" r="3" fill="#3b2240"/>
    <circle cx="43" cy="51" r="1" fill="#fff"/><circle cx="59" cy="51" r="1" fill="#fff"/>
    <ellipse cx="37" cy="59" rx="3.5" ry="2" fill="#ff9ec4" opacity=".7"/><ellipse cx="63" cy="59" rx="3.5" ry="2" fill="#ff9ec4" opacity=".7"/>
    <path d="M45 61Q50 65 55 61" stroke="#3b2240" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
}

function jagdHtml() {
  if (!jagdFrei()) {
    return `<div class="karte jagdZu">${jaegerinSvg()}<p>Die Wichtel-Jägerin ${JAGD_JAEGERIN} kommt, sobald der <b>Pusteblumen-Riese</b> auf der Blumenwiese einmal eingeschlafen ist.</p></div>`;
  }
  const j = jagd(), a = j.auftrag, L = stufe("jagd");
  let auftrag;
  if (a) {
    const m = MONSTER[a.monster], art = JAGD.arten.find(x => x.id === a.art);
    const proStueck = jagdMuenzenFuer(m, art);
    const kaempftDa = spiel.aktiv?.kampf && spiel.aktiv.monster === m.id;
    auftrag = `<div class="karte jagdAuftrag"><span class="mBild">${monsterSvg(m.aussehen)}</span>
      <div class="jaText"><small>${art.icon} ${art.name}er Auftrag · ${KAMPFARTEN[monsterArt(m)].icon} ${KAMPFARTEN[monsterArt(m)].name}-Monster</small>
        <b>Lass ${a.ziel}× ${m.name} einschlafen</b>
        <div class="balken dick"><div style="width:${(a.stand / a.ziel * 100).toFixed(1)}%"></div></div>
        <small>${a.stand} / ${a.ziel} · 🏅 ${proStueck} je Monster + ${Math.round(JAGD.bonusAmEnde * 100)} % Bonus am Ende</small></div>
      <div class="jaKnoepfe">${kaempftDa ? `<span class="jaLaeuft">⚔️ Du kämpfst gerade dagegen!</span>`
        : `<button type="button" class="knopf" id="jagdZumMonster">⚔️ Zum Monster</button>`}
        <button type="button" class="knopf leise" id="jagdTauschen">🔄 Anderer Auftrag${j.muenzen >= JAGD.tauschenKostet ? ` (🏅 ${JAGD.tauschenKostet})` : " (gratis)"}</button></div></div>`;
  } else {
    auftrag = `<div class="karte jagdWahl"><h3>📋 Neuer Auftrag</h3><p class="hinweis">Wie schwer soll dein nächster Auftrag sein?</p>
      <div class="jagdArten">${JAGD.arten.map(art => `<button type="button" class="jagdHolen" data-art="${art.id}" ${L < art.stufe ? "disabled" : ""}>
        <span>${art.icon}</span><b>${art.name}</b><small>${L < art.stufe ? `🔒 ab Jagd-Stufe ${art.stufe}` : `🏅 ×${art.faktor}`}</small></button>`).join("")}</div></div>`;
  }
  const laden = JAGD_LADEN.map(x => {
    const k = jagdKosten(x), n = jagdLaden(x.id), max = x.preise.length;
    const text = x.kleidung ? x.text : x.text.replace("{w}", (n ? n : 1) * x.wert);
    const knopf = !k ? `<span class="sternVoll">✅ ${x.kleidung ? "gekauft" : "voll"}</span>`
      : L < k.ab ? `<span class="sternSperre">🔒 Jagd ${k.ab}</span>`
      : `<button type="button" class="knopf kaufen jagdKaufen" data-id="${x.id}" ${j.muenzen < k.preis ? "disabled" : ""}>🏅 ${zahl(k.preis)}</button>`;
    return `<div class="jagdWare"><span class="sternIcon">${x.icon}</span><span class="sternText"><b>${x.name}${max > 1 ? ` <small>${n} / ${max}</small>` : ""}</b>
      <small>${n || x.kleidung ? text : `Stufe 1: ${text}`}${n && k && !x.kleidung ? ` · nächste: ${x.text.replace("{w}", (n + 1) * x.wert)}` : ""}</small></span>${knopf}</div>`;
  }).join("");
  return `<div class="karte jagdKopf">${jaegerinSvg()}<div><b>Wichtel-Jägerin ${JAGD_JAEGERIN}</b>
      <p>${a ? "Viel Glück bei deinem Auftrag!" : "Hallo! Ich hab Arbeit für dich – such dir einen Auftrag aus."}</p>
      <div class="jagdMuenzen">🏅 <b>${zahl(j.muenzen)}</b> Jagd-Münzen · Jagd-Stufe <b>${L}</b> · ${zahl(spiel.statistik.jagdAuftraege || 0)} Aufträge geschafft</div></div></div>
    ${auftrag}
    <div class="karte"><h3>🏅 Jagd-Laden</h3>${laden}
      <p class="hinweis">Jagd-Münzen gibt es nur für Monster aus deinem Auftrag. <button type="button" class="linkKnopf" id="jagdEinfuehrung">❔ Einführung nochmal ansehen</button></p></div>`;
}

function verdrahteJagd(seite) {
  for (const b of seite.querySelectorAll(".jagdHolen")) b.addEventListener("click", () => {
    if (!neuerAuftrag(b.dataset.art)) { ton.nein(); return; }
    ton.stufe(); speichern(); zeichneAbenteuer();
  });
  seite.querySelector("#jagdZumMonster")?.addEventListener("click", () => {
    ton.klick();
    starteKampf(jagd().auftrag.monster);
    abenteuerTab = "kampf";
    speichern(); zeichneAktivLeiste(); zeichneAbenteuer(); $("inhalt").scrollTop = 0;
  });
  seite.querySelector("#jagdTauschen")?.addEventListener("click", () => {
    ton.klick();
    frage("🔄 Anderer Auftrag?", `Möchtest du einen anderen Auftrag?${jagd().muenzen >= JAGD.tauschenKostet ? ` Das kostet 🏅 ${JAGD.tauschenKostet} Jagd-Münzen.` : ""}`, "Ja, tauschen", () => {
      tauscheAuftrag(); speichern(); zeichneAbenteuer();
    });
  });
  for (const b of seite.querySelectorAll(".jagdKaufen")) b.addEventListener("click", () => {
    const x = JAGD_LADEN.find(y => y.id === b.dataset.id);
    if (!jagdKaufe(x)) { ton.nein(); return; }
    ton.stufe(); herzchen(b);
    melde(`🏅 ${x.name} gekauft!${x.kleidung ? " Schau in deinen Kleiderschrank." : ""}`, "gross");
    for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
    speichern(); zeichneAbenteuer();
  });
  seite.querySelector("#jagdEinfuehrung")?.addEventListener("click", () => { ton.klick(); zeigeJagdEinfuehrung(); });
}

// ===================== EINFÜHRUNG =====================
const JAGD_EINFUEHRUNG = [
  { titel: "📋 Die Wichtel-Jägerin", bild: () => jaegerinSvg(),
    text: () => `Der Pusteblumen-Riese schläft – das hat die Wichtel-Jägerin <b>${JAGD_JAEGERIN}</b> gesehen! Sie hat ab jetzt <b>Monster-Aufträge</b> für dich. Du findest sie im ⚔️ Abenteuer unter „📋 Aufträge“.` },
  { titel: "⚔️ Ein Auftrag", bild: () => `<div class="seBilder">${monsterSvg(MONSTER.wuschelwolf.aussehen)}</div>`,
    text: () => `Ein Auftrag heißt zum Beispiel: <b>„Lass 30× Wuschelwolf einschlafen“</b>. Such dir aus, ob er leicht, mittel oder schwer sein soll. Mit „⚔️ Zum Monster“ geht es sofort los.` },
  { titel: "🏅 Jagd-Münzen", bild: () => `<div class="seBilder dGrossBilder"><span>🏅</span><span>🏹</span><span>🔮</span></div>`,
    text: () => `Für jedes Monster aus deinem Auftrag gibt es <b>Jagd-Münzen</b> und Jagd-Erfahrung – und am Ende einen Bonus. Im <b>Jagd-Laden</b> kaufst du damit tolle Sachen: einen Köcher, der Pfeile spart, ein Perlen-Täschchen, einen Talisman fürs Kampf-Dreieck und Kleidung.` },
  { titel: "🔥 Schwere Aufträge", bild: () => `<div class="seBilder dGrossBilder"><span>🌱</span><span>⚔️</span><span>🔥</span></div>`,
    text: () => `Je höher deine <b>Jagd-Stufe</b>, desto schwerere Aufträge gibt es – mit mehr Jagd-Münzen. Tipp: Nimm die Waffe, die gegen das Monster stark ist! Und mit Glück findet dich am Ende eines Auftrags der Igel <b>Stups</b>.` },
];
let jagdSeiteNr = 0;
function zeichneJagdEinfuehrung() {
  const s = JAGD_EINFUEHRUNG[jagdSeiteNr], letzte = jagdSeiteNr === JAGD_EINFUEHRUNG.length - 1;
  $("jagdIntroInhalt").innerHTML = `<h2>${s.titel}</h2><div class="seBild">${s.bild()}</div><p>${s.text()}</p>
    <div class="sePunkte">${JAGD_EINFUEHRUNG.map((_, i) => `<i class="${i === jagdSeiteNr ? "an" : ""}"></i>`).join("")}</div>`;
  $("jagdIntroZurueck").hidden = jagdSeiteNr === 0;
  $("jagdIntroWeiter").textContent = letzte ? "📋 Zu den Aufträgen!" : "Weiter ›";
}
function zeigeJagdEinfuehrung() { jagdSeiteNr = 0; zeichneJagdEinfuehrung(); $("jagdIntroOverlay").hidden = false; }
function pruefeJagdEinfuehrung() {
  if (spiel.jagdIntro || !jagdFrei()) return;
  if (document.querySelector(".overlay:not([hidden])") || !$("einfuehrung").hidden) return;
  spiel.jagdIntro = true;
  jagd();
  speichern();
  ton.stufe();
  melde("📋 Neu: Monster-Aufträge bei der Jägerin!", "gross");
  zeigeJagdEinfuehrung();
}
function richteJagdEin() {
  $("jagdIntroWeiter").addEventListener("click", () => {
    ton.klick();
    if (jagdSeiteNr < JAGD_EINFUEHRUNG.length - 1) { jagdSeiteNr++; zeichneJagdEinfuehrung(); return; }
    $("jagdIntroOverlay").hidden = true;
    abenteuerTab = "jagd"; zeigeSeite("seiteAbenteuer");
  });
  $("jagdIntroZurueck").addEventListener("click", () => { ton.klick(); jagdSeiteNr = Math.max(0, jagdSeiteNr - 1); zeichneJagdEinfuehrung(); });
  $("jagdIntroX").addEventListener("click", () => { ton.klick(); $("jagdIntroOverlay").hidden = true; });
  setInterval(pruefeJagdEinfuehrung, 1500);
}
