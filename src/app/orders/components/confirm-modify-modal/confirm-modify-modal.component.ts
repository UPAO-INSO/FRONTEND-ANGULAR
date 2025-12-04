import { Component, EventEmitter, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UUID } from '../../interfaces/order.interface';

@Component({
  selector: 'app-confirm-modify-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modify-modal.component.html',
})
export class ConfirmModifyModalComponent {
  isOpen = input<boolean>(false);
  orderId = input<UUID>('');

  confirm = output<boolean>();
  cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit(true);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
