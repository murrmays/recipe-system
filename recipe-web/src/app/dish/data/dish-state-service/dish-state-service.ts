import { Component, inject, signal } from '@angular/core';
import { DishService } from '../dish-service/dish-service';
import { DishFilter } from '../../models/dish-filter';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { asyncScheduler, catchError, observeOn, of, switchMap, tap } from 'rxjs';
import { Dish } from '../../models/dish';

@Component({
  selector: 'app-dish-state-service',
  imports: [],
  templateUrl: './dish-state-service.html',
  styleUrl: './dish-state-service.css',
})
export class DishStateService {
  private service = inject(DishService);
  filters = signal<DishFilter>({
    categories: [],
    flags: [],
    search: '',
  });
  isLoading = signal(false);

  state = toSignal(
    toObservable(this.filters).pipe(
      observeOn(asyncScheduler),
      tap(() => this.isLoading.set(true)),
      switchMap((f) => this.service.getAllDishes(f).pipe(catchError(() => of([])))),
      tap(() => this.isLoading.set(false)),
    ),
    { initialValue: [] as Dish[]},
  );

  updateFilters(newFilters: Partial<DishFilter>) {
    this.filters.update((old) => ({ ...old, ...newFilters }));
  }
  refresh() {
    this.filters.update((f) => ({ ...f }));
  }
}
