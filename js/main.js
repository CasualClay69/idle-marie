"use strict";
// =====================================================
//  START & STEUERUNG: Spielschleife, Knöpfe, Speichern, Update-Fenster
// =====================================================

// Tippen auf eine Tätigkeit: starten, oder anhalten, wenn sie schon läuft
function tippeTaetigkeit(t) {
  if (spiel.aktiv?.id === t.id) {
    stoppe(); ton.klick(); melde(`⏸️ ${t.name} angehalten`);
  } else {
    const grund = hindernis(t);
    if (grund) { ton.nein(); melde(`🙈 ${grund}`); return; }
    starte(t); ruheAus(); ton.klick();
  }
  speichern();
  zeichneAktivLeiste();
  zeichneSeite();
}

// Ergebnisse eines Ticks anzeigen (Meldungen, Stufen, Neuzeichnen)
function verarbeite(ergebnis) {
  if (!ergebnis.durchgaenge && !ergebnis.gestoppt) return;
  for (const e of ergebnis.ereignisse) {
    if (e.haustier) zeigeHaustierFund(e.haustier);
    if (e.seasonStufen) { zeigeSeasonStufen(e.seasonStufen); continue; }
    if (e.truhe) { zeigeTruhe(e.truhe); continue; }
    if (e.jagdFertig) { ton.stufe(); melde(`📋 Auftrag geschafft! +${zahl(e.jagdFertig.bonus)} 🏅 Bonus – hol dir bei ${JAGD_JAEGERIN} einen neuen.`, "gross"); continue; }
    if (!e.taetigkeit && !e.pokal && !e.kampfStufe) continue;
    if (e.pokal) { ton.stufe(); melde(`🏆 Wow! ${GEGENSTAENDE[e.pokal].name} gefunden!`, "gross"); continue; }
    if (e.kampfStufe) { const f = fertigkeit(e.kampfStufe); ton.stufe(); melde(`🎉 ${f.icon} ${f.name}: Stufe ${e.neueStufe}!`, "gross"); continue; }
    const f = fertigkeit(e.taetigkeit.fertigkeit);
    if (e.neueStufe) {
      ton.stufe();
      melde(`🎉 ${f.icon} ${f.name}: Stufe ${e.neueStufe}!`, "gross");
      const neu = taetigkeitenVon(f.id).filter(t => t.stufe === e.neueStufe);
      for (const t of neu) melde(`🔓 Neu freigeschaltet: ${t.name}`, "gross");
    }
    if (e.neueUebung && e.neueUebung % 10 === 0) melde(`⭐ Übung ${e.neueUebung}: ${e.taetigkeit.name}`);
    if (e.karte) { const fa = FELD_ARTEN[e.karte.art]; ton.stufe(); melde(`🗺️ Entdeckt: ${fa.name}! ${e.karte.text}`, "gross"); if (e.karte.haustier) zeigeHaustierFund(e.karte.haustier); }
    if (e.fund) { const g = GEGENSTAENDE[e.fund]; ton.stufe(); melde(`🦴 Fundstück! ${g.name} (${SELTENHEITEN[seltenheit(e.fund)].name})${imMuseum(e.fund) ? "" : " – ab ins Museum!"}`, "gross"); }
    if (e.goldsplitter) { ton.muenze(); melde("🌟 Ein Goldsplitter funkelt am Himmel!", "gross"); }
    if (e.edelstein) { ton.muenze(); melde(`💎 Ein ${GEGENSTAENDE[e.edelstein].name} gefunden!`); }
    if (e.kleidung) { const k = teilNachId(e.kleidung); ton.stufe(); melde(`🧵 ${k.icon} ${k.name} ist fertig genäht!`, "gross"); }
    if (e.doppelt) {   // kein Text (käme sonst ständig) – die Leiste blitzt golden
      const l = $("aktivLeiste");
      l.classList.remove("doppelt"); void l.offsetWidth; l.classList.add("doppelt");
    }
  }
  if (ergebnis.durchgaenge) ton.fertig();
  for (const name of spiel.traenkeLeer || []) melde(`🧪 ${name} wirkt nicht mehr`);
  spiel.traenkeLeer = [];
  if (ergebnis.durchgaenge) zeichneTrankLeiste();
  if (ergebnis.bankVoll) melde("🏦 Die Bank ist voll – manche Beute blieb liegen");
  if (ergebnis.gestoppt) { ton.nein(); melde(`⏸️ ${ergebnis.gestoppt}`); }
  zeichneKopf();
  zeichneAktivLeiste();
  zeichneSeite();
}

// Schatztruhe: Meldung + bei besonderen Funden ein großes Fenster
function zeigeTruhe(t) {
  ton.stufe();
  melde(`🧰 Schatztruhe vom ${t.pfad.name}: +${zahl(t.muenzen)} Münzen und Beute!`, "gross");
  if (t.rahmen) { const r = teilNachId(t.rahmen); melde(`🖼️ In der Truhe lag der ${r.name}! Schau im Kleiderschrank.`, "gross"); }
  if (t.haustier) zeigeHaustierFund(t.haustier);
}

// ----- Sekunden-Aufgaben -----
// Statt vieler eigener Zeitgeber: alles, was regelmäßig geprüft werden muss, hängt sich hier an.
// Läuft im Sekundentakt der Spielschleife – also nur, solange das Spiel sichtbar ist (schont den Akku).
// Was die Zeit braucht (Dorf, Garten, Lagerfeuer …), rechnet beim Zurückkommen selbst nach.
const sekundenAufgaben = [];
let sekundenZaehler = 0;
function jedeSekunde(fn, alleSekunden = 1) { sekundenAufgaben.push({ fn, alle: alleSekunden }); }
function sekundenTakt() {
  sekundenZaehler++;
  for (const a of sekundenAufgaben) {
    if (sekundenZaehler % a.alle) continue;
    try { a.fn(); } catch (e) { console.error("Fehler in einer Sekunden-Aufgabe:", e); }
  }
}

// ----- Spielschleife -----
let letzteGartenPruefung = 0;
let letzterSeasonStand = "";
function schleife() {
  try { schleifenSchritt(); } catch (e) { console.error("Fehler in der Spielschleife:", e); }
  requestAnimationFrame(schleife);   // immer weiter – auch wenn beim Zeichnen etwas schiefgeht
}
function schleifenSchritt() {
  // Sicherheitsnetz: War die App länger weg, ohne dass das Zurückkommen gemeldet wurde?
  if (!document.hidden && spiel.schnappschuss && Date.now() - spiel.schnappschuss.zeit > 60000) {
    holeOfflineNach();
    pruefeRueckkehr();
    zeichneKopf(); zeichneAktivLeiste(); zeichneSeite();
  }
  verarbeite(tick());
  if (Date.now() - letzteGartenPruefung > 1000) {
    letzteGartenPruefung = Date.now();
    sekundenTakt();
    pruefeQuest();
    if (!document.hidden) merkeSchnappschuss();
    if (pruefeSeasonWechsel()) { speichern(); melde(`🎟️ Neue Season-Aufgaben sind da!`); }
    if (aktuelleSeite === "seiteFertigkeiten") { zeichneSeasonBanner(); zeichneGluecksKarte(); }
    if (aktuelleSeite === "seiteSeason") {
      const stand = spiel.season.aufgaben.map(a => aufgabeStand(a).wert).join();
      if (stand !== letzterSeasonStand) { letzterSeasonStand = stand; zeichneSeason(); }
    }
    const erfolge = pruefeErfolge();
    for (const e of erfolge) { ton.stufe(); melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross"); }
    if (erfolge.length) { speichern(); zeichneKopf(); if (aktuelleSeite === "seiteIch") zeichneSeite(); }
    const reif = neuReifeBeete();
    if (reif.length) {
      ton.muenze();
      melde(`🌱 ${reif.map(p => p.name).join(", ")} ${reif.length === 1 ? "ist" : "sind"} reif!`, "gross");
      if (aktuelleSeite === "seiteFertigkeiten") zeichneSeite();
      speichern();
    }
  }
  zeichneAktivBalken();
}

// ----- Knöpfe -----
function richteKnoepfeEin() {
  for (const b of document.querySelectorAll("#untenNav button")) {
    b.addEventListener("click", () => { ton.klick(); if (b.dataset.seite === "seiteBank") bankTab = "alle"; zeigeSeite(b.dataset.seite); });
  }
  $("zurueck").addEventListener("click", () => { ton.klick(); zeigeSeite("seiteFertigkeiten"); });
  $("aktivStopp").addEventListener("click", () => {
    if (!spiel.aktiv) return;
    stoppe(); ruheAus(); ton.klick(); speichern(); zeichneAktivLeiste(); zeichneSeite();
  });
  $("haustierZu").addEventListener("click", () => { ton.klick(); zeigeNaechstesHaustier(); zeichneKopf(); if (aktuelleSeite === "seiteIch") zeichneSeite(); });
  $("begleiterKopf").addEventListener("click", () => { ton.klick(); if (spiel.begleiter) zeigeTierFenster(spiel.begleiter); });
  $("tierZu").addEventListener("click", () => { ton.klick(); $("tierOverlay").hidden = true; });
  $("tierOverlay").addEventListener("click", e => { if (e.target.id === "tierOverlay") $("tierOverlay").hidden = true; });
  $("wahlZu").addEventListener("click", () => { ton.klick(); $("wahlOverlay").hidden = true; });
  $("wahlOverlay").addEventListener("click", e => { if (e.target.id === "wahlOverlay") $("wahlOverlay").hidden = true; });
  $("aktivLeiste").addEventListener("click", e => {
    if (e.target.closest("#aktivStopp") || !spiel.aktiv) return;
    if (spiel.aktiv.kampf) { abenteuerTab = "kampf"; zeigeSeite("seiteAbenteuer"); return; }
    offeneFertigkeit = taetigkeitNachId(spiel.aktiv.id).fertigkeit;
    zeigeSeite("seiteFertigkeit");
  });
  $("figurKnopf").addEventListener("click", () => { ton.klick(); ichTab = "figur"; zeigeSeite("seiteIch"); });
  for (const b of document.querySelectorAll("#ichReiter button")) b.addEventListener("click", () => { ton.klick(); zeigeIchTab(b.dataset.teil); $("inhalt").scrollTop = 0; });
  $("offlineZu").addEventListener("click", () => { ton.klick(); $("offlineOverlay").hidden = true; });
  $("gegenstandZu").addEventListener("click", () => { ton.klick(); $("gegenstandOverlay").hidden = true; });
  $("gegenstandOverlay").addEventListener("click", e => { if (e.target.id === "gegenstandOverlay") $("gegenstandOverlay").hidden = true; });
  $("tonAn").addEventListener("change", e => { ton.an = e.target.checked; ton.speichern(); ton.klick(); });
  $("loeschen").addEventListener("click", () => { ton.klick(); $("loeschenOverlay").hidden = false; });
  $("loeschenNein").addEventListener("click", () => { ton.klick(); $("loeschenOverlay").hidden = true; });
  $("loeschenJa").addEventListener("click", () => {
    try { localStorage.removeItem(SPEICHER_SCHLUESSEL); } catch (e) { /* egal */ }
    spiel = neuerSpielstand();
    location.reload();
  });
}

function fragFigur() {
  zeichneFigurAuswahl($("figurAuswahlStart"), id => {
    ton.klick();
    spiel.figur = id;
    speichern();
    $("figurOverlay").hidden = true;
    zeichneKopf(); zeichneAktivLeiste(); zeichneSeite();
    melde(`💖 Hallo ${figurName()}!`, "gross");
    if (!spiel.einfuehrung) setTimeout(starteEinfuehrung, 600);
  });
  $("figurOverlay").hidden = false;
}

// ----- Versionen & Update -----
function istNeuereVersion(a, b) {
  const x = a.split(".").map(Number), y = b.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
}
let updateSpaeter = false;
async function pruefeAufUpdate() {
  if (updateSpaeter || !location.protocol.startsWith("http") || !$("updateOverlay").hidden) return;
  try {
    const antwort = await fetch(`js/version.js?frisch=${Date.now()}`, { cache: "no-store" });
    if (!antwort.ok) return;
    const text = await antwort.text();
    const version = (text.match(/APP_VERSION\s*=\s*"([^"]+)"/) || [])[1];
    const neu = (text.match(/APP_NEU\s*=\s*"([^"]*)"/) || [])[1] || "";
    if (version && istNeuereVersion(version, APP_VERSION)) {
      $("updateVersionen").textContent = `Du spielst Version ${APP_VERSION} – neu ist Version ${version}.`;
      $("updateNeu").textContent = neu ? `🆕 ${neu}` : "";
      $("updateOverlay").hidden = false;
    }
  } catch (e) { /* offline -> später nochmal */ }
}
// Alle Dateien frisch holen, nur die eigenen Caches löschen, neu starten
async function aktualisiereApp() {
  const knopf = $("updateJetzt");
  knopf.disabled = true;
  knopf.textContent = "⏳ Einen Moment …";
  speichern();
  const dateien = new Set(["./", "index.html", "sw.js", "manifest.webmanifest"]);
  for (const s of document.scripts) if (s.src) dateien.add(s.src.split("?")[0]);
  for (const l of document.querySelectorAll('link[rel="stylesheet"]')) dateien.add(l.href.split("?")[0]);
  try { await Promise.all([...dateien].map(d => fetch(d, { cache: "reload" }).catch(() => {}))); } catch (e) { /* offline */ }
  try {
    const regs = await navigator.serviceWorker?.getRegistrations() || [];
    await Promise.all(regs.filter(r => r.scope.includes("/idle-marie/") || !location.pathname.includes("/idle-marie/")).map(r => r.unregister()));
  } catch (e) { /* kein Service Worker */ }
  try {
    const namen = await caches.keys();
    await Promise.all(namen.filter(n => n.startsWith("idle-marie")).map(n => caches.delete(n)));
  } catch (e) { /* kein Cache */ }
  location.reload();
}
function zeigeVersionen() {
  $("versionenListe").innerHTML = VERSIONEN.map(v => {
    const [j, m, t] = v.datum.split("-");
    return `<section class="versionEintrag${v.v === APP_VERSION ? " aktuell" : ""}"><h3>Version ${v.v}${v.v === APP_VERSION ? ` <b class="versionMarke">deine Version</b>` : ""}<small>${Number(t)}.${Number(m)}.${j}</small></h3>
      <ul>${v.neu.map(n => `<li>${n}</li>`).join("")}</ul></section>`;
  }).join("");
  $("versionenOverlay").hidden = false;
}
function richteVersionenEin() {
  $("version").textContent = `v${APP_VERSION}`;
  $("version").addEventListener("click", () => { ton.klick(); zeigeVersionen(); });
  $("versionenZu").addEventListener("click", () => { ton.klick(); $("versionenOverlay").hidden = true; });
  $("updateJetzt").addEventListener("click", aktualisiereApp);
  $("updateSpaeter").addEventListener("click", () => { updateSpaeter = true; $("updateOverlay").hidden = true; });
  setTimeout(pruefeAufUpdate, 4000);
  setInterval(pruefeAufUpdate, 5 * 60 * 1000);
}

// ----- Start -----
function starteSpiel() {
  laden();
  ton.laden();
  richteSeasonEin();   // vor dem Offline-Nachholen: das Season-Monster muss bekannt sein
  richteKnoepfeEin();
  richteVersionenEin();
  richteOnlineEin();
  richteAdminEin();
  richteSicherungEin();
  richteEinfuehrungEin();
  richteQuestsEin();
  richteBankEin();
  richteGluecksradEin();
  richteAdventEin();
  richteUebungEin();
  richteFortschrittEin();
  richteSterneEin();
  richteDorfEin();
  richteFeuerEin();
  richteJagdEin();
  richteTurnenEin();
  richteGrabenEin();
  richteFreundeEin();
  richteKarteEin();
  richteFinaleEin();
  richteHeuteEin();
  richteWikiEin();
  holeOfflineNach();
  ruheAus();
  zeichneKopf();
  zeichneAktivLeiste();
  zeichneTrankLeiste();
  for (const b of gartenStand().beete) if (b && beetFortschritt(b) >= 1) b.gemeldet = true;   // beim Start nicht alles auf einmal melden
  zeigeSeite("seiteFertigkeiten");
  if (!spiel.figur) fragFigur();
  else pruefeRueckkehr();   // "Willkommen zurück!" mit allem, was passiert ist
  for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
  speichern();
  requestAnimationFrame(schleife);

  setInterval(speichern, 10 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { merkeSchnappschuss(); speichern(); }
    else {
      holeOfflineNach();
      zeichneKopf(); zeichneAktivLeiste(); zeichneSeite();
      pruefeRueckkehr();
      speichern();
      pruefeAufUpdate();
    }
  });
  window.addEventListener("pagehide", speichern);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

starteSpiel();
