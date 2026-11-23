"use strict";
// =====================================================
//  IKONEN 1: Herzen, Sterne, Himmel & Wetter, Pflanzen, Essen
// =====================================================

// ----- Herzen -----
const herzIkon = (f, extra = "") => B.p(HERZ_D, f) + B.fp("M9.5 11.5Q10.5 9 13 9.2", "none", `stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"`) + extra;
ikon("❤", herzIkon("#ff4f7a"));
ikon("💖", herzIkon("#ff7eb6", B.fp(sternD(25, 7, 3.5, 4, 0.35), "#ffd54f") + B.fp(sternD(6, 23, 2.6, 4, 0.35), "#fff6b0")));
ikon("💗", herzIkon("#ff7eb6", B.fp("M16 21C11.5 18 10 15.4 11.3 13.2C12.4 11.4 14.6 11.6 16 13.4C17.4 11.6 19.6 11.4 20.7 13.2C22 15.4 20.5 18 16 21Z", "#ffc2dc")));
ikon("💕", `<g transform="translate(-4 3) scale(.75)">${B.p(HERZ_D, "#ff7eb6")}</g><g transform="translate(12 -1) scale(.6)">${B.p(HERZ_D, "#ff4f9a")}</g>`);
ikon("💞", `<g transform="rotate(-15 16 16) translate(-3 2) scale(.72)">${B.p(HERZ_D, "#ff7eb6")}</g><g transform="rotate(15 16 16) translate(11 4) scale(.6)">${B.p(HERZ_D, "#b48cff")}</g>`);
ikon("💝", herzIkon("#ff5f8f", B.l("M16 9.6V27M5 14H27", "#ffd54f", 2.4) + B.fp("M16 9.5L12 5.5L11 9.5ZM16 9.5L20 5.5L21 9.5Z", "#ffd54f")));
ikon("🩷", herzIkon("#ff9fc8"));
ikon("🩵", herzIkon("#7ad7f0"));
ikon("💚", herzIkon("#5fcf7a"));
ikon("💛", herzIkon("#ffd54f"));
ikon("💜", herzIkon("#b48cff"));
ikon("💌", B.r(4, 9, 24, 16, 2.5, "#fff6fb") + B.l("M4.8 10L16 18.5L27.2 10", "#d8a8c4", 1.5) + `<g transform="translate(9.6 11.5) scale(.4)">${B.p(HERZ_D, "#ff5f8f")}</g>`);

// ----- Sterne & Glitzer -----
ikon("⭐", B.p(sternD(16, 16.5, 13), "#ffd54f") + B.glanz(12, 12));
ikon("★", B.p(sternD(16, 16.5, 12), "#f5b942"));
ikon("☆", `<path d="${sternD(16, 16.5, 12)}" fill="#fff" stroke="#d9b56a" stroke-width="1.6" stroke-linejoin="round"/>`);
ikon("🌟", B.fk(16, 16, 14, "#fff3b0", `opacity=".8"`) + B.p(sternD(16, 16.5, 11.5), "#ffcc33") + B.glanz(12.5, 12.5));
ikon("✨", B.fp(sternD(12, 15, 9, 4, 0.3), "#ffd54f") + B.fp(sternD(24, 7, 5, 4, 0.3), "#ffe88a") + B.fp(sternD(24, 24, 4, 4, 0.3), "#ffe88a"));
ikon("💫", B.l("M5 24Q9 12 21 14Q27 15 26 21", "#f5b942", 2) + B.p(sternD(10, 11, 7), "#ffd54f"));

// ----- Himmel & Wetter -----
const sonne = (x, y, r) => [0, 45, 90, 135, 180, 225, 270, 315].map(w => {
  const a = w * Math.PI / 180;
  return B.l(`M${(x + (r + 2) * Math.cos(a)).toFixed(1)} ${(y + (r + 2) * Math.sin(a)).toFixed(1)}L${(x + (r + 5) * Math.cos(a)).toFixed(1)} ${(y + (r + 5) * Math.sin(a)).toFixed(1)}`, "#f5a623", 2);
}).join("") + B.k(x, y, r, "#ffd54f") + B.glanz(x - r * 0.35, y - r * 0.35, r * 0.25);
ikon("☀", sonne(16, 16, 7));
const wolkeD = "M8 25H24A5.5 5.5 0 0 0 24.5 14A7.5 7.5 0 0 0 10.5 12.5A6 6 0 0 0 8 25Z";
ikon("☁", B.p(wolkeD, "#f4f8ff"));
ikon("🌥", `<g transform="translate(-4 -5) scale(.8)">${sonne(22, 12, 6)}</g>` + B.p(wolkeD, "#f4f8ff", `transform="translate(2 3) scale(.92)"`));
ikon("🌨", B.p(wolkeD, "#e8f0fb", `transform="translate(0 -5)"`) + B.l("M10 25V29M8.5 27H11.5M17 24V28M15.5 26H18.5M23 25V29M21.5 27H24.5", "#8fbbe6", 1.4));
ikon("🌙", B.p("M20 4A12 12 0 1 0 28 22A9.5 9.5 0 1 1 20 4Z", "#ffe08a") + B.fk(13, 18, 1.4, "#f5c542") + B.fk(16, 24, 1, "#f5c542"));
ikon("🌛", B.p("M12 4A12 12 0 1 1 6 26A10 10 0 1 0 12 4Z", "#ffe08a") + B.fk(14.5, 12, 1, "#3b2240") + B.mund(13, 17));
ikon("🌌", B.r(3, 3, 26, 26, 6, "#3b3f8f") + B.fp("M3 22Q12 14 20 18T29 12V24Q20 28 12 24T3 26Z", "#7a6bd6", `opacity=".8"`) + B.fp(sternD(10, 10, 3, 4, 0.35), "#fff6b0") + B.fp(sternD(22, 8, 2, 4, 0.35), "#fff") + B.fk(25, 16, 1, "#fff"));
ikon("❄", B.l("M16 3V29M4.7 9.5L27.3 22.5M4.7 22.5L27.3 9.5", "#7ab8e0", 3) + B.l("M16 3V29M4.7 9.5L27.3 22.5M4.7 22.5L27.3 9.5", "#e8f6ff", 1.3) + B.l("M13 6L16 9L19 6M13 26L16 23L19 26", "#7ab8e0", 1.5) + B.k(16, 16, 2.6, "#e8f6ff"));
ikon("🌈", B.l("M3 25A13 13 0 0 1 29 25", "#ff6b6b", 3.2) + B.l("M6.3 25A9.7 9.7 0 0 1 25.7 25", "#ffd54f", 3.2) + B.l("M9.6 25A6.4 6.4 0 0 1 22.4 25", "#7ad7f0", 3.2) + B.e(5, 26, 4, 2.5, "#fff") + B.e(27, 26, 4, 2.5, "#fff"));
ikon("🫧", B.k(12, 18, 8, "#dff6ff", `fill-opacity=".6"`) + B.k(23, 9, 5, "#dff6ff", `fill-opacity=".6"`) + B.glanz(9, 14, 2) + B.glanz(21.5, 7, 1.2));
ikon("💧", B.p("M16 3Q25 15 25 20A9 9 0 0 1 7 20Q7 15 16 3Z", "#7ad7f0") + B.glanz(12, 19, 1.8));
ikon("🔥", B.p("M16 3Q24 11 23 19A7 7 0 0 1 9 19Q8.5 14 12 10Q12.5 14 15 15Q13 9 16 3Z", "#ff8a3a") + B.p("M16 14Q20 18 19.5 21.5A3.5 3.5 0 0 1 12.5 21.5Q12.5 18 16 14Z", "#ffd54f"));
ikon("🌋", B.p("M3 28L11 10H21L29 28Z", "#a8796a") + B.p("M11 10L14 16L16 12L18 16L21 10Z", "#ff6b3a") + B.l("M14 8Q12 4 15 2M18 8Q20 4 18 2", "#c9c2d0", 1.5));

// ----- Pflanzen -----
const blatt = (x, y, w, l, f) => `<ellipse cx="${x}" cy="${y}" rx="${l}" ry="${l * 0.45}" transform="rotate(${w} ${x} ${y})" fill="${f}" stroke="${umriss(f)}" stroke-width="1.3"/>`;
ikon("🌱", B.l("M16 29V16", "#6fbf6a", 2.4) + blatt(11, 13, -35, 6, "#8fd47a") + blatt(21, 11, 35, 6.5, "#7cc36b") + B.fp("M9 29H23Q22 26 16 26Q10 26 9 29Z", "#b07d4f"));
ikon("🌿", B.l("M8 29Q14 18 24 4", "#5fae5a", 2) + blatt(12, 22, -50, 5, "#8fd47a") + blatt(18, 21, 20, 5, "#7cc36b") + blatt(15, 15, -50, 4.5, "#8fd47a") + blatt(21, 13, 20, 4.5, "#7cc36b") + blatt(22, 7, -40, 3.5, "#8fd47a"));
ikon("🍃", blatt(12, 18, -30, 9, "#8fd47a") + blatt(21, 12, 30, 7.5, "#6fbf6a") + B.l("M5 23Q12 18 19 13", "#4a8f45", 1.2));
ikon("🍂", blatt(16, 16, -40, 11, "#e8873a") + B.l("M8 24L24 8M13 19L11 14M17 15L22 17", "#a8521f", 1.3));
ikon("🍁", B.p("M16 3L18 9L23 6L22 12L28 12L23 17L25 21L18 20L17 27H15L14 20L7 21L9 17L4 12L10 12L9 6L14 9Z", "#e8533a") + B.l("M16 27V14", "#a8321f", 1.3));
ikon("🌳", B.r(13.5, 18, 5, 11, 2, "#a8693a") + B.k(16, 12, 9, "#7cc36b") + B.k(9, 16, 5.5, "#6fb35f") + B.k(23, 16, 5.5, "#6fb35f") + B.glanz(13, 8, 2));
ikon("🌲", B.r(14, 23, 4, 6, 1.5, "#a8693a") + B.p("M16 2L25 14H20.5L27 24H5L11.5 14H7Z", "#4f9d55") + B.glanz(14, 9, 1.2));
ikon("🎄", B.r(14, 24, 4, 5, 1.5, "#a8693a") + B.p("M16 3L25 14H20.5L27 24H5L11.5 14H7Z", "#4f9d55") + B.fk(12, 19, 1.6, "#ff5f8f") + B.fk(20, 17, 1.6, "#ffd54f") + B.fk(16, 12, 1.4, "#7ad7f0") + B.fp(sternD(16, 3.5, 3.5), "#ffd54f"));
const ikBluete = (x, y, r, f, m = "#ffd54f") => [0, 72, 144, 216, 288].map(w => {
  const a = (w - 90) * Math.PI / 180;
  return B.k((x + r * Math.cos(a)).toFixed(1), (y + r * Math.sin(a)).toFixed(1), r * 0.78, f);
}).join("") + B.k(x, y, r * 0.62, m);
ikon("🌸", ikBluete(16, 16, 6.5, "#ffc2dc"));
ikon("🌼", B.l("M16 29V20", "#6fbf6a", 2) + ikBluete(16, 14, 6.2, "#fff", "#ffcc33"));
ikon("🌺", ikBluete(16, 16, 7, "#ff6b8a", "#ffd54f") + B.l("M16 16L22 22", "#ffd54f", 1.4));
ikon("🌷", B.l("M16 29V17", "#6fbf6a", 2.2) + blatt(11, 23, -40, 5, "#8fd47a") + B.p("M9 6L12 10L16 4L20 10L23 6Q25 17 16 18Q7 17 9 6Z", "#ff6b8a") + B.glanz(12, 11, 1.4));
ikon("🪻", B.l("M16 29V14", "#6fbf6a", 2) + [[16, 4], [13, 7], [19, 7], [13, 11], [19, 11], [16, 9], [16, 14]].map(([x, y]) => B.k(x, y, 2.6, "#b48cff")).join(""));
ikon("🪷", B.p("M16 6Q22 14 16 24Q10 14 16 6Z", "#ffb3d1") + B.p("M5 14Q14 13 16 24Q8 23 5 14Z", "#ffc2dc") + B.p("M27 14Q18 13 16 24Q24 23 27 14Z", "#ffc2dc") + B.e(16, 26, 11, 2.5, "#8fd47a"));
ikon("🎋", B.r(10, 3, 4, 26, 2, "#8fcf6a") + B.r(18, 7, 4, 22, 2, "#7cc36b") + B.l("M10 11H14M10 19H14M18 15H22M18 23H22", "#4f9d55", 1.4) + blatt(25, 9, 30, 4.5, "#8fd47a") + blatt(7, 14, -30, 4, "#8fd47a"));
ikon("🌾", B.l("M16 29V8M11 29Q12 18 9 9M21 29Q20 18 23 9", "#c9a03a", 1.6) + [[16, 8], [9, 9], [23, 9]].map(([x, y]) => B.e(x, y, 2.4, 5, "#f2c14e")).join("") + [[16, 14], [10, 15], [22, 15]].map(([x, y]) => B.e(x, y, 2, 3.6, "#f2c14e")).join(""));
ikon("🍄", B.r(12.5, 15, 7, 13, 3, "#fff3dc") + B.p("M3 17Q4 4 16 4Q28 4 29 17Z", "#ff5f5f") + B.fk(10, 10, 2, "#fff") + B.fk(19, 8, 2.4, "#fff") + B.fk(23, 13, 1.6, "#fff"));
ikon("🪶", B.p("M26 4Q30 14 18 22L8 28L12 20Q14 8 26 4Z", "#c9b8e8") + B.l("M24 7Q18 16 9 27", "#8a74b8", 1.3) + B.l("M14 17L11 14M18 13L16 10M17 19L20 20", "#8a74b8", 1));
ikon("🐚", B.p("M16 28L4 14Q16 1 28 14Z", "#ffd1e0") + B.l("M16 28L9 9M16 28L16 5M16 28L23 9", "#e08aa8", 1.4) + B.r(12, 26, 8, 3, 1.5, "#e8b0c4"));
ikon("🟫", B.r(4, 6, 24, 20, 5, "#b07d4f") + B.l("M8 12H13M17 17H23M9 21H14", "#8a5a30", 1.5));
ikon("⚪", `<circle cx="16" cy="16" r="10" fill="#fff" stroke="#c9c2d0" stroke-width="2" stroke-dasharray="3 2.5"/>`);

// ----- Essen -----
ikon("🥬", B.p("M16 28Q6 26 6 16Q6 6 16 5Q26 6 26 16Q26 26 16 28Z", "#8fd47a") + B.p("M16 28Q10 22 12 12Q16 7 20 12Q22 22 16 28Z", "#b8e88f") + B.l("M16 28V12", "#6fae5a", 1.4));
ikon("🥕", B.p("M8 26L22 8Q27 9 25 14Z", "#ff8a3a") + B.l("M14 19L12 17M17 15L15 13M19 12L17.5 10.5", "#d9601f", 1.2) + B.l("M23 9L27 3M24 10L29 7M22 8L23 3", "#6fbf6a", 1.8));
ikon("🥔", B.p("M6 18Q5 9 14 8Q24 6 26 14Q28 24 17 25Q7 26 6 18Z", "#d9a46a") + B.fk(12, 14, 0.9, "#a8743a") + B.fk(19, 12, 0.9, "#a8743a") + B.fk(16, 20, 0.9, "#a8743a") + B.fk(22, 18, 0.9, "#a8743a"));
ikon("🍅", B.k(16, 18, 10, "#ff5f4f") + B.p("M16 9L13 6L15 9L11 9L15 11L16 14L17 11L21 9L17 9L19 6Z", "#6fbf6a") + B.glanz(12, 14, 2));
ikon("🍓", B.p("M16 28Q6 20 7 13Q8 9 16 10Q24 9 25 13Q26 20 16 28Z", "#ff4f6a") + B.p("M10 10L13 6L16 9L19 6L22 10Q16 12 10 10Z", "#6fbf6a") + [[12, 15], [17, 14], [21, 16], [14, 20], [19, 21], [16, 25]].map(([x, y]) => B.fk(x, y, 0.8, "#fff3b0")).join(""));
ikon("🍉", B.p("M3 12A13 13 0 0 0 29 12Z", "#5fae5a") + B.p("M5 12A11 11 0 0 0 27 12Z", "#ff6b7a") + [[11, 16], [16, 19], [21, 16], [16, 14]].map(([x, y]) => B.e(x, y, 0.8, 1.3, "#3b2240")).join(""));
ikon("🫐", B.k(11, 19, 6, "#5a6fd6") + B.k(21, 20, 5.5, "#4a5fc6") + B.k(16, 11, 5.5, "#6a7fe6") + B.l("M15 9L16 11L17 9M10 17L11 19L12 17", "#2f3f8f", 1));
ikon("🥗", B.p("M3 15H29Q28 27 16 27Q4 27 3 15Z", "#fff") + blatt(10, 13, -20, 5, "#8fd47a") + blatt(20, 12, 25, 5, "#6fbf6a") + B.k(15, 12, 2.6, "#ff5f4f") + B.k(24, 14, 2, "#ffd54f"));
ikon("🍲", B.p("M4 14H28V20Q28 27 16 27Q4 27 4 20Z", "#b8c4d6") + B.e(16, 14, 12, 3, "#ffa94d") + B.r(1, 12, 4, 3, 1.5, "#8a93a8") + B.r(27, 12, 4, 3, 1.5, "#8a93a8") + B.l("M12 9Q10 6 12 3M18 9Q16 6 18 3", "#c9c2d0", 1.4));
ikon("🍠", B.p("M5 20Q8 8 20 8Q28 10 26 18Q22 26 12 25Q5 25 5 20Z", "#c9533a") + B.p("M20 8Q28 10 26 18Q22 14 20 8Z", "#ffb347"));
ikon("🍝", B.e(16, 22, 13, 5, "#fff") + B.p("M7 20Q7 12 16 11Q25 12 25 20Z", "#ffd88a") + B.l("M9 18Q13 14 17 18T25 17M10 15Q14 12 20 14", "#e8b64a", 1.3) + B.k(16, 13, 2.6, "#ff5f4f"));
ikon("🍰", B.p("M4 24L16 9L28 24Z", "#fff3dc") + B.p("M4 24H28V28H4Z", "#ffd88a") + B.l("M10 17H22", "#ff9fc8", 2.5) + B.k(16, 8, 2.6, "#ff4f6a"));
ikon("🍧", B.p("M8 17H24L21 29H11Z", "#b8e0ff") + B.k(16, 12, 7, "#ffc2dc") + B.k(12, 15, 4, "#fff") + B.k(20, 14, 3.5, "#7ad7f0") + B.k(16, 5, 1.8, "#ff4f6a"));
ikon("🎂", B.r(5, 15, 22, 12, 3, "#fff3dc") + B.p("M5 18Q8 21 11 18T16 18T21 18T27 18V15H5Z", "#ff9fc8") + B.r(15, 7, 2.4, 8, 1, "#7ad7f0") + B.p("M16.2 2Q19 5 16.2 7Q13.5 5 16.2 2Z", "#ffb347"));
ikon("🍯", B.r(10, 5, 12, 4, 1.5, "#c98a5a") + B.p("M8 10H24Q27 16 25 24Q23 28 16 28Q9 28 7 24Q5 16 8 10Z", "#f5b942") + B.r(10, 15, 12, 7, 2, "#fff3dc") + B.l("M10 12Q12 15 11 18", "#ffd88a", 1.8));
ikon("🍖", B.p("M6 20Q6 10 16 9Q24 9 24 16Q23 24 14 25Q7 25 6 20Z", "#c9633a") + B.l("M22 15L27 9", "#fff3dc", 3.2) + B.k(27.5, 7.5, 2.4, "#fff3dc") + B.k(29, 10, 2, "#fff3dc"));
ikon("🥣", B.p("M3 14H29Q28 27 16 27Q4 27 3 14Z", "#ffd1e6") + B.e(16, 14, 13, 3, "#fff3dc") + B.l("M22 13L28 4", "#c98a5a", 2.2));
ikon("🥚", B.p("M16 4C22 4 26 13 26 18A10 10 0 0 1 6 18C6 13 10 4 16 4Z", "#fff6e8") + B.glanz(12, 11, 2));
ikon("🌽", blatt(10, 22, -60, 9, "#8fd47a") + blatt(22, 22, 60, 9, "#6fbf6a") + B.e(16, 13, 5, 10, "#ffd54f") + [[14, 7], [18, 7], [14, 11], [18, 11], [14, 15], [18, 15], [16, 19]].map(([x, y]) => B.fk(x, y, 1, "#f5a623")).join(""));
ikon("😋", B.k(16, 16, 12, "#ffd54f") + B.augen(11.5, 20.5, 13) + B.p("M10 18Q16 25 22 18Z", "#b0476f") + B.fp("M17 21Q21 21 21 19L18 19Z", "#ff7eb6"));
