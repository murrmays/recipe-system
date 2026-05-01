import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductDraft } from '../../models/product';
import { ProductCategory, ProductCategoryList } from '../../models/product-category';
import { Flag, FlagsList } from '../../../core/models/flags';
import { Readiness, ReadinessList } from '../../models/readiness';
import { LucideAngularModule } from 'lucide-angular';
import { FormError } from '../../../core/ui/form-error/form-error';
import { NutritionSumValidator } from '../../../core/data/nutrition-sum-validator';

@Component({
  selector: 'app-product-creation-form',
  imports: [ReactiveFormsModule, LucideAngularModule, FormError],
  templateUrl: './product-creation-form.html',
  styleUrl: './product-creation-form.css',
})
export class ProductCreationForm {
  private formBuilder = inject(FormBuilder);

  initialData = input<ProductDraft | null>(null);
  categoryOptions = ProductCategoryList;
  readinessOptions = ReadinessList;
  flagOptions = FlagsList;
  photoPreviews: (File | string)[] = [];

  isSubmitting = input<boolean>(false);
  close = output<void>();
  formSubmit = output<ProductDraft>();

  form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    photos: [[] as (string | File)[], [Validators.min(0), Validators.maxLength(5)]],
    calories: [0, [Validators.required, Validators.min(0)]],
    proteins: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    fats: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    carbs: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    ingredients: [''],
    category: ['Овощи' as ProductCategory, Validators.required],
    readiness: ['' as Readiness, Validators.required],
    flags: [[] as Flag[]],
  }, {validators: [NutritionSumValidator]});

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (data) {
        const formattedData = {
          ...data,
          ingredients: data.ingredients === null ? undefined : data.ingredients,
        };
        this.form.patchValue(formattedData);

        if (data.photos) {
          this.photoPreviews = [...data.photos];
        }
      } else {
        this.form.reset();
        this.photoPreviews.forEach((p) => {
          if (typeof p === 'string' && p.startsWith('blob:')) {
            URL.revokeObjectURL(p);
          }
        });
        this.photoPreviews = [];
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.getRawValue());
    } else {
      this.form.markAllAsTouched();
    }
  }
  onClose() {
    this.close.emit();
  }

  toggleFlag(flag: Flag) {
    const currentFlags = this.form.controls.flags.value;
    const index = currentFlags.indexOf(flag);

    if (index === -1) {
      this.form.controls.flags.setValue([...currentFlags, flag]);
    } else {
      this.form.controls.flags.setValue(currentFlags.filter((f) => f !== flag));
    }
  }

  async onFileSelected(event: any) {
    const files: FileList = event.target.files || event.dataTransfer?.files;
    if (!files) return;

    const currFiles = this.form.controls.photos.value;
    const newFiles = [...currFiles];

    for (let i = 0; i < files.length; i++) {
      if (newFiles.length < 5) {
        const file = files[i];
        const preview = URL.createObjectURL(file);

        this.photoPreviews.push(preview);
        newFiles.push(file);
      }
    }
    this.form.controls.photos.setValue(newFiles);
  }
  getPhotoPreview(photo: any): string {
    if (typeof photo === 'string') {
      return photo.startsWith('http') ? photo : `http://localhost:8080${photo}`;
    }
    return photo.preview || photo;
  }
  removePhoto(index: number) {
    const photos = this.form.controls.photos.value;
    
    if (typeof photos[index] === 'string' && photos[index].startsWith('blob:')) {
      URL.revokeObjectURL(photos[index]);
    }

    photos.splice(index, 1);
    this.form.controls.photos.setValue([...photos]);
  }
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.onFileSelected(event);
  }
}
