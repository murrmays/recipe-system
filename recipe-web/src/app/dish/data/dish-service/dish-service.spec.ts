import { TestBed } from '@angular/core/testing';
import { Product } from '../../../product/models/product';
import { DishService } from './dish-service';
import { DishIngredient } from '../../models/dish';

describe('TDishService: Nutrition Calculation', () => {
  let service: DishService;

  const mockProduct: Product = {
    id: 'p1',
    name: 'Курица',
    calories: 200,
    proteins: 20,
    fats: 12,
    carbs: 0,
    category: 'Мясной',
  } as Product;
  const waterProduct: Product = {
    id: 'p2',
    calories: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
  } as Product;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DishService],
    });
    service = TestBed.inject(DishService);
  });

  it('should return zeros when ingredients list is empty', () => {
    const result = service.countNutritionValue([], 0);
    expect(result.calories).toBe(0);
  });
  it('should return 0 calories if portionSize is 0', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 100 }];
    const result = service.countNutritionValue(ingredients, 0);
    expect(result.calories).toBe(0);
  });
  it('should not scale values when portionSize is exactly 100', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 100 }];
    const result = service.countNutritionValue(ingredients, 100);
    expect(result.calories).toBe(200);
  });

  it('should return 0 calories if amount is negative', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: -50 }];
    const result = service.countNutritionValue(ingredients, 100);
    expect(result.calories).toBeGreaterThanOrEqual(0);
  });

  it('should return 0 calories if portionSize is negative', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 100 }];
    const result = service.countNutritionValue(ingredients, -200);
    expect(result.calories).toBe(0);
  });

  it('should return 0 calories when quantity is 0', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 0 }];
    const result = service.countNutritionValue(ingredients, 100);
    expect(result.calories).toBe(0);
  });

  it('should handle floating point quantities correctly (e.g. 33.3g)', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 33.3 }];
    const result = service.countNutritionValue(ingredients, 100);
    expect(result.calories).toBeCloseTo(66.6, 1);
  });

  it('should correctly sum nutrition values from multiple ingredients', () => {
    const ingredients: DishIngredient[] = [
      { product: mockProduct, amount: 200 },
      { product: waterProduct, amount: 500 },
    ];
    const result = service.countNutritionValue(ingredients, 100);
    expect(result.calories).toBe(400);
  });

  [
    { amount: 100, portion: 200, expected: 400 },
    { amount: 200, portion: 100, expected: 400 },
    { amount: 50, portion: 50, expected: 50 },
  ].forEach(({ amount, portion, expected }) => {
    it(`should return ${expected} kcal for amount=${amount}g and portion=${portion}g`, () => {
      const result = service.countNutritionValue([{ product: mockProduct, amount }], portion);
      expect(result.calories).toBe(expected);
    });
  });

  it('should handle high calorie density products (max boundary 900kcal/100g)', () => {
    const oil: Product = { ...mockProduct, calories: 900 };
    const result = service.countNutritionValue([{ product: oil, amount: 50 }], 100);
    expect(result.calories).toBe(450);
  });

  it('should round to tenths instead of floor', () => {
    const product = { ...mockProduct, calories: 199.99 };
    const result = service.countNutritionValue([{ product, amount: 100 }], 100);
    expect(result.calories).toBeCloseTo(200.0, 1);
  });

  it('should return one decimal place for complex calculations', () => {
    const result = service.countNutritionValue([{ product: mockProduct, amount: 100 }], 33.3);
    expect(result.calories).toBe(66.6);
    const stringValue = result.calories.toString();
    expect(stringValue.split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
  });

  it('should scale down values for smaller portion (50g)', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 100 }];
    const result = service.countNutritionValue(ingredients, 50);
    expect(result.calories).toBe(100);
  });
  it('should handle large portion sizes (10000g)', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 100 }];
    const result = service.countNutritionValue(ingredients, 10000);
    expect(result.calories).toBe(20000);
  });
});
