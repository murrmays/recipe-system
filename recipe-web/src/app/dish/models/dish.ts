import { Flag } from '../../core/models/flags';
import { Product } from '../../product/models/product';
import { DishCategory } from './dish-category';

export interface Dish {
  id: string;
  name: string;
  photos?: (File | string)[];
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  ingredients: DishIngredient[];
  portionSize: number;
  category: DishCategory;
  flags?: Flag[];
  creationDate?: Date;
  editDate?: Date;
}

export interface DishIngredient {
  product: Product;
  amount: number;
}

export type DishDraft = Omit<Dish, 'id' | 'creationDate' | 'editDate'>;
