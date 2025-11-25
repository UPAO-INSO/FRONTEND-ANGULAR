import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-status-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-status-modal.component.html',
})
export class ConfirmStatusModalComponent {
  @Input() isOpen: boolean = false;
  @Input() orderId: number = 0;
  @Input() confirmText: string = 'Cambiar Estado';
  @Input() statusQuery: any = null;
  @Output() confirm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit(this.statusQuery);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
