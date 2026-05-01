import { Component, inject } from '@angular/core';
import { Product, ProductDraft } from '../../models/product';
import { Observable, switchMap, throwError } from 'rxjs';
import { ProductFilter } from '../../models/product-filters';
import { MockDbService } from '../../../core/data/mock-db-service/mock-db-service';
import { ApiService } from '../../../core/data/api-service/api-service';

@Component({
  selector: 'app-product-service',
  imports: [],
  templateUrl: './product-service.html',
  styleUrl: './product-service.css',
})
export class ProductService {
  // private db = inject(MockDbService);
  private db = inject(ApiService);

  createProduct(draft: ProductDraft): Observable<Product> {
    const formData = new FormData();

    const productDto = {
      name: draft.name,
      calories: draft.calories,
      proteins: draft.proteins,
      fats: draft.fats,
      carbs: draft.carbs,
      category: draft.category,
      readiness: draft.readiness,
      ingredients: draft.ingredients,
      flags: draft.flags,
    };
    const jsonBlob = new Blob([JSON.stringify(productDto)], {
      type: 'application/json',
    });
    formData.append('dto', jsonBlob);

    if (draft.photos && draft.photos.length > 0) {
      draft.photos.forEach((photo: any) => {
        const fileToUpload = photo.file ? photo.file : photo;
        formData.append('files', fileToUpload);
      });
    }

    return this.db.createProduct(formData);
  }
  getFilteredProducts(filter: ProductFilter): Observable<Product[]> {
    return this.db.getFilteredProducts(filter);
  }
  getProductByName(id: string): Observable<Product | undefined> {
    return this.db.getProduct(id);
  }
  editProduct(id: string, draft: ProductDraft): Observable<Product | undefined> {
    const formData = new FormData();
    const existingPhotoPaths = draft.photos?.filter((p: any) => typeof p === 'string');
    const newPhotoFiles = draft.photos?.filter((p: any) => typeof p !== 'string');

    const productDto = {
      name: draft.name,
      calories: draft.calories,
      proteins: draft.proteins,
      fats: draft.fats,
      carbs: draft.carbs,
      category: draft.category,
      readiness: draft.readiness,
      ingredients: draft.ingredients,
      photos: existingPhotoPaths,
      flags: draft.flags,
    };
    const jsonBlob = new Blob([JSON.stringify(productDto)], {
      type: 'application/json',
    });
    formData.append('dto', jsonBlob);

    newPhotoFiles?.forEach((photo: any) => {
      const fileToUpload = photo.file ? photo.file : photo;
      formData.append('files', fileToUpload);
    });
    return this.db.editProduct(id, formData);
  }
  deleteProduct(id: string): Observable<void> {
    return this.db.deleteProduct(id);
  }
}
