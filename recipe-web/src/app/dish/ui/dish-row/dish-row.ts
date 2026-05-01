import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Dish } from '../../models/dish';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dish-row',
  imports: [LucideAngularModule, DatePipe],
  templateUrl: './dish-row.html',
  styleUrl: './dish-row.css',
})
export class DishRow {
  dishInfo = input.required<Dish>();
  currentImage = signal(0);
  isEditing = output<string>();
  isDeleting = output<string>();
  isExpanded = signal(false);

  toggleIngredients(event: Event) {
    event.stopPropagation()
    this.isExpanded.update((prev) => !prev);
  }

  private readonly SERVER_URL = 'http://localhost:8080';
  private router = inject(Router);

  displayPhotos = computed(() => {
    const photos = this.dishInfo().photos || [];

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
    const photos = this.dishInfo().photos;
    if (photos && photos.length > 0) {
      this.currentImage.update((idx) => (idx + 1) % photos.length);
    }
  }
  prevImage(event: Event) {
    event.stopPropagation();
    const photos = this.dishInfo().photos;
    if (photos && photos.length > 0) {
      this.currentImage.update((idx) => (idx - 1 + photos.length) % photos.length);
    }
  }
  handleEdit(event: Event, id: string) {
    event.stopPropagation();
    this.isEditing.emit(id);
  }
  handleDelete(event: Event, id: string) {
    event.stopPropagation()
    this.isDeleting.emit(id);
  }
  handleNavigate() {
    this.router.navigate(['/dish', this.dishInfo().id]);
  }
  ngOnDestroy() {
    this.displayPhotos().forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
}
