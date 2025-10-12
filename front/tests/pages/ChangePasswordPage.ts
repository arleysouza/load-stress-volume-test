import { Page, expect } from "@playwright/test";

export class ChangePasswordPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/change-password");
  }

  async fillOldPassword(password: string) {
    await this.page.fill("[data-testid='change-password-old']", password);
  }

  async fillNewPassword(password: string) {
    await this.page.fill("[data-testid='change-password-new']", password);
  }

  async submit() {
    await this.page.click("[data-testid='change-password-submit']");
  }

  async expectError(message: string) {
    const errorLocator = this.page.locator(
      "[data-testid='change-password-error']",
    );
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toHaveText(message);
    await this.expectOnPage(); // aproveita validação da própria página
  }

  async expectSuccess() {
    const successLocator = this.page.locator(
      "[data-testid='change-password-success']",
    );
    await expect(successLocator).toBeVisible();
    await expect(successLocator).toHaveText("Senha alterada com sucesso!");
    await this.expectOnPage(); // também valida que permanece na mesma tela
  }

  async expectOnPage() {
    await expect(this.page).toHaveURL(/.*change-password/);
    await expect(
      this.page.locator("[data-testid='change-password-title']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='change-password-old']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='change-password-new']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='change-password-submit']"),
    ).toBeVisible();
  }
}
