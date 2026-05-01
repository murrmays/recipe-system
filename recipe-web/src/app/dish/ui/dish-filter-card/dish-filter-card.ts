import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DishFilter } from '../../models/dish-filter';
import { Flag, FlagsList } from '../../../core/models/flags';
import { DishCategory, DishCategoryList } from '../../models/dish-category';
import { Search } from 'lucide-angular';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dish-filter-card',
  imports: [ReactiveFormsModule],
  templateUrl: './dish-filter-card.html',
  styleUrl: './dish-filter-card.css',
})
export class DishFilterCard {
  private formBuilder = inject(FormBuilder).nonNullable;
  filterChange = output<DishFilter>();
  categoryOptions = DishCategoryList;
  flagOptions = FlagsList;

  filtersForm = this.formBuilder.group({
    categories: [[] as DishCategory[]],
    flags: [[] as Flag[]],
    search: [''],
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

  toggleCategory(cat: DishCategory) {
      const currentCats = this.filtersForm.controls.categories.value;
      const index = currentCats.indexOf(cat);
  
      if (index === -1) {
        this.filtersForm.controls.categories.setValue([...currentCats, cat]);
      } else {
        this.filtersForm.controls.categories.setValue(currentCats.filter((c) => c !== cat));
      }
    }
}
