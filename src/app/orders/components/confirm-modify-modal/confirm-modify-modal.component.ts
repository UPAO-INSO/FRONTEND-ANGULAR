import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modify-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modify-modal.component.html',
})
export class ConfirmModifyModalComponent {
  @Input() isOpen: boolean = false;
  @Input() orderId: number = 0;
  @Output() confirm = new EventEmitter<boolean>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit(true);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
