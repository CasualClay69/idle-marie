"use strict";
// =====================================================
//  HAUSTIERE PFLEGEN – Streicheln und Füttern lässt jedes Haustier bis Stufe 10 wachsen.
//  Mit jeder Stufe wird sein Bonus 10 % größer (Stufe 10 = fast doppelt so stark).
//  spiel.tierPflege = { tierId: { xp, gestreichelt (Zeitpunkt) } }
// =====================================================

const PFLEGE = {
  maxStufe: 10,
  xpBis: [0, 30, 80, 150, 250, 380, 550, 770, 1050, 1400],   // Erfahrung für Stufe 1 … 10
  streichelXp: 10,
  streichelPauseMin: 120,   // so oft darf jedes Tier gestreichelt werden
  bonusProStufe: 0.1,
};

// Startertier: Hündchen Bello gibt es als Belohnung für einen frühen Auftrag
HAUSTIERE.push({ id: "bello", name: "Bello", tier: "Hündchen", emoji: "🐶", start: true, bonus: { art: "xp", wert: 0.02 }, text: "+2 % Erfahrung bei allem" });
{
  const alle = ERFOLGE.find(e => e.id === "haustiere-14");
  if (alle) alle.ziel = HAUSTIERE.filter(h => !h.season).length;
}

erfolg({ id: "pflege-1", icon: "💖", name: "Kuschelzeit", text: "Streichle ein Haustier", ziel: 1, muenzen: 100, wert: () => spiel.statistik.gestreichelt || 0 });
erfolg({ id: "pflege-10", icon: "⭐", name: "Bester Freund", text: "Bring ein Haustier auf Stufe 10", ziel: 10, muenzen: 50000,
  wert: () => Math.max(1, ...(spiel.haustiere || []).map(tierStufe)) });
erfolg({ id: "pflege-alle", icon: "🐾", name: "Tierpflege-Profi", text: "Bring 10 Haustiere auf Stufe 10", ziel: 10, muenzen: 2000000,
  wert: () => (spiel.haustiere || []).filter(id => tierStufe(id) >= 10).length });

function pflegeStand(id) {
  spiel.tierPflege = spiel.tierPflege || {};
  return spiel.tierPflege[id] || (spiel.tierPflege[id] = { xp: 0, gestreichelt: 0 });
}
function tierStufe(id) {
  const xp = pflegeStand(id).xp;
  let l = 1;
  while (l < PFLEGE.maxStufe && xp >= PFLEGE.xpBis[l]) l++;
  return l;
}
function tierBonusFaktor(id) { return (1 + PFLEGE.bonusProStufe * (tierStufe(id) - 1)) * (typeof zubehoerFaktor === "function" ? zubehoerFaktor(id, "bonus") : 1); }

function gibTierXp(id, n) {
  const vorher = tierStufe(id);
  pflegeStand(id).xp += n;
  return tierStufe(id) > vorher ? tierStufe(id) : 0;
}
function streichelnIn(id) {   // Millisekunden, bis man wieder streicheln darf (0 = jetzt)
  return Math.max(0, pflegeStand(id).gestreichelt + PFLEGE.streichelPauseMin * 60000 - Date.now());
}
function streichle(id) {
  if (streichelnIn(id) > 0) return null;
  pflegeStand(id).gestreichelt = Date.now();
  spiel.statistik.gestreichelt = (spiel.statistik.gestreichelt || 0) + 1;
  const xp = Math.round(PFLEGE.streichelXp * (typeof zubehoerFaktor === "function" ? zubehoerFaktor(id, "pflege") : 1));   // Halsband
  return { neueStufe: gibTierXp(id, xp), xp };
}
function futterXp(essenId) { return Math.max(3, Math.round(GEGENSTAENDE[essenId].heilt / 5)); }
function fuettere(id, essenId) {
  if (anzahl(essenId) < 1 || tierStufe(id) >= PFLEGE.maxStufe) return null;
  nimmAusBank(essenId, 1);
  spiel.statistik.gefuettert = (spiel.statistik.gefuettert || 0) + 1;
  const xp = Math.round(futterXp(essenId) * (typeof zubehoerFaktor === "function" ? zubehoerFaktor(id, "pflege") : 1));   // Halsband
  return { neueStufe: gibTierXp(id, xp), xp };
}

// ===================== FENSTER =====================
function zeigeTierFenster(id) {
  const h = HAUSTIERE.find(x => x.id === id);
  if (!h || !hatHaustier(id)) return;
  const l = tierStufe(id), xp = pflegeStand(id).xp;
  const max = l >= PFLEGE.maxStufe;
  const anteil = max ? 1 : (xp - PFLEGE.xpBis[l - 1]) / (PFLEGE.xpBis[l] - PFLEGE.xpBis[l - 1]);
  const bonusJetzt = Math.round(h.bonus.wert * 100 * tierBonusFaktor(id) * 10) / 10;
  const bonusNaechste = Math.round(h.bonus.wert * 100 * (1 + PFLEGE.bonusProStufe * l) * 10) / 10;
  const warten = streichelnIn(id);
  const essen = Object.keys(spiel.bank).filter(e => anzahl(e) > 0 && GEGENSTAENDE[e].heilt).sort((a, b) => futterXp(b) - futterXp(a));
  $("tierInhalt").innerHTML = `<div class="tierGross" id="tierGross">${h.emoji}</div>
    <h2>${h.name} <small>${h.tier}</small></h2>
    <div class="tierSterne">${"★".repeat(l)}${"☆".repeat(PFLEGE.maxStufe - l)}</div>
    <p class="tierStufe">Stufe <b>${l}</b> / ${PFLEGE.maxStufe}</p>
    <div class="balken dick tierBalken"><div style="width:${(anteil * 100).toFixed(1)}%"></div></div>
    <p class="hinweis">✨ Bonus jetzt: <b>${h.text.replace(/\d+(,\d+)? %/, `${String(bonusJetzt).replace(".", ",")} %`)}</b>${max ? " · 🏆 ganz groß!" : ` · auf Stufe ${l + 1}: ${String(bonusNaechste).replace(".", ",")} %`}</p>
    <div class="tierKnoepfe">
      <button type="button" class="knopf" id="streicheln" ${warten || max ? "disabled" : ""}>💖 Streicheln${warten && !max ? `<small>wieder in ${Math.ceil(warten / 60000)} min</small>` : ""}</button>
      <button type="button" class="knopf leise" id="alsBegleiter" ${spiel.begleiter === id ? "disabled" : ""}>${spiel.begleiter === id ? "💖 Ist dein Begleiter" : "Als Begleiter"}</button>
    </div>
    ${max ? "" : `<h3 class="rasterTitel">🍖 Füttern <small>(gekochtes Essen)</small></h3>
    ${essen.length ? `<div class="futterListe">${essen.map(e => `<button type="button" class="futter" data-essen="${e}">${symbolHtml(e, "mini")}<span>${GEGENSTAENDE[e].name}<small>×${zahl(anzahl(e))} · +${futterXp(e)} ✨</small></span></button>`).join("")}</div>`
                   : `<p class="hinweis">Du hast noch kein Essen. Koche etwas bei 🍳 Kochen!</p>`}`}`;
  const feiern = (e) => {
    herzchen($("tierGross"));
    $("tierGross").classList.remove("freut"); void $("tierGross").offsetWidth; $("tierGross").classList.add("freut");
    if (e.neueStufe) { ton.stufe(); melde(`🎉 ${h.emoji} ${h.name} ist jetzt Stufe ${e.neueStufe}!`, "gross"); }
    speichern();
    setTimeout(() => zeigeTierFenster(id), 650);
    if (aktuelleSeite === "seiteIch") zeichneHaustiere();
  };
  $("streicheln")?.addEventListener("click", () => { const e = streichle(id); if (e) { ton.muenze(); feiern(e); } });
  $("alsBegleiter").addEventListener("click", () => { ton.klick(); spiel.begleiter = id; speichern(); zeichneKopf(); zeigeTierFenster(id); if (aktuelleSeite === "seiteIch") zeichneHaustiere(); });
  for (const b of $("tierInhalt").querySelectorAll(".futter")) b.addEventListener("click", () => {
    const e = fuettere(id, b.dataset.essen);
    if (e) { ton.klick(); feiern(e); }
  });
  $("tierOverlay").hidden = false;
}
