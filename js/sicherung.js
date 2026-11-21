"use strict";
// =====================================================
//  SPIELSTAND SICHERN & WIEDERHERSTELLEN
//  Als Code (zum Kopieren, z.B. in eine Nachricht an sich selbst) oder als Datei.
//  Code-Aufbau: "IM1:" + Base64 des (wenn möglich gzip-gepackten) Spielstands.
//  "IM1Z:" = gepackt, "IM1:" = ungepackt (ältere Geräte ohne Packer).
// =====================================================

function zuBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function ausBase64(text) {
  const s = atob(text);
  return Uint8Array.from(s, z => z.charCodeAt(0));
}
async function packe(text, richtung) {
  const strom = new Blob([text]).stream().pipeThrough(richtung === "ein" ? new CompressionStream("gzip") : new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(strom).arrayBuffer());
}

async function sicherungsCode() {
  speichern();
  const json = JSON.stringify(spiel);
  if (typeof CompressionStream === "function") {
    try { return "IM1Z:" + zuBase64(await packe(json, "ein")); } catch (e) { /* dann ungepackt */ }
  }
  return "IM1:" + zuBase64(new TextEncoder().encode(json));
}

// Code lesen und prüfen. Rückgabe: Spielstand-Objekt – oder Fehler mit verständlicher Meldung
async function leseSicherung(code) {
  code = String(code || "").replace(/\s+/g, "");
  let json;
  try {
    if (code.startsWith("IM1Z:")) {
      if (typeof DecompressionStream !== "function") throw new Error("alt");
      json = new TextDecoder().decode(await packe(ausBase64(code.slice(5)), "aus"));
    } else if (code.startsWith("IM1:")) {
      json = new TextDecoder().decode(ausBase64(code.slice(4)));
    } else throw new Error("form");
  } catch (e) {
    if (e.message === "alt") throw new Error("Dieses Gerät kann den Code leider nicht lesen. Bitte ein neueres Gerät benutzen.");
    throw new Error("Das ist kein gültiger Hannah-Idle-Code. Bitte ganz und genau einfügen.");
  }
  let stand;
  try { stand = JSON.parse(json); } catch (e) { throw new Error("Der Code ist beschädigt."); }
  if (!stand || typeof stand !== "object" || typeof stand.xp !== "object" || typeof stand.bank !== "object") {
    throw new Error("Der Code ist beschädigt.");
  }
  return stand;
}

function standKurz(stand) {
  const xp = stand.xp || {};
  const gesamt = FERTIGKEITEN.reduce((s, f) => s + stufeAusXp(xp[f.id] || 0), 0);
  const figur = (FIGUREN.find(f => f.id === stand.figur) || FIGUREN[0]).name;
  return `${figur} · Gesamtstufe ${gesamt} · ${zahl(stand.muenzen || 0)} Münzen`;
}

function stelleWiederHer(stand) {
  spiel = Object.assign(neuerSpielstand(), stand);
  spiel.letzteZeit = Date.now();   // keine riesige Offline-Zeit nachholen
  if (spiel.aktiv && !spiel.aktiv.kampf) spiel.aktiv.start = Date.now();
  if (spiel.aktiv?.kampf) spiel.aktiv = null;
  speichern();
  // Bestenlisten-Anmeldung kommt mit dem Spielstand mit
  try {
    if (spiel.mitglied) localStorage.setItem(MITGLIED_SPEICHER, JSON.stringify(spiel.mitglied));
    else localStorage.removeItem(MITGLIED_SPEICHER);
  } catch (e) { /* egal */ }
  location.reload();
}

// ----- Anzeige -----
function richteSicherungEin() {
  $("sicherCode").addEventListener("click", async () => {
    ton.klick();
    const code = await sicherungsCode();
    $("sicherFeld").value = code;
    $("sicherFeld").hidden = false;
    let kopiert = false;
    try { await navigator.clipboard.writeText(code); kopiert = true; } catch (e) { /* nicht erlaubt */ }
    $("sicherHinweis").className = "okText";
    $("sicherHinweis").textContent = kopiert
      ? "✅ Der Code ist kopiert! Füge ihn z.B. in eine Nachricht an dich selbst ein und heb ihn gut auf."
      : "Markiere den Code im Feld und kopiere ihn. Heb ihn gut auf!";
    $("sicherFeld").select();
  });
  $("sicherDatei").addEventListener("click", async () => {
    ton.klick();
    const code = await sicherungsCode();
    const d = new Date();
    const name = `hannah-idle-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.txt`;
    const datei = new File([code], name, { type: "text/plain" });
    // Auf Handys: über "Teilen" speichern (z.B. in Dateien oder als Nachricht); sonst normal herunterladen
    if (navigator.canShare?.({ files: [datei] })) {
      try { await navigator.share({ files: [datei], title: "Hannah Idle – Spielstand" }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(datei);
    a.download = name;
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    $("sicherHinweis").className = "okText";
    $("sicherHinweis").textContent = `✅ Gespeichert als „${name}“.`;
  });

  $("ladenKnopf").addEventListener("click", () => {
    ton.klick();
    $("ladenBereich").hidden = !$("ladenBereich").hidden;
  });
  $("ladenDatei").addEventListener("change", async e => {
    const datei = e.target.files?.[0];
    if (datei) $("ladenFeld").value = (await datei.text()).trim();
    e.target.value = "";
    pruefeWiederherstellung();
  });
  $("ladenFeld").addEventListener("input", () => { $("ladenFehler").textContent = ""; $("ladenFrage").hidden = true; });
  $("ladenPruefen").addEventListener("click", pruefeWiederherstellung);
}

let gelesenerStand = null;
async function pruefeWiederherstellung() {
  $("ladenFehler").textContent = "";
  $("ladenFrage").hidden = true;
  try {
    gelesenerStand = await leseSicherung($("ladenFeld").value);
  } catch (e) {
    ton.nein();
    $("ladenFehler").textContent = e.message;
    return;
  }
  ton.klick();
  $("ladenFrage").hidden = false;
  $("ladenVergleich").innerHTML = `<b>Im Code:</b> ${standKurz(gelesenerStand)}<br><b>Jetzt auf diesem Gerät:</b> ${standKurz(spiel)}`;
  $("ladenJa").onclick = () => stelleWiederHer(gelesenerStand);
}
