import { test } from "@playwright/test";
import dotenv from "dotenv";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ContactsPage } from "../pages/ContactsPage";
dotenv.config();

const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3001";

test.describe("Contacts Flow (Page Object)", () => {
  const username = `e2euser_contacts_${Date.now()}`;
  const password = "123456";

  test.beforeAll(async ({ request }) => {
    // cria usuário via API antes de todos os testes
    await request.post(`${apiBaseUrl}/users`, {
      data: { username, password },
    });
  });

  test("deve criar, listar e excluir contatos", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const contactsPage = new ContactsPage(page);

    // login
    await loginPage.goto();
    await loginPage.fillUsername(username);
    await loginPage.fillPassword(password);
    await loginPage.submit();
    await dashboardPage.expectOnPage(username);

    // navega para contatos
    await page.click("text=Contatos");
    await contactsPage.expectOnPage();

    // cria contato
    const name = `Contato ${Date.now()}`;
    const phone = "5512988776655";
    await contactsPage.fillName(name);
    await contactsPage.fillPhone(phone);
    await contactsPage.submit();
    await contactsPage.expectContactVisible(name, phone);

    // deleta contato (encontra id pelo botão do primeiro item)
    // Como o id é dinâmico, selecionamos o primeiro botão Remover da lista
    const firstDelete = page
      .locator("[data-testid^='contacts-delete-']")
      .first();
    const btnCount = await firstDelete.count();
    if (btnCount > 0) {
      await firstDelete.click();
    }
    await contactsPage.expectContactNotVisible(name);
  });
});
