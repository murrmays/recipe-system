import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-alert-modal',
  imports: [],
  templateUrl: './alert-modal.html',
  styleUrl: './alert-modal.css',
})
export class AlertModal {
  close = output<void>()
  isConfirmed = output<boolean>()

  type = input<string>()
  title = input<string>()
  message = input<string>()

  handleConfirm(result: boolean){
    this.isConfirmed.emit(result)
  }
}
