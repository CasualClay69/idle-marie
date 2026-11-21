"use strict";
// =====================================================
//  ONLINE (Supabase): Bestenliste, Nachricht an alle, Lauftext, Belohnungs-Codes
//  Datenbank-Regeln: supabase/online.sql (nur Tabellen/Funktionen mit Vorsilbe im_)
//  Gespeichert werden nur Spitzname und Spielwerte. Diese Datei fasst das HTML nicht an.
// =====================================================

const ONLINE = {
  // Beides ist öffentlich und darf im Code stehen. Den geheimen "Secret key" NIE hier eintragen!
  url: "https://tpbsqfivdkgkqpktqnlv.supabase.co",
  schluessel: "sb_publishable_Penidm4iDwsdKhpk74WUvg_kpA5A7S-",
  meldenAlleSek: 60,
};
const MITGLIED_SPEICHER = "idleMarie-bestenliste";

let mitglied = null;   // { name, spielerId, geheimnis }

function gueltigesMitglied(d) { return Boolean(d && d.name && d.spielerId && d.geheimnis); }
function ladeMitglied() {
  try {
    const d = JSON.parse(localStorage.getItem(MITGLIED_SPEICHER));
    if (gueltigesMitglied(d)) mitglied = d;
  } catch (e) { /* nichts gespeichert */ }
  if (!mitglied && gueltigesMitglied(spiel.mitglied)) mitglied = { ...spiel.mitglied };
  if (mitglied) speichereMitglied();
}
function speichereMitglied() {
  try {
    if (mitglied) localStorage.setItem(MITGLIED_SPEICHER, JSON.stringify(mitglied));
    else localStorage.removeItem(MITGLIED_SPEICHER);
  } catch (e) { /* egal */ }
  spiel.mitglied = mitglied ? { ...mitglied } : null;
  speichern();
}

function zufallsHex(bytes) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), b => b.toString(16).padStart(2, "0")).join("");
}
function zufallsUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const h = zufallsHex(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// Eine Datenbank-Funktion aufrufen (Vorsilbe im_ wird ergänzt). Wirft verständliche Fehler.
async function rufeOnlineAuf(funktion, parameter = {}) {
  const kopf = { apikey: ONLINE.schluessel, "Content-Type": "application/json" };
  let antwort;
  try {
    antwort = await fetch(`${ONLINE.url}/rest/v1/rpc/im_${funktion}`, { method: "POST", headers: kopf, body: JSON.stringify(parameter) });
  } catch (e) {
    throw new Error("Keine Internetverbindung.");
  }
  if (!antwort.ok) {
    let text = "";
    try { text = (await antwort.json()).message || ""; } catch (e) { /* keine Details */ }
    if (antwort.status === 400 && text) throw new Error(text);
    if (antwort.status === 404) throw new Error("Die Bestenliste ist noch nicht eingerichtet.");
    throw new Error("Die Bestenliste ist gerade nicht erreichbar.");
  }
  const inhalt = await antwort.text();
  return inhalt ? JSON.parse(inhalt) : null;
}

function meineWerte() {
  return {
    p_figur: aussehenCode(),   // Figur + Hut, Kleidung, Rahmen, z.B. "hannah.12.11.9"
    p_begleiter: spiel.begleiter || "",
    p_gesamtstufe: gesamtStufe(),
    p_xp_gesamt: Math.floor(Object.values(spiel.xp).reduce((s, x) => s + x, 0)),
    p_kampfstufe: kampfStufe(),
    p_monster: spiel.statistik.besiegt || 0,
    p_haustiere: (spiel.haustiere || []).length,
    p_erfolge: anzahlErfolge(),
  };
}
async function meldeWerte() {
  if (!mitglied) return;
  await rufeOnlineAuf("melde", { p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis, p_name: mitglied.name, ...meineWerte() });
}

// Mitmachen: Spitzname wählen (erst melden, dann erst speichern – so bleibt nichts Halbes übrig)
async function tritBei(name) {
  const neu = { name: name.trim(), spielerId: mitglied?.spielerId || zufallsUuid(), geheimnis: mitglied?.geheimnis || zufallsHex(24) };
  await rufeOnlineAuf("melde", { p_spieler_id: neu.spielerId, p_geheimnis: neu.geheimnis, p_name: neu.name, ...meineWerte() });
  mitglied = neu;
  speichereMitglied();
}
async function verlasseListe() {
  if (!mitglied) return;
  await rufeOnlineAuf("verlasse", { p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis });
  mitglied = null;
  speichereMitglied();
}
async function holeListe() {
  return (await rufeOnlineAuf("hole_liste")) || [];
}

// ----- Belohnungs-Codes -----
async function loeseCode(code) {
  const b = await rufeOnlineAuf("loese_code", { p_code: code, p_wer: mitglied?.name || figurName() });
  const n = Math.round(b.menge);
  let text;
  if (b.art === "muenzen") {
    spiel.muenzen += n;
    text = `${zahl(n)} Münzen`;
  } else if (b.art === "trank") {
    gibInBank("trank7", n);
    text = `${n} × ${GEGENSTAENDE.trank7.name}`;
  } else {
    // Samen: von jeder Pflanze, die man schon anbauen darf, n Stück
    const frei = PFLANZEN.filter(p => stufe("garten") >= p.stufe);
    for (const p of frei) gibInBank(p.samen, n);
    text = `${n} Samen von ${frei.length} Pflanzen`;
  }
  speichern();
  return { text, grund: b.text };
}
