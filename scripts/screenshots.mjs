// Renders the demo page with the simulated data of both houses at a fixed time (15 Nov 2026, 21:30 Berlin) and
// saves the README screenshots: the whole card (light / dark) for Wolf and Viessmann, the burner views, the
// heating curve, an opened tip and the mini card. Usage: npm run screenshots
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { serve } from "./serve.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
mkdirSync(`${root}screenshots`, { recursive: true });
const server = serve();
await new Promise((resolve, reject) => server.once("listening", resolve).once("error", reject));
const port = server.address().port;
const browser = await chromium.launch();
const TIME = new Date("2026-11-15T21:30:00+01:00");
const shot = (name) => `${root}screenshots/${name}.png`;

try {
  for (const house of ["wolf", "viessmann"]) {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({
        viewport: { width: 1100, height: 5200 },
        deviceScaleFactor: 2,
        reducedMotion: "no-preference",
        timezoneId: "Europe/Berlin",
      });
      await page.clock.setFixedTime(TIME);
      await page.goto(`http://127.0.0.1:${port}/demo/?lang=de&house=${house}`);
      await page.locator(`#${theme}`).evaluate((el) => {
        el.style.padding = "16px";
        el.style.width = "492px";
      });
      const card = page.locator(`#${theme} central-heating-card`).first();
      await card.locator(".footer").waitFor();
      await card.locator("#curve-plot svg").waitFor();
      await card.locator(".tips").waitFor();
      await page.waitForTimeout(500);
      const tag = `${house}-${theme}`;
      await card.screenshot({ path: shot(`card-${tag}`) });
      console.log(`saved screenshots/card-${tag}.png`);
      if (theme === "light") {
        for (const view of ["takt", "days", "months"]) {
          await card.locator(`.seg button[data-view="${view}"]`).click();
          await page.waitForTimeout(200);
          await card
            .locator("section", { has: page.locator("#plot") })
            .screenshot({ path: shot(`burner-${view}-${house}`) });
          console.log(`saved screenshots/burner-${view}-${house}.png`);
        }
        await card
          .locator("section", { has: page.locator("#curve-plot") })
          .screenshot({ path: shot(`curve-${house}`) });
        await card.locator("details.tip").first().locator("summary").click();
        await page.waitForTimeout(200);
        await card.locator("section", { has: page.locator(".tips") }).screenshot({ path: shot(`tips-${house}`) });
        console.log(`saved screenshots/curve-${house}.png, tips-${house}.png`);
      }
      const mini = page.locator(`#${theme} central-heating-mini-card`).first();
      await mini.locator(".banner, .mini").first().waitFor();
      await page.waitForTimeout(300);
      await mini.screenshot({ path: shot(`mini-${tag}`) });
      console.log(`saved screenshots/mini-${tag}.png`);
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
