"use strict";
// =====================================================
//  GLÜCKSRAD – jeden Tag ein Geschenk
//  Einmal am Tag drehen. Die Geschenke wachsen mit der Gesamtstufe mit (bleiben aber klein,
//  damit das Balancing stimmt). Jeder 7. Tag in Folge: doppeltes Geschenk.
//  spiel.gluecksrad = { tag: "2026-11-23", serie, besteSerie, gedreht }
// =====================================================

const GLUECKSRAD = {
  serieBonus: 7,
  felder: [
    { id: "muenzen", name: "Münzen",         icon: "🪙", farbe: "#ffe27a", gewicht: 24 },
    { id: "samen",   name: "Samen-Päckchen", icon: "🌱", farbe: "#a8e08f", gewicht: 15 },
    { id: "essen",   name: "Picknick-Korb",  icon: "🧺", farbe: "#ffc08f", gewicht: 14 },
    { id: "season",  name: "Season-Punkte",  icon: "🎟️", farbe: "#ffb3d1", gewicht: 12 },
    { id: "trank",   name: "Zaubertrank",    icon: "🧪", farbe: "#cdb0ff", gewicht: 10 },
    { id: "sack",    name: "Münzsack",       icon: "💰", farbe: "#f7c96a", gewicht: 10 },
    { id: "stein",   name: "Edelstein",      icon: "💎", farbe: "#a6e6f7", gewicht: 10 },
    { id: "schatz",  name: "Schatz!",        icon: "👑", farbe: "#ff8fb0", gewicht: 5 },
  ],
};

const rad = () => (spiel.gluecksrad = spiel.gluecksrad || { tag: null, serie: 0, besteSerie: 0, gedreht: 0 });
const kannDrehen = () => rad().tag !== tagText();
const radBasis = () => Math.max(20, Math.round((20 + 2 * Math.pow(gesamtStufe(), 1.3)) / 10) * 10);
// höchste freigeschaltete Material-Stufe (0–7) einer Fertigkeit
const radTier = fid => Math.max(0, STUFEN.filter(s => s <= stufe(fid)).length - 1);
const radZufall = liste => liste[Math.floor(Math.random() * liste.length)];

function radGewinn(feld, mal) {
  const b = radBasis();
  if (feld.id === "muenzen" || feld.id === "sack" || feld.id === "schatz") {
    const n = b * { muenzen: 1, sack: 3, schatz: 10 }[feld.id] * mal;
    spiel.muenzen += n;
    return `${muenzeHtml("muenze klein")} <b>${zahl(n)}</b> Münzen`;
  }
  if (feld.id === "samen") {
    const art = radZufall(["gemuese", "kraut", "faser"]);
    const p = PFLANZEN.filter(x => x.art === art && x.stufe <= stufe("garten")).pop() || PFLANZEN[0];
    gibInBank(p.samen, 5 * mal);
    return `${symbolHtml(p.samen, "mini")} <b>${5 * mal}×</b> ${GEGENSTAENDE[p.samen].name}`;
  }
  if (feld.id === "essen") {
    const id = `essen${radTier("kochen")}`;
    gibInBank(id, 10 * mal);
    return `${symbolHtml(id, "mini")} <b>${10 * mal}×</b> ${GEGENSTAENDE[id].name}`;
  }
  if (feld.id === "trank") {
    const id = radZufall(TRAENKE.filter((t, i) => STUFEN[i] <= Math.max(1, stufe("traenke")))).id;
    gibInBank(id, 2 * mal);
    return `${symbolHtml(id, "mini")} <b>${2 * mal}×</b> ${GEGENSTAENDE[id].name}`;
  }
  if (feld.id === "stein") {
    const id = `stein${radTier("bergbau")}`;
    gibInBank(id, mal);
    return `${symbolHtml(id, "mini")} <b>${mal}×</b> ${GEGENSTAENDE[id].name}`;
  }
  if (feld.id === "season") {
    const n = SEASON.tagesPunkte * mal;
    const neu = gibSeasonPunkte(n);
    if (neu.length) setTimeout(() => zeigeSeasonStufen(neu), 1500);
    return `⭐ <b>${n}</b> Season-Punkte`;
  }
  return "";
}

// Dreht das Rad (Geschenk wird sofort gutgeschrieben). Rückgabe: { nr, feld, text, doppelt }
function dreheRad() {
  if (!kannDrehen()) return null;
  const r = rad();
  const gestern = tagText(new Date(Date.now() - 86400000));
  r.serie = r.tag === gestern ? r.serie + 1 : 1;
  r.besteSerie = Math.max(r.besteSerie || 0, r.serie);
  r.tag = tagText();
  r.gedreht = (r.gedreht || 0) + 1;
  const summe = GLUECKSRAD.felder.reduce((s, f) => s + f.gewicht, 0);
  let wurf = Math.random() * summe, nr = 0;
  while (wurf >= GLUECKSRAD.felder[nr].gewicht) { wurf -= GLUECKSRAD.felder[nr].gewicht; nr++; }
  const feld = GLUECKSRAD.felder[nr];
  const doppelt = r.serie % GLUECKSRAD.serieBonus === 0;
  const text = radGewinn(feld, doppelt ? 2 : 1);
  speichern();
  return { nr, feld, text, doppelt };
}

// ----- Erfolge -----
erfolg({ id: "rad-1", icon: "🎁", name: "Glückspilz", text: "Dreh das Glücksrad zum ersten Mal", ziel: 1, muenzen: 100, wert: () => spiel.gluecksrad?.gedreht || 0 });
erfolg({ id: "rad-7", icon: "🎡", name: "Eine ganze Woche", text: "Dreh das Glücksrad 7 Tage hintereinander", ziel: 7, muenzen: 5000, wert: () => spiel.gluecksrad?.besteSerie || 0 });
erfolg({ id: "rad-30", icon: "🍀", name: "Glücksrad-Fan", text: "Dreh das Glücksrad an 30 Tagen", ziel: 30, muenzen: 50000, wert: () => spiel.gluecksrad?.gedreht || 0 });

// ===================== ANZEIGE =====================
function radSvg() {
  const n = GLUECKSRAD.felder.length, w = 360 / n;
  const punkt = (grad, r) => [100 + r * Math.sin(grad * Math.PI / 180), 100 - r * Math.cos(grad * Math.PI / 180)];
  const felder = GLUECKSRAD.felder.map((f, i) => {
    const [x1, y1] = punkt(i * w - w / 2, 92), [x2, y2] = punkt(i * w + w / 2, 92), [ix, iy] = punkt(i * w, 62);
    return `<path d="M100 100 L${x1.toFixed(1)} ${y1.toFixed(1)} A92 92 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${f.farbe}" stroke="#fff" stroke-width="3"/>
      ${ikonSvg(f.icon, "radIk").replace("<svg ", `<svg x="${(ix - 15).toFixed(1)}" y="${(iy - 15).toFixed(1)}" width="30" height="30" `)}`;
  }).join("");
  const lichter = Array.from({ length: 16 }, (_, i) => { const [x, y] = punkt(i * 22.5, 97); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${i % 2 ? "#fff" : "#ffd54f"}"/>`; }).join("");
  return `<svg class="radRad" id="radRad" viewBox="0 0 200 200"><circle cx="100" cy="100" r="99" fill="#ff7eb6"/>${felder}${lichter}
    <circle cx="100" cy="100" r="16" fill="#fff" stroke="#ff7eb6" stroke-width="4"/><circle cx="100" cy="100" r="6" fill="#ffd54f"/></svg>`;
}

let gluecksKarteText = "";
function zeichneGluecksKarte() {
  const r = rad();
  let html;
  if (kannDrehen()) {
    const naechste = r.tag === tagText(new Date(Date.now() - 86400000)) ? r.serie + 1 : 1;
    const doppelt = naechste % GLUECKSRAD.serieBonus === 0;
    html = `<span class="gkIcon">🎁</span><span class="gkText"><b>Dein tägliches Geschenk!</b>
      <small>${doppelt ? "🔥 Heute doppelt – 7 Tage in Folge!" : `Dreh das Glücksrad · Tag ${naechste} in Folge`}</small></span><span class="gkLos">Drehen</span>`;
  } else {
    const morgen = new Date(); morgen.setHours(24, 0, 0, 0);
    const min = Math.max(1, Math.round((morgen - Date.now()) / 60000));
    html = `<span class="gkIcon">🎡</span><span class="gkText"><b>Glücksrad</b>
      <small>🔥 ${r.serie} Tag${r.serie === 1 ? "" : "e"} in Folge · nächstes Geschenk in ${min >= 60 ? `${Math.floor(min / 60)} Std. ${min % 60} Min.` : `${min} Min.`}</small></span>`;
  }
  if (html === gluecksKarteText) return;
  gluecksKarteText = html;
  const k = $("gluecksKarte");
  k.classList.toggle("bereit", kannDrehen());
  k.innerHTML = html;
}

function zeigeGluecksrad() {
  const r = rad();
  $("radInfo").textContent = kannDrehen() ? "Einmal am Tag darfst du drehen. Jeder 7. Tag in Folge bringt ein doppeltes Geschenk!"
    : "Heute hast du schon gedreht. Morgen wartet ein neues Geschenk!";
  $("radBox").innerHTML = radSvg() + `<span class="radZeiger"></span>`;
  $("radErgebnis").innerHTML = "";
  $("radDrehen").hidden = !kannDrehen();
  $("radDrehen").disabled = false;
  $("radSerie").textContent = r.serie ? `🔥 ${r.serie} Tag${r.serie === 1 ? "" : "e"} in Folge · ${r.gedreht} Mal gedreht` : "";
  $("gluecksOverlay").hidden = false;
}

function richteGluecksradEin() {
  $("gluecksKarte").addEventListener("click", () => { ton.klick(); zeigeGluecksrad(); });
  $("radZu").addEventListener("click", () => { ton.klick(); $("gluecksOverlay").hidden = true; });
  $("radDrehen").addEventListener("click", () => {
    const g = dreheRad();
    if (!g) return;
    ton.klick();
    $("radDrehen").disabled = true;
    const w = 360 / GLUECKSRAD.felder.length;
    const ziel = 360 * 6 - g.nr * w + (Math.random() * 0.6 - 0.3) * w;
    const radEl = $("radRad");
    radEl.style.transform = `rotate(${ziel}deg)`;
    setTimeout(() => {
      $("radDrehen").hidden = true;
      $("radErgebnis").innerHTML = `<div class="radGewinn"><small>${g.feld.icon} ${g.feld.name}${g.doppelt ? " · doppelt!" : ""}</small><span>${g.text}</span></div>`;
      $("radInfo").textContent = "Toll! Morgen kannst du wieder drehen.";
      $("radSerie").textContent = `🔥 ${rad().serie} Tag${rad().serie === 1 ? "" : "e"} in Folge · ${rad().gedreht} Mal gedreht`;
      ton.stufe();
      herzchen($("radErgebnis"));
      melde(`🎁 Glücksrad: ${g.text.replace(/<[^>]+>/g, "")}`, "gross");
      zeichneKopf(); zeichneGluecksKarte();
      for (const e of pruefeErfolge()) melde(`🏆 Erfolg: ${e.name}! +${zahl(e.muenzen)} Münzen`, "gross");
      speichern();
    }, 4300);
  });
  zeichneGluecksKarte();
}
