import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
dotenv.config();

const baseURL =
  process.env.CI === "true"
    ? "http://front-e2e-front:80" // quando roda no Docker
    : `http://localhost:${process.env.FRONT_HOST_PORT || 3003}`;

export default defineConfig({
  testDir: "./tests/e2e", // pasta dos testes
  timeout: 30 * 1000, // 30s por teste
  expect: {
    timeout: 5000,
  },
  retries: 2, // reexecuta até 2x em caso de falha
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL, // front rodando no docker
    headless: true, // sempre headless
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "Chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Só inicia webServer em ambiente local
  ...(process.env.CI !== "true"
    ? {
        webServer: {
          command: "npm run dev",
          port: Number(process.env.FRONT_HOST_PORT || 3003),
          reuseExistingServer: true,
        },
      }
    : {}),
});
