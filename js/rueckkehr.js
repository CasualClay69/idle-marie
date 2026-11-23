"use strict";
// =====================================================
//  WILLKOMMEN ZURÜCK – zeigt, was während der Abwesenheit passiert ist.
//  Solange das Spiel sichtbar ist, merkt es sich jede Sekunde einen "Schnappschuss".
//  Kommt man nach mindestens 3 Minuten zurück (App wieder geöffnet oder neu gestartet),
//  wird der aktuelle Stand mit dem Schnappschuss verglichen.
//  So ist es egal, ob das Handy im Hintergrund schon weitergerechnet hat oder nicht.
// =====================================================

const RUECKKEHR = { abMinuten: 3 };

function schnappschuss() {
  return {
    zeit: Date.now(),
    xp: { ...spiel.xp },
    bank: { ...spiel.bank },
    muenzen: spiel.muenzen,
    besiegt: spiel.statistik.besiegt || 0,
    truhen: spiel.statistik.truhen || 0,
    geerntet: spiel.statistik.geerntet || 0,
    haustiere: [...(spiel.haustiere || [])],
    aktiv: spiel.aktiv ? (spiel.aktiv.kampf ? `kampf:${spiel.aktiv.pfad?.id || spiel.aktiv.monster}` : spiel.aktiv.id) : null,
  };
}
function merkeSchnappschuss() { spiel.schnappschuss = schnappschuss(); }

// Prüfen, ob man länger weg war – wenn ja: Fenster zeigen. Rückgabe: true, wenn das Fenster kam
function pruefeRueckkehr() {
  const s = spiel.schnappschuss;
  if (!s || !spiel.figur) { merkeSchnappschuss(); return false; }
  const weg = Date.now() - s.zeit;
  if (weg < RUECKKEHR.abMinuten * 60000) { merkeSchnappschuss(); return false; }
  zeigeRueckkehr(s, weg);
  merkeSchnappschuss();
  return true;
}

function zeitText(ms) {
  const min = Math.floor(ms / 60000), tage = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  const teile = [];
  if (tage) teile.push(`${tage} Tag${tage === 1 ? "" : "e"}`);
  if (h) teile.push(`${h} Stunde${h === 1 ? "" : "n"}`);
  if (m && !tage) teile.push(`${m} Minute${m === 1 ? "" : "n"}`);
  return teile.join(" und ") || "kurz";
}

function zeigeRueckkehr(s, weg) {
  const abschnitte = [];
  const liste = (titel, zeilen) => { if (zeilen.length) abschnitte.push(`<h3 class="rkTitel">${titel}</h3><ul class="offlineListe">${zeilen.join("")}</ul>`); };

  // Erfahrung und Stufen
  const xpZeilen = [];
  for (const f of FERTIGKEITEN) {
    const plus = (spiel.xp[f.id] || 0) - (s.xp[f.id] || 0);
    if (plus < 1) continue;
    const vorher = stufeAusXp(s.xp[f.id] || 0), jetzt = stufe(f.id);
    xpZeilen.push(`<li>${f.icon} <span class="rkName">${f.name}</span> <b>+${zahl(plus)} EP</b>${jetzt > vorher ? `<b class="hell">🎉 Stufe ${jetzt}!</b>` : ""}</li>`);
  }
  liste("✨ Erfahrung", xpZeilen);

  // Sachen
  const gewonnen = [], verbraucht = [];
  for (const id of new Set([...Object.keys(s.bank), ...Object.keys(spiel.bank)])) {
    if (!GEGENSTAENDE[id]) continue;
    const d = anzahl(id) - (s.bank[id] || 0);
    if (d > 0) gewonnen.push(`<li>${symbolHtml(id, "mini")} <span class="rkName">${GEGENSTAENDE[id].name}</span> <b>+${zahl(d)}</b></li>`);
    if (d < 0) verbraucht.push(`<li class="sanft">${symbolHtml(id, "mini")} <span class="rkName">${GEGENSTAENDE[id].name}</span> −${zahl(-d)}</li>`);
  }
  liste("🎒 Gesammelt und hergestellt", gewonnen);

  // Abenteuer & Besonderes
  const extra = [];
  const muenzen = spiel.muenzen - s.muenzen;
  if (muenzen > 0) extra.push(`<li>${muenzeHtml("muenze klein")} <span class="rkName">Münzen</span> <b>+${zahl(muenzen)}</b></li>`);
  const monster = (spiel.statistik.besiegt || 0) - s.besiegt;
  if (monster > 0) extra.push(`<li>💤 <span class="rkName">Monster eingeschlafen</span> <b>${zahl(monster)}</b></li>`);
  const truhen = (spiel.statistik.truhen || 0) - s.truhen;
  if (truhen > 0) extra.push(`<li>🧰 <span class="rkName">Schatztruhen geöffnet</span> <b>${zahl(truhen)}</b></li>`);
  for (const id of (spiel.haustiere || []).filter(x => !s.haustiere.includes(x))) {
    const h = HAUSTIERE.find(x => x.id === id);
    if (h) extra.push(`<li>🎉 <b>${h.emoji} ${h.name}</b> ist bei dir eingezogen!</li>`);
  }
  liste("🌟 Außerdem", extra);
  liste("📦 Verbraucht", verbraucht);

  // Was jetzt wartet
  const warten = [];
  const reif = gartenStand().beete.filter(b => b && beetFortschritt(b) >= 1).length;
  if (reif) warten.push(`<li>🌱 <span class="rkName">${reif} Beet${reif === 1 ? " ist" : "e sind"} reif zum Ernten</span></li>`);
  const leer = gartenStand().beete.filter(b => !b).length;
  if (leer) warten.push(`<li>🟫 <span class="rkName">${leer} Beet${leer === 1 ? " ist" : "e sind"} leer – pflanz etwas!</span></li>`);
  const season = abholbereiteAufgaben?.().length || 0;
  if (season) warten.push(`<li>🎟️ <span class="rkName">${season} Season-Aufgabe${season === 1 ? "" : "n"} zum Abholen</span></li>`);
  const streichel = (spiel.haustiere || []).filter(id => tierStufe(id) < PFLEGE.maxStufe && streichelnIn(id) === 0).length;
  if (streichel) warten.push(`<li>💖 <span class="rkName">${streichel} Haustier${streichel === 1 ? " möchte" : "e möchten"} gestreichelt werden</span></li>`);
  if (dorfFrei() && !dorfLagerLeer()) warten.push(`<li>🏘️ <span class="rkName">Im Dorflager liegen Sachen zum Abholen</span></li>`);
  if (feuerFrei() && !feuerBrennt()) warten.push(`<li>🔥 <span class="rkName">Dein großes Lagerfeuer ist aus – zünde ein neues an!</span></li>`);
  if (kannDrehen()) warten.push(`<li>🎁 <span class="rkName">Dein tägliches Glücksrad wartet – dreh es!</span></li>`);
  const q = aktuellerQuest();
  if (q && questStand(q).fertig) warten.push(`<li>📜 <span class="rkName">Auftrag geschafft – Belohnung abholen!</span></li>`);
  liste("👀 Das wartet auf dich", warten);

  // Wann wurde angehalten? Und gab es eine Höchstzeit?
  const grenzeStd = SPIEL.offlineMaxStunden + baumhausBonus("offline");
  let hinweis = "";
  if (spiel.letzterStopp && spiel.letzterStopp.zeit >= s.zeit) hinweis += `<p class="hinweis">⏸️ ${spiel.letzterStopp.grund}</p>`;
  else if (!spiel.aktiv && !s.aktiv) hinweis += `<p class="hinweis">💤 ${figurName()} hat Pause gemacht – tippe eine Tätigkeit an, dann geht es weiter, auch wenn du weg bist.</p>`;
  if (weg > grenzeStd * 3600000 && s.aktiv) hinweis += `<p class="hinweis">🛏️ ${figurName()} arbeitet höchstens ${grenzeStd} Stunden ohne dich. Ein besseres Bett im 🏡 Baumhaus macht die Zeit länger!</p>`;

  $("offlineTitel").innerHTML = `🌙 Willkommen zurück!`;
  $("offlineInhalt").innerHTML = `<div class="rkZeit"><small>Du warst weg:</small><b>${zeitText(weg)}</b></div>
    ${abschnitte.length ? abschnitte.join("") : `<p>In der Zwischenzeit ist nichts passiert.</p>`}${hinweis}`;
  $("offlineOverlay").hidden = false;
}
