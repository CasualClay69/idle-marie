"use strict";
// =====================================================
//  BAUMHAUS – Logik und Anzeige (oben auf der Seite der Fertigkeit "Bauen")
//  spiel.baumhaus = { platzId: Stufe (0 = noch nicht gebaut, 1 … 5) }
// =====================================================

// Bretter-Symbol: ein kleiner Stapel Bretter in der Holzfarbe
SYMBOL_BAU.brett = (f) => [0, 1, 2].map(i => `<rect x="${12 + i * 3}" y="${62 - i * 16}" width="${76 - i * 6}" height="14" rx="3" fill="${toene(f, -0.1 + i * 0.12)}" stroke="${toene(f, -0.45)}" stroke-width="2.5"/>
  <path d="M${22 + i * 3} ${69 - i * 16}H${44 + i * 3}M${56 + i * 3} ${67 - i * 16}H${74 - i * 3}" stroke="${toene(f, -0.3)}" stroke-width="2" stroke-linecap="round"/>`).join("");

function bauStufe(platzId) { return spiel.baumhaus?.[platzId] || 0; }
// Summe eines Bonus (Prozent-Boni als Anteil, z.B. 0,05 – Bankfächer und Stunden als Zahl)
function baumhausBonus(art) {
  let summe = 0;
  for (const p of BAUPLAETZE) {
    const k = bauStufe(p.id);
    if (k && p.bonus.art === art) summe += p.bonus.werte[k - 1];
  }
  return ["bank", "offline"].includes(art) ? summe : summe / 100;
}

// Kann der nächste Ausbau gebaut werden? Rückgabe: null = ja, sonst ein Grund
function bauHindernis(p) {
  const k = bauStufe(p.id);
  if (k >= BAU_STUFEN.length) return "Ganz fertig ausgebaut!";
  if (p.id !== "plattform" && !bauStufe("plattform")) return "Bau zuerst die Plattform";
  const kosten = bauKosten(p, k);
  if (stufe("bauen") < kosten.stufe) return `Erst ab Bauen-Stufe ${kosten.stufe}`;
  for (const [id, n] of Object.entries(kosten.sachen)) if (anzahl(id) < n) return `Es fehlt: ${GEGENSTAENDE[id].name}`;
  if (spiel.muenzen < kosten.muenzen) return "Nicht genug Münzen";
  return null;
}
function baue(p) {
  if (bauHindernis(p)) return null;
  const k = bauStufe(p.id), kosten = bauKosten(p, k);
  for (const [id, n] of Object.entries(kosten.sachen)) nimmAusBank(id, n);
  spiel.muenzen -= kosten.muenzen;
  spiel.baumhaus = spiel.baumhaus || {};
  spiel.baumhaus[p.id] = k + 1;
  const vorher = stufe("bauen");
  spiel.xp.bauen = (spiel.xp.bauen || 0) + Math.round(kosten.xp * trankFaktorXp());
  zaehleAktion("bauen");
  return { name: bauName(p, k), neueStufe: stufe("bauen") > vorher ? stufe("bauen") : 0 };
}

// ===================== ANZEIGE =====================
// Wo im Bild steht was? (x, y im Bild 0–360 × 0–380, Größe des Emojis)
const BAU_ORTE = {
  bett: [128, 172, 26], werkbank: [184, 176, 24], regal: [236, 146, 24], kamin: [124, 136, 22],
  teleskop: [296, 166, 26], blumen: [180, 204, 20], truhe: [236, 180, 22], puppe: [66, 172, 24],
  haengematte: [62, 108, 24], leiter: [314, 262, 0], dach: [180, 70, 0], plattform: [180, 200, 0],
};
const HOLZ_FARBEN = ["#c9a27a", "#e8d8b0", "#ffb3c8", "#f2a65a", "#c9a6ff"];   // Ast, Birke, Ahorn, Zauber, Regenbogen
const DACH_FARBEN = ["#b07d4f", "#e8d8b0", "#ff8a7a", "#b48cff", "url(#dachRegenbogen)"];

function baumhausSvg() {
  const pl = bauStufe("plattform"), da = bauStufe("dach"), le = bauStufe("leiter");
  const holz = HOLZ_FARBEN[Math.max(0, pl - 1)];
  const teile = [];
  // Himmel, Wiese, Baum
  teile.push(`<defs><linearGradient id="bhHimmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ecff"/><stop offset="1" stop-color="#fff0f8"/></linearGradient>
    <linearGradient id="dachRegenbogen" x1="0" x2="1"><stop offset="0" stop-color="#ff7a7a"/><stop offset=".25" stop-color="#ffd54f"/><stop offset=".5" stop-color="#8fcf6a"/><stop offset=".75" stop-color="#7ad7f0"/><stop offset="1" stop-color="#b48cff"/></linearGradient></defs>
    <rect width="360" height="380" rx="24" fill="url(#bhHimmel)"/>
    <ellipse cx="180" cy="372" rx="210" ry="44" fill="#a8e08f"/>
    <path d="M160 380Q166 300 162 230Q150 200 120 190L126 182Q156 190 170 210Q172 150 160 110L176 108Q186 160 186 210Q200 186 236 180L238 190Q206 200 196 232Q194 300 202 380Z" fill="#9b6b43"/>
    <g fill="#7cc36b"><circle cx="90" cy="96" r="46"/><circle cx="160" cy="62" r="56"/><circle cx="236" cy="70" r="52"/><circle cx="292" cy="112" r="40"/><circle cx="54" cy="150" r="30"/></g>
    <g fill="#8fd47a"><circle cx="120" cy="70" r="26"/><circle cx="210" cy="50" r="28"/><circle cx="270" cy="96" r="22"/></g>`);
  if (pl) {
    // Hütte und Plattform
    teile.push(`<rect x="100" y="118" width="160" height="78" rx="6" fill="${holz}" stroke="#8a5a30" stroke-width="3"/>
      <path d="M112 132H248M112 150H248M112 168H248M112 186H248" stroke="#8a5a30" stroke-width="1.5" opacity=".35"/>
      <rect x="160" y="140" width="34" height="56" rx="16" fill="#8a5a30" opacity=".85"/><circle cx="186" cy="170" r="2.6" fill="#ffd54f"/>
      <rect x="40" y="194" width="290" height="16" rx="5" fill="${holz}" stroke="#8a5a30" stroke-width="3"/>
      <path d="M70 210L100 250M290 210L262 250" stroke="#8a5a30" stroke-width="6" stroke-linecap="round"/>`);
  } else {
    teile.push(`<rect x="40" y="194" width="290" height="16" rx="5" fill="none" stroke="#8a5a30" stroke-width="3" stroke-dasharray="8 6" opacity=".6"/>`);
  }
  if (da) teile.push(`<path d="M86 122L180 58L274 122Z" fill="${DACH_FARBEN[da - 1]}" stroke="#7a3a2a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M110 112L180 66L250 112" stroke="#fff" stroke-width="3" opacity=".35" fill="none"/>`);
  if (le) teile.push(`<g stroke="${HOLZ_FARBEN[le - 1]}" stroke-width="6" stroke-linecap="round"><path d="M300 210L310 362M330 210L340 362"/>
    ${[232, 258, 284, 310, 336].map(y => `<path d="M${302 + (y - 210) * 0.065} ${y}H${332 + (y - 210) * 0.065}"/>`).join("")}</g>`);
  if (bauStufe("haengematte")) teile.push(`<path d="M34 96Q62 130 92 104" stroke="#ff9fd0" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  return `<svg viewBox="0 0 360 380" aria-hidden="true">${teile.join("")}</svg>`;
}

function zeichneBaumhaus(ziel) {
  const figur = `<span class="bhFigur">${figurSvg(spiel.figur)}</span>`;
  // Möbel und leere Plätze als antippbare Punkte im Bild
  const punkte = BAUPLAETZE.map(p => {
    const [x, y, g] = BAU_ORTE[p.id], k = bauStufe(p.id);
    const frei = p.id === "plattform" || bauStufe("plattform");
    if (!frei) return "";
    const stil = `left:${(x / 360 * 100).toFixed(1)}%;top:${(y / 380 * 100).toFixed(1)}%`;
    if (k && g) return `<button type="button" class="bhMoebel" data-platz="${p.id}" style="${stil};font-size:calc(var(--bh) * ${g / 360})">${p.emoji}${k > 1 ? `<i>${k}</i>` : ""}</button>`;
    if (k) return `<button type="button" class="bhMarke" data-platz="${p.id}" style="${stil}">${k > 1 ? k : "✓"}</button>`;
    return `<button type="button" class="bhLeer" data-platz="${p.id}" style="${stil}">+</button>`;
  }).join("");
  // Haustiere wohnen mit (bis zu 8)
  const orte = [[40, 186], [290, 186], [120, 350], [230, 352], [270, 140], [80, 64], [300, 60], [200, 352]];
  const tiere = (spiel.haustiere || []).slice(0, 8).map((id, i) => {
    const h = HAUSTIERE.find(x => x.id === id);
    return h ? `<span class="bhTier" style="left:${orte[i][0] / 3.6}%;top:${orte[i][1] / 3.8}%;animation-delay:${i * 0.4}s">${h.emoji}</span>` : "";
  }).join("");
  const gebaut = BAUPLAETZE.filter(p => bauStufe(p.id)).length;
  ziel.innerHTML = `<div class="baumhaus">${baumhausSvg()}${punkte}${tiere}${figur}</div>
    <p class="hinweis">🏡 ${gebaut} von ${BAUPLAETZE.length} Plätzen eingerichtet. Tippe auf ein <b>+</b> oder ein Möbelstück, um zu bauen.</p>
    <div class="bauListe">${BAUPLAETZE.map(p => {
      const k = bauStufe(p.id);
      return `<button type="button" class="bauKarte${k ? " gebaut" : ""}" data-platz="${p.id}"><span class="bkEmoji">${p.emoji}</span>
        <span class="bkText"><b>${k ? bauName(p, k - 1) : p.name}</b><small>${k ? bauBonusText(p, k - 1) : "noch leer"}</small></span>
        <span class="bkSterne">${"★".repeat(k)}${"☆".repeat(5 - k)}</span></button>`;
    }).join("")}</div>
    <h3 class="rasterTitel">🪚 Bretter sägen</h3>`;
  const breite = ziel.querySelector(".baumhaus");
  if (typeof ResizeObserver === "function") new ResizeObserver(([e]) => breite.style.setProperty("--bh", e.contentRect.width + "px")).observe(breite);
  for (const b of ziel.querySelectorAll("[data-platz]")) b.addEventListener("click", () => { ton.klick(); zeigeBauFenster(b.dataset.platz); });
}

function zeigeBauFenster(platzId) {
  const p = BAUPLAETZE.find(x => x.id === platzId);
  const k = bauStufe(p.id);
  let html = `<h2>${p.emoji} ${k ? bauName(p, k - 1) : p.name}</h2>
    <p class="hinweis">${k ? `Jetzt: <b>${bauBonusText(p, k - 1)}</b>` : "Hier ist noch nichts gebaut."}</p>`;
  if (k >= BAU_STUFEN.length) {
    html += `<p>🌈 Ganz fertig ausgebaut – schöner geht es nicht!</p>`;
  } else {
    const kosten = bauKosten(p, k), grund = bauHindernis(p);
    const zeile = (inhalt, ok) => `<li class="${ok ? "" : "fehlt"}">${inhalt}</li>`;
    html += `<div class="bauNaechstes"><b>${k ? "Ausbauen zu" : "Bauen"}: ${bauName(p, k)}</b><small>✨ ${bauBonusText(p, k)}</small>
      <ul class="bauKosten">
        ${zeile(`🔨 Bauen-Stufe ${kosten.stufe}`, stufe("bauen") >= kosten.stufe)}
        ${Object.entries(kosten.sachen).map(([id, n]) => zeile(`${symbolHtml(id, "mini")} ${n}× ${GEGENSTAENDE[id].name} <small>(du hast ${zahl(anzahl(id))})</small>`, anzahl(id) >= n)).join("")}
        ${zeile(`${muenzeHtml("muenze klein")} ${zahl(kosten.muenzen)} Münzen`, spiel.muenzen >= kosten.muenzen)}
      </ul>
      ${grund ? `<p class="fehlerText">${grund}</p>` : ""}
      <button type="button" class="knopf" id="jetztBauen" ${grund ? "disabled" : ""}>🔨 ${k ? "Ausbauen" : "Bauen"}! (+${zahl(kosten.xp)} EP)</button></div>`;
  }
  $("wahlInhalt").innerHTML = html;
  $("jetztBauen")?.addEventListener("click", () => {
    const e = baue(p);
    if (!e) return;
    ton.stufe();
    herzchen($("jetztBauen"));
    melde(`🏡 ${e.name} ist fertig!`, "gross");
    if (e.neueStufe) melde(`🎉 🔨 Bauen: Stufe ${e.neueStufe}!`, "gross");
    $("wahlOverlay").hidden = true;
    speichern();
    zeichneKopf();
    zeichneSeite();
  });
  $("wahlOverlay").hidden = false;
}
