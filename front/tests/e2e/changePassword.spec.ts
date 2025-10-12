import { test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ChangePasswordPage } from "../pages/ChangePasswordPage";
import dotenv from "dotenv";
dotenv.config();

const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3001";

test.describe("ChangePassword Flow (Page Object)", () => {
  const username = `e2euser_change_${Date.now()}`;
  const password = "123456";

  test.beforeAll(async ({ request }) => {
    // cria usuário via API antes de todos os testes
    await request.post(`${apiBaseUrl}/users`, {
      data: { username, password },
    });
  });

  test("deve alterar senha do usuário logado", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const changePasswordPage = new ChangePasswordPage(page);

    // login
    await loginPage.goto();
    await loginPage.fillUsername(username);
    await loginPage.fillPassword(password);
    await loginPage.submit();
    await dashboardPage.expectOnPage(username);

    // vai para alterar senha
    await page.click("text=Alterar Senha");
    await changePasswordPage.expectOnPage();

    await changePasswordPage.fillOldPassword(password);
    await changePasswordPage.fillNewPassword("novasenha");
    await changePasswordPage.submit();

    await changePasswordPage.expectSuccess();
  });

  test("não deve alterar senha com senha atual incorreta", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const changePasswordPage = new ChangePasswordPage(page);

    // login com senha já atualizada
    await loginPage.goto();
    await loginPage.fillUsername(username);
    await loginPage.fillPassword("novasenha");
    await loginPage.submit();
    await dashboardPage.expectOnPage(username);

    // vai para alterar senha
    await page.click("text=Alterar Senha");
    await changePasswordPage.expectOnPage();

    await changePasswordPage.fillOldPassword("senhaerrada");
    await changePasswordPage.fillNewPassword("outranova");
    await changePasswordPage.submit();

    await changePasswordPage.expectError("Senha atual incorreta");
  });

  test("deve redirecionar para login se token expirar", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const changePasswordPage = new ChangePasswordPage(page);

    // login com senha já atualizada
    await loginPage.goto();
    await loginPage.fillUsername(username);
    await loginPage.fillPassword("novasenha");
    await loginPage.submit();
    await dashboardPage.expectOnPage(username);

    // força logout limpando token localStorage
    await page.evaluate(() => localStorage.removeItem("token"));

    // tenta ir para alterar senha
    await changePasswordPage.goto();

    // deve redirecionar para login
    await loginPage.expectOnPage();
  });
});
