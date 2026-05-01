import { Flag } from "../../core/models/flags";
import { DishCategory } from "./dish-category";

export interface DishFilter{
    categories?: DishCategory[];
    flags?: Flag[];
    search?: string;
}