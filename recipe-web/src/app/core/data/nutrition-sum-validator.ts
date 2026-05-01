import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const NutritionSumValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const p = control.get('proteins')?.value || 0;
    const f = control.get('fats')?.value || 0;
    const c = control.get('carbs')?.value || 0;
    return p + f + c > 100 ? { nutritionOverload: true } : null;
  };