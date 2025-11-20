import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-ready-modal',
  imports: [],
  templateUrl: './confirm-ready-modal.component.html',
})
export class ConfirmReadyModalComponent {
  isOpen = input.required<boolean>();

  confirm = output<void>();
  cancel = output<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
