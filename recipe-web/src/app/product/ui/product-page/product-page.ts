import { Component, inject, signal } from '@angular/core';
import { ProductService } from '../../data/product-service/product-service';
import { ProductFilter } from '../../models/product-filters';
import { Product, ProductDraft } from '../../models/product';
import { ProductRow } from '../product-row/product-row';
import { ProductStateService } from '../../data/product-state-service/product-state-service';
import { ProductFilterCard } from '../product-filter-card/product-filter-card';
import { ProductCreationForm } from '../product-creation-form/product-creation-form';
import { AlertModal } from '../../../core/ui/alert-modal/alert-modal';

@Component({
  selector: 'app-product-page',
  imports: [ProductRow, ProductFilterCard, ProductCreationForm, AlertModal],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage {
  private service = inject(ProductService);
  private stateService = inject(ProductStateService);

  state = this.stateService;
  productToEdit = signal<Product | null>(null);
  productIdToDelete = signal<string | null>(null);
  alertData = signal<{ type: 'error' | 'success' | 'warn'; msg: string } | null>(null);

  isModalOpen = signal(false);
  isSubmitting = signal(false);

  handleEdit(id: string) {
    const product = this.state.state().find((p) => p.id === id);
    if (product) {
      this.productToEdit.set(product);
      this.openModal();
    }
  }
  requestDelete(id: string) {
    this.productIdToDelete.set(id);
    this.alertData.set({ type: 'warn', msg: 'Вы уверены, что хотите удалить этот продукт?' });
  }

  handleFiltersUpdate(filters: ProductFilter) {
    this.stateService.updateFilters(filters);
  }
  handleFormSubmit(draft: ProductDraft) {
    this.isSubmitting.set(true);
    const existingProduct = this.productToEdit();

    if (existingProduct) {
      this.service.editProduct(existingProduct.id, draft).subscribe({
        next: () => {
          this.alertData.set({ type: 'success', msg: 'Продукт успешно обновлен' });
          this.stateService.refresh();
          this.closeModal();
        },
        error: (err) => {
          this.alertData.set({ type: 'error', msg: err.message });
          this.isSubmitting.set(false);
        },
      });
    } else {
      this.service.createProduct(draft).subscribe({
        next: () => {
          this.alertData.set({ type: 'success', msg: 'Продукт успешно добавлен' });
          this.isSubmitting.set(false);
          this.stateService.refresh();
          this.closeModal();
        },
        error: (err) => {
          this.alertData.set({ type: 'error', msg: err.message });
          this.isSubmitting.set(false);
        },
      });
    }
  }

  openModal() {
    this.isModalOpen.set(true);
  }
  closeModal() {
    this.productToEdit.set(null);
    this.isModalOpen.set(false);
  }

  showAlert(msg: string, type: 'error' | 'success' = 'error') {
    this.alertData.set({ type, msg });
  }
  closeAlert() {
    this.alertData.set(null);
    this.productIdToDelete.set(null);
  }
  handleConfirm(result: boolean) {
    const id = this.productIdToDelete();
    const currentAlert = this.alertData();

    if (!result || currentAlert?.type !== 'warn') {
      this.closeAlert();
      return;
    }

    if (id) {
      this.service.deleteProduct(id).subscribe({
        next: () => {
          this.state.refresh();
          this.alertData.set({ msg: 'Продукт успешно удален', type: 'success' });
        },
        error: () => {
          this.alertData.set({
            msg: 'Нельзя удалить продукт, поскольку он используется в создании блюда',
            type: 'error',
          });
        },
      });
    } else {
      this.alertData.set(null);
    }
    this.alertData.set(null);
  }
}
