import { Component, input } from '@angular/core';
import { AbstractControl} from '@angular/forms';

@Component({
  selector: 'app-form-error',
  imports: [],
  templateUrl: './form-error.html',
  styleUrl: './form-error.css',
})
export class FormError {
  control = input<AbstractControl | null>();

  get errorText(): string | null {
    const ctrl = this.control();

    if (!ctrl || !(ctrl.invalid && (ctrl.touched || ctrl.dirty))) {
      return null;
    }

    if (ctrl.hasError('required')) return 'Это поле обязательно';
    if (ctrl.hasError('min')) return 'Слишком маленькое значение';
    if (ctrl.hasError('minlength')) {
      const error = ctrl.errors?.['minlength'];
      return `Минимум символов: ${error.requiredLength} (введено: ${error.actualLength})`;
    }
    if (ctrl.hasError('maxlength')) {
      const error = ctrl.errors?.['maxlength'];
      return `Максимум символов: ${error.requiredLength} (введено: ${error.actualLength})`;
    }
    if (ctrl.hasError('max')) return 'Слишком большое значение';
    if (ctrl.hasError('nutritionOverload')) {
      return 'Сумма белков, жиров и углеводов не может быть больше 100';
    }

    return null;
  }
}
