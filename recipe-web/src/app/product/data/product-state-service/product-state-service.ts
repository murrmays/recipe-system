import { Component, effect, inject, signal } from '@angular/core';
import { ProductService } from '../product-service/product-service';
import { Product } from '../../models/product';
import { ProductFilter } from '../../models/product-filters';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { asyncScheduler, catchError, observeOn, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-product-state-service',
  imports: [],
  templateUrl: './product-state-service.html',
  styleUrl: './product-state-service.css',
})
export class ProductStateService {
  private service = inject(ProductService);
  filters = signal<ProductFilter>({
    categories: [],
    readiness: [],
    flags: [],
    search: '',
    sort: 'nameAsc',
  });
  isLoading = signal(false);

  state = toSignal(
    toObservable(this.filters).pipe(
      observeOn(asyncScheduler),
      tap(() => this.isLoading.set(true)),
      switchMap((f) => this.service.getFilteredProducts(f).pipe(catchError(() => of([])))),
      tap(() => this.isLoading.set(false)),
    ),
    { initialValue: [] as Product[] },
  );

  updateFilters(newFilters: Partial<ProductFilter>) {
    this.filters.update((old) => ({ ...old, ...newFilters }));
  }
  refresh() {
    this.filters.update((f) => ({ ...f }));
  }
}
