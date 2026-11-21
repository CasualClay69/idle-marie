"use strict";
// =====================================================
//  ZEICHNUNGEN FÜRS ABENTEUER: Ausrüstung und Monster
// =====================================================

// ----- Ausrüstung -----
Object.assign(SYMBOL_BAU, {
  schwert: (f) => `<g transform="rotate(45 50 50)"><path d="M46 8H54L56 62H44Z" fill="${toene(f, 0.15)}" stroke="${toene(f, -0.45)}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 12V58" stroke="${toene(f, 0.55)}" stroke-width="3"/>
    <rect x="30" y="62" width="40" height="8" rx="4" fill="#c98a1a" stroke="#8a5a10" stroke-width="2.5"/>
    <rect x="45" y="70" width="10" height="18" rx="4" fill="#a8693a"/><circle cx="50" cy="91" r="6" fill="#ff7eb6" stroke="#d63384" stroke-width="2"/></g>`,
  helm: (f) => `<path d="M16 66Q14 22 50 18Q86 22 84 66Z" fill="${f}" stroke="${toene(f, -0.45)}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M12 64H88V76H12Z" fill="${toene(f, -0.15)}" stroke="${toene(f, -0.45)}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M30 34Q40 26 52 26" stroke="${toene(f, 0.5)}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M50 18Q56 6 66 8" stroke="#ff7eb6" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  schild: (f) => `<path d="M50 10L84 22Q84 66 50 90Q16 66 16 22Z" fill="${f}" stroke="${toene(f, -0.45)}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M50 22L72 30Q72 60 50 76Q28 60 28 30Z" fill="${toene(f, 0.3)}"/>
    <path d="M50 64C38 54 36 46 42 42C46 40 50 44 50 46C50 44 54 40 58 42C64 46 62 54 50 64Z" fill="#ff7eb6"/>`,
  ruestung: (f) => `<path d="M30 14L42 20Q50 26 58 20L70 14L90 30L80 46L74 42V88H26V42L20 46L10 30Z" fill="${f}" stroke="${toene(f, -0.45)}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M38 40H62M36 56H64M36 72H64" stroke="${toene(f, -0.25)}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="30" r="5" fill="#ff7eb6"/>`,
});

// =====================================================
//  MONSTER – ein Baukasten: Körper, Ohren, Hörner, Flügel und Extras
//  schlaeft = geschlossene Augen und Zzz
// =====================================================
const MONSTER_KOERPER = {
  blob: `<path d="M18 66Q14 26 50 24Q86 26 82 66Q82 88 50 88Q18 88 18 66Z"/>`,
  rund: `<ellipse cx="50" cy="60" rx="34" ry="30"/>`,
  tropfen: `<path d="M50 14Q80 50 80 66Q80 88 50 88Q20 88 20 66Q20 50 50 14Z"/>`,
  geist: `<path d="M20 88V54Q20 22 50 22Q80 22 80 54V88L72 80L64 88L57 80L50 88L43 80L36 88L28 80Z"/>`,
  wolke: `<path d="M18 78Q6 76 10 62Q8 48 24 48Q26 30 44 32Q54 22 66 32Q84 30 84 48Q96 52 90 66Q92 80 78 80Z"/>`,
};
const OBEN_EXTRAS = ["puste", "pilzhut", "blaetter", "helm", "krone", "flamme", "zacken"];

function monsterExtra(art, f, d, h) {
  const stern = (x, y) => `<path d="M${x} ${y - 5}L${x + 1.6} ${y - 1.6}L${x + 5} ${y}L${x + 1.6} ${y + 1.6}L${x} ${y + 5}L${x - 1.6} ${y + 1.6}L${x - 5} ${y}L${x - 1.6} ${y - 1.6}Z"/>`;
  switch (art) {
    case "streifen": return `<path d="M23 74Q50 68 77 74M28 84Q50 79 72 84" stroke="#5b4a2a" stroke-width="5" fill="none"/>`;
    case "maske": return `<path d="M26 52Q38 44 46 54Q50 50 54 54Q62 44 74 52Q70 64 60 60Q50 56 40 60Q30 64 26 52Z" fill="#5b5560"/>`;
    case "puste": return `<g fill="#fff" stroke="#e6dca8" stroke-width="1.5">${[[50, 14], [30, 22], [70, 22], [20, 40], [80, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`).join("")}</g>`;
    case "pilzhut": return `<path d="M12 40Q50 -4 88 40Z" fill="#e8453a" stroke="#b02a22" stroke-width="3"/><circle cx="34" cy="26" r="5" fill="#fff"/><circle cx="56" cy="18" r="4.5" fill="#fff"/><circle cx="70" cy="32" r="4" fill="#fff"/>`;
    case "wuschel": return `<path d="M26 34Q30 24 36 32Q40 20 48 30Q54 18 60 30Q66 22 70 34" stroke="${h}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case "eule": return `<circle cx="39" cy="55" r="12" fill="${h}"/><circle cx="61" cy="55" r="12" fill="${h}"/><path d="M46 64L50 72L54 64Z" fill="#ffb347"/>`;
    case "blaetter": return `<g fill="#6fbf6a">${[[30, 28, -30], [50, 20, 0], [70, 28, 30], [22, 42, -60], [78, 42, 60]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="12" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g>`;
    case "helm": return `<path d="M22 44Q22 20 50 20Q78 20 78 44Z" fill="#a9b4c4" stroke="#6f7a8a" stroke-width="3"/><path d="M50 20V8" stroke="#ff7eb6" stroke-width="6" stroke-linecap="round"/>`;
    case "steine": return `<g fill="${d}"><circle cx="30" cy="76" r="4"/><circle cx="68" cy="74" r="5"/><circle cx="58" cy="84" r="3"/></g>`;
    case "krone": return `<path d="M32 26L36 10L44 20L50 6L56 20L64 10L68 26Z" fill="#ffd54f" stroke="#c98a1a" stroke-width="2.5" stroke-linejoin="round"/><circle cx="50" cy="20" r="3" fill="#ff5fa2"/>`;
    case "flamme": return `<path d="M50 4Q62 18 56 26Q66 22 62 34H38Q34 22 44 26Q38 16 50 4Z" fill="#ffd54f"/>`;
    case "punkte": return `<g fill="${h}"><circle cx="28" cy="74" r="5"/><circle cx="72" cy="74" r="6"/><circle cx="60" cy="84" r="4"/><circle cx="34" cy="42" r="4"/></g>`;
    case "zacken": return `<path d="M34 28L40 14L46 25L52 12L58 25L64 14L68 28Z" fill="${d}"/>`;
    case "flocken": return `<g stroke="#9ad0f0" stroke-width="2.5" stroke-linecap="round"><path d="M30 74V84M25 79H35M68 72V82M63 77H73"/></g>`;
    case "stacheln": return `<path d="M18 62L6 54L19 50L12 38L27 42L27 26L40 35L46 20L54 33L62 20L66 35L79 28L76 43L90 40L82 53L94 60Z" fill="#e8f6ff" stroke="#7ab8e0" stroke-width="2" stroke-linejoin="round"/>`;
    case "blitz": return `<path d="M54 70L44 84H52L46 96L62 78H54L60 70Z" fill="#ffd54f" stroke="#c98a1a" stroke-width="2"/>`;
    case "sterne": return `<g fill="#fff6b0">${stern(28, 76)}${stern(72, 76)}${stern(50, 84)}</g>`;
    case "regenbogen": return `<g fill="none" stroke-width="4"><path d="M28 80Q50 62 72 80" stroke="#ff7a7a"/><path d="M33 84Q50 68 67 84" stroke="#ffd54f"/><path d="M38 88Q50 74 62 88" stroke="#7ad7f0"/></g>`;
    case "herz": return `<path d="M50 88C38 80 36 72 42 69C45 67.5 48.5 69 50 72C51.5 69 55 67.5 58 69C64 72 62 80 50 88Z" fill="#ff5fa2" stroke="#fff" stroke-width="1.5"/>
      <path d="M18 40L14 34M82 40L86 34" stroke="#ff5fa2" stroke-width="3" stroke-linecap="round"/>`;
    case "kuerbis": return `<path d="M36 34Q34 60 38 86M64 34Q66 60 62 86M50 30V88" stroke="${d}" stroke-width="2.5" fill="none" opacity=".55"/>
      <path d="M48 32Q46 18 54 12" stroke="#6fbf6a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M54 14Q64 10 66 18Q58 20 54 14Z" fill="#8fcf6a"/>`;
    default: return "";
  }
}

function monsterSvg(a, schlaeft = false) {
  const f = a.farbe, d = toene(f, -0.35), h = toene(f, 0.45);
  const hinten = [];
  if (a.fluegel === true) hinten.push(`<ellipse cx="20" cy="42" rx="16" ry="11" fill="#e8f6ff" opacity=".9" stroke="#b9d6ea" stroke-width="2" transform="rotate(-25 20 42)"/><ellipse cx="80" cy="42" rx="16" ry="11" fill="#e8f6ff" opacity=".9" stroke="#b9d6ea" stroke-width="2" transform="rotate(25 80 42)"/>`);
  if (a.fluegel === "fledermaus") hinten.push(`<path d="M28 52Q6 30 2 54Q10 52 12 60Q18 54 22 64Q24 56 30 62Z M72 52Q94 30 98 54Q90 52 88 60Q82 54 78 64Q76 56 70 62Z" fill="${d}"/>`);
  if (a.fluegel === "drache") hinten.push(`<path d="M28 50Q4 22 4 52L14 48L14 60L24 56Z M72 50Q96 22 96 52L86 48L86 60L76 56Z" fill="${d}" stroke="${toene(f, -0.55)}" stroke-width="2" stroke-linejoin="round"/>`);
  if (a.ohren === "rund") hinten.push(`<circle cx="26" cy="30" r="10" fill="${f}" stroke="${d}" stroke-width="2.5"/><circle cx="74" cy="30" r="10" fill="${f}" stroke="${d}" stroke-width="2.5"/><circle cx="26" cy="30" r="5" fill="#ffc2d9"/><circle cx="74" cy="30" r="5" fill="#ffc2d9"/>`);
  if (a.ohren === "spitz") hinten.push(`<path d="M22 40L24 10L42 28Z M78 40L76 10L58 28Z" fill="${f}" stroke="${d}" stroke-width="2.5" stroke-linejoin="round"/><path d="M27 32L28 18L37 28Z M73 32L72 18L63 28Z" fill="#ffc2d9"/>`);
  if (a.ohren === "feder") hinten.push(`<path d="M26 34L22 12L38 26Z M74 34L78 12L62 26Z" fill="${d}"/>`);
  if (a.hoerner) hinten.push(`<path d="M32 30Q24 14 30 6Q34 18 42 24Z M68 30Q76 14 70 6Q66 18 58 24Z" fill="#fff4d6" stroke="#c9a86a" stroke-width="2"/>`);
  if (a.extra === "stacheln") hinten.push(monsterExtra("stacheln", f, d, h));

  const form = a.form || "blob";
  const koerper = MONSTER_KOERPER[form].replace("/>", ` fill="${f}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/>`);
  const bauch = form === "wolke" ? "" : `<ellipse cx="50" cy="74" rx="18" ry="10" fill="${h}" opacity=".65"/>`;
  const extra = a.extra === "stacheln" ? "" : monsterExtra(a.extra, f, d, h);
  const oben = OBEN_EXTRAS.includes(a.extra);
  const backen = `<ellipse cx="28" cy="66" rx="6" ry="3.5" fill="#ff9ec4" opacity=".65"/><ellipse cx="72" cy="66" rx="6" ry="3.5" fill="#ff9ec4" opacity=".65"/>`;
  const augen = schlaeft
    ? `<path d="M33 56Q39 61 45 56M55 56Q61 61 67 56" stroke="#3b2240" stroke-width="3" fill="none" stroke-linecap="round"/>
       <text x="74" y="22" font-size="17" font-weight="900" fill="#7a6bb8" font-family="sans-serif">z</text><text x="85" y="11" font-size="12" font-weight="900" fill="#7a6bb8" font-family="sans-serif">z</text>`
    : `<ellipse cx="39" cy="55" rx="5.5" ry="7" fill="#3b2240"/><ellipse cx="61" cy="55" rx="5.5" ry="7" fill="#3b2240"/>
       <circle cx="41" cy="52.5" r="2.2" fill="#fff"/><circle cx="63" cy="52.5" r="2.2" fill="#fff"/>`;
  const mund = schlaeft ? `<ellipse cx="50" cy="70" rx="3" ry="2.4" fill="#3b2240"/>`
                        : `<path d="M45 68Q50 72 55 68" stroke="#3b2240" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${hinten.join("")}${koerper}${bauch}${oben ? "" : extra}${backen}${augen}${mund}${oben ? extra : ""}</svg>`;
}
