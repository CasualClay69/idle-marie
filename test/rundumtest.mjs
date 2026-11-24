// =====================================================
//  Rundum-Test starten:  node test/rundumtest.mjs
//  Startet Edge unsichtbar (headless) mit der Debug-Schnittstelle, öffnet test/rundumtest.html,
//  wartet bis der Test fertig ist und gibt das Ergebnis aus. Rückgabewert 0 = alles OK.
// =====================================================
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const EDGE = process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9300 + Math.floor(Math.random() * 500);
const ordner = path.dirname(fileURLToPath(import.meta.url));
const seite = pathToFileURL(path.join(ordner, process.env.SEITE || "rundumtest.html")).href;
const profil = fs.mkdtempSync(path.join(os.tmpdir(), "rundumtest-"));
const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profil}`, "about:blank"], { stdio: "ignore" });
const schlaf = ms => new Promise(r => setTimeout(r, ms));

async function ende(code) {
  edge.kill();
  await schlaf(500);
  try { fs.rmSync(profil, { recursive: true, force: true }); } catch (e) { /* egal */ }
  process.exit(code);
}

try {
  // Auf die Debug-Schnittstelle warten
  let ziel;
  for (let i = 0; i < 40 && !ziel; i++) {
    await schlaf(250);
    try { ziel = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === "page"); } catch (e) { /* noch nicht da */ }
  }
  if (!ziel) throw new Error("Edge-Debug-Schnittstelle nicht erreichbar");
  const ws = new WebSocket(ziel.webSocketDebuggerUrl);
  await new Promise((ok, nein) => { ws.onopen = ok; ws.onerror = nein; });
  let nr = 0; const warten = new Map();
  const browserFehler = [];
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && warten.has(d.id)) { warten.get(d.id)(d.result); warten.delete(d.id); }
    if (d.method === "Runtime.exceptionThrown") browserFehler.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  };
  const cdp = (method, params = {}) => new Promise(ok => { const id = ++nr; warten.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });
  const wert = async ausdruck => (await cdp("Runtime.evaluate", { expression: ausdruck, returnByValue: true })).result?.value;

  await cdp("Runtime.enable");
  await cdp("Page.navigate", { url: seite });
  const start = Date.now();
  let titel = "";
  const grenze = Number(process.env.GRENZE || 240000);
  while (Date.now() - start < grenze) {
    await schlaf(1000);
    titel = await wert("document.title") || "";
    if (titel.startsWith("FERTIG")) break;
    const stand = (await wert("document.getElementById('ergebnis')?.textContent") || "").split("\n")[0];
    if (process.stdout.isTTY) process.stdout.write(`\r${stand.slice(0, 90).padEnd(90)}`);
  }
  if (process.stdout.isTTY) process.stdout.write("\r" + " ".repeat(90) + "\r");
  console.log(await wert("document.getElementById('ergebnis').textContent"));
  if (browserFehler.length) console.log("\nFehler auf der Testseite selbst:\n" + browserFehler.slice(0, 5).join("\n"));
  ws.close();
  await ende(titel === "FERTIG OK" ? 0 : 1);
} catch (e) {
  console.error("Rundum-Test konnte nicht laufen:", e.message);
  await ende(2);
}
