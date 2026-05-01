import { Routes } from '@angular/router';
import { ProductPage } from './product/ui/product-page/product-page';
import { DishPage } from './dish/ui/dish-page/dish-page';
import { ProductDetails } from './product/ui/product-details/product-details';
import { DishDetails } from './dish/ui/dish-details/dish-details';

export const routes: Routes = [
    {path: '', component: ProductPage},
    {path: 'products', component: ProductPage},
    {path: 'dishes', component: DishPage},
    {path: 'product/:id', component: ProductDetails},
    {path: 'dish/:id', component: DishDetails}
];
