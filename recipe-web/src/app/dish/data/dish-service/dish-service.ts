import { Component, inject } from '@angular/core';
import { Dish, DishDraft, DishIngredient } from '../../models/dish';
import { Observable, throwError } from 'rxjs';
import { NutritionValue } from '../../../core/models/nutrition-value';
import { DishFilter } from '../../models/dish-filter';
import { MockDbService } from '../../../core/data/mock-db-service/mock-db-service';
import { ApiService } from '../../../core/data/api-service/api-service';

@Component({
  selector: 'app-dish-service',
  imports: [],
  templateUrl: './dish-service.html',
  styleUrl: './dish-service.css',
})
export class DishService {
  // private db = inject(MockDbService);
  private db = inject(ApiService);

  createDish(draft: DishDraft): Observable<Dish> {
    const formData = new FormData();

    const dishDto = {
      name: draft.name,
      calories: draft.calories,
      proteins: draft.proteins,
      fats: draft.fats,
      carbs: draft.carbs,
      category: draft.category,
      portionSize: draft.portionSize,
      ingredients: draft.ingredients.map((ing) => ({
        productId: ing.product.id,
        amount: ing.amount,
      })),
      flags: draft.flags,
    };
    const jsonBlob = new Blob([JSON.stringify(dishDto)], {
      type: 'application/json',
    });
    formData.append('dto', jsonBlob);

    if (draft.photos && draft.photos.length > 0) {
      draft.photos.forEach((photo: any) => {
        const fileToUpload = photo.file ? photo.file : photo;
        formData.append('files', fileToUpload);
      });
    }

    return this.db.createDish(formData);
  }
  getAllDishes(filter: DishFilter): Observable<Dish[]> {
    return this.db.getFilteredDishes(filter);
  }
  getDishById(id: string): Observable<Dish | undefined> {
    return this.db.getDish(id);
  }
  editDish(id: string, draft: DishDraft): Observable<Dish | undefined> {
    const formData = new FormData();
    const existingPhotoPaths = draft.photos?.filter((p: any) => typeof p === 'string');
    const newPhotoFiles = draft.photos?.filter((p: any) => typeof p !== 'string');

    const dishDto = {
      name: draft.name,
      calories: draft.calories,
      proteins: draft.proteins,
      fats: draft.fats,
      carbs: draft.carbs,
      category: draft.category,
      portionSize: draft.portionSize,
      ingredients: draft.ingredients.map((ing) => ({
        productId: ing.product.id,
        amount: ing.amount,
      })),
      photos: existingPhotoPaths,
      flags: draft.flags,
    };
    const jsonBlob = new Blob([JSON.stringify(dishDto)], {
      type: 'application/json',
    });
    formData.append('dto', jsonBlob);

    newPhotoFiles?.forEach((photo: any) => {
      const fileToUpload = photo.file ? photo.file : photo;
      formData.append('files', fileToUpload);
    });
    return this.db.editDish(id, formData);
  }
  deleteDish(id: string): Observable<void> {
    return this.db.deleteDish(id);
  }

  countNutritionValue(ingredients: DishIngredient[]): NutritionValue {
    // const safePortionSize = Number(portionSize) || 0;

    const totals = (ingredients || []).reduce(
      (acc, curr) => {
        const weight = Math.max(0, Number(curr.amount) || 0);
        const prod = curr.product;

        if (!prod) return acc;
        const ratio = weight / 100;

        return {
          weight: acc.weight + weight,
          calories: acc.calories + (Number(prod.calories) || 0) * ratio,
          proteins: acc.proteins + (Number(prod.proteins) || 0) * ratio,
          fats: acc.fats + (Number(prod.fats) || 0) * ratio,
          carbs: acc.carbs + (Number(prod.carbs) || 0) * ratio,
        };
      },
      { weight: 0, calories: 0, proteins: 0, fats: 0, carbs: 0 },
    );

    if (totals.weight === 0) {
      return { calories: 0, proteins: 0, fats: 0, carbs: 0 };
    }
    const round = (val: number) => Number(val.toFixed(1));
    // const factor = safePortionSize / totals.weight;

    // return {
    //   calories: round(totals.calories * factor),
    //   proteins: round(totals.proteins * factor),
    //   fats: round(totals.fats * factor),
    //   carbs: round(totals.carbs * factor),
    // };
    return {
      calories: round(totals.calories),
      proteins: round(totals.proteins),
      fats: round(totals.fats),
      carbs: round(totals.carbs),
    };
  }
}
