import { Page, expect } from "@playwright/test";

export class RegisterPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/register");
  }

  async fillUsername(username: string) {
    await this.page.fill("[data-testid='register-username']", username);
  }

  async fillPassword(password: string) {
    await this.page.fill("[data-testid='register-password']", password);
  }

  async submit() {
    await this.page.click("[data-testid='register-submit']");
  }

  async expectError(message: string) {
    const errorLocator = this.page.locator("[data-testid='register-error']");
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toHaveText(message);
    await this.expectOnPage(); // aproveita a validação da própria página
  }

  async expectSuccessRedirect() {
    await expect(this.page).toHaveURL(/.*login/);
    await expect(
      this.page.locator("[data-testid='login-title']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='login-username']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='login-password']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='login-submit']"),
    ).toBeVisible();
  }

  async expectOnPage() {
    await expect(this.page).toHaveURL(/.*register/);
    await expect(
      this.page.locator("[data-testid='register-title']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='register-username']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='register-password']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='register-submit']"),
    ).toBeVisible();
  }
}
