import { Page, Locator } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly addBtn: Locator;
  readonly nameInput: Locator;
  readonly caloriesInput: Locator;
  readonly proteinsInput: Locator;
  readonly fatsInput: Locator;
  readonly carbsInput: Locator;
  readonly ingredientsInput: Locator;
  readonly categorySelect: Locator;
  readonly readinessSelect: Locator;
  readonly submitBtn: Locator;
  readonly fileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addBtn = page.locator('.add-product-btn');

    this.nameInput = page.locator('[formControlName="name"]');
    this.caloriesInput = page.locator('[formControlName="calories"]');
    this.proteinsInput = page.locator('[formControlName="proteins"]');
    this.fatsInput = page.locator('[formControlName="fats"]');
    this.carbsInput = page.locator('[formControlName="carbs"]');
    this.ingredientsInput = page.locator('[formControlName="ingredients"]');
    this.categorySelect = page.locator('[formControlName="category"]');
    this.readinessSelect = page.locator('[formControlName="readiness"]');
    this.submitBtn = page.locator('.product-form .submit-btn');
    this.fileInput = page.locator('.product-form input[type="file"]');
  }

  async goto() {
    await this.page.goto('/products');
  }

  async openAddModal() {
    await this.addBtn.click();
    await this.nameInput.waitFor({ state: 'visible' });
  }

  async fillForm(data: {
    name: string;
    calories: string;
    proteins: string;
    fats: string;
    carbs: string;
    ingredients: string;
    category: string;
    readiness: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.caloriesInput.fill(data.calories);
    await this.proteinsInput.fill(data.proteins);
    await this.fatsInput.fill(data.fats);
    await this.carbsInput.fill(data.carbs);
    await this.ingredientsInput.fill(data.ingredients);
    await this.categorySelect.selectOption({ label: data.category });
    await this.readinessSelect.selectOption({ label: data.readiness });
  }

  async toggleFlag(flagName: string) {
    await this.page.locator(`.product-form input[value="${flagName}"]`).check();
  }

  async submit() {
    await this.submitBtn.click();
  }
}
