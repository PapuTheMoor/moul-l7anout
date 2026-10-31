import { expect, test, type Route } from "@playwright/test";

test("credit, repayment, undo and reload preserve the same shop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.screenshot({ path: ".tmp/moul7anout-home.png" });
  await page.getByRole("button", { name: "Exemples locaux", exact: true }).click();
  await page.getByRole("button", { name: "Achat à crédit", exact: true }).click();
  await page.getByRole("button", { name: "Comprendre l’opération", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Voilà ce que j’ai compris." })).toBeFocused();
  await page.screenshot({ path: ".tmp/moul7anout-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Confirmer l’opération", exact: true }).click();
  await expect(page.getByTestId("customer-balance-ahmed")).toContainText("49");
  await expect(page.getByTestId("product-stock-milk")).toContainText("22");
  await expect(page.getByTestId("summary-cash")).toContainText("0");
  await page.screenshot({ path: ".tmp/moul7anout-credit.png" });
  await page.getByRole("button", { name: "Remboursement", exact: true }).click();
  await page.getByRole("button", { name: "Comprendre l’opération", exact: true }).click();
  await page.getByRole("button", { name: "Confirmer l’opération", exact: true }).click();
  await expect(page.getByTestId("customer-balance-ahmed")).toContainText("Réglé");
  await expect(page.getByTestId("summary-cash")).toContainText("49");
  await expect(page.getByTestId("summary-sales")).toContainText("14");
  await page.getByRole("button", { name: "Annuler la dernière opération", exact: true }).click();
  await expect(page.getByTestId("customer-balance-ahmed")).toContainText("49");
  await page.reload();
  await expect(page.getByTestId("customer-balance-ahmed")).toContainText("49");
  await expect(page.getByTestId("product-stock-milk")).toContainText("22");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Réinitialiser le carnet", exact: true }).click();
  await expect(page.getByTestId("customer-balance-ahmed")).toContainText("35");
  await expect(page.getByTestId("product-stock-milk")).toContainText("24");
});

test("mobile keeps capture usable and has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByLabel("Que s’est-il passé dans votre hanout ?")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  await page.screenshot({ path: ".tmp/moul7anout-mobile.png", fullPage: true });
});

test("microphone denial after editing shows a useful error and keeps text usable", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Que s’est-il passé dans votre hanout ?").fill("Ahmed khda jouj l7lib");
  await page.evaluate(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { configurable: true, value: async () => { throw new DOMException("denied", "NotAllowedError"); } });
  });
  await page.getByRole("button", { name: "Enregistrer une opération en Darija", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "microphone" })).toBeVisible();
  await expect(page.getByLabel("Que s’est-il passé dans votre hanout ?")).toBeEnabled();
});

test("an old transcription cannot overwrite a newer recording", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecorder {
      static isTypeSupported() { return true; }
      state = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["test-audio"], { type: this.mimeType }) }); this.onstop?.(); }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FakeRecorder });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { configurable: true, value: async () => ({ getTracks: () => [{ stop() {} }] }) });
  });
  let firstRoute: Route | undefined;
  await page.route("**/api/transcribe", (route) => { firstRoute = route; });
  await page.goto("/");
  await page.getByRole("button", { name: "Enregistrer une opération en Darija", exact: true }).click();
  await page.getByRole("button", { name: "Terminer l’enregistrement", exact: true }).click();
  await expect.poll(() => Boolean(firstRoute)).toBe(true);
  await page.getByLabel("Que s’est-il passé dans votre hanout ?").fill("Ma nouvelle opération");
  await page.getByRole("button", { name: "Enregistrer une opération en Darija", exact: true }).click();
  await firstRoute!.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { text: "ANCIENNE TRANSCRIPTION" } }) }).catch(() => undefined);
  await page.waitForTimeout(150);
  await expect(page.getByLabel("Que s’est-il passé dans votre hanout ?")).toHaveValue("Ma nouvelle opération");
  await expect(page.getByRole("button", { name: "Terminer l’enregistrement", exact: true })).toBeVisible();
});
