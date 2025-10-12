import { test } from "@playwright/test";
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

test.describe("Dashboard Flow (Page Object)", () => {
  const username = `e2euser_dashboard_${Date.now()}`;
  const password = "123456";

  test("deve exibir informações do usuário logado", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // registra novo usuário
    await registerPage.goto();
    await registerPage.fillUsername(username);
    await registerPage.fillPassword(password);
    await registerPage.submit();
    await registerPage.expectSuccessRedirect();

    // faz login
    await loginPage.fillUsername(username);
    await loginPage.fillPassword(password);
    await loginPage.submit();

    // valida dashboard
    await dashboardPage.expectOnPage(username);
    await dashboardPage.expectWelcomeMessage(username);

    // como o user.id vem do backend, não sabemos aqui o valor exato.
    // mas podemos validar que o campo está presente.
    await dashboardPage.expectUIElements();
  });
});
