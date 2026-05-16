import { Page, Locator } from '@playwright/test';

export class DishPage {
  readonly page: Page;
  readonly addBtn: Locator;
  readonly nameInput: Locator;
  readonly caloriesInput: Locator;
  readonly portionSizeInput: Locator;
  readonly proteinsInput: Locator;
  readonly fatsInput: Locator;
  readonly carbsInput: Locator;
  readonly categorySelect: Locator;
  readonly addIngredientBtn: Locator;
  readonly submitBtn: Locator;
  readonly fileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addBtn = page.getByRole('button', { name: 'Добавить' });

    this.nameInput = page.locator('.dish-form [formControlName="name"]');
    this.caloriesInput = page.locator('.dish-form [formControlName="calories"]');
    this.portionSizeInput = page.locator('.dish-form [formControlName="portionSize"]');
    this.proteinsInput = page.locator('.dish-form [formControlName="proteins"]');
    this.fatsInput = page.locator('.dish-form [formControlName="fats"]');
    this.carbsInput = page.locator('.dish-form [formControlName="carbs"]');
    this.categorySelect = page.locator('.dish-form [formControlName="category"]');
    this.addIngredientBtn = page.locator('.dish-form .add-ing-btn');
    this.submitBtn = page.locator('.dish-form .submit-btn');
    this.fileInput = page.locator('.dish-form input[type="file"]');
  }

  async goto() {
    await this.page.goto('/dishes');
  }

  async openAddModal() {
    await this.addBtn.click();
    await this.nameInput.waitFor({ state: 'visible' });
  }

  async fillBasicInfo(data: {
    name: string;
    calories: string;
    portionSize: string;
    proteins: string;
    fats: string;
    carbs: string;
    category: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.caloriesInput.fill(data.calories);
    await this.portionSizeInput.fill(data.portionSize);
    await this.proteinsInput.fill(data.proteins);
    await this.fatsInput.fill(data.fats);
    await this.carbsInput.fill(data.carbs);
    await this.categorySelect.selectOption({ label: data.category });
  }

  async addIngredient(index: number, productLabel: string, amount: string) {
    const row = this.page.locator('.ingredient-row').nth(index);
    if (!(await row.isVisible())) {
      await this.addIngredientBtn.click();
    }

    await row.locator('[formControlName="product"]').selectOption({ label: productLabel });
    await row.locator('[formControlName="amount"]').fill(amount);
  }

  async toggleFlag(flagName: string) {
    const checkbox = this.page.locator(`input[type="checkbox"][value="${flagName}"]`);

    await checkbox.check({ force: true });
  }

  async submit() {
    await this.submitBtn.click();
  }
}
