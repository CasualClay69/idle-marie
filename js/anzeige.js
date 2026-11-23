"use strict";
// =====================================================
//  ANZEIGE: baut die Seiten aus dem Spielstand
// =====================================================

const $ = id => document.getElementById(id);

// Große Zahlen kurz: 12.345 · 1,2 Mio. · 3,4 Mrd.
function zahl(n) {
  n = Math.floor(n);
  if (n < 1e6) return n.toLocaleString("de-DE");
  const stufen = [[1e12, "Bio."], [1e9, "Mrd."], [1e6, "Mio."]];
  for (const [w, name] of stufen) if (n >= w) return `${(n / w).toLocaleString("de-DE", { maximumFractionDigits: 1 })} ${name}`;
  return String(n);
}
function sekunden(s) {
  return `${s.toLocaleString("de-DE", { maximumFractionDigits: 2 })} s`;
}
function dauerText(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} Minute${min === 1 ? "" : "n"}`;
  const h = Math.floor(min / 60), m = min % 60;
  return `${h} Stunde${h === 1 ? "" : "n"}${m ? ` und ${m} Minute${m === 1 ? "" : "n"}` : ""}`;
}
function figurName() {
  return (FIGUREN.find(f => f.id === spiel.figur) || FIGUREN[0]).name;
}
function el(tag, klasse, html) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

// ----- Seitenwechsel -----
let aktuelleSeite = "seiteFertigkeiten";
let offeneFertigkeit = null;

function zeigeSeite(id) {
  aktuelleSeite = id;
  for (const s of document.querySelectorAll(".seite")) s.hidden = s.id !== id;
  const navZiel = id === "seiteFertigkeit" || id === "seiteSeason" ? "seiteFertigkeiten" : id;
  for (const b of document.querySelectorAll("#untenNav button")) b.classList.toggle("aktiv", b.dataset.seite === navZiel);
  $("inhalt").scrollTop = 0;
  zeichneSeite();
}
function zeichneSeite() {
  if (aktuelleSeite === "seiteFertigkeiten") zeichneFertigkeiten();
  if (aktuelleSeite === "seiteFertigkeit") zeichneFertigkeit();
  if (aktuelleSeite === "seiteAbenteuer") zeichneAbenteuer();
  if (aktuelleSeite === "seiteSeason") zeichneSeason();
  if (aktuelleSeite === "seiteBank") zeichneBank();
  if (aktuelleSeite === "seiteLaden") zeichneLaden();
  if (aktuelleSeite === "seiteIch") zeichneIch();
  if (aktuelleSeite === "seiteWiki") zeichneWiki();
}

// ----- Kopf -----
function zeichneKopf() {
  $("figurKnopf").innerHTML = figurSvg(spiel.figur);
  $("muenzAnzeige").innerHTML = `${muenzeHtml()}<b>${zahl(spiel.muenzen)}</b>`;
  $("navFigur").innerHTML = figurSvg(spiel.figur);
  const b = HAUSTIERE.find(h => h.id === spiel.begleiter && hatHaustier(h.id));
  $("begleiterKopf").hidden = !b;
  $("begleiterKopf").textContent = b ? b.emoji : "";
}

// ----- Leiste mit der laufenden Tätigkeit -----
function zeichneAktivLeiste() {
  const leiste = $("aktivLeiste");
  if (spiel.aktiv?.kampf) {
    const m = MONSTER[spiel.aktiv.monster];
    leiste.classList.remove("ruhe");
    $("aktivSymbol").innerHTML = monsterSvg(m.aussehen);
    const pfad = spiel.aktiv.pfad && PFADE.find(p => p.id === spiel.aktiv.pfad.id);
    $("aktivTitel").textContent = pfad ? `${figurName()} auf dem ${pfad.name} (${spiel.aktiv.pfad.schritt + 1}/${pfad.liste.length})` : `${figurName()} ist im Abenteuer: ${m.name}`;
    leiste.style.setProperty("--farbe", fertigkeit(aktiverStil()).farbe);
    return;
  }
  const t = spiel.aktiv && taetigkeitNachId(spiel.aktiv.id);
  leiste.classList.toggle("ruhe", !t);
  if (!t) {
    $("aktivSymbol").innerHTML = figurSvg(spiel.figur);
    $("aktivTitel").textContent = `${figurName()} macht gerade Pause – tippe eine Tätigkeit an!`;
    $("aktivBalken").style.width = "0%";
    return;
  }
  const f = fertigkeit(t.fertigkeit);
  $("aktivSymbol").innerHTML = t.kleidung ? `<span class="symbol kleidVorschau">${figurSvg(spiel.figur, { ...aussehen(), [t.kategorie]: t.kleidung })}</span>` : symbolHtml(Object.keys(t.gibt)[0]);
  $("aktivTitel").textContent = `${figurName()} ${f.tun}: ${t.name}`;
  leiste.style.setProperty("--farbe", f.farbe);
}
function zeichneAktivBalken() {
  $("aktivBalken").style.width = `${(aktivFortschritt() * 100).toFixed(1)}%`;
  if (aktuelleSeite === "seiteAbenteuer") zeichneKampfLive();
  zeichneGartenLive();
  const karte = spiel.aktiv && document.querySelector(`.taetigkeit[data-id="${spiel.aktiv.id}"] .balken > div`);
  if (karte) karte.style.width = `${(aktivFortschritt() * 100).toFixed(1)}%`;
}

// ----- Übersicht aller Fertigkeiten -----
function zeichneFertigkeiten() {
  zeichneSeasonBanner();
  zeichneGluecksKarte();
  zeichneFortschrittKnopf();
  $("gesamtStufe").textContent = `Gesamtstufe ${gesamtStufe()}`;
  const raster = $("fertigkeitenRaster");
  raster.textContent = "";
  let art = null;
  for (const f of FERTIGKEITEN) {
    if (f.art !== art) {
      art = f.art;
      raster.append(el("h3", "rasterTitel", { sammeln: "🧺 Sammeln", machen: "🛠️ Herstellen", kampf: "⚔️ Abenteuer" }[art]));
    }
    const xp = spiel.xp[f.id] || 0;
    const aktiv = spiel.aktiv && (spiel.aktiv.kampf ? f.id === aktiverStil() : taetigkeitNachId(spiel.aktiv.id).fertigkeit === f.id);
    const zu = (f.id === "sterne" && !sterneFrei()) || (f.id === "dorf" && !dorfFrei());
    const karte = el("button", "fertigkeitKarte" + (aktiv ? " laeuft" : "") + (zu ? " zu" : ""));
    karte.type = "button";
    karte.style.setProperty("--farbe", f.farbe);
    karte.dataset.id = f.id;
    karte.innerHTML = `<span class="fIcon">${f.icon}</span>
      <span class="fName">${f.name}</span>
      <span class="fStufe">${zu ? `🔒 nach dem ${f.id === "dorf" ? 2 : 1}. Pfad` : `Stufe <b>${stufeAusXp(xp)}</b> / ${SPIEL.maxStufe}`}</span>
      <span class="balken"><div style="width:${(fortschrittInStufe(xp) * 100).toFixed(1)}%"></div></span>
      ${aktiv ? `<span class="laeuftMarke">▶</span>` : ""}
      ${f.id === "garten" && reifeBeete() ? `<span class="laeuftMarke reifMarke">${reifeBeete()}</span>` : ""}`;
    karte.addEventListener("click", () => {
      ton.klick();
      if (f.art === "kampf") { zeigeSeite("seiteAbenteuer"); return; }
      if (zu) { melde(f.id === "dorf" ? "🏘️ Das Wichteldorf öffnet sich, wenn du zwei Abenteuer-Pfade geschafft hast." : "🔭 Die Sternenkunde öffnet sich, wenn du deinen ersten Abenteuer-Pfad geschafft hast."); return; }
      offeneFertigkeit = f.id; zeigeSeite("seiteFertigkeit");
    });
    raster.append(karte);
  }
}

// ----- Eine Fertigkeit mit ihren Tätigkeiten -----
function zeichneFertigkeit() {
  const f = fertigkeit(offeneFertigkeit);
  const xp = spiel.xp[f.id] || 0;
  const l = stufeAusXp(xp);
  const naechste = l < SPIEL.maxStufe ? XP_TABELLE[l + 1] : xp;
  let werkzeugText = "";
  if (f.werkzeug) {
    const w = WERKZEUGE[f.werkzeug], st = spiel.werkzeuge[f.werkzeug] || 0;
    werkzeugText = st ? `${w.icon} ${WERKZEUG_STUFEN[st - 1].name}-${w.name}: ${st * 5} % schneller`
                      : `${w.icon} Noch keine ${w.name} – im Laden gibt es eine!`;
  }
  const kopf = $("fertigkeitKopf");
  kopf.style.setProperty("--farbe", f.farbe);
  kopf.innerHTML = `<span class="fIcon gross">${f.icon}</span>
    <div class="fKopfText">
      <h2>${f.name}</h2>
      <div class="fStufe">Stufe <b>${l}</b> / ${SPIEL.maxStufe}</div>
      <div class="balken dick"><div style="width:${(fortschrittInStufe(xp) * 100).toFixed(1)}%"></div></div>
      <small>${zahl(xp)} / ${zahl(naechste)} EP${werkzeugText ? ` · ${werkzeugText}` : ""}</small>
    </div>`;

  const raster = $("taetigkeitenRaster");
  raster.textContent = "";
  raster.classList.toggle("garten", f.id === "garten");
  $("baumhausBereich").hidden = f.id !== "bauen";
  $("sternBereich").hidden = f.id !== "sterne";
  if (f.id === "sterne") zeichneSternBereich($("sternBereich"));
  if (f.id === "bauen") zeichneBaumhaus($("baumhausBereich"));
  raster.classList.toggle("dorfRaster", f.id === "dorf");
  if (f.id === "garten") { zeichneGarten(raster); return; }
  if (f.id === "dorf") { zeichneDorf(raster); return; }
  for (const t of taetigkeitenVon(f.id).sort((x, y) => x.stufe - y.stufe)) {
    const gesperrt = l < t.stufe;
    const aktiv = spiel.aktiv?.id === t.id;
    const karte = el("button", "taetigkeit" + (gesperrt ? " gesperrt" : "") + (aktiv ? " laeuft" : ""));
    karte.type = "button";
    karte.dataset.id = t.id;
    karte.style.setProperty("--farbe", f.farbe);
    const ausgabe = Object.keys(t.gibt)[0];
    const bild = t.kleidung ? `<span class="symbol kleidVorschau">${figurSvg(spiel.figur, { ...aussehen(), [t.kategorie]: t.kleidung })}</span>` : symbolHtml(ausgabe);
    if (gesperrt) {
      karte.innerHTML = `${bild}<span class="tName">${t.name}</span><span class="tSperre">🔒 ab Stufe ${t.stufe}</span>`;
    } else {
      const ue = spiel.uebung[t.id] || 0;
      const braucht = Object.entries(t.braucht || {}).map(([id, n]) =>
        `<span class="braucht${anzahl(id) < n ? " fehlt" : ""}">${symbolHtml(id, "mini")} ${n} <small>(${zahl(anzahl(id))})</small></span>`).join("");
      const genaeht = t.kleidung && (spiel.garderobe || []).includes(t.kleidung);
      if (genaeht) karte.classList.add("genaeht");
      karte.innerHTML = `${bild}
        <span class="tName">${t.name}${genaeht ? " ✓" : ""}</span>
        <span class="tWerte">✨ ${t.xp} EP · ⏱️ ${sekunden(dauer(t))}</span>
        ${genaeht ? `<span class="tBraucht">👗 im Kleiderschrank</span>` : braucht ? `<span class="tBraucht">${braucht}</span>` : `<span class="tBraucht">${symbolHtml(ausgabe, "mini")} in der Bank: ${zahl(anzahl(ausgabe))}</span>`}
        <span class="uebung" title="Übung">⭐ ${stufeAusXp(ue)} <span class="balken duenn"><div style="width:${(fortschrittInStufe(ue) * 100).toFixed(1)}%"></div></span></span>
        <span class="balken aktion"><div></div></span>`;
    }
    karte.addEventListener("click", () => tippeTaetigkeit(t));
    raster.append(karte);
  }
  raster.append(el("p", "hinweis", `⭐ <b>Übung:</b> Je öfter du etwas machst, desto besser wirst du darin. Alle 10 Übungs-Stufen gibt es öfter doppelte Ausbeute (+5 %). Mit ⭐ 99 bist du Meister und ${SPIEL.meisterSchneller * 100} % schneller.`));
  const ueKnopf = el("button", "knopf leise ueKnopf", `⭐ Übung bei ${f.name} ansehen`);
  ueKnopf.type = "button";
  ueKnopf.addEventListener("click", () => { ton.klick(); zeigeUebung(f.id); });
  raster.append(ueKnopf);
}

// ----- Bank -----
function zeigeGegenstand(id) {
  const g = GEGENSTAENDE[id];
  const n = anzahl(id);
  const inhalt = $("gegenstandInhalt");
  if (!n) { $("gegenstandOverlay").hidden = true; return; }
  inhalt.innerHTML = `<div class="gKopf"><span class="seltenRahmen${seltenKlasse(id)}" style="${seltenheitStil(id)}">${symbolHtml(id, "symbol gross")}</span><div><h2>${g.name}</h2>
      <span class="seltenName" style="${seltenheitStil(id)}">${SELTENHEITEN[seltenheit(id)].name}</span>
      <p>Du hast <b>${zahl(n)}</b> Stück · je ${muenzeHtml("muenze klein")} ${zahl(g.wert)}${g.heilt ? ` · heilt ${g.heilt} ❤️` : ""}</p></div></div>
    ${g.platz ? `<p class="hinweis">${g.schmuckText ? `✨ ${g.schmuckText} ` : ""}${[g.bonus.treff && `🎯 Treffen +${g.bonus.treff}`, g.bonus.kraft && `💥 Schlag +${g.bonus.kraft}`, g.bonus.abwehr && `🛡️ Ausweichen +${g.bonus.abwehr}`, g.bonus.weniger && `${g.bonus.weniger} % weniger Schaden`].filter(Boolean).join(" · ")}
      · braucht ${Object.entries(g.braucht).map(([f, l]) => `${fertigkeit(f).icon} ${fertigkeit(f).name} ${l}`).join(", ")}</p>
      <button type="button" class="knopf" id="anlegen" ${darfTragen(g) ? "" : "disabled"}>🎒 Anlegen</button>` : ""}
    ${g.trank ? `<p class="hinweis">🧪 ${g.trank.text} · wirkt ${g.trank.ladungen}-mal${spiel.traenke?.[id] ? ` · noch aktiv: ${spiel.traenke[id]}` : ""}</p>
      <button type="button" class="knopf" id="trinken">🧪 Trinken</button>` : ""}
    ${g.heilt ? `<button type="button" class="knopf" id="alsEssen">🍽️ Im Kampf essen${spiel.essen === id ? " ✓" : ""}</button>` : ""}
    <div class="verkaufKnoepfe"></div>`;
  inhalt.querySelector("#anlegen")?.addEventListener("click", () => {
    if (ruesteAus(id)) { ton.klick(); melde(`🎒 ${g.name} angelegt`); speichern(); zeichneSeite(); zeigeGegenstand(id); }
  });
  inhalt.querySelector("#trinken")?.addEventListener("click", () => {
    if (trinke(id)) { ton.stufe(); melde(`🧪 ${g.name} getrunken – ${g.trank.text}!`, "gross"); speichern(); zeichneTrankLeiste(); zeichneSeite(); zeigeGegenstand(id); }
  });
  inhalt.querySelector("#alsEssen")?.addEventListener("click", () => {
    ton.klick(); spiel.essen = id; melde(`🍽️ ${figurName()} nimmt ${g.name} mit ins Abenteuer`); speichern(); zeigeGegenstand(id);
  });
  const knoepfe = inhalt.querySelector(".verkaufKnoepfe");
  const gesehen = new Set();
  const mengen = [[1, "1"], [10, "10"], [Math.floor(n / 2), "Hälfte"], [n - 1, "Alle außer 1"], [n, "Alle"]]
    .filter(([m], i, a) => m > 0 && (i === a.length - 1 || m < n) && !gesehen.has(m) && gesehen.add(m));
  for (const [m, text] of mengen) {
    const b = el("button", "knopf", `Verkaufe ${text}<small>${muenzeHtml("muenze klein")} ${zahl(m * g.wert)}</small>`);
    b.type = "button";
    b.addEventListener("click", () => {
      const erloes = verkaufe(id, m);
      ton.muenze();
      melde(`💰 ${zahl(m)} × ${g.name} verkauft: +${zahl(erloes)} Münzen`);
      speichern();
      zeichneKopf();
      zeichneSeite();
      zeigeGegenstand(id);
    });
    knoepfe.append(b);
  }
  $("gegenstandOverlay").hidden = false;
}

// ----- Laden -----
function zeichneLaden() {
  const liste = $("ladenListe");
  liste.textContent = "";
  for (const [art, w] of Object.entries(WERKZEUGE)) {
    const st = spiel.werkzeuge[art] || 0;
    const naechstes = werkzeugNaechstes(art);
    const f = fertigkeit(w.fertigkeit);
    const karte = el("div", "ladenKarte");
    const jetzt = st ? `Du hast: ${WERKZEUG_STUFEN[st - 1].name}-${w.name} (${st * 5} % schneller)` : `Du hast noch keine ${w.name}.`;
    if (!naechstes) {
      karte.innerHTML = `<span class="lIcon">${w.icon}</span><div class="lText"><b>${w.name}</b><small>${jetzt}</small><small>🏆 Das beste Werkzeug!</small></div>`;
    } else {
      const zuNiedrig = stufe(f.id) < naechstes.stufe;
      karte.innerHTML = `<span class="lIcon">${w.icon}</span>
        <div class="lText"><b>${naechstes.name}-${w.name}</b><small>${jetzt}</small>
        <small>Neu: ${(st + 1) * 5} % schneller beim ${f.name}${zuNiedrig ? ` · 🔒 ab ${f.name}-Stufe ${naechstes.stufe}` : ""}</small></div>`;
      const b = el("button", "knopf kaufen", `${muenzeHtml("muenze klein")} ${zahl(naechstes.preis)}`);
      b.type = "button";
      b.disabled = zuNiedrig || spiel.muenzen < naechstes.preis;
      b.addEventListener("click", () => {
        if (kaufeWerkzeug(art) === "ok") {
          ton.stufe();
          melde(`🎉 Neue ${naechstes.name}-${w.name}!`);
          speichern(); zeichneKopf(); zeichneLaden();
        }
      });
      karte.append(b);
    }
    liste.append(karte);
  }
  const preis = bankFachPreis(spiel.bankFaecherGekauft);
  const fach = el("div", "ladenKarte", `<span class="lIcon">🏦</span><div class="lText"><b>Neues Bankfach</b>
    <small>Du hast ${bankFaecher()} Fächer. Jedes Fach hat Platz für eine Sorte – in beliebiger Menge.</small></div>`);
  const b = el("button", "knopf kaufen", `${muenzeHtml("muenze klein")} ${zahl(preis)}`);
  b.type = "button";
  b.disabled = spiel.muenzen < preis;
  b.addEventListener("click", () => {
    if (kaufeBankFach() === "ok") { ton.muenze(); melde("🏦 Ein Bankfach mehr!"); speichern(); zeichneKopf(); zeichneLaden(); }
  });
  fach.append(b);
  liste.append(fach);
  liste.append(el("p", "hinweis", "💡 Münzen bekommst du, wenn du in der Bank Sachen verkaufst."));
}

// ----- Ich -----
function zeichneFigurAuswahl(ziel, beimWaehlen) {
  ziel.textContent = "";
  for (const f of FIGUREN) {
    const b = el("button", "figurKarte" + (spiel.figur === f.id ? " gewaehlt" : ""), `${figurSvg(f.id)}<span>${f.name}</span>`);
    b.type = "button";
    b.addEventListener("click", () => beimWaehlen(f.id));
    ziel.append(b);
  }
}
// Unter-Reiter der Seite "Ich" (wird gemerkt)
let ichTab = (() => { try { return localStorage.getItem("idleMarie-ichTab") || "figur"; } catch (e) { return "figur"; } })();
function zeigeIchTab(teil) {
  ichTab = teil;
  try { localStorage.setItem("idleMarie-ichTab", teil); } catch (e) { /* egal */ }
  zeichneIch();
}

function zeichneIch() {
  for (const b of document.querySelectorAll("#ichReiter button")) b.classList.toggle("aktiv", b.dataset.teil === ichTab);
  for (const k of document.querySelectorAll("#seiteIch .ichTeil")) k.hidden = k.dataset.teil !== ichTab;
  if (ichTab === "figur") zeichneKleiderschrank();
  if (ichTab === "liste") { zeichneBestenliste(); ladeListe(); }
  if (ichTab === "tiere") zeichneHaustiere();
  if (ichTab === "erfolge") zeichneErfolge();
  zeichneFigurAuswahl($("figurAuswahlIch"), id => {
    ton.klick(); spiel.figur = id; speichern(); zeichneKopf(); zeichneAktivLeiste(); zeichneIch();
  });
  const st = spiel.statistik;
  const zeilen = [
    ["Gesamtstufe", gesamtStufe()],
    ["Erledigte Tätigkeiten", zahl(st.aktionen)],
    ["Verkaufte Sachen", zahl(st.verkauft)],
    ["Verdiente Münzen", zahl(st.verdient)],
    ["Eingeschlafene Monster 💤", zahl(st.besiegt || 0)],
    ["Geerntete Beete 🧺", zahl(st.geerntet || 0)],
    ["Getrunkene Tränke 🧪", zahl(st.getrunken || 0)],
    ["Haustiere 🐾", `${(spiel.haustiere || []).length} / ${HAUSTIERE.length}`],
    ["Erfolge 🏆", `${anzahlErfolge()} / ${ERFOLGE.length}`],
    ...FERTIGKEITEN.map(f => [`${f.icon} ${f.name}`, `Stufe ${stufe(f.id)} · ${zahl(spiel.xp[f.id] || 0)} EP`]),
  ];
  $("statistik").innerHTML = zeilen.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("");
  $("tonAn").checked = ton.an;
}

// ----- Kleine Meldungen unten -----
function melde(text, art = "") {
  const m = el("div", "meldung " + art, text);
  $("meldungen").append(m);
  while ($("meldungen").children.length > 3) $("meldungen").firstChild.remove();
  setTimeout(() => m.classList.add("weg"), 2600);
  setTimeout(() => m.remove(), 3200);
}

// ----- Offline-Zusammenfassung -----
function zeigeOffline(e) {
  const zeilen = [];
  for (const [fid, xp] of Object.entries(e.xp)) {
    const f = fertigkeit(fid);
    const neu = stufe(fid) - e.stufenVorher[fid];
    zeilen.push(`<li>${f.icon} <b>+${zahl(xp)} EP</b> ${f.name}${neu ? ` · <b class="hell">${neu === 1 ? "eine Stufe" : neu + " Stufen"} höher! 🎉</b>` : ""}</li>`);
  }
  for (const x of e.ereignisse || []) if (x.haustier) zeilen.push(`<li>🎉 <b>${x.haustier.emoji} ${x.haustier.name}</b> ist bei dir eingezogen!</li>`);
  const truhen = (e.ereignisse || []).filter(x => x.truhe).length;
  if (truhen) zeilen.push(`<li>🧰 <b>${truhen}</b> Schatztruhe${truhen === 1 ? "" : "n"} geöffnet!</li>`);
  if (e.besiegt) zeilen.push(`<li>💤 <b>${zahl(e.besiegt)}</b> Monster sind eingeschlafen · ${muenzeHtml("muenze klein")} +${zahl(e.muenzen || 0)}</li>`);
  for (const [id, n] of Object.entries(e.gewonnen)) zeilen.push(`<li>${symbolHtml(id, "mini")} <b>+${zahl(n)}</b> ${GEGENSTAENDE[id].name}</li>`);
  for (const [id, n] of Object.entries(e.verbraucht)) zeilen.push(`<li class="sanft">${symbolHtml(id, "mini")} −${zahl(n)} ${GEGENSTAENDE[id].name}</li>`);
  $("offlineTitel").textContent = `🌙 Du warst ${dauerText(e.weg)} weg …`;
  $("offlineInhalt").innerHTML = `<p>… und ${figurName()} hat fleißig weitergemacht:</p><ul class="offlineListe">${zeilen.join("")}</ul>
    ${e.gestoppt ? `<p class="hinweis">⏸️ Irgendwann ging es nicht weiter: ${e.gestoppt}.</p>` : ""}`;
  $("offlineOverlay").hidden = false;
}
