import { Component, computed, inject, signal } from '@angular/core';
import { Dish, DishDraft } from '../../models/dish';
import { ProductStateService } from '../../../product/data/product-state-service/product-state-service';
import { DishStateService } from '../../data/dish-state-service/dish-state-service';
import { DishService } from '../../data/dish-service/dish-service';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, of, switchMap } from 'rxjs';
import { AlertModal } from '../../../core/ui/alert-modal/alert-modal';
import { DishCreationForm } from '../dish-creation-form/dish-creation-form';

@Component({
  selector: 'app-dish-details',
  imports: [LucideAngularModule, DatePipe, AlertModal, DishCreationForm],
  templateUrl: './dish-details.html',
  styleUrl: './dish-details.css',
})
export class DishDetails {
  private service = inject(DishService);
  private dishStateService = inject(DishStateService);
  productService = inject(ProductStateService);
  private route = inject(ActivatedRoute);
  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));
  private readonly SERVER_URL = 'http://localhost:8080';

  state = this.dishStateService;
  dishToEdit = signal<Dish | null>(null);
  dishIdToDelete = signal<string | null>(null);
  alertData = signal<{ type: 'error' | 'success' | 'warn'; msg: string } | null>(null);
  currentImage = signal(0);
  isModalOpen = signal(false);
  isSubmitting = signal(false);

  private refreshTrigger = signal(0);
  dishInfo = toSignal(
    toObservable(
      computed(() => ({
        id: this.id(),
        trigger: this.refreshTrigger(),
      })),
    ).pipe(
      switchMap(({ id }) => {
        if (!id) return of(null);
        return this.service.getDishById(id);
      }),
    ),
    { initialValue: null },
  );

  displayPhotos = computed(() => {
    const photos = this.dishInfo()?.photos || [];

    return photos.map((p) => {
      if (typeof p === 'string') {
        return p.startsWith('http') ? p : `${this.SERVER_URL}${p}`;
      } else if (p instanceof File) {
        return URL.createObjectURL(p);
      }

      return '';
    });
  });

  ngOnDestroy() {
    this.displayPhotos().forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
  handleEdit(id: string) {
    const dish = this.state.state().find((d) => d.id === id);
    if (dish) {
      this.dishToEdit.set(dish);
      this.openModal();
    }
  }
  requestDelete(id: string) {
    this.dishIdToDelete.set(id);
    this.alertData.set({ type: 'warn', msg: 'Вы уверены, что хотите удалить это блюдо?' });
  }

  handleFormSubmit(draft: DishDraft) {
    this.isSubmitting.set(true);
    const existingDish = this.dishToEdit();

    if (existingDish) {
      this.service.editDish(existingDish.id, draft).subscribe({
        next: () => {
          this.alertData.set({ type: 'success', msg: 'Блюдо успешно обновлено' });
          this.refreshTrigger.update((v) => v + 1);
          this.closeModal();
        },
        error: () => {
          this.alertData.set({ type: 'error', msg: 'Ошибка при обновление блюда' });
          this.isSubmitting.set(false);
        },
      });
    } else {
      this.service.createDish(draft).subscribe({
        next: () => {
          this.alertData.set({ type: 'success', msg: 'Блюдо успешно добавлено' });
          this.isSubmitting.set(false);
          this.refreshTrigger.update((v) => v + 1);
          this.closeModal();
        },
        error: () => {
          this.alertData.set({ type: 'error', msg: 'Ошибка при создании блюда' });
          this.isSubmitting.set(false);
        },
      });
    }
  }

  openModal() {
    this.isModalOpen.set(true);
  }
  closeModal() {
    this.dishToEdit.set(null);
    this.isModalOpen.set(false);
  }

  showAlert(msg: string, type: 'error' | 'success' = 'error') {
    this.alertData.set({ type, msg });
  }
  closeAlert() {
    this.alertData.set(null);
    this.dishIdToDelete.set(null);
  }
  handleConfirm(result: boolean) {
    const id = this.dishIdToDelete();
    const currentAlert = this.alertData();

    if (!result || currentAlert?.type !== 'warn') {
      this.closeAlert();
      return;
    }

    if (id) {
      this.service.deleteDish(id).subscribe({
        next: () => {
          this.state.refresh();
          this.alertData.set({ msg: 'Блюдо успешно удалено', type: 'success' });
        },
        error: (err) => {
          this.alertData.set({ msg: err.message, type: 'error' });
        },
      });
    } else {
      this.alertData.set(null);
    }
    this.alertData.set(null);
  }
}
