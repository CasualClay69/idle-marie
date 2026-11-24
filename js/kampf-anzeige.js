"use strict";
// =====================================================
//  ABENTEUER-SEITE: Kampf, Werte, Ausrüstung, Gebiete
// =====================================================

function prozent(x) { return `${Math.round(x * 100)} %`; }

// Unter-Reiter der Abenteuer-Seite (wird gemerkt)
const ABENTEUER_REITER = [["kampf", "⚔️", "Kampf"], ["ausruestung", "🎒", "Ausrüstung"], ["gebiete", "🗺️", "Gebiete"], ["pfade", "🧭", "Pfade"], ["jagd", "📋", "Aufträge"]];
let abenteuerTab = (() => { try { return localStorage.getItem("idleMarie-abenteuerTab") || "kampf"; } catch (e) { return "kampf"; } })();
function zeigeAbenteuerTab(teil) {
  abenteuerTab = teil;
  try { localStorage.setItem("idleMarie-abenteuerTab", teil); } catch (e) { /* egal */ }
  zeichneAbenteuer();
}

function zeichneAbenteuer() {
  const a = spiel.aktiv?.kampf ? spiel.aktiv : null;
  const m = a && MONSTER[a.monster];
  const w = spielerWerte(m);
  const seite = $("abenteuerInhalt");
  const ka = KAMPFARTEN[w.art];
  const figur = figurName();

  // ----- Kampf oder Ruhe -----
  let kampf;
  if (m) {
    kampf = `<div class="kampfFeld" style="--farbe:${GEBIETE.find(g => g.id === m.gebiet)?.farbe || aktuellesThema().farben[1]}">
      <div class="kaempfer">
        <div class="kBild figurRund">${figurSvg(spiel.figur)}</div>
        <b>${figur}</b>
        <div class="hpZeile">❤️ <span id="spielerHpText"></span></div>
        <div class="balken hp"><div id="spielerHp"></div></div>
        <div class="balken duenn takt"><div id="spielerTakt"></div></div>
      </div>
      <div class="gegen">⚔️</div>
      <div class="kaempfer">
        <div class="kBild" id="monsterBild"></div>
        <b>${m.name}${m.waechter ? " 🛡️" : m.chef ? " 👑" : ""}</b>
        <div class="hpZeile">Stufe ${m.stufe} · ❤️ <span id="monsterHpText"></span></div>
        <div class="balken hp monsterHp"><div id="monsterHp"></div></div>
        <div class="balken duenn takt"><div id="monsterTakt"></div></div>
      </div>
    </div>
    ${a.pfad ? (() => { const p = PFADE.find(x => x.id === a.pfad.id); return `<div class="pfadFortschritt"><b>🗺️ ${p.name}</b>
      <div class="pfadPunkte">${p.liste.map((id, i) => `<span class="${i < a.pfad.schritt ? "geschafft" : i === a.pfad.schritt ? "jetzt" : ""}${i === p.liste.length - 1 ? " waechter" : ""}">${i === p.liste.length - 1 ? "🧰" : i < a.pfad.schritt ? "💤" : i + 1}</span>`).join("")}</div></div>`; })() : ""}
    <ul id="kampfLog" class="kampfLog"></ul>
    <button id="weglaufen" class="knopf leise" type="button">🏃 Nach Hause gehen</button>`;
  } else {
    kampf = `<div class="ruheFeld"><div class="kBild figurRund">${figurSvg(spiel.figur)}</div>
      <div><b>${figur} ist bereit!</b><p>❤️ ${maxHp()} Herzen · Kampfstufe ${kampfStufe()}</p>
      <p class="hinweis">Tippe unten ein Monster an. ${figur} schubst es so lange, bis es müde wird und einschläft 💤.</p></div></div>`;
  }

  // ----- Kampfstil & Werte -----
  const stile = erlaubteStile(w.art).map(s => `<button type="button" class="stilKnopf${aktiverStil() === s.id ? " aktiv" : ""}" data-stil="${s.id}">
      <span>${s.icon}</span>${s.name}<small>${s.text}</small></button>`).join("");
  const gegnerTreff = m ? ` · Treffer gegen ${m.name}: <b>${prozent(trefferChance(w.genauigkeit, m.ausweichen))}</b>` : "";
  const dreieckText = m && w.dreieck ? `<p class="dreieckHinweis ${w.dreieck > 0 ? "gut" : "schlecht"}">${w.dreieck > 0
      ? `${ka.icon} Super! ${ka.name} ist stark gegen ${KAMPFARTEN[monsterArt(m)].icon}-Monster: +${prozent(w.dreieck)}`
      : `${KAMPFARTEN[monsterArt(m)].icon} Achtung: Dieses Monster ist stark gegen ${ka.name} (−${prozent(-w.dreieck)}). Probier eine andere Waffe!`}</p>` : "";
  const ohneMun = ka.munition && !munitionBereit(w.art) ? `<p class="dreieckHinweis schlecht">${ka.icon} Du hast keine ${ka.munition === "pfeile" ? "Pfeile" : "Zauberperlen"} gewählt – ohne sie bist du ganz schwach! Tippe in der 🎒 Ausrüstung auf ${ka.munition === "pfeile" ? "den Köcher" : "die Perlen"}.</p>` : "";
  const werte = `<div class="karte"><h3>🎯 Kampfstil <small>${ka.icon} ${ka.name}${w.art === "nah" ? "" : ` mit ${ka.waffe}`}</small></h3><div class="stile">${stile}</div>
    <p class="werte">💥 Stärkster Schlag: <b>${w.maxSchlag}</b> · 🛡️ Weniger Schaden: <b>${prozent(w.weniger)}</b>${gegnerTreff}</p>${dreieckText}${ohneMun}
    ${setsHtml(false)}
    <p class="hinweis">Die Waffe bestimmt die Kampfart: 🗡️ Schwert = Nahkampf, 🏹 Bogen = Fernkampf, 🪄 Zauberstab = Magie.</p></div>`;

  // ----- Ausrüstung & Essen -----
  const plaetze = PLAETZE.map(p => {
    const g = ausgeruestet(p.id);
    return `<button type="button" class="platz" data-platz="${p.id}">${g ? symbolHtml(g.id) : `<span class="platzLeer">${p.icon}</span>`}<small>${g ? g.name : p.name}</small></button>`;
  }).join("");
  const essen = spiel.essen && anzahl(spiel.essen) ? spiel.essen : null;
  const essenKnopf = `<button type="button" class="platz essenPlatz" data-platz="essen">${essen ? symbolHtml(essen) : `<span class="platzLeer">🍽️</span>`}
    <small>${essen ? `${GEGENSTAENDE[essen].name} ×${zahl(anzahl(essen))}` : "Essen wählen"}</small></button>`;
  const munKnopf = ka.munition ? (() => {
    const id = spiel.munition?.[ka.munition], da = id && anzahl(id) > 0;
    return `<button type="button" class="platz essenPlatz" data-platz="${ka.munition}">${da ? symbolHtml(id) : `<span class="platzLeer">${ka.munition === "pfeile" ? "➳" : "🔮"}</span>`}
      <small>${da ? `${GEGENSTAENDE[id].name} ×${zahl(anzahl(id))}` : ka.munition === "pfeile" ? "Pfeile wählen" : "Perlen wählen"}</small></button>`;
  })() : "";
  const ausruestung = `<div class="karte"><h3>🎒 Ausrüstung <small>${ka.icon} ${ka.name}</small></h3><div class="plaetze">${plaetze}${essenKnopf}${munKnopf}</div>
    <p class="hinweis">Schwert, Helm, Schild und Rüstung schmiedest du beim 🔨 Schmieden, Bögen und Pfeile beim 🪚 Schnitzen, Zauberstäbe und Zauberperlen beim 💍 Goldschmieden. ${figur} isst automatisch, wenn weniger als die Hälfte der Herzen übrig ist.</p></div>`;

  // ----- Gebiete -----
  const legende = `<p class="hinweis dreieckLegende">Jedes Monster kämpft auf seine Art (Zeichen oben links): ⚔️ Nahkampf · 🏹 Fernkampf · 🪄 Magie.
    ⚔️ ist stark gegen 🏹, 🏹 stark gegen 🪄, 🪄 stark gegen ⚔️. <b class="gut">Grün</b> = gut für deine Waffe, <b class="schlecht">rot</b> = schwer.</p>`;
  const gebiete = GEBIETE.map(g => `<div class="gebiet" style="--farbe:${g.farbe}">
      <h3>${g.icon} ${g.name} <small>empfohlen ab Kampfstufe ${g.ab}</small></h3>
      <div class="monsterListe">${g.monster.map(mo => `<button type="button" class="monsterKarte${a?.monster === mo.id ? " laeuft" : ""}${mo.chef ? " chef" : ""}" data-monster="${mo.id}">
        ${spiel.jagd?.auftrag?.monster === mo.id ? `<span class="mJagd" title="Dein Auftrag">📋</span>` : ""}
        <span class="mArt${dreieck(mo, w.art) > 0 ? " gut" : dreieck(mo, w.art) < 0 ? " schlecht" : ""}" title="${KAMPFARTEN[monsterArt(mo)].name}">${KAMPFARTEN[monsterArt(mo)].icon}</span>
        <span class="mBild">${monsterSvg(mo.aussehen)}</span><b>${mo.name}</b><small>Stufe ${mo.stufe}${spiel.besiegt?.[mo.id] ? ` · 💤 ${zahl(spiel.besiegt[mo.id])}` : ""}</small>
        <span class="mBeute">${(mo.beute || []).map(b => symbolHtml(b.id, "mini")).join("")}</span></button>`).join("")}</div>
      ${beuteTabelle(g.monster)}
    </div>`).join("");

  const sm = MONSTER.season, th = aktuellesThema();
  const seasonGebiet = `<div class="gebiet" style="--farbe:${th.farben[1]}">
      <h3>🎟️ Season: ${th.titel} <small>passt sich deiner Kampfstufe an · ⭐ ${SEASON.monsterPunkte} Season-Punkte pro Einschlafen</small></h3>
      <div class="monsterListe"><button type="button" class="monsterKarte chef${a?.monster === "season" ? " laeuft" : ""}" data-monster="season">
        <span class="mBild">${monsterSvg(sm.aussehen)}</span><b>${sm.name}</b><small>Stufe ${sm.stufe}</small>
        <span class="mBeute">${(sm.beute || []).map(b => symbolHtml(b.id, "mini")).join("")}</span></button></div>${beuteTabelle([sm])}</div>`;
  const pfade = `<p class="hinweis">Mehrere Monster hintereinander – ohne Ausruhen. Am Ende wartet ein Wächter und eine 🧰 Schatztruhe! Nimm genug Essen mit.</p>
    <div class="pfadListe">${PFADE.map(p => {
      const frei = pfadFrei(p), w = MONSTER[p.waechter], laeuft = a?.pfad?.id === p.id;
      return `<button type="button" class="pfadKarte${frei ? "" : " gesperrt"}${laeuft ? " laeuft" : ""}" data-pfad="${p.id}" style="--farbe:${GEBIETE.find(g => g.id === p.gebiet).farbe}">
        <span class="mBild">${monsterSvg(w.aussehen)}</span>
        <span class="pfadText"><b>${p.icon} ${p.name}</b><small>${p.liste.length - 1} Monster + Wächter ${w.name} (Stufe ${w.stufe})</small>
        <small>${frei ? (spiel.pfade?.[p.id] ? `🧰 ${zahl(spiel.pfade[p.id])}× geschafft` : "✨ Noch nie geschafft") : `🔒 Bring zuerst ${MONSTER[p.chef].name} zum Einschlafen`}</small></span></button>`;
    }).join("")}</div>`;
  const reiter = `<div class="ichReiter abenteuerReiter">${ABENTEUER_REITER.map(([id, icon, name]) =>
    `<button type="button" data-tab="${id}" class="${abenteuerTab === id ? "aktiv" : ""}"><span>${icon}</span>${name}${id === "kampf" && a ? " ●" : ""}</button>`).join("")}</div>`;
  const inhalt = { kampf: kampf + werte, ausruestung: ausruestung + setsHtml(true), gebiete: legende + seasonGebiet + gebiete, pfade, jagd: jagdHtml() }[abenteuerTab] || kampf + werte;
  seite.innerHTML = reiter + inhalt;
  for (const b of seite.querySelectorAll(".abenteuerReiter button")) b.addEventListener("click", () => { ton.klick(); zeigeAbenteuerTab(b.dataset.tab); $("inhalt").scrollTop = 0; });

  // ----- Knöpfe -----
  if (abenteuerTab === "jagd") verdrahteJagd(seite);
  verdrahteSets(seite);
  seite.querySelector("#weglaufen")?.addEventListener("click", () => {
    ton.klick(); stoppe(); ruheAus(); speichern(); zeichneAktivLeiste(); zeichneAbenteuer();
  });
  for (const b of seite.querySelectorAll(".stilKnopf")) b.addEventListener("click", () => {
    ton.klick(); spiel.kampfstil = b.dataset.stil; speichern(); zeichneAbenteuer();
  });
  for (const b of seite.querySelectorAll(".platz")) b.addEventListener("click", () => { ton.klick(); zeigePlatzWahl(b.dataset.platz); });
  for (const b of seite.querySelectorAll(".pfadKarte")) b.addEventListener("click", () => {
    const p = PFADE.find(x => x.id === b.dataset.pfad);
    if (!pfadFrei(p)) { ton.nein(); melde(`🔒 Bring zuerst ${MONSTER[p.chef].name} zum Einschlafen`); return; }
    if (spiel.aktiv?.pfad?.id === p.id) return;
    ton.klick();
    starteKampf(null, p.id);
    abenteuerTab = "kampf";
    speichern(); zeichneAktivLeiste(); zeichneAbenteuer();
    $("inhalt").scrollTop = 0;
  });
  for (const b of seite.querySelectorAll(".monsterKarte")) b.addEventListener("click", () => {
    const mo = MONSTER[b.dataset.monster];
    if (spiel.aktiv?.monster === mo.id) return;
    ton.klick();
    starteKampf(mo.id);
    abenteuerTab = "kampf";
    speichern(); zeichneAktivLeiste(); zeichneAbenteuer();
    $("inhalt").scrollTop = 0;
  });
  letzterLog = "";
  zeichneKampfLive();
}

// Wird jedes Bild aufgerufen: Herzen-Balken, Takt-Balken und Kampf-Notizen
let letzterLog = "";
function zeichneKampfLive() {
  const a = spiel.aktiv?.kampf ? spiel.aktiv : null;
  if (!a || !$("monsterHp")) return;
  const m = MONSTER[a.monster], jetzt = Date.now();
  $("spielerHp").style.width = prozent(spiel.hp / maxHp());
  $("spielerHpText").textContent = `${spiel.hp} / ${maxHp()}`;
  const mhp = a.pauseBis ? 0 : a.mhp;
  $("monsterHp").style.width = prozent(mhp / m.hp);
  $("monsterHpText").textContent = `${mhp} / ${m.hp}`;
  $("monsterBild").dataset.schlaeft = a.pauseBis ? "1" : "";
  const bild = a.pauseBis ? monsterSvg(m.aussehen, true) : monsterSvg(m.aussehen);
  if ($("monsterBild").dataset.svg !== String(!!a.pauseBis)) { $("monsterBild").innerHTML = bild; $("monsterBild").dataset.svg = String(!!a.pauseBis); }
  const takt = (naechster, tempo) => a.pauseBis ? "0%" : prozent(Math.max(0, Math.min(1, 1 - (naechster - jetzt) / (tempo * 1000))));
  $("spielerTakt").style.width = takt(a.spielerNaechster, spielerWerte().tempo);
  $("monsterTakt").style.width = takt(a.monsterNaechster, m.tempo);
  const log = (spiel.kampfLog || []).join("|");
  if (log !== letzterLog) {
    letzterLog = log;
    $("kampfLog").innerHTML = (spiel.kampfLog || []).map((z, i) => `<li style="opacity:${1 - i * 0.14}">${z}</li>`).join("");
  }
}

// ----- Ausrüstung / Essen wählen -----
function zeigePlatzWahl(platz) {
  const ziel = $("wahlInhalt");
  const istMun = platz === "pfeile" || platz === "perlen";
  const istEssen = platz === "essen" || istMun;
  const p = PLAETZE.find(x => x.id === platz);
  const ids = Object.keys(spiel.bank).filter(id => anzahl(id) > 0 &&
    (istMun ? GEGENSTAENDE[id].munition === platz : istEssen ? GEGENSTAENDE[id].heilt : GEGENSTAENDE[id].platz === platz));
  let html = `<h2>${platz === "pfeile" ? "➳ Pfeile für den Bogen" : platz === "perlen" ? "🔮 Zauberperlen" : istEssen ? "🍽️ Essen für den Kampf" : `${p.icon} ${p.name}`}</h2>`;
  const jetzt = istMun ? spiel.munition?.[platz] : istEssen ? spiel.essen : spiel.ausruestung[platz];
  if (jetzt && !istEssen) html += `<p>Jetzt: <b>${GEGENSTAENDE[jetzt].name}</b></p><button type="button" class="knopf leise" data-ab="1">Ablegen</button>`;
  if (!ids.length) html += `<p class="hinweis">${platz === "pfeile" ? "Du hast keine Pfeile. Schnitze welche beim 🪚 Schnitzen (Holz + Barren)!"
    : platz === "perlen" ? "Du hast keine Zauberperlen. Mach welche beim 💍 Goldschmieden aus Erz!"
    : istEssen ? "Du hast noch kein Essen. Koche Fisch beim 🍳 Kochen!"
    : platz === "waffe" ? "Du hast keine Waffe in der Bank. Schwerter gibt es beim 🔨 Schmieden, Bögen beim 🪚 Schnitzen und Zauberstäbe beim 💍 Goldschmieden!"
    : "Du hast nichts Passendes in der Bank. Schmiede etwas beim 🔨 Schmieden!"}</p>`;
  html += `<div class="wahlListe">${ids.map(id => {
    const g = GEGENSTAENDE[id];
    const ok = (istEssen && !istMun) || darfTragen(g);
    const info = istMun ? `💥 +${g.bonus.kraft} · ×${zahl(anzahl(id))}` : istEssen ? `heilt ${g.heilt} ❤️ · ×${zahl(anzahl(id))}`
      : g.schmuckText ? `✨ ${g.schmuckText}` : (g.kampfart ? `${KAMPFARTEN[g.kampfart].icon} ${KAMPFARTEN[g.kampfart].name} · ` : "") + [g.bonus.treff && `🎯 +${g.bonus.treff}`, g.bonus.kraft && `💥 +${g.bonus.kraft}`, g.bonus.abwehr && `🛡️ +${g.bonus.abwehr}`, g.bonus.weniger && `−${g.bonus.weniger} % Schaden`].filter(Boolean).join(" · ");
    const sperre = ok ? "" : ` · 🔒 ${Object.entries(g.braucht).map(([f, l]) => `${fertigkeit(f).name} ${l}`).join(", ")}`;
    return `<button type="button" class="wahlZeile${ok ? "" : " gesperrt"}${jetzt === id ? " aktiv" : ""}" data-id="${id}" ${ok ? "" : "disabled"}>${symbolHtml(id)}<span><b>${g.name}</b><small>${info}${sperre}</small></span></button>`;
  }).join("")}</div>`;
  ziel.innerHTML = html;
  ziel.querySelector("[data-ab]")?.addEventListener("click", () => {
    if (legeAb(platz)) { ton.klick(); } else melde("🏦 Kein Platz in der Bank");
    nachWahl();
  });
  for (const b of ziel.querySelectorAll(".wahlZeile")) b.addEventListener("click", () => {
    ton.klick();
    if (istMun) (spiel.munition = spiel.munition || {})[platz] = b.dataset.id;
    else if (istEssen) spiel.essen = b.dataset.id; else ruesteAus(b.dataset.id);
    nachWahl();
  });
  $("wahlOverlay").hidden = false;
}
function nachWahl() {
  $("wahlOverlay").hidden = true;
  speichern();
  zeichneSeite();
}

// ----- Wer lässt was fallen? (Tabelle unter jedem Gebiet) -----
let beuteOffen = (() => { try { return localStorage.getItem("idleMarie-beuteOffen") === "1"; } catch (e) { return false; } })();
function beuteTabelle(liste) {
  const zeilen = liste.map(m => {
    const tier = HAUSTIERE.find(h => h.chef === m.id);
    const sachen = (m.beute || []).map(b => `<span class="btDing">${symbolHtml(b.id, "mini")}<span><b>${GEGENSTAENDE[b.id].name}</b>
      <small>${Math.round(b.chance * 100)} % · ${b.anzahl[0] === b.anzahl[1] ? b.anzahl[0] : `${b.anzahl[0]}–${b.anzahl[1]}`} Stück</small></span></span>`).join("");
    return `<div class="btZeile${m.chef ? " chef" : ""}"><div class="btKopf"><span class="btBild">${monsterSvg(m.aussehen)}</span>
        <b>${m.name}${m.chef ? " 👑" : ""}</b><small>${muenzeHtml("muenze klein")} ${zahl(m.muenzen[0])}–${zahl(m.muenzen[1])}</small></div>
      <div class="btDinge">${sachen}${tier ? `<span class="btDing"><span class="btTier">${tier.emoji}</span><span><b>${tier.name} (${tier.tier})</b>
        <small>1 von ${Math.round(1 / HAUSTIER_REGEL.chefChance)} · Haustier${hatHaustier(tier.id) ? " ✅" : ""}</small></span></span>` : ""}</div></div>`;
  }).join("");
  return `<details class="beuteTabelle"${beuteOffen ? " open" : ""}><summary>💰 Wer lässt was fallen?</summary>${zeilen}</details>`;
}
// Auf- und Zuklappen merken (für alle Gebiete gleich)
document.addEventListener("toggle", e => {
  if (!e.target.classList?.contains("beuteTabelle")) return;
  beuteOffen = e.target.open;
  try { localStorage.setItem("idleMarie-beuteOffen", beuteOffen ? "1" : "0"); } catch (x) { /* egal */ }
}, true);
