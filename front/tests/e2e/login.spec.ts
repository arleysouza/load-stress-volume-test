import { test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import dotenv from "dotenv";
dotenv.config();

const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3001";

test.describe("Login Flow (Page Object)", () => {
  const username = `e2euser_login_${Date.now()}`;
  const password = "123456";

  test.beforeAll(async ({ request }) => {
    // cria usuário via API antes de todos os testes
    await request.post(`${apiBaseUrl}/users`, {
      data: { username, password },
    });
  });

  test("deve falhar login com usuário inexistente", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillUsername("wronguser");
    await loginPage.fillPassword(password);
    await loginPage.submit();

    await loginPage.expectError("Credenciais inválidas.");
    await loginPage.expectOnPage();
  });

  test("deve falhar login com senha incorreta", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillUsername(username);
    await loginPage.fillPassword("incorreta");
    await loginPage.submit();

    await loginPage.expectError("Credenciais inválidas.");
    await loginPage.expectOnPage();
  });

  test("deve logar com usuário válido e ir para dashboard", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.fillUsername(username);
    await loginPage.fillPassword(password);
    await loginPage.submit();

    await dashboardPage.expectOnPage(username);
    await dashboardPage.expectUIElements();
  });
});
