"use strict";
// =====================================================
//  ENTDECKER-KARTE – Anzeige (eigene Seite statt Tätigkeiten) und Einführung
// =====================================================

function inselSvg(klein = false) {
  const n = KARTE.groesse, gr = 40, ziel = spiel.karte ? kartenZiel() : null;
  const felder = Object.values(INSEL).map(f => {
    const id = feldId(f.x, f.y), x = f.x * gr, y = f.y * gr;
    const offen = spiel.karte ? istOffen(id) : f.d === 0;
    if (offen) {
      const a = FELD_ARTEN[f.art];
      return `<g><rect x="${x + 1}" y="${y + 1}" width="${gr - 2}" height="${gr - 2}" rx="8" fill="${a.farbe}"/>
        <text x="${x + gr / 2}" y="${y + gr / 2 + 1}" font-size="${klein ? 18 : 22}" text-anchor="middle" dominant-baseline="central">${a.icon}</text></g>`;
    }
    const waehlbar = !klein && spiel.karte && erkundbar(id);
    const istZiel = id === ziel;
    const anteil = istZiel ? Math.min(1, (karte().punkte[id] || 0) / feldKosten(id)) : 0;
    const gesperrt = !klein && spiel.karte && !waehlbar && stufe("karte") < KARTE.stufeFuerAbstand[f.d];
    return `<g class="kFeld${waehlbar ? " waehlbar" : ""}${istZiel ? " ziel" : ""}" data-feld="${id}">
      <rect x="${x + 1}" y="${y + 1}" width="${gr - 2}" height="${gr - 2}" rx="8" fill="${waehlbar ? "#e6eef8" : "#cfd8e6"}" stroke="${istZiel ? "#ff5fa2" : waehlbar ? "#9ab0d0" : "none"}" stroke-width="${istZiel ? 3 : 1.5}" ${waehlbar && !istZiel ? 'stroke-dasharray="4 3"' : ""}/>
      <circle cx="${x + 14}" cy="${y + 22}" r="7" fill="#fff" opacity=".7"/><circle cx="${x + 24}" cy="${y + 18}" r="9" fill="#fff" opacity=".7"/>
      ${istZiel ? `<rect x="${x + 5}" y="${y + gr - 9}" width="${(gr - 10) * anteil}" height="4" rx="2" fill="#ff5fa2"/>` : ""}
      ${gesperrt ? `<text x="${x + gr / 2}" y="${y + gr / 2 + 1}" font-size="12" text-anchor="middle" dominant-baseline="central">🔒</text>` : ""}</g>`;
  }).join("");
  return `<svg class="inselBild${klein ? " klein" : ""}" viewBox="-10 -10 ${n * gr + 20} ${n * gr + 20}">
    <rect x="-10" y="-10" width="${n * gr + 20}" height="${n * gr + 20}" rx="24" fill="#7ad0f0"/>
    <path d="M-4 ${n * gr / 3}Q10 ${n * gr / 3 - 8} 24 ${n * gr / 3}M${n * gr - 30} ${n * gr * 0.7}Q${n * gr - 16} ${n * gr * 0.7 - 8} ${n * gr - 2} ${n * gr * 0.7}" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
    ${felder}</svg>`;
}

function zeichneKarte(ziel) {
  if (!karteFrei()) {
    ziel.innerHTML = `<div class="karte dorfZu"><span class="dGross">🗺️</span><p>Die Entdecker-Karte gibt es, wenn du <b>sieben Abenteuer-Pfade</b> geschafft hast.</p></div>`;
    return;
  }
  const k = karte(), t = taetigkeitNachId("karte-0"), laeuft = spiel.aktiv?.id === t.id, zid = kartenZiel();
  const zf = zid && INSEL[zid];
  const lauf = `<button type="button" class="taetigkeit kartenLauf${laeuft ? " laeuft" : ""}" data-id="${t.id}">
    <span class="plIcon">🧭</span><span class="tName">${laeuft ? "⏸️ Erkundet gerade – tippen zum Anhalten" : "▶ Insel erkunden"}</span>
    <span class="tWerte">✨ ${t.xp} EP · ⏱️ ${sekunden(dauer(t))} pro Schritt</span>
    <span class="tBraucht">${zf ? `Ziel: Feld im ${zf.d}. Ring · ${zahl(k.punkte[zid] || 0)} / ${zahl(feldKosten(zid))} Schritte` : "Alles entdeckt – weiter umherstreifen gibt Erfahrung"}</span>
    <span class="balken aktion"><div></div></span></button>`;
  const orte = ["schatz", "kristall", "aussicht", "quelle", "schatzkarte", "nest", "geheim"].map(a => {
    const alle = Object.values(INSEL).filter(f => f.art === a).length;
    return `<span class="kOrt${kartenAnzahl(a) ? " da" : ""}">${FELD_ARTEN[a].icon} ${kartenAnzahl(a)}/${alle}</span>`;
  }).join("");
  ziel.innerHTML = `<div class="dorfSeite">
    <div class="karte inselKarte">${inselSvg()}
      <p class="hinweis">Tipp ein Feld mit gestricheltem Rand an, um es als Nächstes zu erkunden. ${offeneFelder()} / ${alleFelder()} Felder entdeckt.</p></div>
    ${lauf}
    <div class="karte"><h3>📍 Gefunden</h3><div class="kOrte">${orte}</div>
      <p class="hinweis">✨ Zauberquellen: +${kartenAnzahl("quelle")} % Erfahrung bei allem · 🗺️ Schatzkarten machen Funde beim Ausgraben häufiger.</p>
      <button type="button" class="knopf leise" id="karteEinfuehrung">❔ Einführung nochmal ansehen</button></div></div>`;
  ziel.querySelector(".kartenLauf").addEventListener("click", () => tippeTaetigkeit(t));
  for (const g of ziel.querySelectorAll(".kFeld.waehlbar")) g.addEventListener("click", () => {
    ton.klick(); karte().ziel = g.dataset.feld; speichern(); zeichneFertigkeit();
    melde("🧭 Neues Ziel auf der Insel gewählt");
  });
  ziel.querySelector("#karteEinfuehrung").addEventListener("click", () => { ton.klick(); zeigeKarteEinfuehrung(); });
}

// ===================== EINFÜHRUNG =====================
const KARTE_EINFUEHRUNG = [
  { titel: "🗺️ Die Entdecker-Karte", bild: () => inselSvg(true),
    text: () => `Sieben Abenteuer-Pfade geschafft – jetzt kennst du alle Gebiete! Doch weit draußen im Meer liegt eine geheimnisvolle <b>Insel im Nebel</b>. ${figurName()} schlägt dort ein Lager auf. Neue Fertigkeit: <b>Entdecken</b>.` },
  { titel: "🧭 Felder erkunden", bild: () => `<div class="seBilder dGrossBilder"><span>🧭</span><span>☁️</span><span>🌼</span></div>`,
    text: () => `Tipp auf der Karte ein Feld neben dem Entdeckten an und dann auf „Insel erkunden“. ${figurName()} erkundet es Schritt für Schritt – auch wenn das Spiel zu ist. Weiter außen dauert es länger und braucht eine höhere Entdecken-Stufe.` },
  { titel: "🧰 Was du finden kannst", bild: () => `<div class="seBilder dGrossBilder"><span>🧰</span><span>💎</span><span>✨</span><span>🗺️</span></div>`,
    text: () => `Versteckte <b>Schätze</b> und <b>Kristallhöhlen</b>, <b>Zauberquellen</b> (mehr Erfahrung für immer), alte <b>Schatzkarten</b> (bessere Funde beim Ausgraben) und <b>Aussichtspunkte</b>, von denen du die Felder rundherum schneller erkundest.` },
  { titel: "🌈 Das große Geheimnis", bild: () => `<div class="seBilder dGrossBilder"><span>🐾</span><span>🌈</span></div>`,
    text: () => `Irgendwo wohnt ein kleines Tier in einem Nest – und ganz weit draußen, in einer Ecke der Insel, liegt die geheime <b>Regenbogen-Insel</b>. Kannst du sie finden?` },
];
let karteSeiteNr = 0;
function zeichneKarteEinfuehrung() {
  const s = KARTE_EINFUEHRUNG[karteSeiteNr], letzte = karteSeiteNr === KARTE_EINFUEHRUNG.length - 1;
  $("karteIntroInhalt").innerHTML = `<h2>${s.titel}</h2><div class="seBild">${s.bild()}</div><p>${s.text()}</p>
    <div class="sePunkte">${KARTE_EINFUEHRUNG.map((_, i) => `<i class="${i === karteSeiteNr ? "an" : ""}"></i>`).join("")}</div>`;
  $("karteIntroZurueck").hidden = karteSeiteNr === 0;
  $("karteIntroWeiter").textContent = letzte ? "🗺️ Los, entdecken!" : "Weiter ›";
}
function zeigeKarteEinfuehrung() { karteSeiteNr = 0; zeichneKarteEinfuehrung(); $("karteIntroOverlay").hidden = false; }
function pruefeKarteEinfuehrung() {
  if (spiel.karteIntro || !karteFrei()) return;
  if (document.querySelector(".overlay:not([hidden])") || !$("einfuehrung").hidden) return;
  spiel.karteIntro = true;
  karte();
  speichern();
  ton.stufe();
  melde("🗺️ Neue Fertigkeit: Entdecken!", "gross");
  zeigeKarteEinfuehrung();
}
function richteKarteEin() {
  $("karteIntroWeiter").addEventListener("click", () => {
    ton.klick();
    if (karteSeiteNr < KARTE_EINFUEHRUNG.length - 1) { karteSeiteNr++; zeichneKarteEinfuehrung(); return; }
    $("karteIntroOverlay").hidden = true;
    offeneFertigkeit = "karte"; zeigeSeite("seiteFertigkeit");
  });
  $("karteIntroZurueck").addEventListener("click", () => { ton.klick(); karteSeiteNr = Math.max(0, karteSeiteNr - 1); zeichneKarteEinfuehrung(); });
  $("karteIntroX").addEventListener("click", () => { ton.klick(); $("karteIntroOverlay").hidden = true; });
  jedeSekunde(pruefeKarteEinfuehrung, 2);
  // Ziel-Fortschritt auf der Karte aktuell halten
  jedeSekunde(() => { if (aktuelleSeite === "seiteFertigkeit" && offeneFertigkeit === "karte" && spiel.aktiv?.id === "karte-0") zeichneFertigkeit(); }, 3);
}
