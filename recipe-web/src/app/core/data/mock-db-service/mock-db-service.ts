import { Component } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ProductFilter } from '../../../product/models/product-filters';
import { DishFilter } from '../../../dish/models/dish-filter';
import { Dish, DishDraft, DishIngredient } from '../../../dish/models/dish';
import { DishCategory } from '../../../dish/models/dish-category';
import { Flag } from '../../models/flags';
import { Product, ProductDraft } from '../../../product/models/product';

@Component({
  selector: 'app-mock-db-service',
  imports: [],
  templateUrl: './mock-db-service.html',
  styleUrl: './mock-db-service.css',
})
export class MockDbService {
  private readonly products_key = 'app-products';
  private readonly dishes_key = 'app-dishes';

  constructor() {
    this.seedDb();
  }
  createProduct(draft: ProductDraft): Observable<Product> {
    const products = this.readFromStorage<Product[]>(this.products_key);
    const newProduct: Product = {
      ...draft,
      id: crypto.randomUUID(),
      creationDate: new Date(),
    };

    products.push(newProduct);
    this.saveToStorage(this.products_key, products);
    return of(newProduct).pipe(delay(500));
  }
  getAllProducts(): Observable<Product[]> {
    return of(this.readFromStorage<Product[]>(this.products_key)).pipe(delay(500));
  }
  getFilteredProducts(filters: ProductFilter): Observable<Product[]> {
    const allProducts = this.readFromStorage<Product[]>(this.products_key);

    const filteredProducts = allProducts.filter((p) => {
      const matchesSearch =
        !filters.search ||
        p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.ingredients?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory =
        !filters.categories?.length || filters.categories.includes(p.category);
      const matchesReadiness =
        !filters.readiness?.length || filters.readiness.includes(p.readiness);
      const matchesFlags =
        !filters.flags?.length || filters.flags.every((f) => p.flags?.includes(f));

      return matchesSearch && matchesCategory && matchesReadiness && matchesFlags;
    });

    if (filters.sort) {
      filteredProducts.sort((a, b) => {
        switch (filters.sort) {
          case 'nameAsc':
            return a.name.localeCompare(b.name);
          case 'nameDesc':
            return b.name.localeCompare(a.name);

          case 'caloriesAsc':
            return a.calories - b.calories;
          case 'caloriesDesc':
            return b.calories - a.calories;

          case 'proteinsAsc':
            return a.proteins - b.proteins;
          case 'proteinsDesc':
            return b.proteins - a.proteins;

          case 'fatsAsc':
            return a.fats - b.fats;
          case 'fatsDesc':
            return b.fats - a.fats;

          case 'carbsAsc':
            return a.carbs - b.carbs;
          case 'carbsDesc':
            return b.carbs - a.carbs;

          default:
            return 0;
        }
      });
    }

    return of(filteredProducts).pipe(delay(500));
  }
  getProduct(id: string): Observable<Product | undefined> {
    const product = this.readFromStorage<Product[]>(this.products_key).find((p) => p.id === id);
    return of(product).pipe(delay(200));
  }
  editProduct(id: string, draft: ProductDraft): Observable<Product | undefined> {
    const allProducts = this.readFromStorage<Product[]>(this.products_key);
    const index = allProducts.findIndex((p) => p.id === id);

    if (index === -1) return of(undefined).pipe(delay(200));
    const productToEdit = allProducts[index];

    const editedProduct: Product = {
      ...draft,
      id: id,
      creationDate: productToEdit.creationDate,
      editDate: new Date(),
    };

    const updatedProducts = [
      ...allProducts.slice(0, index),
      editedProduct,
      ...allProducts.slice(index + 1),
    ];

    this.saveToStorage(this.products_key, updatedProducts);
    return of(editedProduct).pipe(delay(200));
  }
  deleteProduct(id: string): Observable<void> {
    const allProducts = this.readFromStorage<Product[]>(this.products_key);
    const updatedProducts = allProducts.filter((p) => p.id !== id);

    this.saveToStorage(this.products_key, updatedProducts);
    return of(undefined);
  }

  createDish(draft: DishDraft): Observable<Dish> {
    const dishes = this.readFromStorage<Dish[]>(this.dishes_key);

    const { category: calculatedCategory, cleanName } = this.checkCategory(draft.name);
    const flags = this.checkFlags(draft.ingredients);
    const category = draft.category || calculatedCategory;

    const newDish: Dish = {
      ...draft,
      id: crypto.randomUUID(),
      name: cleanName,
      category: category,
      flags: flags,
      creationDate: new Date()
    };

    dishes.push(newDish);
    this.saveToStorage(this.dishes_key, dishes);
    return of(newDish).pipe(delay(200));
  }
  getFilteredDishes(filters: DishFilter): Observable<Dish[]> {
    const allDishes = this.readFromStorage<Dish[]>(this.dishes_key);

    const filteredDishes = allDishes.filter((d) => {
      const matchesSearch =
        !filters.search || d.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory =
        !filters.categories?.length || filters.categories.includes(d.category);
      const matchesFlags =
        !filters.flags?.length || filters.flags.every((f) => d.flags?.includes(f));

      return matchesSearch && matchesCategory && matchesFlags;
    });

    return of(filteredDishes).pipe(delay(500));
  }
  getDish(id: string): Observable<Dish | undefined> {
    const dish = this.readFromStorage<Dish[]>(this.dishes_key).find((d) => d.id === id);
    return of(dish).pipe(delay(200));
  }
  editDish(id: string, draft: DishDraft): Observable<Dish | undefined> {
    const allDishes = this.readFromStorage<Dish[]>(this.dishes_key);
    const index = allDishes.findIndex((d) => d.id === id);
    const { category: calculatedCategory, cleanName } = this.checkCategory(draft.name);
    const flags = this.checkFlags(draft.ingredients);
    const category = draft.category || calculatedCategory;

    if (index === -1) return of(undefined).pipe(delay(200));
    const dishToEdit = allDishes[index];

    const editedDish: Dish = {
      ...draft,
      id: dishToEdit.id,
      name: cleanName,
      category: category,
      flags: flags,
      creationDate: dishToEdit.creationDate,
      editDate: new Date(),
    };

    const updatedDishes = [...allDishes.slice(0, index), editedDish, ...allDishes.slice(index + 1)];

    this.saveToStorage(this.dishes_key, updatedDishes);
    return of(editedDish).pipe(delay(200));
  }
  deleteDish(id: string): Observable<void> {
    const allDishes = this.readFromStorage<Dish[]>(this.dishes_key);
    const updatedDishes = allDishes.filter((d) => d.id !== id);

    this.saveToStorage(this.dishes_key, updatedDishes);
    return of(undefined);
  }
  getDishesContainingProduct(id: string): Observable<Dish[]> {
    const dishes = this.readFromStorage<Dish[]>(this.dishes_key).filter((d) =>
      d.ingredients.some((i) => i.product.id === id),
    );

    return of(dishes).pipe(delay(500));
  }

  private readFromStorage<T>(key: string): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : ([] as T);
  }
  private saveToStorage(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  private checkCategory(name: string): { category: DishCategory | null; cleanName: string } {
    const macroMap: Record<string, DishCategory> = {
      '!десерт': 'Десерт',
      '!первое': 'Первое',
      '!второе': 'Второе',
      '!напиток': 'Напиток',
      '!салат': 'Салат',
      '!суп': 'Суп',
      '!перекус': 'Перекус',
    };

    const macroRegex = new RegExp(Object.keys(macroMap).join('|'), 'g');
    const matches = name.match(macroRegex);

    if (matches && matches.length > 0) {
      const firstMacro = matches[0];
      const category = macroMap[firstMacro];

      const cleanName = name.replace(macroRegex, '').replace(/\s+/g, ' ').trim();

      return { category, cleanName };
    }

    return { category: null, cleanName: name };
  }
  private checkFlags(ingredients: DishIngredient[]): Flag[] {
    const checkFlag = (flagName: Flag): boolean => {
      return ingredients.every((i) => i.product.flags?.includes(flagName));
    };

    const result: Flag[] = [];
    if (checkFlag('Веган')) result.push('Веган');
    if (checkFlag('Без глютена')) result.push('Без глютена');
    if (checkFlag('Без сахара')) result.push('Без сахара');

    return result;
  }
  private seedDb() {
    if (!localStorage.getItem(this.products_key)) {
      const products: Product[] = [
        {
          id: crypto.randomUUID(),
          name: 'Картошка',
          photos: [],
          calories: 300,
          proteins: 6,
          fats: 4,
          carbs: 60,
          ingredients: '',
          category: 'Овощи',
          readiness: 'Требует приготовления',
          flags: [],
          creationDate: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: 'Мясо',
          photos: [],
          calories: 500,
          proteins: 30,
          fats: 20,
          carbs: 6,
          ingredients: '',
          category: 'Мясной',
          readiness: 'Требует приготовления',
          flags: [],
          creationDate: new Date(),
        },
      ];
      this.saveToStorage(this.products_key, products);
    }
  }
}
