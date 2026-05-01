import { Component, inject, signal } from '@angular/core';
import { DishFilterCard } from '../dish-filter-card/dish-filter-card';
import { DishStateService } from '../../data/dish-state-service/dish-state-service';
import { DishService } from '../../data/dish-service/dish-service';
import { Dish, DishDraft } from '../../models/dish';
import { DishFilter } from '../../models/dish-filter';
import { DishRow } from '../dish-row/dish-row';
import { DishCreationForm } from '../dish-creation-form/dish-creation-form';
import { ProductStateService } from '../../../product/data/product-state-service/product-state-service';
import { AlertModal } from '../../../core/ui/alert-modal/alert-modal';

@Component({
  selector: 'app-dish-page',
  imports: [DishFilterCard, DishRow, DishCreationForm, AlertModal],
  templateUrl: './dish-page.html',
  styleUrl: './dish-page.css',
})
export class DishPage {
  private service = inject(DishService);
  private dishStateService = inject(DishStateService);
  productService = inject(ProductStateService);

  state = this.dishStateService;
  dishToEdit = signal<Dish | null>(null);
  dishIdToDelete = signal<string | null>(null);
  alertData = signal<{ type: 'error' | 'success' | 'warn'; msg: string } | null>(null);

  isModalOpen = signal(false);
  isSubmitting = signal(false);

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
          this.dishStateService.refresh();
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
          this.dishStateService.refresh();
          this.closeModal();
        },
        error: (err) => {
          this.alertData.set({ type: 'error', msg: 'Ошибка при создании блюда' });
          this.isSubmitting.set(false);
        },
      });
    }
  }
  handleFiltersUpdate(filters: DishFilter) {
    this.dishStateService.updateFilters(filters);
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
