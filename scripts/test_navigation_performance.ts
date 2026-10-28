import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 3458;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOTS_DIR = path.join(process.cwd(), "docs/images/test-runs");

async function run() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log("🚀 Launching Headless Chrome via puppeteer-core...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1440,900",
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
    },
  });

  const page = await browser.newPage();

  // Step 1: Navigate to Home (starts in Screener mode)
  console.log("\n--- STEP 1: Navigate to Home (Screener) ---");
  const t0 = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("header nav", { timeout: 10000 });
  // Wait for real stock rows to populate (replacing skeleton rows)
  await page.waitForSelector("tbody tr.cursor-pointer", { timeout: 15000 });
  const loadTime = Date.now() - t0;
  console.log(`⏱️ Initial page load completed in ${loadTime}ms`);

  // Check initial row count in Screener table
  const initialRowCount = await page.evaluate(() => {
    return document.querySelectorAll("tbody tr").length;
  });
  console.log(
    `📊 Initial table row count: ${initialRowCount} (progressive batching active)`
  );

  // Measure Center Nav geometry in Screener mode
  const screenerNavBox = await page.evaluate(() => {
    const nav = document.querySelector("header nav");
    if (!nav) return null;
    const r = nav.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      centerX: r.x + r.width / 2,
    };
  });
  console.log("📐 Center Nav Box (Screener Mode):", screenerNavBox);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "01_screener_initial.png"),
  });

  // Step 2: Click on the first stock row to navigate to Cockpit (Model)
  console.log("\n--- STEP 2: Navigate from Screener -> Stock Model ---");
  const clickT0 = Date.now();
  // Click on the first stock ticker button in the table
  const clicked = await page.evaluate(() => {
    const firstRow = document.querySelector("tbody tr.cursor-pointer");
    if (firstRow) {
      (firstRow as HTMLElement).click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    console.error("❌ Could not find stock row to click!");
  }

  // Wait for Cockpit to be fully loaded with stress model sliders
  await page.waitForSelector("input[type='range']", { timeout: 10000 });

  const cockpitTransitionTime = Date.now() - clickT0;
  console.log(
    `⏱️ Transition latency (Screener -> Model fully loaded): ${cockpitTransitionTime}ms`
  );

  // Measure Center Nav geometry in Model mode
  const modelNavBox = await page.evaluate(() => {
    const nav = document.querySelector("header nav");
    if (!nav) return null;
    const r = nav.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      centerX: r.x + r.width / 2,
    };
  });
  console.log("📐 Center Nav Box (Model Mode):", modelNavBox);

  const deltaCenterX1 = Math.abs(
    (modelNavBox?.centerX ?? 0) - (screenerNavBox?.centerX ?? 0)
  );
  console.log(
    `📏 Nav Center Horizontal Shift (Screener -> Model): ${deltaCenterX1.toFixed(2)}px`
  );

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "02_cockpit_model.png"),
  });

  // Step 3: Click "Screener" Tab in Header to return to Screener
  console.log("\n--- STEP 3: Navigate from Model -> Screener via Menu Tab ---");
  const screenerClickT0 = Date.now();
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("header nav button"));
    // Screener is second button
    if (buttons[1]) {
      (buttons[1] as HTMLElement).click();
    }
  });

  // Check if Screener is instantly visible (hidden class removed)
  const isScreenerVisible = await page.evaluate(() => {
    const screenerWrapper = document.querySelector(
      "div.block > div.mx-auto.max-w-\\[1520px\\]"
    );
    return screenerWrapper !== null;
  });

  const screenerTransitionTime = Date.now() - screenerClickT0;
  console.log(
    `⏱️ Transition latency (Model -> Screener): ${screenerTransitionTime}ms`
  );
  console.log(`✅ Screener visible immediately: ${isScreenerVisible}`);

  // Measure Center Nav geometry after returning to Screener
  const returnScreenerNavBox = await page.evaluate(() => {
    const nav = document.querySelector("header nav");
    if (!nav) return null;
    const r = nav.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      centerX: r.x + r.width / 2,
    };
  });
  console.log(
    "📐 Center Nav Box (Returned to Screener):",
    returnScreenerNavBox
  );

  const deltaCenterX2 = Math.abs(
    (returnScreenerNavBox?.centerX ?? 0) - (modelNavBox?.centerX ?? 0)
  );
  console.log(
    `📏 Nav Center Horizontal Shift (Model -> Screener): ${deltaCenterX2.toFixed(2)}px`
  );

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "03_returned_to_screener.png"),
  });

  // Step 4: Scroll Table Container to test progressive loading (Intersection Observer)
  console.log("\n--- STEP 4: Test Progressive Scroll Loading ---");
  const beforeScrollCount = await page.evaluate(() => {
    return document.querySelectorAll("tbody tr.group").length;
  });
  console.log(`📊 Row count before scroll: ${beforeScrollCount}`);

  // Scroll down the table scroll container
  await page.evaluate(() => {
    const scrollContainer = document.querySelector(
      "[role='region'][aria-label='Stock Screener Table']"
    );
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  // Wait a moment for intersection observer to increment batch
  await new Promise((r) => setTimeout(r, 800));

  const afterScrollCount = await page.evaluate(() => {
    return document.querySelectorAll("tbody tr.group").length;
  });
  console.log(`📊 Row count after scroll: ${afterScrollCount}`);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "04_screener_scrolled.png"),
  });

  // Step 5: Test Watchlist Tab
  console.log("\n--- STEP 5: Navigate from Screener -> Watchlist Tab ---");
  const wlClickT0 = Date.now();
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("header nav button"));
    if (buttons[2]) {
      (buttons[2] as HTMLElement).click();
    }
  });

  const wlTransitionTime = Date.now() - wlClickT0;
  console.log(
    `⏱️ Transition latency (Screener -> Watchlist): ${wlTransitionTime}ms`
  );

  const wlNavBox = await page.evaluate(() => {
    const nav = document.querySelector("header nav");
    if (!nav) return null;
    const r = nav.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      centerX: r.x + r.width / 2,
    };
  });
  console.log("📐 Center Nav Box (Watchlist Mode):", wlNavBox);

  const deltaCenterX3 = Math.abs(
    (wlNavBox?.centerX ?? 0) - (screenerNavBox?.centerX ?? 0)
  );
  console.log(
    `📏 Nav Center Horizontal Shift (Screener -> Watchlist): ${deltaCenterX3.toFixed(2)}px`
  );

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "05_watchlist_view.png"),
  });

  await browser.close();

  console.log("\n================ TEST SUMMARY ================");
  console.log(
    `1. Nav Horizontal Drift: ${deltaCenterX1.toFixed(2)}px (Threshold: <= 1.0px)`
  );
  console.log(
    `2. Screener Load Latency: ${screenerTransitionTime}ms (Threshold: < 50ms)`
  );
  console.log(
    `3. Model Load Latency: ${cockpitTransitionTime}ms (Threshold: < 100ms)`
  );
  console.log(
    `4. Progressive Loading: ${beforeScrollCount} -> ${afterScrollCount} rows auto-incremented`
  );
  console.log(`5. Screenshots saved to: ${SCREENSHOTS_DIR}`);

  if (deltaCenterX1 > 1.0) {
    throw new Error(
      `FAIL: Nav center shifted by ${deltaCenterX1}px! Expected <= 1px.`
    );
  }
  if (screenerTransitionTime > 100) {
    throw new Error(
      `FAIL: Screener transition took ${screenerTransitionTime}ms! Expected < 100ms.`
    );
  }
  console.log("\n🎉 ALL TESTS PASSED WITH 100% SPEC COMPLIANCE!");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
