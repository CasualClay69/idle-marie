"use strict";
// =====================================================
//  SERVICE WORKER – macht das Spiel offline spielbar
//
//  Strategie "stale-while-revalidate":
//  1. Datei sofort aus dem Speicher (Cache) liefern → startet blitzschnell, auch offline
//  2. Gleichzeitig im Hintergrund die neueste Version laden und den Cache aktualisieren
//  → Änderungen, die du hochlädst, sind beim ÜBERNÄCHSTEN Öffnen da.
//  Im Hintergrund wird immer beim Server nachgefragt (cache: "no-cache"), nie aus dem
//  Browser-Zwischenspeicher genommen – sonst könnten alte und neue Dateien gemischt werden.
//
//  Wenn du Dateien hinzufügst oder umbenennst: in DATEIEN eintragen.
//  Die Versionsnummer steht in js/version.js – dort hochzählen,
//  damit der alte Cache gelöscht wird.
// =====================================================

importScripts("js/version.js");   // liefert APP_VERSION
const CACHE = "idle-marie-v" + APP_VERSION;

const DATEIEN = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/version.js",
  "js/splash.js",
  "js/versionen.js",
  "js/daten.js",
  "js/daten-kampf.js",
  "js/daten-garten.js",
  "js/daten-sammlung.js",
  "js/daten-baumhaus.js",
  "js/daten-kleiderschrank.js",
  "js/daten-season.js",
  "js/daten-naehen.js",
  "js/daten-pfade.js",
  "js/daten-schmuck.js",
  "js/daten-sterne.js",
  "js/daten-fernkampf.js",
  "js/daten-dorf.js",
  "js/daten-feuer.js",
  "js/daten-jagd.js",
  "js/daten-turnen.js",
  "js/daten-graben.js",
  "js/daten-gebiet7.js",
  "js/daten-freunde.js",
  "js/daten-karte.js",
  "js/symbole.js",
  "js/ikonen.js",
  "js/ikonen-natur.js",
  "js/ikonen-dinge.js",
  "js/ikonen-tiere.js",
  "js/monster.js",
  "js/logik.js",
  "js/kampf.js",
  "js/garten.js",
  "js/sammlung.js",
  "js/pflege.js",
  "js/uebungstopf.js",
  "js/daten-quests.js",
  "js/quests.js",
  "js/kleiderschrank.js",
  "js/season.js",
  "js/baumhaus.js",
  "js/sound.js",
  "js/anzeige.js",
  "js/bank.js",
  "js/kampf-anzeige.js",
  "js/sets.js",
  "js/garten-anzeige.js",
  "js/sammlung-anzeige.js",
  "js/online.js",
  "js/online-anzeige.js",
  "js/admin.js",
  "js/sicherung.js",
  "js/einfuehrung.js",
  "js/season-anzeige.js",
  "js/gluecksrad.js",
  "js/advent.js",
  "js/daten-gebiet8.js",
  "js/uebung-anzeige.js",
  "js/fortschritt.js",
  "js/sterne-anzeige.js",
  "js/dorf-anzeige.js",
  "js/dorffest.js",
  "js/feuer-anzeige.js",
  "js/jagd-anzeige.js",
  "js/turnen-anzeige.js",
  "js/graben-anzeige.js",
  "js/freunde-anzeige.js",
  "js/karte-anzeige.js",
  "js/finale.js",
  "js/heute.js",
  "js/rueckkehr.js",
  "js/daten-wiki.js",
  "js/wiki.js",
  "js/wiki-anzeige.js",
  "js/main.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

// Installation: alle Dateien vorab in den Cache laden
self.addEventListener("install", ereignis => {
  ereignis.waitUntil(
    caches.open(CACHE)
      // cache: "reload" = am Browser-Zwischenspeicher vorbei direkt vom Server holen,
      // sonst landet evtl. eine alte Datei im neuen Cache
      .then(cache => cache.addAll(DATEIEN.map(datei => new Request(datei, { cache: "reload" }))))
      .then(() => self.skipWaiting())       // neue Version sofort aktiv werden lassen
  );
});

// Aktivierung: Caches älterer Versionen löschen
self.addEventListener("activate", ereignis => {
  ereignis.waitUntil(
    caches.keys()
      .then(namen => Promise.all(
        // nur eigene alte Caches löschen – andere Spiele auf derselben Adresse nicht anfassen
        namen.filter(name => name.startsWith("idle-marie") && name !== CACHE).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Jede Anfrage: erst Cache, im Hintergrund aktualisieren
self.addEventListener("fetch", ereignis => {
  const anfrage = ereignis.request;
  const adresse = new URL(anfrage.url);
  if (anfrage.method !== "GET" || adresse.origin !== self.location.origin) return;

  // Versions-Check des Spiels (…?frisch=…): immer direkt vom Server, nie aus dem Speicher
  if (adresse.searchParams.has("frisch")) return;

  const ausDemNetz = fetch(anfrage.url, { cache: "no-cache", credentials: "same-origin" }).then(antwort => {
    if (antwort.ok && antwort.type === "basic") {
      const kopie = antwort.clone();
      caches.open(CACHE).then(cache => cache.put(anfrage, kopie));
    }
    return antwort;
  });
  ereignis.waitUntil(ausDemNetz.catch(() => {}));   // Fehler offline ignorieren

  ereignis.respondWith(
    caches.match(anfrage, { ignoreSearch: true })
      .then(ausDemCache => ausDemCache || ausDemNetz)
  );
});
