"use strict";
// =====================================================
//  SEASON-PASS – Anzeige: Banner auf der Fertigkeiten-Seite und eigene Season-Seite
// =====================================================

function belohnungKurz(b) {
  if (b.muenzen) return `${muenzeHtml("muenze klein")} ${zahl(b.muenzen)}`;
  if (b.aussehen) { const t = teilNachId(b.aussehen); return `${t.icon} ${t.name}`; }
  if (b.haustier) { const h = HAUSTIERE.find(x => x.id === b.haustier); return `${h.emoji} ${h.name}`; }
  if (b.sachen) return Object.entries(b.sachen).map(([id, n]) => `${symbolHtml(id, "mini")} ${n}× ${GEGENSTAENDE[id].name}`).join(" · ");
  if (b.samen) return "🌱 Samen-Paket";
  if (b.essen) return "🍽️ Essens-Paket";
  return "";
}

// ----- Season-Logo mit Jahreszahl (Banner-Stil wie bei Marie Clicker) -----
// Season 1 = November 2026 (Start des Season-Passes), danach jeden Monat eine mehr
function seasonNummer(id) { return (Number(id.slice(0, 4)) - 2026) * 12 + Number(id.slice(5)) - 10; }
function seasonLogoSvg(t, id) {
  const titel = `${t.titel} ${id.slice(0, 4)}`.replace(/&/g, "&amp;");
  const groesse = Math.min(34, Math.floor(262 / (0.6 * titel.length)));
  const hell = t.farben[0], kraeftig = t.farben[1];
  const rand = toene(kraeftig, -0.45), enden = toene(kraeftig, -0.12), schatten = toene(kraeftig, -0.4);
  const g = `sl${id.replace("-", "")}`;
  const motive = [t.icon, ...(t.rahmenEmoji || [])];
  const deko = [[motive[0], 0, 48, 44], [motive[1] || motive[0], 314, 46, 40], [motive[2] || motive[0], 44, 139, 25], [motive[0], 292, 139, 25]]
    .map(([e, x, y, gr]) => `<text x="${x}" y="${y}" font-size="${gr}">${e}</text>`).join("");
  return `<svg viewBox="0 0 360 140" role="img" aria-label="Season ${seasonNummer(id)}: ${titel}">
  <defs>
    <linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${toene(kraeftig, 0.35)}"/><stop offset="1" stop-color="${kraeftig}"/></linearGradient>
    <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${hell}"/></linearGradient>
  </defs>
  <path d="M12 66 H60 V116 H12 L27 91 Z" fill="${enden}"/>
  <path d="M348 66 H300 V116 H348 L333 91 Z" fill="${enden}"/>
  <path d="M60 116 L46 104 H60 Z" fill="${schatten}"/>
  <path d="M300 116 L314 104 H300 Z" fill="${schatten}"/>
  <rect x="42" y="52" width="276" height="70" rx="18" fill="url(#${g}b)" stroke="${rand}" stroke-width="4"/>
  <path d="M62 62 H298" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>
  <text x="180" y="105" text-anchor="middle" font-family="ui-rounded, 'Arial Rounded MT Bold', Nunito, sans-serif" font-size="${groesse}" font-weight="900"
        fill="url(#${g}s)" stroke="${rand}" stroke-width="7" stroke-linejoin="round" paint-order="stroke">${titel}</text>
  <rect x="124" y="31" width="112" height="28" rx="14" fill="#ffffff" stroke="${rand}" stroke-width="3"/>
  <text x="180" y="50.5" text-anchor="middle" font-family="ui-rounded, 'Arial Rounded MT Bold', Nunito, sans-serif" font-size="14" font-weight="900" fill="${rand}" letter-spacing="3">SEASON ${seasonNummer(id)}</text>
  ${deko}
</svg>`;
}

// ----- Banner (oben auf der Fertigkeiten-Seite) -----
function zeichneSeasonBanner() {
  const t = aktuellesThema(), s = spiel.season;
  if (!s) return;
  const st = seasonStufe(), fertig = abholbereiteAufgaben().length;
  const anteil = st >= SEASON.stufen ? 1 : (s.punkte % SEASON.punkteProStufe) / SEASON.punkteProStufe;
  const b = $("seasonBanner");
  b.style.setProperty("--s1", t.farben[0]);
  b.style.setProperty("--s2", t.farben[1]);
  b.innerHTML = `<span class="sbIcon">${t.icon}</span>
    <span class="sbText"><b>Season ${seasonNummer(s.id)}: ${t.titel} ${s.id.slice(0, 4)}</b><small>Stufe ${st} / ${SEASON.stufen} · noch ${seasonTageUebrig()} Tage</small>
      <span class="balken duenn"><div style="width:${(anteil * 100).toFixed(1)}%"></div></span></span>
    ${fertig ? `<span class="sbMarke">🎁 ${fertig}</span>` : `<span class="sbPfeil">›</span>`}`;
}

// ----- Season-Seite -----
function zeichneSeason() {
  const t = aktuellesThema(), s = spiel.season;
  const st = seasonStufe();
  const naechste = st >= SEASON.stufen ? null : (st + 1) * SEASON.punkteProStufe;
  const kopf = `<div class="seasonKopf mitLogo" style="--s1:${t.farben[0]};--s2:${t.farben[1]}">
      <div class="seasonLogo">${seasonLogoSvg(t, s.id)}</div>
      <div><small>${MONATSNAMEN[Number(s.id.slice(5)) - 1]} ${s.id.slice(0, 4)} · noch ${seasonTageUebrig()} Tage</small>
      <div class="skStufe">Stufe <b>${st}</b> / ${SEASON.stufen}</div>
      <div class="balken dick"><div style="width:${naechste ? ((s.punkte % SEASON.punkteProStufe) / SEASON.punkteProStufe * 100).toFixed(1) : 100}%"></div></div>
      <small>${naechste ? `${zahl(s.punkte)} / ${zahl(naechste)} Season-Punkte` : `🎉 Alle Stufen geschafft! Jede weiteren 100 Punkte bringen Münzen.`}</small></div></div>`;

  const aufgabeHtml = a => {
    const z = aufgabeStand(a);
    const alt = a.art === "tag" && a.tag !== tagText() ? `<span class="altMarke">von ${Number(a.tag.slice(8))}.${Number(a.tag.slice(5, 7))}.</span>` : "";
    const offen = !a.abgeholt && !z.fertig;
    return `<div class="aufgabe${a.abgeholt ? " erledigt" : ""}${z.fertig && !a.abgeholt ? " fertig" : ""}${offen ? " hinKnopf" : ""}"${offen ? ` data-hin="${a.id}" role="button"` : ""}>
      <span class="aText"><b>${a.text} ${alt}</b><span class="balken duenn"><div style="width:${(z.wert / a.ziel * 100).toFixed(1)}%"></div></span>
        <small>${zahl(z.wert)} / ${zahl(a.ziel)} · ⭐ ${a.punkte} Punkte</small></span>
      ${a.abgeholt ? `<span class="aHaken">✓</span>` : z.fertig ? `<button type="button" class="knopf kaufen" data-aufgabe="${a.id}">Abholen</button>` : `<span class="aHin">🧭</span>`}</div>`;
  };
  // Erledigte (abgeholte) Tagesaufgaben verschwinden – nur noch offene und abholbereite zeigen
  const tag = s.aufgaben.filter(a => a.art === "tag" && !a.abgeholt).sort((x, y) => y.tag.localeCompare(x.tag));
  const woche = s.aufgaben.filter(a => a.art === "woche");

  const m = MONSTER.season;
  const monster = `<div class="karte seasonMonster"><span class="mBild">${monsterSvg(m.aussehen)}</span>
    <div><b>${m.name}</b><small>Das Season-Monster passt sich deiner Kampfstufe an (jetzt Stufe ${m.stufe}). Jedes Mal, wenn es einschläft: ⭐ ${SEASON.monsterPunkte} Punkte.</small>
    <button type="button" class="knopf kaufen" id="zumSeasonMonster">⚔️ Zum Monster</button></div></div>`;

  const stufen = Array.from({ length: SEASON.stufen }, (_, i) => i + 1).map(n => {
    const b = stufenBelohnung(n), besonders = b.aussehen || b.haustier;
    return `<li class="${n <= st ? "erreicht" : ""}${n === st + 1 ? " naechste" : ""}${besonders ? " besonders" : ""}">
      <span class="stNr">${n <= st ? "✓" : n}</span>
      ${b.aussehen ? `<span class="stBild">${figurSvg(spiel.figur, { ...aussehen(), [teilNachId(b.aussehen).kategorie]: b.aussehen })}</span>` : ""}
      ${b.haustier ? `<span class="stBild stTier">${HAUSTIERE.find(x => x.id === b.haustier).emoji}</span>` : ""}
      <span class="stText">${belohnungKurz(b)}</span></li>`;
  }).join("");

  $("seasonInhalt").innerHTML = `${kopf}
    <div class="karte"><h3>☀️ Tagesaufgaben <small>jeden Tag 3 neue</small></h3>${tag.length ? tag.map(aufgabeHtml).join("") : `<p class="hinweis">🎉 Alle Tagesaufgaben geschafft! Morgen gibt es 3 neue.</p>`}
      <p class="hinweis">Verpasst? Nicht schlimm – Tagesaufgaben bleiben eine Woche lang offen.</p></div>
    <div class="karte"><h3>📅 Wochenaufgaben <small>neu jeden Montag</small></h3>${woche.map(aufgabeHtml).join("")}</div>
    ${monster}
    <div class="karte"><h3>🎁 Belohnungen</h3><ol class="seasonStufen">${stufen}</ol>
      <p class="hinweis">Season-Sachen kommen im nächsten Jahr wieder – du verpasst also nichts für immer.</p></div>`;

  for (const b of $("seasonInhalt").querySelectorAll("[data-aufgabe]")) b.addEventListener("click", () => {
    const a = spiel.season.aufgaben.find(x => x.id === b.dataset.aufgabe);
    const neu = holeAufgabe(a);
    if (!neu) return;
    ton.muenze();
    herzchen(b);
    melde(`⭐ +${a.punkte} Season-Punkte!`);
    zeigeSeasonStufen(neu);
    speichern();
    zeichneKopf();
    zeichneSeason();
    zeichneSeasonBanner();
  });
  for (const d of $("seasonInhalt").querySelectorAll("[data-hin]")) d.addEventListener("click", () => {
    const a = spiel.season.aufgaben.find(x => x.id === d.dataset.hin);
    if (!a) return;
    ton.klick();
    const h = seasonAufgabeZiel(a);
    zeigeBlase(`🎟️ ${a.text}`, h.hinweis || "");
    zeigeWegHilfe(h);
  });
  $("zumSeasonMonster").addEventListener("click", () => {
    ton.klick();
    aktualisiereSeasonMonster();
    starteKampf("season");
    speichern();
    zeichneAktivLeiste();
    abenteuerTab = "kampf";
    zeigeSeite("seiteAbenteuer");
  });
}

// Neue Stufen feiern (Meldungen; Haustier mit großem Fenster)
function zeigeSeasonStufen(neu) {
  for (const { stufe: n, belohnung } of neu) {
    ton.stufe();
    melde(`🎟️ Season-Stufe ${n}! ${belohnungKurz(belohnung)}`, "gross");
    if (belohnung.neuesHaustier) zeigeHaustierFund(belohnung.neuesHaustier);
  }
}

function richteSeasonEin() {
  aktualisiereSeasonMonster();
  pruefeSeasonWechsel();
  $("seasonBanner").addEventListener("click", () => { ton.klick(); zeigeSeite("seiteSeason"); });
  $("seasonZurueck").addEventListener("click", () => { ton.klick(); zeigeSeite("seiteFertigkeiten"); });
}

// Wohin führt eine Tages- oder Wochenaufgabe? (gleiche Ziele wie der Kompass)
function seasonAufgabeZiel(a) {
  if (a.typ === "aktion") {
    const t = besteTaetigkeit(a.fertigkeit);
    return { fertigkeit: a.fertigkeit, ziel: t ? `.taetigkeit[data-id="${t.id}"]` : undefined, hinweis: t ? `Am besten jetzt: ${t.name}.` : "" };
  }
  if (a.typ === "monster") {
    const m = besterGegner();
    return { seite: "seiteAbenteuer", abenteuerTab: "gebiete", ziel: `.monsterKarte[data-monster="${m.id}"]`, hinweis: `Tippe ${m.name.replaceAll("­", "")} an – das passt gerade am besten zu dir.` };
  }
  if (a.typ === "season") return { seite: "seiteAbenteuer", abenteuerTab: "gebiete", ziel: '.monsterKarte[data-monster="season"]', hinweis: "Tippe das Season-Monster an!" };
  if (a.typ === "ernte") return gartenZiel();
  if (a.typ === "truhe") {
    const p = [...PFADE].reverse().find(x => pfadFrei(x) && kampfStufe() >= MONSTER[x.chef].stufe - 5) || PFADE.find(pfadFrei);
    return p ? { seite: "seiteAbenteuer", abenteuerTab: "pfade", ziel: `.pfadKarte[data-pfad="${p.id}"]`, hinweis: `Lauf den ${p.name} bis zum Ende – dann wartet die Schatztruhe.` }
             : { seite: "seiteAbenteuer", abenteuerTab: "pfade", hinweis: "Besiege zuerst einen Chef, dann öffnet sich ein Pfad." };
  }
  if (a.typ === "streicheln") {
    const tier = (spiel.haustiere || []).find(id => streichelnIn(id) === 0);
    return { seite: "seiteIch", ichTab: "tiere", ziel: tier ? `.haustierKarte[data-id="${tier}"]` : ".haustierKarte",
      hinweis: tier ? "Tippe das Haustier an und streichle es!" : "Gerade will kein Haustier gestreichelt werden – schau später wieder vorbei." };
  }
  return {};
}
