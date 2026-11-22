"use strict";
// =====================================================
//  ABENTEUER-SEITE: Kampf, Werte, Ausrüstung, Gebiete
// =====================================================

function prozent(x) { return `${Math.round(x * 100)} %`; }

function zeichneAbenteuer() {
  const a = spiel.aktiv?.kampf ? spiel.aktiv : null;
  const m = a && MONSTER[a.monster];
  const w = spielerWerte();
  const seite = $("abenteuerInhalt");
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
  const stile = KAMPFSTILE.map(s => `<button type="button" class="stilKnopf${(spiel.kampfstil || "mut") === s.id ? " aktiv" : ""}" data-stil="${s.id}">
      <span>${s.icon}</span>${s.name}<small>${s.text}</small></button>`).join("");
  const gegnerTreff = m ? ` · Treffer gegen ${m.name}: <b>${prozent(trefferChance(w.genauigkeit, m.ausweichen))}</b>` : "";
  const werte = `<div class="karte"><h3>🎯 Kampfstil</h3><div class="stile">${stile}</div>
    <p class="werte">💥 Stärkster Schlag: <b>${w.maxSchlag}</b> · 🛡️ Weniger Schaden: <b>${prozent(w.weniger)}</b>${gegnerTreff}</p></div>`;

  // ----- Ausrüstung & Essen -----
  const plaetze = PLAETZE.map(p => {
    const g = ausgeruestet(p.id);
    return `<button type="button" class="platz" data-platz="${p.id}">${g ? symbolHtml(g.id) : `<span class="platzLeer">${p.icon}</span>`}<small>${g ? g.name : p.name}</small></button>`;
  }).join("");
  const essen = spiel.essen && anzahl(spiel.essen) ? spiel.essen : null;
  const essenKnopf = `<button type="button" class="platz essenPlatz" data-platz="essen">${essen ? symbolHtml(essen) : `<span class="platzLeer">🍽️</span>`}
    <small>${essen ? `${GEGENSTAENDE[essen].name} ×${zahl(anzahl(essen))}` : "Essen wählen"}</small></button>`;
  const ausruestung = `<div class="karte"><h3>🎒 Ausrüstung</h3><div class="plaetze">${plaetze}${essenKnopf}</div>
    <p class="hinweis">Ausrüstung schmiedest du beim 🔨 Schmieden aus Barren. ${figur} isst automatisch, wenn weniger als die Hälfte der Herzen übrig ist.</p></div>`;

  // ----- Gebiete -----
  const gebiete = GEBIETE.map(g => `<div class="gebiet" style="--farbe:${g.farbe}">
      <h3>${g.icon} ${g.name} <small>empfohlen ab Kampfstufe ${g.ab}</small></h3>
      <div class="monsterListe">${g.monster.map(mo => `<button type="button" class="monsterKarte${a?.monster === mo.id ? " laeuft" : ""}${mo.chef ? " chef" : ""}" data-monster="${mo.id}">
        <span class="mBild">${monsterSvg(mo.aussehen)}</span><b>${mo.name}</b><small>Stufe ${mo.stufe}${spiel.besiegt?.[mo.id] ? ` · 💤 ${zahl(spiel.besiegt[mo.id])}` : ""}</small></button>`).join("")}</div>
    </div>`).join("");

  const sm = MONSTER.season, th = aktuellesThema();
  const seasonGebiet = `<div class="gebiet" style="--farbe:${th.farben[1]}">
      <h3>🎟️ Season: ${th.titel} <small>passt sich deiner Kampfstufe an · ⭐ ${SEASON.monsterPunkte} Season-Punkte pro Einschlafen</small></h3>
      <div class="monsterListe"><button type="button" class="monsterKarte chef${a?.monster === "season" ? " laeuft" : ""}" data-monster="season">
        <span class="mBild">${monsterSvg(sm.aussehen)}</span><b>${sm.name}</b><small>Stufe ${sm.stufe}</small></button></div></div>`;
  const pfade = `<h2 class="seitenTitel">🧭 Abenteuer-Pfade</h2><p class="hinweis">Mehrere Monster hintereinander – ohne Ausruhen. Am Ende wartet ein Wächter und eine 🧰 Schatztruhe! Nimm genug Essen mit.</p>
    <div class="pfadListe">${PFADE.map(p => {
      const frei = pfadFrei(p), w = MONSTER[p.waechter], laeuft = a?.pfad?.id === p.id;
      return `<button type="button" class="pfadKarte${frei ? "" : " gesperrt"}${laeuft ? " laeuft" : ""}" data-pfad="${p.id}" style="--farbe:${GEBIETE.find(g => g.id === p.gebiet).farbe}">
        <span class="mBild">${monsterSvg(w.aussehen)}</span>
        <span class="pfadText"><b>${p.icon} ${p.name}</b><small>${p.liste.length - 1} Monster + Wächter ${w.name} (Stufe ${w.stufe})</small>
        <small>${frei ? (spiel.pfade?.[p.id] ? `🧰 ${zahl(spiel.pfade[p.id])}× geschafft` : "✨ Noch nie geschafft") : `🔒 Bring zuerst ${MONSTER[p.chef].name} zum Einschlafen`}</small></span></button>`;
    }).join("")}</div>`;
  seite.innerHTML = kampf + werte + ausruestung + pfade + `<h2 class="seitenTitel">🗺️ Gebiete</h2>` + seasonGebiet + gebiete;

  // ----- Knöpfe -----
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
    speichern(); zeichneAktivLeiste(); zeichneAbenteuer();
    $("inhalt").scrollTop = 0;
  });
  for (const b of seite.querySelectorAll(".monsterKarte")) b.addEventListener("click", () => {
    const mo = MONSTER[b.dataset.monster];
    if (spiel.aktiv?.monster === mo.id) return;
    ton.klick();
    starteKampf(mo.id);
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
  const istEssen = platz === "essen";
  const p = PLAETZE.find(x => x.id === platz);
  const ids = Object.keys(spiel.bank).filter(id => anzahl(id) > 0 &&
    (istEssen ? GEGENSTAENDE[id].heilt : GEGENSTAENDE[id].platz === platz));
  let html = `<h2>${istEssen ? "🍽️ Essen für den Kampf" : `${p.icon} ${p.name}`}</h2>`;
  const jetzt = istEssen ? spiel.essen : spiel.ausruestung[platz];
  if (jetzt && !istEssen) html += `<p>Jetzt: <b>${GEGENSTAENDE[jetzt].name}</b></p><button type="button" class="knopf leise" data-ab="1">Ablegen</button>`;
  if (!ids.length) html += `<p class="hinweis">${istEssen ? "Du hast noch kein Essen. Koche Fisch beim 🍳 Kochen!" : "Du hast nichts Passendes in der Bank. Schmiede etwas beim 🔨 Schmieden!"}</p>`;
  html += `<div class="wahlListe">${ids.map(id => {
    const g = GEGENSTAENDE[id];
    const ok = istEssen || darfTragen(g);
    const info = istEssen ? `heilt ${g.heilt} ❤️ · ×${zahl(anzahl(id))}`
      : g.schmuckText ? `✨ ${g.schmuckText}` : [g.bonus.treff && `🎯 +${g.bonus.treff}`, g.bonus.kraft && `💥 +${g.bonus.kraft}`, g.bonus.abwehr && `🛡️ +${g.bonus.abwehr}`, g.bonus.weniger && `−${g.bonus.weniger} % Schaden`].filter(Boolean).join(" · ");
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
    if (istEssen) spiel.essen = b.dataset.id; else ruesteAus(b.dataset.id);
    nachWahl();
  });
  $("wahlOverlay").hidden = false;
}
function nachWahl() {
  $("wahlOverlay").hidden = true;
  speichern();
  zeichneSeite();
}
