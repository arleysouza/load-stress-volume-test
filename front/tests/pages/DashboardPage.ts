import { Page, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectWelcomeMessage(username: string) {
    await expect(this.page).toHaveURL(/.*dashboard/);
    await expect(
      this.page.locator("[data-testid='dashboard-title']"),
    ).toContainText(`Bem-vindo, ${username}`);
  }

  async expectUserId(userId: number) {
    await expect(
      this.page.locator("[data-testid='dashboard-user-id']"),
    ).toContainText(`ID: ${userId}`);
  }

  async expectUIElements() {
    await expect(this.page.locator("button:has-text('Sair')")).toBeVisible();
    await expect(this.page.locator("nav")).toBeVisible();
  }

  async expectOnPage(username?: string) {
    await expect(this.page).toHaveURL(/.*dashboard/);
    await expect(
      this.page.locator("[data-testid='dashboard-title']"),
    ).toBeVisible();
    if (username) {
      await expect(
        this.page.locator("[data-testid='dashboard-title']"),
      ).toContainText(`Bem-vindo, ${username}`);
    }
    await this.expectUIElements();
  }
}
