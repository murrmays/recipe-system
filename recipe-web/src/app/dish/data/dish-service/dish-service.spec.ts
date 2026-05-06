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
    const result = service.countNutritionValue([]);
    expect(result.calories).toBe(0);
    expect(result.proteins).toBe(0);
    expect(result.fats).toBe(0);
    expect(result.carbs).toBe(0);
  });

  it('should correctly calculate the total for a single ingredient', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 100 }];
    const result = service.countNutritionValue(ingredients);
    expect(result.calories).toBe(200);
    expect(result.proteins).toBe(20);
  });

  it('should correctly sum nutrition values from multiple ingredients', () => {
    const ingredients: DishIngredient[] = [
      { product: mockProduct, amount: 200 },
      { product: waterProduct, amount: 500 },
    ];
    const result = service.countNutritionValue(ingredients);
    expect(result.calories).toBe(400);
  });

  [
    { amount: 100, expected: 200 },
    { amount: 200, expected: 400 },
    { amount: 50, expected: 100 },
  ].forEach(({ amount, expected }) => {
    it('should return ${expected} kcal for amount=${amount}g ', () => {
      const result = service.countNutritionValue([{ product: mockProduct, amount }]);
      expect(result.calories).toBe(expected);
    });
  });

  it('should return 0 when ingredient amount is 0', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 0 }];
    const result = service.countNutritionValue(ingredients);
    expect(result.calories).toBe(0);
  });

  it('should treat a negative amount as 0', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: -50 }];
    const result = service.countNutritionValue(ingredients);
    expect(result.calories).toBe(0);
  });

  it('should handle floating point amounts correctly', () => {
    const ingredients: DishIngredient[] = [{ product: mockProduct, amount: 33.3 }];
    const result = service.countNutritionValue(ingredients);
    expect(result.calories).toBeCloseTo(66.6, 1);
  });

  it('should correctly calculate for a high-calorie ingredient', () => {
    const oil: Product = { ...mockProduct, calories: 900 };
    const ingredients: DishIngredient[] = [{ product: oil, amount: 50 }];
    const result = service.countNutritionValue(ingredients);
    expect(result.calories).toBe(450);
  });

  it('should round the final total to one decimal place', () => {
    const ingredients = [{ product: mockProduct, amount: 12.34 }];
    const result = service.countNutritionValue(ingredients);
    expect(result.calories).toBe(24.7);
  });
});
