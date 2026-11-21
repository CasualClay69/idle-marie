"use strict";
// =====================================================
//  TÖNE – kleine Klänge mit dem Web-Audio-Baustein (keine Dateien nötig)
// =====================================================

const ton = {
  an: true,
  kontext: null,
  laden() {
    try { this.an = localStorage.getItem("idleMarie-ton") !== "aus"; } catch (e) { /* egal */ }
  },
  speichern() {
    try { localStorage.setItem("idleMarie-ton", this.an ? "an" : "aus"); } catch (e) { /* egal */ }
  },
  spiele(noten, typ = "sine", lautstaerke = 0.08) {
    if (!this.an || document.hidden) return;
    try {
      this.kontext ||= new (window.AudioContext || window.webkitAudioContext)();
      const k = this.kontext;
      if (k.state === "suspended") k.resume();
      let zeit = k.currentTime;
      for (const [frequenz, dauer] of noten) {
        const osz = k.createOscillator(), laut = k.createGain();
        osz.type = typ;
        osz.frequency.value = frequenz;
        laut.gain.setValueAtTime(lautstaerke, zeit);
        laut.gain.exponentialRampToValueAtTime(0.001, zeit + dauer);
        osz.connect(laut).connect(k.destination);
        osz.start(zeit);
        osz.stop(zeit + dauer);
        zeit += dauer * 0.8;
      }
    } catch (e) { /* kein Ton möglich */ }
  },
  klick()  { this.spiele([[660, 0.06]], "triangle", 0.05); },
  fertig() { this.spiele([[880, 0.05]], "sine", 0.03); },
  muenze() { this.spiele([[988, 0.07], [1319, 0.12]], "square", 0.03); },
  nein()   { this.spiele([[300, 0.12], [220, 0.16]], "triangle", 0.06); },
  stufe()  { this.spiele([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]], "triangle", 0.07); },
};
