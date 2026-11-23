"use strict";
// =====================================================
//  WIKI – Anzeige
//  Alle Reiter außer "Spielregeln" werden aus den Spieldaten gebaut – neuer Inhalt
//  (neue Gegenstände, Monster, Haustiere, Fertigkeiten …) erscheint hier automatisch.
//  Jeder Artikel ist ein .wikiEintrag – die Suche findet alles, was darin steht.
// =====================================================

const WIKI_TABS = [
  { id: "guide",        name: "Guide",        icon: "🧭", html: () => wikiGuide() },
  { id: "regeln",       name: "Spielregeln",  icon: "📜", html: () => wikiRegeln() },
  { id: "fertigkeiten", name: "Fertigkeiten", icon: "🌟", html: () => wikiFertigkeiten() },
  { id: "gegenstaende", name: "Gegenstände",  icon: "🎒", html: () => wikiGegenstaende() },
  { id: "abenteuer",    name: "Abenteuer",    icon: "⚔️", html: () => wikiAbenteuer() },
  { id: "garten",       name: "Garten",       icon: "🌱", html: () => wikiGarten() },
  { id: "haustiere",    name: "Haustiere",    icon: "🐾", html: () => wikiHaustiere() },
  { id: "baumhaus",     name: "Baumhaus",     icon: "🏡", html: () => wikiBaumhaus() },
  { id: "aussehen",     name: "Aussehen",     icon: "👗", html: () => wikiAussehen() },
  { id: "erfolge",      name: "Erfolge",      icon: "🏆", html: () => wikiErfolge() },
  { id: "season",       name: "Season",       icon: "🎟️", html: () => wikiSeason() },
];
let wikiTab = (() => { try { return localStorage.getItem("idleMarie-wikiTab") || "guide"; } catch (e) { return "guide"; } })();
let wikiArt = BANK_ARTEN[0].id;   // Unter-Auswahl bei Gegenstände
let wikiZurueck = "seiteFertigkeiten";

// ----- Bausteine -----
const wName = n => String(n).replaceAll("­", "");
const wEintrag = (id, kopf, inhalt, klasse = "") => `<article class="karte wikiEintrag${klasse}" id="w-${id}"><h3>${kopf}</h3>${inhalt}</article>`;
const wSym = id => (GEGENSTAENDE[id] ? symbolHtml(id, "mini") : "");
const wSachen = obj => Object.entries(obj || {}).map(([id, n]) => `${wSym(id)} ${n}× ${wName(GEGENSTAENDE[id]?.name || id)}`).join(", ");
const wZeile = (stufeText, name, info, offen = true) =>
  `<div class="wikiZeile${offen ? "" : " zu"}"><span class="wStufe">${stufeText}</span><span class="wName">${name}</span><small>${info}</small></div>`;
const wHaken = ja => (ja ? `<span class="wJa">✅</span>` : "");
const ART_NAMEN = { sammeln: "Sammeln", machen: "Herstellen", kampf: "Kampf" };

// Woher kommt ein Gegenstand, wofür braucht man ihn? (einmal ausrechnen)
function wikiIndex() {
  if (wikiIndex.fertig) return wikiIndex.fertig;
  const her = {}, nutz = {};
  const dazu = (m, id, text) => { m[id] = m[id] || []; if (!m[id].includes(text)) m[id].push(text); };
  for (const t of TAETIGKEITEN) {
    const f = fertigkeit(t.fertigkeit);
    for (const id of Object.keys(t.gibt || {})) dazu(her, id, `${f.icon} ${wName(f.name)} ab Stufe ${t.stufe}`);
    for (const [id, n] of Object.entries(t.braucht || {})) dazu(nutz, id, `${f.icon} ${wName(t.name)} (${n}×)`);
  }
  for (const p of PFLANZEN) {
    dazu(her, p.ertrag, `🌱 Gärtnern ab Stufe ${p.stufe} (${p.menge[0]}–${p.menge[1]} pro Ernte)`);
    dazu(her, p.samen, `🛍️ Samen-Laden im Garten (${zahl(GEGENSTAENDE[p.samen].preis)} Münzen)`);
    dazu(her, p.samen, "🌱 Manchmal beim Ernten zurück");
    dazu(nutz, p.samen, `🌱 Einpflanzen: ${p.name}`);
  }
  for (const m of Object.values(MONSTER)) for (const b of m.beute || []) {
    if (m.id === "season") continue;
    dazu(her, b.id, `💤 ${wName(m.name)} (${Math.round(b.chance * 100)} %)`);
  }
  for (const p of PFADE) for (const s of p.truhe.sachen) dazu(her, s.id, `🧰 Schatztruhe: ${p.name}`);
  EDELSTEINE.forEach((e, i) => dazu(her, `stein${i}`, `⛏️ Bergbau: ${Math.round(SCHMUCK.edelsteinChance * 100)} % Glück bei ${GEGENSTAENDE[`erz${i}`].name}`));
  BAU_STUFEN.forEach((s, k) => {
    dazu(nutz, `brett${s.brett}`, `🏡 Baumhaus: ${s.vorsilbe}-Stufe (${s.bretter}× je Platz)`);
    if (s.barrenAnzahl) dazu(nutz, `barren${s.barren}`, `🏡 Baumhaus: ${s.vorsilbe}-Stufe (${s.barrenAnzahl}× je Platz)`);
  });
  for (const id of Object.keys(GEGENSTAENDE)) {
    const g = GEGENSTAENDE[id];
    if (g.heilt) dazu(nutz, id, "🍽️ Essen im Abenteuer und für Haustiere");
    if (g.platz) dazu(nutz, id, "⚔️ Anlegen im Abenteuer");
    if (g.trank) dazu(nutz, id, "🧪 Trinken in der Bank");
  }
  return (wikiIndex.fertig = { her, nutz });
}

// ===================== GUIDE =====================
function wikiGuide() {
  pruefeGuide();
  const r = route(), geschafft = r.filter(schrittErledigt).length, p = guideProzent();
  const n = naechsterGuideSchritt();
  let html = `<div class="karte guideKopf"><h3>🧭 Dein Weg zu 100 %</h3>
    <div class="balken dick"><div style="width:${p}%"></div></div>
    <p class="guideZahl"><b>${p} %</b> · ${geschafft} von ${r.length} Schritten geschafft</p>`;
  if (n) {
    const w = schrittWert(n);
    html += `<div class="guideNaechster"><small>Als Nächstes</small><b>${n.titel}</b><span>${n.text}</span>
      ${n.ziel > 1 ? `<div class="balken duenn"><div style="width:${(w / n.ziel * 100).toFixed(1)}%"></div></div><small>${zahl(w)} / ${zahl(n.ziel)}</small>` : ""}
      <button type="button" class="knopf" id="guideZeig">🧭 Zeig mir wo</button></div>`;
  } else html += `<div class="guideNaechster"><b>👑 Alles geschafft!</b><span>Du hast 100 % erreicht.</span></div>`;
  html += `<p class="hinweis">Das ist der beste Weg vom Start bis 100 %. Geschaffte Schritte werden von allein abgehakt – auch wenn du sie früher erledigst. Der 🧭 Kompass unten rechts zeigt dir immer, was du als Nächstes tun solltest.</p></div>`;
  for (const k of guideKapitel()) {
    const fertig = k.schritte.filter(schrittErledigt).length;
    html += `<details class="karte guideKapitel"${k.schritte.includes(n) ? " open" : ""}>
      <summary>${fertig === k.schritte.length ? "✅" : "📜"} ${k.name} <small>${fertig} / ${k.schritte.length}</small></summary><ol>`
      + k.schritte.map(s => {
        const ok = schrittErledigt(s);
        return `<li class="guideSchritt wikiEintrag${ok ? " erledigt" : ""}${s === n ? " jetzt" : ""}"><span class="gHaken">${ok ? "✅" : s === n ? "👉" : "⚪"}</span>
          <div><b>${s.titel}</b><small>${s.text}</small></div></li>`;
      }).join("") + `</ol></details>`;
  }
  return html;
}

// ===================== SPIELREGELN =====================
function wikiRegeln() {
  return WIKI_REGELN.map(a => wEintrag(`r-${a.id}`, `${a.icon} ${a.titel}`, a.text())).join("");
}

// ===================== FERTIGKEITEN =====================
const KAMPF_TEXTE = {
  mut: "Mut lässt dich öfter treffen. Du übst ihn mit dem Kampfstil „⚔️ Mutig“. Für Schwerter brauchst du Mut.",
  kraft: "Kraft macht deinen Schlag stärker – Monster schlafen schneller ein. Du übst sie mit dem Kampfstil „💪 Kräftig“.",
  schutz: "Schutz lässt dich öfter ausweichen. Du übst ihn mit dem Kampfstil „🛡️ Vorsichtig“. Für Helm, Schild und Rüstung brauchst du Schutz.",
  herzen: () => `Herzen sind deine Lebenspunkte (Stufe × ${KAMPF.hpProStufe}). Sie steigen bei jedem Kampf mit und beginnen bei Stufe 10.`,
};
function wikiFertigkeiten() {
  return FERTIGKEITEN.map(f => {
    const L = stufe(f.id);
    let inhalt = `<p class="wikiMeta">${ART_NAMEN[f.art]} · Deine Stufe: <b>${L}</b> / ${SPIEL.maxStufe}${f.werkzeug ? ` · Werkzeug: ${WERKZEUGE[f.werkzeug].icon} ${WERKZEUGE[f.werkzeug].name}` : ""}</p>`;
    if (f.art === "kampf") {
      const t = KAMPF_TEXTE[f.id];
      inhalt += `<p>${typeof t === "function" ? t() : t || ""}</p>`;
    } else if (f.id === "garten") {
      inhalt += PFLANZEN.map(p => wZeile(p.stufe, `${wSym(p.ertrag)} ${p.name}`, `${zahl(p.xp)} EP · ${p.minuten} min · ${p.menge[0]}–${p.menge[1]} Stück`, p.stufe <= L)).join("");
    } else {
      inhalt += TAETIGKEITEN.filter(t => t.fertigkeit === f.id).map(t => {
        const gibt = Object.keys(t.gibt || {})[0];
        const bild = gibt ? wSym(gibt) : t.kleidung ? (teilNachId(t.kleidung)?.icon || "👗") : "";
        return wZeile(t.stufe, `${bild} ${wName(t.name)}`, `${zahl(t.xp)} EP · ${sekunden(t.zeit)}${t.braucht && Object.keys(t.braucht).length ? ` · braucht ${wSachen(t.braucht)}` : ""}`, t.stufe <= L);
      }).join("");
    }
    return wEintrag(`f-${f.id}`, `${f.icon} ${wName(f.name)}`, inhalt);
  }).join("");
}

// ===================== GEGENSTÄNDE =====================
function wikiGegenstand(id) {
  const g = GEGENSTAENDE[id], s = SELTENHEITEN[seltenheit(id)];
  const { her, nutz } = wikiIndex();
  const wirkung = [];
  if (g.heilt) wirkung.push(`❤️ Heilt ${g.heilt} Herzen`);
  if (g.trank) wirkung.push(`🧪 ${g.trank.text} · ${g.trank.ladungen} Ladungen`);
  if (g.schmuckText) wirkung.push(`💍 ${g.schmuckText}`);
  if (g.platz && g.bonus && !g.schmuck) {
    const b = g.bonus, t = [];
    if (b.treff) t.push(`Treffen +${b.treff}`);
    if (b.kraft) t.push(`Schlag +${b.kraft}`);
    if (b.abwehr) t.push(`Abwehr +${b.abwehr}`);
    if (b.weniger) t.push(`${b.weniger} weniger Schaden`);
    if (t.length) wirkung.push(`🛡️ ${t.join(" · ")}`);
  }
  if (g.braucht) wirkung.push(`Zum Anlegen: ${Object.entries(g.braucht).map(([f, l]) => `${wName(fertigkeit(f).name)} ${l}`).join(", ")}`);
  const liste = (a, max) => a.slice(0, max).join("<br>") + (a.length > max ? `<br>… und ${a.length - max} mehr` : "");
  return `<article class="karte wikiEintrag wikiDing" id="w-g-${id}">
    <div class="wDingKopf"><span class="seltenRahmen${seltenKlasse(id)}" style="${seltenheitStil(id)}">${symbolHtml(id)}</span>
      <div><h3>${wName(g.name)}</h3><span class="seltenName" style="${seltenheitStil(id)}">${s.name}</span>
      <small class="wikiMeta">${muenzeHtml("muenze klein")} ${zahl(g.wert)} · du hast ${zahl(anzahl(id))}</small></div></div>
    ${wirkung.length ? `<p>${wirkung.join("<br>")}</p>` : ""}
    ${her[id] ? `<p><b>So bekommst du es:</b><br>${liste(her[id], 6)}</p>` : ""}
    ${nutz[id] ? `<p><b>Brauchst du für:</b><br>${liste(nutz[id], 8)}</p>` : ""}</article>`;
}
function wikiGegenstaende(alle = false) {
  const ids = Object.keys(GEGENSTAENDE);
  const chips = `<div class="wikiChips">${BANK_ARTEN.map(a => `<button type="button" data-art="${a.id}" class="${wikiArt === a.id ? "aktiv" : ""}">${a.icon} ${a.name}</button>`).join("")}</div>`;
  const zeigen = alle ? ids : ids.filter(id => bankArt(id).art.id === wikiArt);
  return (alle ? "" : chips) + zeigen.map(wikiGegenstand).join("");
}

// ===================== ABENTEUER =====================
function wikiMonsterZeile(m) {
  const mal = spiel.besiegt?.[m.id] || 0;
  const tier = HAUSTIERE.find(h => h.chef === m.id);
  const beute = (m.beute || []).map(b => `${wSym(b.id)} ${Math.round(b.chance * 100)} %`).join(" ");
  return `<div class="wikiMonster${mal ? "" : " neu"}"><span class="wMonster">${monsterSvg(m.aussehen)}</span>
    <div><b>${wName(m.name)}</b>${m.waechter ? " <small>(Pfad-Wächter)</small>" : m.chef ? " <small>(Chef)</small>" : ""}
    <small>Stufe ${m.stufe} · ❤️ ${zahl(m.hp)} · 💥 bis ${m.maxSchlag} · ${muenzeHtml("muenze klein")} ${zahl(m.muenzen[0])}–${zahl(m.muenzen[1])}</small>
    ${beute ? `<small>Beute: ${beute}</small>` : ""}${tier ? `<small>Haustier: ${tier.emoji} ${tier.name} (1 von ${Math.round(1 / HAUSTIER_REGEL.chefChance)})</small>` : ""}
    <small>${mal ? `💤 ${zahl(mal)}× eingeschlafen` : "Noch nie eingeschlafen"}</small></div></div>`;
}
function wikiAbenteuer() {
  let html = wEintrag("r-kampf2", "⚔️ So funktioniert der Kampf", WIKI_REGELN.find(r => r.id === "kampf").text());
  for (const g of GEBIETE) {
    html += wEintrag(`a-${g.id}`, `${g.icon} ${g.name} <small>ab Kampfstufe ${g.ab}</small>`, g.monster.map(wikiMonsterZeile).join(""));
  }
  html += wEintrag("a-ausruestung", "🛡️ Ausrüstung aus Barren", ERZE.map((erz, i) => {
    const w = id => GEGENSTAENDE[id].bonus;
    const sw = w(`schwert${i}`);
    const abwehr = ["helm", "schild", "ruestung"].map(a => w(`${a}${i}`).abwehr).join(" / ");
    return wZeile(STUFEN[i], `${wSym(`schwert${i}`)} ${erz}`, `Schwert: Treffen +${sw.treff}, Schlag +${sw.kraft} · Helm/Schild/Rüstung: Abwehr ${abwehr}`, stufe("schmieden") >= STUFEN[i]);
  }).join("") + `<p class="hinweis">Die Zahl vorne ist die Stufe, die du zum Anlegen brauchst (Mut fürs Schwert, Schutz für den Rest).</p>`);
  for (const p of PFADE) {
    const chef = MONSTER[p.chef];
    const mal = spiel.pfade?.[p.id] || 0;
    html += wEintrag(`a-${p.id}`, `${p.icon} ${p.name} ${wHaken(mal)}`,
      `<p class="wikiMeta">Frei, wenn ${wName(chef.name)} einmal eingeschlafen ist · ${p.liste.length} Monster hintereinander · ${mal ? `${zahl(mal)}× geschafft` : "noch nicht geschafft"}</p>
      ${wikiMonsterZeile(MONSTER[p.waechter])}
      <p><b>In der Schatztruhe:</b><br>${muenzeHtml("muenze klein")} ${zahl(p.truhe.muenzen[0])}–${zahl(p.truhe.muenzen[1])} Münzen<br>
      ${p.truhe.sachen.map(s => `${wSym(s.id)} ${s.anzahl[0]}–${s.anzahl[1]}× ${wName(GEGENSTAENDE[s.id].name)}`).join("<br>")}<br>
      🖼️ ${Math.round(PFAD_REGEL.rahmenChance * 100)} % ${wName(teilNachId(p.rahmenId)?.name || "Pfad-Rahmen")} · 🦜 1 von ${Math.round(1 / PFAD_REGEL.kikiChance)} Papagei Kiki</p>`);
  }
  return html;
}

// ===================== GARTEN & TRÄNKE =====================
function wikiGarten() {
  const L = stufe("garten");
  let html = wEintrag("r-garten2", "🌱 So funktioniert der Garten", WIKI_REGELN.find(r => r.id === "garten").text()
    + `<p><b>Neue Beete:</b> ${GARTEN.beetPreise.map(zahl).join(" · ")} Münzen – dazu bis zu 3 Beete mit dem 🌷 Blumenkasten im Baumhaus.</p>`);
  for (const [art, titel] of [["gemuese", "🥕 Gemüse"], ["kraut", "🌿 Kräuter"], ["faser", "☁️ Fasern"]]) {
    html += wEintrag(`g-${art}`, titel, PFLANZEN.filter(p => p.art === art).map(p =>
      wZeile(p.stufe, `${wSym(p.ertrag)} ${p.name}`, `${p.minuten} min · ${p.menge[0]}–${p.menge[1]} Stück · ${zahl(p.xp)} EP · Samen ${zahl(GEGENSTAENDE[p.samen].preis)} Münzen`, p.stufe <= L)).join(""));
  }
  html += wEintrag("g-traenke", "🧪 Alle Tränke", TRAENKE.map((t, i) => {
    const ta = TAETIGKEITEN.find(x => x.id === `traenke-${i}`);
    return wZeile(ta.stufe, `${wSym(t.id)} ${t.name}`, `${t.text} · ${t.ladungen} Ladungen · braucht ${wSachen(ta.braucht)}`, stufe("traenke") >= ta.stufe);
  }).join(""));
  return html;
}

// ===================== HAUSTIERE =====================
function haustierQuelle(h) {
  if (h.season) return `🎟️ Season ${MONATSNAMEN[h.season - 1]}: Stufe ${SEASON.stufen}`;
  if (h.start) return "📜 Belohnung für einen frühen Auftrag";
  if (h.chef) return `💤 ${wName(MONSTER[h.chef].name)} (Chef): 1 von ${Math.round(1 / HAUSTIER_REGEL.chefChance)}`;
  if (h.truhe) return `🧰 Schatztruhen der Pfade: 1 von ${Math.round(1 / PFAD_REGEL.kikiChance)}`;
  if (h.fertigkeit === "garten") return `🌱 Beim Ernten: 1 von ${Math.round(1 / HAUSTIER_REGEL.gartenChance)}`;
  if (h.fertigkeit) return `${fertigkeit(h.fertigkeit).icon} Beim ${wName(fertigkeit(h.fertigkeit).name)}: im Schnitt nach ${Math.round(HAUSTIER_REGEL.sekundenProFund / 3600)} Stunden Arbeit`;
  return "";
}
function wikiHaustiere() {
  let html = wEintrag("r-haustiere2", "🐾 Haustiere finden und pflegen", WIKI_REGELN.find(r => r.id === "haustiere").text());
  html += HAUSTIERE.map(h => {
    const hat = hatHaustier(h.id);
    return `<article class="karte wikiEintrag wikiTier${hat ? "" : " neu"}" id="w-t-${h.id}"><span class="wTierBild">${h.emoji}</span>
      <div><h3>${h.name} <small>${h.tier}</small> ${wHaken(hat)}</h3><small>${h.text}${hat ? ` · Stufe ${tierStufe(h.id)} / ${PFLEGE.maxStufe}` : ""}</small><small>${haustierQuelle(h)}</small></div></article>`;
  }).join("");
  return html;
}

// ===================== BAUMHAUS =====================
function wikiBaumhaus() {
  let html = wEintrag("r-baumhaus2", "🏡 So funktioniert das Baumhaus", WIKI_REGELN.find(r => r.id === "baumhaus").text()
    + BAU_STUFEN.map((s, k) => wZeile(s.bauen, `${"⭐".repeat(k + 1)} ${s.vorsilbe}`, `${wSym(`brett${s.brett}`)} ${s.bretter} Bretter${s.barrenAnzahl ? ` · ${wSym(`barren${s.barren}`)} ${s.barrenAnzahl} Barren` : ""} · ${muenzeHtml("muenze klein")} ${zahl(s.muenzen)}`, stufe("bauen") >= s.bauen)).join("")
    + `<p class="hinweis">Die Zahl vorne ist die Bauen-Stufe, die du brauchst. Plattform, Leiter, Blumenkasten und Hängematte brauchen keine Barren.</p>`);
  html += BAUPLAETZE.map(p => {
    const jetzt = spiel.baumhaus?.[p.id] || 0;
    return wEintrag(`b-${p.id}`, `${p.emoji} ${p.name} <small>${jetzt ? `${BAU_STUFEN[jetzt - 1].vorsilbe}-Stufe` : "noch nicht gebaut"}</small>`,
      BAU_STUFEN.map((s, k) => wZeile(k + 1, s.vorsilbe, bauBonusText(p, k), jetzt > k)).join(""));
  }).join("");
  return html;
}

// ===================== AUSSEHEN =====================
function teilQuelle(t) {
  const genaeht = TAETIGKEITEN.find(x => x.kleidung === t.id);
  if (t.gratis) return "Hast du von Anfang an";
  if (genaeht) return `🧵 Nähen ab Stufe ${genaeht.stufe}: ${wSachen(genaeht.braucht)}`;
  if (t.season) return `🎟️ Season ${MONATSNAMEN[t.season - 1]}`;
  if (t.pfad) return `🧰 Schatztruhe: ${t.pfad} (${Math.round(PFAD_REGEL.rahmenChance * 100)} %)`;
  if (t.questNr) return `📜 Belohnung für Auftrag ${t.questNr}`;
  if (t.quest) return `📜 Belohnung: ${t.quest}`;
  if (t.preis) return `${muenzeHtml("muenze klein")} ${zahl(t.preis)} Münzen im Kleiderschrank`;
  return "";
}
function wikiAussehen() {
  return KLEIDERSCHRANK.map(k => {
    const teile = k.teile;
    const hat = teile.filter(besitztTeil).length;
    return wEintrag(`k-${k.id}`, `${k.icon} ${k.name} <small>${hat} / ${teile.length}</small>`,
      teile.map(t => `<div class="wikiZeile${besitztTeil(t) ? "" : " zu"}"><span class="wStufe">${t.icon}</span><span class="wName">${t.name} ${wHaken(besitztTeil(t))}</span><small>${teilQuelle(t)}</small></div>`).join(""));
  }).join("");
}

// ===================== ERFOLGE =====================
function wikiErfolge() {
  return wEintrag("e-alle", `🏆 Alle Erfolge <small>${anzahlErfolge()} / ${ERFOLGE.length}</small>`, ERFOLGE.map(e => {
    const ok = erfolgErreicht(e);
    let w = 0; try { w = e.wert(); } catch (x) { /* egal */ }
    return `<div class="wikiZeile${ok ? "" : " zu"}"><span class="wStufe">${e.icon}</span><span class="wName">${e.name} ${wHaken(ok)}</span>
      <small>${e.text} · ${muenzeHtml("muenze klein")} ${zahl(e.muenzen)}${ok ? "" : ` · ${zahl(Math.min(w, e.ziel))} / ${zahl(e.ziel)}`}</small></div>`;
  }).join(""));
}

// ===================== SEASON =====================
function wikiSeason() {
  const monat = new Date().getMonth() + 1;
  let html = wEintrag("r-season2", "🎟️ So funktioniert der Season-Pass", WIKI_REGELN.find(r => r.id === "season").text());
  html += wEintrag("s-themen", "📅 Alle Seasons im Jahr", SEASON_THEMEN.map(t => {
    const tier = HAUSTIERE.find(h => h.id === t.haustierId);
    return `<div class="wikiZeile${t.monat === monat ? " jetzt" : ""}"><span class="wStufe">${t.icon}</span><span class="wName">${MONATSNAMEN[t.monat - 1]}: ${t.titel}${t.monat === monat ? " <small>(jetzt)</small>" : ""}</span>
      <small>Monster: ${wName(t.monster.name)} · Haustier: ${tier ? `${tier.emoji} ${tier.name} – ${tier.text}` : ""} ${wHaken(tier && hatHaustier(tier.id))}</small></div>`;
  }).join(""));
  return html;
}

// ===================== SEITE =====================
function zeichneWiki() {
  const suche = $("wikiSuche").value.trim().toLowerCase();
  $("wikiReiter").innerHTML = WIKI_TABS.map(t => `<button type="button" data-tab="${t.id}" class="${!suche && wikiTab === t.id ? "aktiv" : ""}"><span>${t.icon}</span>${t.name}</button>`).join("");
  for (const b of $("wikiReiter").querySelectorAll("button")) b.addEventListener("click", () => {
    ton.klick(); wikiTab = b.dataset.tab; $("wikiSuche").value = "";
    try { localStorage.setItem("idleMarie-wikiTab", wikiTab); } catch (e) { /* egal */ }
    zeichneWiki(); $("inhalt").scrollTop = 0;
  });
  const ziel = $("wikiInhalt");
  if (suche.length >= 2) {
    // Suche: alle Reiter bauen und die passenden Artikel zeigen
    const vorlage = document.createElement("div");
    vorlage.innerHTML = WIKI_TABS.map(t => (t.id === "gegenstaende" ? wikiGegenstaende(true) : t.html())).join("");
    const treffer = [...vorlage.querySelectorAll(".wikiEintrag")].filter(e => e.textContent.toLowerCase().includes(suche));
    ziel.innerHTML = `<p class="hinweis">${treffer.length ? `${treffer.length} Treffer für „${textSicher(suche)}“` : `Nichts gefunden für „${textSicher(suche)}“.`}</p>`;
    for (const t of treffer.slice(0, 60)) { t.classList.add("karte"); t.removeAttribute("open"); ziel.append(t); }
    return;
  }
  const tab = WIKI_TABS.find(t => t.id === wikiTab) || WIKI_TABS[0];
  ziel.innerHTML = tab.html();
  ziel.querySelector("#guideZeig")?.addEventListener("click", kompass);
  for (const b of ziel.querySelectorAll(".wikiChips button")) b.addEventListener("click", () => { ton.klick(); wikiArt = b.dataset.art; zeichneWiki(); });
}

function richteWikiSeiteEin() {
  let uhr = 0;
  $("wikiSuche").addEventListener("input", () => { clearTimeout(uhr); uhr = setTimeout(zeichneWiki, 250); });
  $("wikiZurueck").addEventListener("click", () => { ton.klick(); zeigeSeite(wikiZurueck); });
}
