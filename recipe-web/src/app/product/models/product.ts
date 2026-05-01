import { Readiness } from "./readiness"
import { ProductCategory } from "./product-category"
import { Flag } from "../../core/models/flags"

export interface Product {
    id: string;
    name: string,
    photos?: (File | string)[],
    calories: number,
    proteins: number,
    fats: number,
    carbs: number,
    ingredients?: string | null,
    category: ProductCategory,
    readiness: Readiness,
    flags?: Flag[],
    creationDate?: Date,
    editDate?: Date,
}

export type ProductDraft = Omit<Product, 'id' | 'creationDate' | 'editDate'>
