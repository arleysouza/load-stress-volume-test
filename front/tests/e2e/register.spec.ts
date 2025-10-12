import { test } from "@playwright/test";
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";

test.describe("Register Flow", () => {
  const username = `e2euser_register_${Date.now()}`;
  const password = "123456";

  test("deve registrar novo usuário e redirecionar para login", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);

    await registerPage.goto();
    await registerPage.fillUsername(username);
    await registerPage.fillPassword(password);
    await registerPage.submit();

    await registerPage.expectSuccessRedirect();
    await loginPage.expectOnPage();
  });

  test("não deve permitir registrar sem username", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.fillPassword(password);
    await registerPage.submit();

    await registerPage.expectError("Campo obrigatório: username");
    await registerPage.expectOnPage();
  });

  test("não deve permitir registrar sem password", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.fillUsername(username);
    await registerPage.submit();

    await registerPage.expectError("Campo obrigatório: password");
    await registerPage.expectOnPage();
  });

  test("não deve permitir registrar usuário duplicado", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    // cria usuário
    await registerPage.goto();
    await registerPage.fillUsername(username);
    await registerPage.fillPassword(password);
    await registerPage.submit();

    // tenta criar de novo
    await registerPage.goto();
    await registerPage.fillUsername(username);
    await registerPage.fillPassword(password);
    await registerPage.submit();

    await registerPage.expectError(
      `O nome de usuário "${username}" já está cadastrado. Escolha outro.`,
    );
    await registerPage.expectOnPage();
  });
});
