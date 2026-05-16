import { test, expect } from '@playwright/test';
import { DishPage } from './dish.po';

test.describe('Dish Management Suite', () => {
  let dishPage: DishPage;

  test.beforeEach(async ({ page }) => {
    dishPage = new DishPage(page);
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: '1', name: 'Tomato', calories: 20 },
          { id: '2', name: 'Chicken', calories: 150 },
        ],
      });
    });
    await dishPage.goto();
    await dishPage.openAddModal();
  });

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('should successfully create a dish with valid EP data and ingredients', async ({ page }) => {
    await page.route('**/api/dishes', async (route) => {
      await route.fulfill({ status: 201, json: { id: '1', name: 'Chicken Salad' } });
    });

    await dishPage.fillBasicInfo({
      name: 'Chicken Salad',
      calories: '300',
      portionSize: '250',
      proteins: '30',
      fats: '10',
      carbs: '5',
      category: 'Салат',
    });

    await dishPage.addIngredient(0, 'Tomato (20 кк.)', '100');
    await dishPage.addIngredient(1, 'Chicken (150 кк.)', '150');

    await expect(dishPage.submitBtn).toBeEnabled();
    await dishPage.submit();
    await expect(dishPage.nameInput).toBeHidden();
  });

  const portionBoundaries = [
    { desc: 'negative weight', val: '-50', isValid: false },
    { desc: 'zero weight', val: '0', isValid: false },
    { desc: 'valid positive weight', val: '300', isValid: true },
  ];

  for (const { desc, val, isValid } of portionBoundaries) {
    test(`should validate portion size with ${desc} (BVA)`, async () => {
      await dishPage.fillBasicInfo({
        name: 'Test Dish',
        calories: '100',
        portionSize: val,
        proteins: '10',
        fats: '10',
        carbs: '10',
        category: 'Суп',
      });

      await dishPage.addIngredient(0, 'Tomato (20 кк.)', '100');

      if (isValid) {
        await expect(dishPage.submitBtn).toBeEnabled();
      } else {
        await expect(dishPage.submitBtn).toBeDisabled();
      }
    });
  }

  test('should disable submission if ingredient amount is missing (EP)', async () => {
    await dishPage.fillBasicInfo({
      name: 'Incomplete Dish',
      calories: '100',
      portionSize: '100',
      proteins: '10',
      fats: '10',
      carbs: '10',
      category: 'Суп',
    });

    await dishPage.addIngredientBtn.click();
    const row = dishPage.page.locator('.ingredient-row').nth(0);
    await row.locator('[formControlName="product"]').selectOption({ label: 'Tomato (20 кк.)' });

    await expect(dishPage.submitBtn).toBeDisabled();
  });

  test('should correctly add and remove ingredient rows', async ({ page }) => {
    await dishPage.addIngredient(0, 'Tomato (20 кк.)', '50');
    await dishPage.addIngredient(1, 'Chicken (150 кк.)', '100');

    await expect(page.locator('.ingredient-row')).toHaveCount(2);

    await page.locator('.ingredient-row').nth(0).locator('.remove-btn').click();

    await expect(page.locator('.ingredient-row')).toHaveCount(1);
  });

  test('should require a category selection (EP)', async () => {
    await dishPage.fillBasicInfo({
      name: 'No Category Dish',
      calories: '100',
      portionSize: '100',
      proteins: '10',
      fats: '10',
      carbs: '10',
      category: 'Выберите категорию',
    });

    await dishPage.addIngredient(0, 'Tomato (20 кк.)', '100');
    await expect(dishPage.submitBtn).toBeDisabled();
  });

  test('should handle server error gracefully during submission', async ({ page }) => {
    await page.route('**/api/dishes', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await dishPage.fillBasicInfo({
      name: 'Error Dish',
      calories: '100',
      portionSize: '100',
      proteins: '10',
      fats: '10',
      carbs: '10',
      category: 'Суп',
    });
    await dishPage.addIngredient(0, 'Tomato (20 кк.)', '100');

    await dishPage.submit();
    await expect(dishPage.nameInput).toBeVisible();
  });
});
