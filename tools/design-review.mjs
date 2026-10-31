import { chromium, expect } from "@playwright/test";

const pass = process.argv[2] || "initial";
if (!["initial", "confirm"].includes(pass)) throw new Error("Use initial or confirm for the bounded design pass.");
const browser = await chromium.launch({ channel: "chrome" });
const reports = [];

async function inspect(page) {
  return page.evaluate(() => {
    const rgb = (value) => {
      const values = value.match(/[\d.]+/g)?.map(Number);
      return values && values.length >= 3 ? [values[0], values[1], values[2], values[3] ?? 1] : [0, 0, 0, 0];
    };
    const blend = (front, back) => front.slice(0, 3).map((v, i) => v * front[3] + back[i] * (1 - front[3]));
    const background = (element) => {
      if (!element) return [255, 255, 255];
      const color = rgb(getComputedStyle(element).backgroundColor);
      return color[3] >= 1 ? color.slice(0, 3) : blend(color, background(element.parentElement));
    };
    const luminance = (color) => color.map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 2 && rect.height > 2 && style.visibility !== "hidden" && Number(style.opacity) > 0.05 && !element.closest('[aria-hidden="true"], [inert], .sr-only');
    };
    const textElements = [...document.querySelectorAll("body *")].filter((element) => visible(element) && [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) && !element.closest("button:disabled, [disabled], svg, script, style"));
    const contrast = textElements.map((element) => {
      const style = getComputedStyle(element);
      const bg = background(element);
      const fg = blend(rgb(style.color), bg);
      const actual = ratio(fg, bg);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
      return { text: element.textContent.trim().slice(0, 65), ratio: Number(actual.toFixed(2)), required: large ? 3 : 4.5, fontSize: style.fontSize };
    }).filter((item) => item.ratio + 0.05 < item.required).sort((a, b) => a.ratio - b.ratio);
    const smallText = textElements.filter((element) => parseFloat(getComputedStyle(element).fontSize) < 12).map((element) => ({ text: element.textContent.trim().slice(0, 60), fontSize: getComputedStyle(element).fontSize }));
    const smallTargets = [...document.querySelectorAll('button, a[href], input:not([type="hidden"]), select')].filter((element) => visible(element) && !element.disabled).map((element) => ({ name: element.getAttribute("aria-label") || element.textContent.trim().slice(0, 50), width: Math.round(element.getBoundingClientRect().width), height: Math.round(element.getBoundingClientRect().height) })).filter((item) => item.width < 24 || item.height < 24);
    const mic = document.querySelector(".mic-button")?.getBoundingClientRect();
    return { horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, contrast: contrast.slice(0, 15), smallText: smallText.slice(0, 15), smallTargets: smallTargets.slice(0, 15), mic: mic ? { x: Math.round(mic.x), y: Math.round(mic.y), width: Math.round(mic.width), height: Math.round(mic.height) } : null };
  });
}

try {
  for (const [device, viewport] of [["desktop", { width: 1440, height: 1050 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 1000)); });
    await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("button", { name: "Exemples locaux", exact: true })).toBeEnabled();
    await page.screenshot({ path: `.tmp/design-${pass}-${device}.png` });
    if (device === "desktop") await page.screenshot({ path: ".tmp/moul7anout-home.png" });
    const initial = await inspect(page);
    await page.getByRole("button", { name: "Exemples locaux", exact: true }).click();
    await page.getByRole("button", { name: "Achat à crédit", exact: true }).click();
    await page.getByRole("button", { name: "Comprendre l’opération", exact: true }).click();
    await expect(page.getByRole("button", { name: "Confirmer l’opération", exact: true })).toBeVisible();
    await page.screenshot({ path: `.tmp/design-${pass}-${device}-draft.png` });
    const draft = await inspect(page);
    await page.getByRole("button", { name: "Confirmer l’opération", exact: true }).click();
    await expect(page.getByTestId("customer-balance-ahmed")).toContainText("49");
    if (device === "desktop") await page.screenshot({ path: ".tmp/moul7anout-credit.png" });
    reports.push({ device, initial, draft, errors, consoleErrors });
    await context.close();
  }
  console.log(JSON.stringify({ pass, reports }, null, 2));
} finally { await browser.close(); }
