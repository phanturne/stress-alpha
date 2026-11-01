import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT_DIR, "docs", "images");

const CHROME_BIN =
  process.env.CHROME_BIN ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("🌐 Launching Headless Chrome via Remote Debugging Protocol...");
  const chrome = spawn(CHROME_BIN, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--remote-debugging-port=9222",
    "--window-size=1600,1050",
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1200));
    const listRes = await fetch("http://127.0.0.1:9222/json/list");
    const targets = await listRes.json();
    const target = targets.find((t) => t.type === "page") || targets[0];

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === curId) {
            ws.removeEventListener("message", handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send("Page.enable");

    async function capture(url, filename, setupExpr = null, delayMs = 2500) {
      console.log(`📸 Capturing: ${filename} (${url})...`);
      await send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, delayMs));

      if (setupExpr) {
        await send("Runtime.evaluate", { expression: setupExpr });
        await new Promise((r) => setTimeout(r, 1200));
      }

      const shot = await send("Page.captureScreenshot", { format: "png" });
      const dest = path.join(OUT_DIR, filename);
      await fs.writeFile(dest, Buffer.from(shot.data, "base64"));
      const stat = await fs.stat(dest);
      console.log(
        `   ✅ Saved ${filename} (${Math.round(stat.size / 1024)} KB)`
      );
    }

    // 1. Cockpit: Flow-through model + Scenario probability tree
    await capture(
      `${BASE_URL}/?report=NVDA-Q2-2027-analysis&tab=valuation`,
      "cockpit-preview.png",
      null,
      3000
    );

    // 2. Universe Screener
    await capture(`${BASE_URL}/screener`, "screener-preview.png", null, 3000);

    // 3. Watchlist Portfolio (pre-populate items before navigating)
    await send("Page.navigate", { url: `${BASE_URL}/screener` });
    await new Promise((r) => setTimeout(r, 1200));
    await send("Runtime.evaluate", {
      expression: `localStorage.setItem("stress_alpha_watchlist", JSON.stringify(["NVDA", "ORCL", "AVGO", "CRWV", "ONDS"]));`,
    });
    await capture(
      `${BASE_URL}/?report=NVDA-Q2-2027-analysis&mode=watchlist`,
      "watchlist-preview.png",
      null,
      3500
    );

    // 4. Investment Committee Memorandum
    await capture(
      `${BASE_URL}/?report=NVDA-Q2-2027-analysis&mode=memo`,
      "memo-preview.png",
      null,
      3000
    );

    // 5. Valuation Methodology
    await capture(
      `${BASE_URL}/methodology`,
      "methodology-preview.png",
      null,
      2500
    );

    ws.close();
  } finally {
    chrome.kill();
  }

  console.log("🎉 All screenshots updated successfully under docs/images/!");
}

main().catch((err) => {
  console.error("❌ Screenshot capture failed:", err);
  process.exit(1);
});
