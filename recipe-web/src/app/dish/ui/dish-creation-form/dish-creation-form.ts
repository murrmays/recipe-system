import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DishDraft, DishIngredient } from '../../models/dish';
import { DishCategory, DishCategoryList } from '../../models/dish-category';
import { Flag, FlagsList } from '../../../core/models/flags';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '../../../product/models/product';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DishService } from '../../data/dish-service/dish-service';
import { FormError } from '../../../core/ui/form-error/form-error';
import { NutritionSumValidator } from '../../../core/data/nutrition-sum-validator';
import { combineLatest, debounceTime, startWith } from 'rxjs';

@Component({
  selector: 'app-dish-creation-form',
  imports: [ReactiveFormsModule, LucideAngularModule, FormError],
  templateUrl: './dish-creation-form.html',
  styleUrl: './dish-creation-form.css',
})
export class DishCreationForm {
  private formBuilder = inject(FormBuilder);
  private service = inject(DishService);

  initialData = input<DishDraft | null>(null);
  isSubmitting = input<boolean>(false);
  close = output<void>();
  formSubmit = output<DishDraft>();

  productOptions = input<Product[]>([]);
  categoryOptions = DishCategoryList;
  flagOptions = FlagsList;
  photoPreviews: (File | string)[] = [];

  form = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      photos: [[] as (File | string)[], [Validators.min(0), Validators.maxLength(5)]],
      calories: [0, [Validators.required, Validators.min(0)]],
      proteins: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      fats: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      carbs: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      ingredients: this.formBuilder.array<FormGroup>([]),
      category: ['Первое' as DishCategory, Validators.required],
      portionSize: [0, [Validators.required, Validators.min(1)]],
      flags: [[] as Flag[]],
    },
    { validators: [NutritionSumValidator] },
  );

  constructor() {
    this.calculateNutrition();
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.form.patchValue(data);
        this.ingredientsArray.clear();

        if (data.ingredients && data.ingredients.length > 0) {
          data.ingredients.forEach((ing) => {
            const group = this.formBuilder.group({
              product: [ing.product, Validators.required],
              amount: [ing.amount, [Validators.required, Validators.min(1)]],
            });
            this.ingredientsArray.push(group);
          });
        }
        if (data.photos) {
          this.photoPreviews = [...data.photos];
        }
      } else {
        this.form.reset();
        this.ingredientsArray.clear();
        this.addIngredient();
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
      const data = this.form.getRawValue();
      const formattedData = {
        ...data,
        ingredients: data.ingredients as DishIngredient[],
      };
      this.formSubmit.emit(formattedData as DishDraft);
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
  compareProducts(p1: Product, p2: Product): boolean {
    return p1 && p2 ? p1.id === p2.id : p1 === p2;
  }
  calculateNutrition() {
    combineLatest([
      this.form.controls.ingredients.valueChanges.pipe(
        startWith(this.form.controls.ingredients.value),
      ),
      this.form.controls.portionSize.valueChanges.pipe(
        startWith(this.form.controls.portionSize.value),
      ),
    ])
      .pipe(takeUntilDestroyed(), debounceTime(300))
      .subscribe(([ingredients, portionSize]) => {
        const total = this.service.countNutritionValue(ingredients, portionSize);

        this.form.patchValue(
          {
            calories: total.calories,
            proteins: total.proteins,
            fats: total.fats,
            carbs: total.carbs,
          },
          { emitEvent: false },
        );
      });
  }

  get ingredientsArray() {
    return this.form.controls.ingredients;
  }
  addIngredient() {
    const ingredientGroup = this.formBuilder.group({
      product: [null as Product | null, Validators.required],
      amount: [100, [Validators.required, Validators.min(1)]],
    });

    this.ingredientsArray.push(ingredientGroup);
  }
  removeIngredient(index: number) {
    this.ingredientsArray.removeAt(index);
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
