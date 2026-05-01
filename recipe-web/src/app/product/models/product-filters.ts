import { Flag } from '../../core/models/flags';
import { ProductCategory } from './product-category';
import { Readiness } from './readiness';

export interface ProductFilter {
  categories?: ProductCategory[];
  readiness?: Readiness[];
  flags?: Flag[];
  search?: string;
  sort?: ProductSort;
}

export type ProductSort =
  | 'nameAsc'
  | 'nameDesc'
  | 'caloriesAsc'
  | 'caloriesDesc'
  | 'proteinsAsc'
  | 'proteinsDesc'
  | 'fatsAsc'
  | 'fatsDesc'
  | 'carbsAsc'
  | 'carbsDesc';

export const SortList: ProductSort[] = [
  'nameAsc',
  'nameDesc',
  'caloriesAsc',
  'caloriesDesc',
  'proteinsAsc',
  'proteinsDesc',
  'fatsAsc',
  'fatsDesc',
  'carbsAsc',
  'carbsDesc'
];

export const SortMap = new Map([
  ['nameAsc', 'По алфавиту (А-Я)'],
  ['nameDesc', 'По алфавиту (Я-А)'],
  ['caloriesAsc', 'Калорийность (по возрастанию)'],
  ['caloriesDesc', 'Калорийность (по убыванию)'],
  ['proteinsAsc', 'Белки (по возрастанию)'],
  ['proteinDesc', 'Белки (по убыванию)'],
  ['fatsAsc', 'Жиры (по возрастанию)'],
  ['fatsDesc', 'Жиры (по убыванию)'],
  ['carbsAsc', 'Углеводы (по возрастанию)'],
  ['carbsDesc', 'Углеводы (по убыванию)']
])