import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ClientService } from '../../service/client.service';
import { Client, CreateClientRequest } from '../../interfaces/client.interface';
import { ClientMapper } from '../../mapper/client.mapper';

@Component({
  selector: 'app-client-form-modal',
  imports: [FormsModule],
  templateUrl: './client-form-modal.component.html',
})
export class ClientFormModalComponent {
  private clientService = inject(ClientService);

  isOpen = input.required<boolean>();
  client = input<Client | null>(null);

  saved = output<void>();
  cancel = output<void>();

  isEdit = false;
  isSaving = signal(false);
  error = signal<string | null>(null);
  isLookingUp = signal(false);
  lookupDone = signal(false);

  form = signal<CreateClientRequest>({
    name: '', lastname: '', phone: '', documentNumber: '',
    email: '', department: '', province: '', district: '', completeAddress: '',
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const client = this.client();
      if (open) {
        this.isEdit = !!client;
        this.error.set(null);
        this.lookupDone.set(false);
        this.isSaving.set(false);
        this.form.set(client ? ClientMapper.toCreateRequest(client) : {
          name: '', lastname: '', phone: '', documentNumber: '',
          email: '', department: '', province: '', district: '', completeAddress: '',
        });
      }
    });
  }

  updateField(field: keyof CreateClientRequest, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.form.set({ ...this.form(), [field]: value });
  }

  lookupDocument() {
    const doc = this.form().documentNumber.trim();
    const isDNI = /^\d{8}$/.test(doc);
    const isRUC = /^\d{11}$/.test(doc);

    if (!isDNI && !isRUC) {
      this.error.set('Ingresa un DNI (8 dígitos) o RUC (11 dígitos) válido');
      return;
    }

    this.isLookingUp.set(true);
    this.error.set(null);

    const obs$ = isDNI
      ? this.clientService.consultarDNI(doc)
      : this.clientService.consultarRUC(doc);

    obs$.subscribe({
      next: (response: any) => {
        this.isLookingUp.set(false);
        if (!response.success) {
          this.error.set(response.message || 'No se encontró información del documento');
          return;
        }
        if (isDNI) {
          this.form.set({
            ...this.form(),
            name: response.data.nombres,
            lastname: `${response.data.apellido_paterno} ${response.data.apellido_materno}`,
            department: response.data.departamento,
            province: response.data.provincia,
            district: response.data.distrito,
            completeAddress: response.data.direccion_completa,
          });
        } else {
          this.form.set({
            ...this.form(),
            name: response.data.nombre_o_razon_social,
            lastname: response.data.tipo_contribuyente || 'PERSONA JURIDICA',
            department: response.data.departamento,
            province: response.data.provincia,
            district: response.data.distrito,
            completeAddress: response.data.direccion,
          });
        }
        this.lookupDone.set(true);
      },
      error: () => {
        this.isLookingUp.set(false);
        this.error.set('Error al consultar el documento. Intenta nuevamente.');
      },
    });
  }

  onSubmit() {
    const f = this.form();
    if (!f.name.trim()) {
      this.error.set('El nombre es requerido');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const client = this.client();
    const obs$ = this.isEdit && client
      ? this.clientService.updateClient(client.id, f)
      : this.clientService.createClient(f);

    obs$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saved.emit();
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.error.set(err.message);
      },
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
