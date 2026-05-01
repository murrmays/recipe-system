import { Component, inject, output } from '@angular/core';
import { ProductFilter, ProductSort, SortList, SortMap } from '../../models/product-filters';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { ProductCategory, ProductCategoryList } from '../../models/product-category';
import { Readiness, ReadinessList } from '../../models/readiness';
import { Flag, FlagsList } from '../../../core/models/flags';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-filter-card',
  imports: [ReactiveFormsModule],
  templateUrl: './product-filter-card.html',
  styleUrl: './product-filter-card.css',
})
export class ProductFilterCard {
  private formBuilder = inject(FormBuilder).nonNullable;
  filterChange = output<ProductFilter>();
  categoryOptions = ProductCategoryList;
  readinessOptions = ReadinessList;
  flagOptions = FlagsList;
  sortOptions = Array.from(SortMap.entries());

  filtersForm = this.formBuilder.group({
    categories: [[] as ProductCategory[]],
    readiness: [[] as Readiness[]],
    flags: [[] as Flag[]],
    search: [''],
    sort: ['nameAsc' as ProductSort],
  });

  constructor() {
    this.filtersForm.valueChanges.pipe(debounceTime(500), takeUntilDestroyed()).subscribe(() => {
      const raw = this.filtersForm.getRawValue();
      this.filterChange.emit(raw);
    });
  }

  toggleFlag(flag: Flag) {
    const currentFlags = this.filtersForm.controls.flags.value;
    const index = currentFlags.indexOf(flag);

    if (index === -1) {
      this.filtersForm.controls.flags.setValue([...currentFlags, flag]);
    } else {
      this.filtersForm.controls.flags.setValue(currentFlags.filter((f) => f !== flag));
    }
  }

  toggleCategory(cat: ProductCategory) {
    const currentCats = this.filtersForm.controls.categories.value;
    const index = currentCats.indexOf(cat);

    if (index === -1) {
      this.filtersForm.controls.categories.setValue([...currentCats, cat]);
    } else {
      this.filtersForm.controls.categories.setValue(currentCats.filter((c) => c !== cat));
    }
  }

  toggleReadiness(readiness: Readiness) {
    const currentReadiness = this.filtersForm.controls.readiness.value;
    const index = currentReadiness.indexOf(readiness);

    if (index === -1) {
      this.filtersForm.controls.readiness.setValue([...currentReadiness, readiness]);
    } else {
      this.filtersForm.controls.readiness.setValue(currentReadiness.filter((r) => r !== readiness));
    }
  }
}
