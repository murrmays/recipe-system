import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, Injectable } from '@angular/core';
import { ProductFilter } from '../../../product/models/product-filters';
import { Observable } from 'rxjs';
import { Product, ProductDraft } from '../../../product/models/product';
import { DishFilter } from '../../../dish/models/dish-filter';
import { Dish, DishDraft } from '../../../dish/models/dish';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:8080/api';

  getFilteredProducts(filter: ProductFilter): Observable<Product[]> {
    let params = new HttpParams();

    Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => params = params.append(key, item));
      } else {
        params = params.set(key, value.toString());
      }
    }
  });

    return this.http.get<Product[]>(`${this.BASE_URL}/products`, {params});
  }
  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.BASE_URL}/products/${id}`);
  }
  createProduct(draft: FormData): Observable<Product> {
    return this.http.post<Product>(`${this.BASE_URL}/products`, draft);
  }
  editProduct(id: string, draft: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.BASE_URL}/products/${id}`, draft);
  }
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/products/${id}`);
  }

  getFilteredDishes(filter: DishFilter): Observable<Dish[]> {
    let params = new HttpParams();

    Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => params = params.append(key, item));
      } else {
        params = params.set(key, value.toString());
      }
    }
  });

    return this.http.get<Dish[]>(`${this.BASE_URL}/dishes`, {params});
  }
  getDishesContainingProduct(productId: string): Observable<Dish[]>{
    return this.http.get<Dish[]>(`${this.BASE_URL}/dishes/${productId}`)
  }
  getDish(id: string): Observable<Dish> {
    return this.http.get<Dish>(`${this.BASE_URL}/dishes/${id}`);
  }
  createDish(draft: FormData): Observable<Dish> {
    return this.http.post<Dish>(`${this.BASE_URL}/dishes`, draft);
  }
  editDish(id: string, draft: FormData): Observable<Dish> {
    return this.http.put<Dish>(`${this.BASE_URL}/dishes/${id}`, draft);
  }
  deleteDish(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/dishes/${id}`);
  }
}
