import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:3000", channel: "chrome", viewport: { width: 1440, height: 1050 }, screenshot: "only-on-failure" },
});
