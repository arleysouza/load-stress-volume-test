import { Page, expect } from "@playwright/test";

export class ContactsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/contacts");
  }

  async fillName(name: string) {
    await this.page.fill("[data-testid='contacts-name']", name);
  }

  async fillPhone(phone: string) {
    await this.page.fill("[data-testid='contacts-phone']", phone);
  }

  async submit() {
    await this.page.click("[data-testid='contacts-submit']");
  }

  async deleteById(id: number) {
    await this.page.click(`[data-testid='contacts-delete-${id}']`);
  }

  async expectOnPage() {
    await expect(this.page).toHaveURL(/.*contacts/);
    await expect(
      this.page.locator("[data-testid='contacts-title']"),
    ).toBeVisible();
    await expect(
      this.page.locator("[data-testid='contacts-form']"),
    ).toBeVisible();
  }

  async expectContactVisible(name: string, phone: string) {
    const list = this.page.locator("[data-testid='contacts-list']");
    await expect(list.getByText(name)).toBeVisible();
    await expect(list.getByText(phone)).toBeVisible();
  }

  async expectContactNotVisible(name: string) {
    const list = this.page.locator("[data-testid='contacts-list']");
    await expect(list.getByText(name)).toHaveCount(0);
  }
}
