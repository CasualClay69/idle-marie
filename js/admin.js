"use strict";
// =====================================================
//  ADMIN-MENÜ – öffnet sich nach 10 Sekunden langem Drücken auf das Logo.
//  Die PIN steht NUR in der Datenbank (verschlüsselt) und wird hier nur für diese Sitzung
//  im Speicher gehalten – nie gespeichert. Jede Admin-Funktion prüft sie neu.
// =====================================================

let adminPin = null;

async function adminAufruf(funktion, parameter = {}) {
  const antwort = await rufeOnlineAuf(funktion, { p_pin: adminPin, ...parameter });
  if (antwort && antwort.fehler) throw new Error(antwort.fehler);
  return antwort;
}

function richteAdminEin() {
  let zeitgeber = null;
  const logo = document.querySelector(".logo");
  const start = () => { clearTimeout(zeitgeber); zeitgeber = setTimeout(zeigeAdminAnmeldung, 10000); };
  const stopp = () => clearTimeout(zeitgeber);
  logo.addEventListener("pointerdown", start);
  for (const ereignis of ["pointerup", "pointerleave", "pointercancel"]) logo.addEventListener(ereignis, stopp);
  logo.addEventListener("contextmenu", e => e.preventDefault());
  $("adminZu").addEventListener("click", () => { ton.klick(); $("adminOverlay").hidden = true; });
}

function zeigeAdminAnmeldung() {
  ton.stufe();
  const inhalt = $("adminInhalt");
  inhalt.innerHTML = `<h2>🔐 Admin</h2><input id="adminPinFeld" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN">
    <button type="button" class="knopf" id="adminAnmelden">Anmelden</button><p class="fehlerText" id="adminFehler"></p>`;
  $("adminOverlay").hidden = false;
  $("adminAnmelden").addEventListener("click", async () => {
    adminPin = $("adminPinFeld").value;
    try { await adminAufruf("admin_anmelden"); zeigeAdminMenue(); }
    catch (e) { adminPin = null; $("adminFehler").textContent = e.message; }
  });
}

async function zeigeAdminMenue() {
  const inhalt = $("adminInhalt");
  inhalt.innerHTML = `<h2>🛠️ Admin-Menü</h2>
    <section class="adminTeil"><h3>📢 Lauftext über dem Logo</h3>
      <input id="adminLauftext" type="text" maxlength="200" placeholder="z.B. Heute gibt es doppelt so viele Erdbeeren!">
      <div class="adminZeile"><button type="button" class="knopf kaufen" id="lauftextSetzen">Zeigen</button><button type="button" class="knopf leise" id="lauftextWeg">Entfernen</button></div></section>
    <section class="adminTeil"><h3>✉️ Nachricht an alle</h3>
      <textarea id="adminNachricht" maxlength="300" rows="3" placeholder="Erscheint einmal als Fenster bei allen"></textarea>
      <div class="adminZeile"><label>Tage <input id="adminTage" type="number" min="1" max="30" value="3"></label>
      <button type="button" class="knopf kaufen" id="nachrichtSenden">Senden</button><button type="button" class="knopf leise" id="nachrichtEnde">Beenden</button></div></section>
    <section class="adminTeil"><h3>🎁 Belohnungs-Code</h3>
      <div class="adminZeile"><select id="codeArt"><option value="muenzen">🪙 Münzen</option><option value="trank">🧪 Glücks-Tränke</option><option value="samen">🌱 Samen (je Pflanze)</option></select>
      <input id="codeMenge" type="number" min="1" value="1000"></div>
      <input id="codeText" type="text" maxlength="80" placeholder="Grund, z.B. Für dein tolles Zeugnis!">
      <button type="button" class="knopf" id="codeErstellen">Code erstellen</button>
      <p id="neuerCode" class="neuerCode"></p><div id="codeListe" class="codeListe"></div></section>
    <section class="adminTeil"><h3>🏅 Bestenliste</h3><div id="adminListe">⏳</div></section>
    <p class="fehlerText" id="adminFehler"></p>`;
  const fehler = e => { $("adminFehler").textContent = e.message; ton.nein(); };
  const ok = text => { $("adminFehler").textContent = ""; melde(text); ton.klick(); };
  $("lauftextSetzen").addEventListener("click", () => adminAufruf("admin_lauftext", { p_text: $("adminLauftext").value }).then(() => { ok("📢 Lauftext ist an"); lauftextJetzt = "-"; pruefeLauftext(); }).catch(fehler));
  $("lauftextWeg").addEventListener("click", () => adminAufruf("admin_lauftext", { p_text: "" }).then(() => { ok("📢 Lauftext entfernt"); pruefeLauftext(); }).catch(fehler));
  $("nachrichtSenden").addEventListener("click", () => adminAufruf("admin_nachricht", { p_text: $("adminNachricht").value, p_tage: Number($("adminTage").value) || 3 }).then(() => ok("✉️ Nachricht gesendet")).catch(fehler));
  $("nachrichtEnde").addEventListener("click", () => adminAufruf("admin_nachricht", { p_text: "", p_tage: 1 }).then(() => ok("✉️ Nachricht beendet")).catch(fehler));
  $("codeErstellen").addEventListener("click", async () => {
    try {
      const r = await adminAufruf("admin_code_erstellen", { p_art: $("codeArt").value, p_menge: Number($("codeMenge").value), p_text: $("codeText").value });
      $("neuerCode").textContent = `${r.code.slice(0, 4)}-${r.code.slice(4)}`;
      ok("🎁 Code erstellt");
      zeigeCodes();
    } catch (e) { fehler(e); }
  });
  zeigeCodes();
  zeigeAdminListe();
}

async function zeigeCodes() {
  try {
    const { codes } = await adminAufruf("admin_codes");
    const art = { muenzen: "🪙", trank: "🧪", samen: "🌱" };
    $("codeListe").innerHTML = codes.map(c => `<div class="${c.eingeloest_am ? "eingeloest" : ""}"><b>${c.code.slice(0, 4)}-${c.code.slice(4)}</b>
      ${art[c.art] || ""} ${zahl(c.menge)} ${textSicher(c.text)}${c.eingeloest_am ? ` · ✓ ${textSicher(c.eingeloest_von || "")}` : ""}</div>`).join("");
  } catch (e) { $("codeListe").textContent = e.message; }
}

async function zeigeAdminListe() {
  try {
    const liste = await holeListe();
    $("adminListe").innerHTML = liste.length ? liste.map(e => `<div class="adminEintrag"><span>${textSicher(e.name)} · Stufe ${e.gesamtstufe}</span>
      <button type="button" data-um="${e.spieler_id}">✏️</button><button type="button" data-weg="${e.spieler_id}">🗑️</button></div>`).join("") : "Noch niemand dabei.";
    for (const b of $("adminListe").querySelectorAll("[data-um]")) b.addEventListener("click", async () => {
      const name = prompt("Neuer Spitzname:");
      if (!name) return;
      try { await adminAufruf("admin_eintrag_umbenennen", { p_spieler_id: b.dataset.um, p_name: name }); zeigeAdminListe(); } catch (e) { $("adminFehler").textContent = e.message; }
    });
    for (const b of $("adminListe").querySelectorAll("[data-weg]")) b.addEventListener("click", () => {
      frage("🗑️ Löschen?", "Diesen Eintrag wirklich löschen?", "Ja, löschen", async () => {
        try { await adminAufruf("admin_eintrag_loeschen", { p_spieler_id: b.dataset.weg }); zeigeAdminListe(); } catch (e) { $("adminFehler").textContent = e.message; }
      });
    });
  } catch (e) { $("adminListe").textContent = e.message; }
}
