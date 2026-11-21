"use strict";
// =====================================================
//  ONLINE – Anzeige: Bestenliste und Code-Einlösen (Seite "Ich"),
//  Nachricht an alle (Fenster) und Lauftext (über dem Logo)
// =====================================================

let listeCache = null, listeZeit = 0, listeTab = "stufe", listeFehler = "";

function textSicher(t) {
  return String(t).replace(/[&<>"']/g, z => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[z]));
}

async function ladeListe(erzwingen = false) {
  if (!erzwingen && listeCache && Date.now() - listeZeit < 30000) return;
  try {
    if (mitglied) await meldeWerte();
    listeCache = await holeListe();
    listeZeit = Date.now();
    listeFehler = "";
  } catch (e) { listeFehler = e.message; }
  if (aktuelleSeite === "seiteIch") zeichneBestenliste();
}

function zeichneBestenliste() {
  const ziel = $("bestenlisteInhalt");
  if (!mitglied) {
    ziel.innerHTML = `<p>Mach mit und vergleiche dich mit Familie und Freunden! 🏅</p>
      <div class="eingabeZeile"><input id="spitzname" type="text" maxlength="16" placeholder="Dein Spitzname" autocomplete="off">
      <button type="button" class="knopf kaufen" id="mitmachen">Mitmachen</button></div>
      <p class="hinweis">🔒 Bitte nur einen Spitznamen – nie den echten Namen. Gespeichert werden nur der Spitzname und deine Spielwerte.</p>
      <p class="fehlerText" id="mitmachenFehler"></p>`;
    $("mitmachen").addEventListener("click", async () => {
      const name = $("spitzname").value.trim();
      if (!name) { $("mitmachenFehler").textContent = "Bitte gib einen Spitznamen ein."; return; }
      $("mitmachen").disabled = true;
      try { await tritBei(name); ton.stufe(); melde(`🏅 Willkommen in der Bestenliste, ${name}!`, "gross"); await ladeListe(true); }
      catch (e) { $("mitmachenFehler").textContent = e.message; $("mitmachen").disabled = false; }
    });
    return;
  }
  const tabs = `<div class="listeTabs"><button type="button" data-tab="stufe" class="${listeTab === "stufe" ? "aktiv" : ""}">🌟 Gesamtstufe</button>
    <button type="button" data-tab="woche" class="${listeTab === "woche" ? "aktiv" : ""}">📅 Diese Woche</button></div>`;
  let liste = "";
  if (listeFehler) liste = `<p class="fehlerText">${textSicher(listeFehler)}</p>`;
  else if (!listeCache) liste = `<p class="hinweis">⏳ Lade …</p>`;
  else {
    const eintraege = [...listeCache];
    if (listeTab === "woche") eintraege.sort((a, b) => b.woche_xp - a.woche_xp);
    liste = `<ol class="bestenliste">${eintraege.map((e, i) => {
      const ich = e.spieler_id === mitglied.spielerId;
      const begleiter = HAUSTIERE.find(h => h.id === e.begleiter);
      const wert = listeTab === "woche" ? `${zahl(e.woche_xp)} EP` : `Stufe ${e.gesamtstufe}`;
      return `<li class="${ich ? "ich" : ""}"><span class="platzNr">${["🥇", "🥈", "🥉"][i] || i + 1}</span>
        <span class="listeFigur">${figurSvg(e.figur)}${begleiter ? `<i>${begleiter.emoji}</i>` : ""}</span>
        <span class="listeName"><b>${textSicher(e.name)}${e.wochen_sieger ? " 👑" : ""}</b>
          <small>⚔️ ${e.kampfstufe} · 💤 ${zahl(e.monster)} · 🐾 ${e.haustiere} · 🏆 ${e.erfolge}</small></span>
        <span class="listeWert">${wert}</span></li>`;
    }).join("")}</ol>`;
  }
  ziel.innerHTML = `${tabs}${liste}
    <p class="hinweis">${listeTab === "woche" ? "📅 Wer sammelt von Montag bis Sonntag die meiste Erfahrung? Die Sieger der letzten Woche tragen eine 👑." : `Du bist dabei als <b>${textSicher(mitglied.name)}</b>.`}</p>
    <div class="listeKnoepfe"><button type="button" class="knopf leise" id="listeNeu">🔄 Neu laden</button>
    <button type="button" class="knopf leise" id="listeAustreten">Austreten</button></div>`;
  for (const b of ziel.querySelectorAll(".listeTabs button")) b.addEventListener("click", () => { ton.klick(); listeTab = b.dataset.tab; zeichneBestenliste(); });
  $("listeNeu").addEventListener("click", () => { ton.klick(); listeCache = null; zeichneBestenliste(); ladeListe(true); });
  $("listeAustreten").addEventListener("click", async () => {
    if (!confirm("Willst du wirklich aus der Bestenliste austreten? Dein Eintrag wird gelöscht.")) return;
    try { await verlasseListe(); melde("👋 Du bist ausgetreten."); } catch (e) { melde(`🙈 ${e.message}`); }
    listeCache = null; zeichneBestenliste();
  });
}

// ----- Code einlösen -----
function richteCodeEin() {
  $("codeLoesen").addEventListener("click", async () => {
    const code = $("codeFeld").value.trim();
    if (!code) return;
    $("codeLoesen").disabled = true;
    try {
      const b = await loeseCode(code);
      ton.stufe();
      $("codeMeldung").className = "okText";
      $("codeMeldung").textContent = `🎁 Juhu! Du bekommst ${b.text}${b.grund ? ` – ${b.grund}` : ""}`;
      $("codeFeld").value = "";
      zeichneKopf();
    } catch (e) {
      ton.nein();
      $("codeMeldung").className = "fehlerText";
      $("codeMeldung").textContent = e.message;
    }
    $("codeLoesen").disabled = false;
  });
}

// ----- Nachricht an alle -----
async function pruefeNachricht() {
  try {
    const n = await rufeOnlineAuf("hole_nachricht");
    if (!n) return;
    let gesehen = "";
    try { gesehen = localStorage.getItem("idleMarie-nachricht") || ""; } catch (e) { /* egal */ }
    if (String(n.id) === gesehen || !$("nachrichtOverlay").hidden) return;
    $("nachrichtText").textContent = n.text;
    $("nachrichtOverlay").hidden = false;
    $("nachrichtOverlay").dataset.id = n.id;
    ton.stufe();
  } catch (e) { /* offline oder nicht eingerichtet */ }
}

// ----- Lauftext über dem Logo -----
let lauftextJetzt = "";
async function pruefeLauftext() {
  let text = "";
  try { text = (await rufeOnlineAuf("hole_lauftext"))?.text || ""; } catch (e) { return; }
  if (text === lauftextJetzt) return;
  lauftextJetzt = text;
  const leiste = $("lauftext");
  leiste.hidden = !text;
  if (!text) return;
  const span = leiste.querySelector("span");
  span.textContent = text;
  // gut lesbar: etwa 60 Pixel pro Sekunde, egal wie lang der Text ist
  requestAnimationFrame(() => {
    const strecke = span.offsetWidth + leiste.offsetWidth;
    span.style.animationDuration = `${Math.max(6, strecke / 60)}s`;
  });
}

function richteOnlineEin() {
  ladeMitglied();
  richteCodeEin();
  $("nachrichtZu").addEventListener("click", () => {
    ton.klick();
    try { localStorage.setItem("idleMarie-nachricht", $("nachrichtOverlay").dataset.id); } catch (e) { /* egal */ }
    $("nachrichtOverlay").hidden = true;
  });
  const regelmaessig = () => { pruefeNachricht(); pruefeLauftext(); };
  setTimeout(regelmaessig, 4500);
  setInterval(regelmaessig, 2 * 60 * 1000);
  setInterval(() => { if (mitglied && !document.hidden) meldeWerte().catch(() => {}); }, ONLINE.meldenAlleSek * 1000);
  setTimeout(() => { if (mitglied) meldeWerte().catch(() => {}); }, 6000);
}
