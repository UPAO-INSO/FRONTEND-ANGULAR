import { Component, computed, input, output } from '@angular/core';
import { Client } from '../../interfaces/client.interface';
import { ClientMapper } from '../../mapper/client.mapper';
import { ClientFormInlineComponent } from '../client-form-inline/client-form-inline.component';

@Component({
  selector: 'app-client-form-modal',
  imports: [ClientFormInlineComponent],
  templateUrl: './client-form-modal.component.html',
})
export class ClientFormModalComponent {
  isOpen = input.required<boolean>();
  client = input<Client | null>(null);

  saved = output<void>();
  cancel = output<void>();

  formInitialData = computed(() => {
    if (!this.isOpen()) return null;
    const client = this.client();
    return client ? ClientMapper.toCreateRequest(client) : null;
  });

  onSaved() { this.saved.emit(); }
  onCancel() { this.cancel.emit(); }
}
