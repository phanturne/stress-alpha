import puppeteer from "puppeteer-core";

const CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
  console.log(
    "🚀 Launching Headless Chrome to measure Screener <-> Stock navigation..."
  );
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1440,900",
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // Listen to console errors and warnings
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  // Enable CDP Performance Domain to measure Long Tasks
  const client = await page.target().createCDPSession();
  await client.send("Performance.enable");

  console.log("\n--- STEP 1: Load Screener ---");
  await page.goto(`${BASE_URL}/?mode=screener`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("tbody tr.cursor-pointer", { timeout: 15000 });

  let rowCount = await page.evaluate(
    () => document.querySelectorAll("tbody tr.cursor-pointer").length
  );
  console.log(`Initial rows loaded: ${rowCount}`);

  // Test 1: Navigation WITHOUT scrolling (baseline)
  console.log("\n--- TEST 1: Navigation BEFORE scrolling (50 rows) ---");
  let t0 = Date.now();
  await page.evaluate(() => {
    const row = document.querySelector(
      "tbody tr.cursor-pointer"
    ) as HTMLElement;
    row?.click();
  });
  await page.waitForSelector("input[type='range']", { timeout: 10000 });
  let t1 = Date.now() - t0;
  console.log(`⏱️ Latency (Screener -> Stock, 50 rows): ${t1}ms`);

  // Navigate back to Screener
  t0 = Date.now();
  await page.evaluate(() => {
    const screenerBtn = Array.from(
      document.querySelectorAll("header nav button")
    )[1] as HTMLElement;
    screenerBtn?.click();
  });
  await page.waitForSelector("div.block table", { timeout: 10000 });
  let t2 = Date.now() - t0;
  console.log(`⏱️ Latency (Stock -> Screener, 50 rows): ${t2}ms`);

  // Now SCROLL to load all rows!
  console.log("\n--- STEP 2: Scrolling down to load hundreds of rows ---");
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise((r) => setTimeout(r, 150));
  }

  // Also click "Load All" if button is visible
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const loadAllBtn = buttons.find(
      (b) =>
        b.textContent?.includes("Load all") ||
        b.textContent?.includes("加载全部")
    );
    if (loadAllBtn) {
      loadAllBtn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  rowCount = await page.evaluate(
    () => document.querySelectorAll("tbody tr.cursor-pointer").length
  );
  const totalDomNodes = await page.evaluate(
    () => document.querySelectorAll("*").length
  );
  console.log(`📊 Rows loaded after scrolling: ${rowCount}`);
  console.log(`📊 Total DOM nodes in document: ${totalDomNodes}`);

  // Test 2: Navigation AFTER scrolling
  console.log("\n--- TEST 2: Navigation AFTER scrolling (all rows loaded) ---");

  // Measure Screener -> Stock page
  t0 = Date.now();
  await page.evaluate(() => {
    const row = document.querySelector(
      "tbody tr.cursor-pointer"
    ) as HTMLElement;
    row?.click();
  });
  await page.waitForSelector("input[type='range']", { timeout: 10000 });
  const delayScreenerToStock = Date.now() - t0;
  console.log(
    `⏱️ Latency (Screener -> Stock, ${rowCount} rows): ${delayScreenerToStock}ms`
  );

  // Measure Stock page -> Screener
  t0 = Date.now();
  await page.evaluate(() => {
    const screenerBtn = Array.from(
      document.querySelectorAll("header nav button")
    )[1] as HTMLElement;
    screenerBtn?.click();
  });
  await page.waitForSelector("div.block table", { timeout: 10000 });
  const delayStockToScreener = Date.now() - t0;
  console.log(
    `⏱️ Latency (Stock -> Screener, ${rowCount} rows): ${delayStockToScreener}ms`
  );

  // Repeat back to Stock page
  t0 = Date.now();
  await page.evaluate(() => {
    const row = document.querySelector(
      "tbody tr.cursor-pointer"
    ) as HTMLElement;
    row?.click();
  });
  await page.waitForSelector("input[type='range']", { timeout: 10000 });
  const delayScreenerToStock2 = Date.now() - t0;
  console.log(
    `⏱️ Latency (Screener -> Stock 2nd time): ${delayScreenerToStock2}ms`
  );

  console.log("\n=================== BENCHMARK SUMMARY ===================");
  console.log(
    `50 rows: Screener -> Stock: ${t1}ms | Stock -> Screener: ${t2}ms`
  );
  console.log(
    `${rowCount} rows: Screener -> Stock: ${delayScreenerToStock}ms | Stock -> Screener: ${delayStockToScreener}ms`
  );
  console.log("=========================================================");

  await browser.close();
}

main().catch(console.error);
