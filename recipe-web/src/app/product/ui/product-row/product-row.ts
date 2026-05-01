import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Product } from '../../models/product';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-row',
  imports: [LucideAngularModule],
  templateUrl: './product-row.html',
  styleUrl: './product-row.css',
})
export class ProductRow {
  productInfo = input.required<Product>();
  currentImage = signal(0);
  isEditing = output<string>();
  isDeleting = output<string>();

  private readonly SERVER_URL = 'http://localhost:8080';
  private router = inject(Router);

  displayPhotos = computed(() => {
    const photos = this.productInfo().photos || [];

    return photos.map((p) => {
      if (typeof p === 'string') {
        return p.startsWith('http') ? p : `${this.SERVER_URL}${p}`;
      } else if (p instanceof File) {
        return URL.createObjectURL(p);
      }

      return '';
    });
  });

  nextImage(event: Event) {
    event.stopPropagation();
    const photos = this.productInfo().photos;
    if (photos && photos.length > 0) {
      this.currentImage.update((idx) => (idx + 1) % photos.length);
    }
  }
  prevImage(event: Event) {
    event.stopPropagation();
    const photos = this.productInfo().photos;
    if (photos && photos.length > 0) {
      this.currentImage.update((idx) => (idx - 1 + photos.length) % photos.length);
    }
  }
  handleEdit(event: Event, id: string) {
    event.stopPropagation();
    this.isEditing.emit(id);
  }
  handleDelete(event: Event, id: string) {
    event.stopPropagation();
    this.isDeleting.emit(id);
  }
  handleNavigate() {
    this.router.navigate(['/product', this.productInfo().id]);
  }

  ngOnDestroy() {
    this.displayPhotos().forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
}
