"use strict";
// =====================================================
//  DAS FINALE – erscheint einmal, wenn der Regenbogenpfad zum ersten Mal geschafft ist
//  Gemalter Regenbogen, Ende der Geschichte, Abspann, Regenbogen-Krone und Heldinnen-Rahmen.
//  spiel.finale = Zeitpunkt (danach unter Ich → Optionen nochmal ansehbar)
// =====================================================

function finaleSvg() {
  const farben = ["#ff7a7a", "#ffb86b", "#ffd54f", "#8fcf6a", "#7ad7f0", "#b48cff"];
  const bogen = farben.map((f, i) => `<path d="M${30 + i * 7} 130A${90 - i * 7} ${90 - i * 7} 0 0 1 ${210 - i * 7} 130" fill="none" stroke="${f}" stroke-width="7" class="fBogen" style="animation-delay:${i * 0.15}s"/>`).join("");
  return `<svg class="finaleBild" viewBox="0 0 240 150">
    <defs><linearGradient id="fHimmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#ffe9f3"/></linearGradient></defs>
    <rect width="240" height="150" rx="18" fill="url(#fHimmel)"/>
    ${bogen}
    <path d="M60 150L120 58L180 150Z" fill="#c9b8e8"/><path d="M120 58L136 84L128 80L120 88L112 80L104 84Z" fill="#fff"/>
    <path d="M0 150L50 104L96 150Z" fill="#a8e08f"/><path d="M150 150L196 108L240 150Z" fill="#a8e08f"/>
    ${[[24, 30], [214, 24], [190, 60], [44, 70], [120, 22]].map(([x, y]) => `<path d="${sternD(x, y, 5)}" fill="#ffd54f" class="fStern"/>`).join("")}
  </svg>`;
}

function zeigeFinale() {
  const name = figurName();
  $("finaleInhalt").innerHTML = `${finaleSvg()}
    <h2>🌈 Die Farben sind zurück!</h2>
    <p>Der Große Nebeldrache gähnt, kuschelt sich in eine Wolke und schläft ganz tief ein. Der Graue Nebel löst sich auf – und über dem Gipfel leuchtet wieder ein riesiger <b>Regenbogen</b>!</p>
    <p>Von der Blumenwiese bis zum Traumschloss, vom Wichteldorf bis zur Entdecker-Insel: Überall feiern die Wichtel, die Tiere und alle Monster, die sich ausgeschlafen haben. Und alle wissen: Das war <b>${name}</b>, die mutigste Heldin der ganzen Welt.</p>
    <div class="finaleGeschenke"><span>👑 Regenbogen-Krone</span><span>🌈 Heldinnen-Rahmen</span><span>🏆 Erfolg „Heldin des Regenbogens“</span></div>
    <div class="abspann">
      <b>✨ Hannah Idle ✨</b>
      <small>Ein Spiel von Stefan R.</small>
      <small>für Hannah und Marie</small>
      <small>mit Liebe gemalt und gebaut 💖</small>
    </div>
    <p class="hinweis">Das große Abenteuer ist geschafft – aber es gibt noch viel zu tun: Fülle alle Übungs-Töpfe, finde jedes Haustier und erreiche 100 %! 🏁</p>`;
  $("finaleOverlay").hidden = false;
}
function pruefeFinale() {
  if (spiel.finale || !(spiel.pfade?.["p-gipfel"] > 0)) return;
  if (document.querySelector(".overlay:not([hidden])")) return;
  spiel.finale = Date.now();
  gibTeil("hf1"); gibTeil("rf1");
  speichern();
  ton.stufe();
  zeigeFinale();
}
function richteFinaleEin() {
  $("finaleWeiter").addEventListener("click", () => { ton.klick(); $("finaleOverlay").hidden = true; });
  $("finaleX").addEventListener("click", () => { ton.klick(); $("finaleOverlay").hidden = true; });
  $("finaleNochmal").addEventListener("click", () => { ton.klick(); zeigeFinale(); });
  jedeSekunde(() => { pruefeFinale(); $("finaleNochmal").hidden = !spiel.finale; }, 2);
}
