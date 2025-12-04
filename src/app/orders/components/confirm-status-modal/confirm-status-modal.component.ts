import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus, UUID } from '../../interfaces/order.interface';

@Component({
  selector: 'app-confirm-status-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-status-modal.component.html',
})
export class ConfirmStatusModalComponent {
  isOpen = input<boolean>(false);
  orderId = input<UUID>('');
  confirmText = input<string>('Cambiar Estado');
  statusQuery = input<OrderStatus>();
  confirm = output<any>();
  cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit(this.statusQuery());
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
