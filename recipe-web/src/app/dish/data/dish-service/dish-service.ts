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

  countNutritionValue(ingredients: DishIngredient[], portionSize: number): NutritionValue {
    const result = ingredients.reduce(
      (acc, curr) => {
        const ratio = curr.amount / 100;
        const portionRatio = portionSize / 100;

        return {
          calories: acc.calories + curr.product.calories * ratio * portionRatio,
          proteins: acc.proteins + curr.product.proteins * ratio,
          fats: acc.fats + curr.product.fats * ratio,
          carbs: acc.carbs + curr.product.carbs * ratio,
        };
      },
      { calories: 0, proteins: 0, fats: 0, carbs: 0 },
    );

    return {
      calories: Math.round(result.calories * 10) / 10,
      proteins: Math.round(result.proteins * 10) / 10,
      fats: Math.round(result.fats * 10) / 10,
      carbs: Math.round(result.carbs * 10) / 10,
    };
  }
}
