import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, of, switchMap } from 'rxjs';
import { ProductStateService } from '../../data/product-state-service/product-state-service';
import { ProductService } from '../../data/product-service/product-service';
import { AlertModal } from '../../../core/ui/alert-modal/alert-modal';
import { ProductCreationForm } from '../product-creation-form/product-creation-form';
import { Product, ProductDraft } from '../../models/product';

@Component({
  selector: 'app-product-details',
  imports: [LucideAngularModule, DatePipe, AlertModal, ProductCreationForm],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private route = inject(ActivatedRoute);
  private state = inject(ProductStateService);
  private service = inject(ProductService);
  private readonly SERVER_URL = 'http://localhost:8080';
  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private refreshTrigger = signal(0);
  productInfo = toSignal(
    toObservable(
      computed(() => ({
        id: this.id(),
        trigger: this.refreshTrigger(),
      })),
    ).pipe(
      switchMap(({ id }) => {
        if (!id) return of(null);
        return this.service.getProductByName(id);
      }),
    ),
    { initialValue: null },
  );

  currentImage = signal(0);
  alertData = signal<{ type: 'error' | 'success' | 'warn'; msg: string } | null>(null);
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  productToEdit = signal<Product | null>(null);

  displayPhotos = computed(() => {
    const photos = this.productInfo()?.photos || [];

    return photos.map((p) => {
      if (typeof p === 'string') {
        return p.startsWith('http') ? p : `${this.SERVER_URL}${p}`;
      } else if (p instanceof File) {
        return URL.createObjectURL(p);
      }

      return '';
    });
  });

  handleEdit() {
    const product = this.state.state().find((p) => p.id === this.productInfo()?.id);
    if (product) {
      this.productToEdit.set(product);
      this.openModal();
    }
  }
  requestDelete() {
    this.alertData.set({ type: 'warn', msg: 'Вы уверены, что хотите удалить этот продукт?' });
  }

  handleFormSubmit(draft: ProductDraft) {
    this.isSubmitting.set(true);
    const existingProduct = this.productInfo();

    if (existingProduct) {
      this.service.editProduct(existingProduct.id, draft).subscribe({
        next: () => {
          this.alertData.set({ type: 'success', msg: 'Продукт успешно обновлен' });
          this.refreshTrigger.update((v) => v + 1);
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
          this.refreshTrigger.update((v) => v + 1);
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
    this.isModalOpen.set(false);
  }

  showAlert(msg: string, type: 'error' | 'success' = 'error') {
    this.alertData.set({ type, msg });
  }
  closeAlert() {
    this.alertData.set(null);
  }
  handleConfirm(result: boolean) {
    const currentAlert = this.alertData();

    if (!result || currentAlert?.type !== 'warn') {
      this.closeAlert();
      return;
    }

    if (this.productInfo()) {
      const id = this.productInfo()?.id;
      if (!id) return;
      this.service.deleteProduct(id).subscribe({
        next: () => {
          this.alertData.set({ msg: 'Продукт успешно удален', type: 'success' });
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

  ngOnDestroy() {
    this.displayPhotos().forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
}
