import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const live = process.env.MOUL7ANOUT_LIVE_CHECK === "1";
const audioPath = path.resolve(".tmp/transcription-smoke.wav");
test.use({ launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${audioPath}`] } });

test("live OpenAI interprets a new Darija cash sale through the UI", async ({ page }) => {
  test.skip(!live, "Opt-in: uses workshop OpenAI credits with synthetic input.");
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Français", exact: true }).click();
  await page.getByLabel("Que s’est-il passé dans votre hanout ?").fill("Youssef khda tlata atay cash");
  await page.getByRole("button", { name: "Comprendre l’opération", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Voilà ce que j’ai compris." })).toBeVisible();
  await expect(page.getByLabel("Quantité produit 1")).toHaveValue("3");
  await expect(page.getByLabel("Produit 1", { exact: true })).toHaveValue("tea");
  await expect(page.getByLabel("Mode de règlement")).toHaveValue("cash");
  await page.getByRole("button", { name: "Confirmer l’opération", exact: true }).click();
  await expect(page.getByTestId("summary-cash")).toContainText("54");
  await expect(page.getByTestId("summary-sales")).toContainText("54");
});

test.describe("real browser recording with a disclosed synthetic audio fixture", () => {
  test("records, uploads, transcribes and interprets the audio", async ({ page }) => {
    test.skip(!live || !fs.existsSync(audioPath), "Opt-in: requires local synthetic fixture and workshop OpenAI credits.");
    test.setTimeout(60_000);
    await page.goto("/");
    await page.getByRole("button", { name: "Français", exact: true }).click();
    await page.getByRole("button", { name: "Enregistrer une opération en Darija", exact: true }).click();
    await page.waitForTimeout(4400); // Capture the complete four-second synthetic phrase.
    await page.getByRole("button", { name: "Terminer l’enregistrement", exact: true }).click();
    await expect(page.getByLabel("Que s’est-il passé dans votre hanout ?")).not.toHaveValue("", { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Voilà ce que j’ai compris." })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Client de l’opération")).toHaveValue("ahmed");
    await expect(page.getByLabel("Quantité produit 1")).toHaveValue("2");
    await expect(page.getByLabel("Mode de règlement")).toHaveValue("credit");
  });
});
