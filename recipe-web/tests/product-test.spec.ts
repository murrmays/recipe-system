/// <reference types="node" />

import { test, expect } from '@playwright/test';
import { ProductPage } from './product.po';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Product Management Suite', () => {
  let productPage: ProductPage;
  const tempDir = path.join(__dirname, 'temp-test-files');
  const tempImagePath = path.join(tempDir, 'test-image.jpg');

  test.beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    fs.writeFileSync(tempImagePath, 'fake-image-data');
  });

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    await page.route('**/api/products*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.continue();
      }
    });
    await productPage.goto();
    await productPage.openAddModal();
  });

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test.afterAll(async () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should successfully create a product with valid EP data', async ({ page }) => {
    await page.route('**/api/products', async (route) => {
      await route.fulfill({ status: 201, json: { id: '1', name: 'Apple' } });
    });

    await productPage.fillForm({
      name: 'Apple',
      calories: '52',
      proteins: '0.3',
      fats: '0.2',
      carbs: '14',
      ingredients: '100% Apple',
      category: 'Овощи',
      readiness: 'Требует приготовления',
    });

    await expect(productPage.submitBtn).toBeEnabled();
    await productPage.submit();
    await expect(productPage.nameInput).toBeHidden();
  });

  const nutrientBoundaries = [
    { desc: 'negative values', val: '-10', isValid: false },
    { desc: 'zero value', val: '0', isValid: true },
    { desc: 'reasonable value', val: '100', isValid: true },
    { desc: 'big value', val: '100000', isValid: true },
  ];

  for (const { desc, val, isValid } of nutrientBoundaries) {
    test(`should validate nutrient fields with ${desc} (BVA)`, async () => {
      await productPage.fillForm({
        name: 'Test Product',
        calories: val,
        proteins: '30',
        fats: '30',
        carbs: '30',
        ingredients: 'None',
        category: 'Жидкость',
        readiness: 'Готовый к употреблению',
      });

      if (isValid) {
        await expect(productPage.submitBtn).toBeEnabled();
      } else {
        await expect(productPage.submitBtn).toBeDisabled();
      }
    });
  }

  const nameBoundaries = [
    { desc: 'empty string', val: '', isValid: false },
    { desc: 'single character', val: 'A', isValid: false },
    { desc: 'max length string', val: 'A'.repeat(255), isValid: true },
  ];

  for (const { desc, val, isValid } of nameBoundaries) {
    test(`should validate product name length with ${desc} (BVA)`, async () => {
      await productPage.fillForm({
        name: val,
        calories: '100',
        proteins: '10',
        fats: '10',
        carbs: '10',
        ingredients: 'None',
        category: 'Жидкость',
        readiness: 'Готовый к употреблению',
      });

      if (isValid) {
        await expect(productPage.submitBtn).toBeEnabled();
      } else {
        await expect(productPage.submitBtn).toBeDisabled();
      }
    });
  }

  test('should keep submit button disabled if any required field is missing (EP)', async () => {
    await productPage.nameInput.fill('Incomplete Product');
    await productPage.caloriesInput.fill('100');

    await expect(productPage.submitBtn).toBeDisabled();
  });

  test.only('should allow uploading up to maximum allowed photos', async () => {
    await productPage.fileInput.setInputFiles(tempImagePath);
    await expect(productPage.page.locator('.preview-item')).toHaveCount(1);

    const filePaths = [tempImagePath, tempImagePath, tempImagePath, tempImagePath, tempImagePath];
    await productPage.fileInput.setInputFiles(filePaths);
    await expect(productPage.page.locator('.preview-item')).toHaveCount(5);
  });

  test('should remove a photo from the preview list', async () => {
    await productPage.fileInput.setInputFiles({
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    await expect(productPage.page.locator('.preview-item')).toHaveCount(1);
    await productPage.page.locator('.remove-photo').click();
    await expect(productPage.page.locator('.preview-item')).toHaveCount(0);
  });

  test('should send correct payload structure to the API', async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/products') && req.method() === 'POST',
    );

    await page.route('**/api/products', async (route) => {
      await route.fulfill({ status: 201, json: { id: '2' } });
    });

    await productPage.fillForm({
      name: 'Payload Test',
      calories: '50',
      proteins: '5',
      fats: '5',
      carbs: '5',
      ingredients: 'Test',
      category: 'Мясной',
      readiness: 'Требует приготовления',
    });

    await productPage.submit();
    const request = await requestPromise;
    const postData = request.postData();

    expect(postData).toContain('Payload Test');
    expect(postData).toContain('50');
  });
});
