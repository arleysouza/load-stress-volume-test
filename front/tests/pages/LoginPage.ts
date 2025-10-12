import { Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/login");
  }

  async fillUsername(username: string) {
    await this.page.fill("[data-testid='login-username']", username);
  }

  async fillPassword(password: string) {
    await this.page.fill("[data-testid='login-password']", password);
  }

  async submit() {
    await this.page.click("[data-testid='login-submit']");
  }

  async expectError(message: string) {
    const errorLocator = this.page.locator("[data-testid='login-error']");
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toHaveText(message);
    await expect(this.page).toHaveURL(/.*login/);
  }

  async expectOnPage() {
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
}
