import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../service/client.service';
import { Client, CreateClientRequest } from '../../interfaces/client.interface';
import { RESTDniResponse, RESTRucResponse } from '@src/app/shared/interfaces/factiliza.interface';

const EMPTY_FORM: CreateClientRequest = {
  name: '', lastname: '', phone: '', documentNumber: '',
  email: '', department: '', province: '', district: '', completeAddress: '',
};

@Component({
  selector: 'app-client-form-inline',
  imports: [FormsModule],
  templateUrl: './client-form-inline.component.html',
})
export class ClientFormInlineComponent {
  private clientService = inject(ClientService);

  initialData = input<CreateClientRequest | null>(null);
  editClientId = input<number | undefined>(undefined);

  saved = output<Client>();
  cancel = output<void>();

  form = signal<CreateClientRequest>({ ...EMPTY_FORM });
  isLookingUp = signal(false);
  lookupDone = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);

  isEditMode = computed(() => this.editClientId() != null);

  constructor() {
    effect(() => {
      const data = this.initialData();
      this.error.set(null);
      this.isSaving.set(false);
      if (data) {
        this.form.set({ ...data });
        this.lookupDone.set(!!data.name);
      } else {
        this.form.set({ ...EMPTY_FORM });
        this.lookupDone.set(false);
      }
    });
  }

  updateField(field: keyof CreateClientRequest, event: Event) {
    this.form.set({ ...this.form(), [field]: (event.target as HTMLInputElement).value });
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

    const obs$ = isDNI ? this.clientService.consultarDNI(doc) : this.clientService.consultarRUC(doc);

    obs$.subscribe({
      next: (response: any) => {
        this.isLookingUp.set(false);
        if (!response.success) {
          this.error.set(response.message || 'No se encontró información del documento');
          return;
        }
        if (isDNI) {
          const r = response as RESTDniResponse;
          this.form.set({
            ...this.form(),
            name: r.data.nombres,
            lastname: `${r.data.apellido_paterno} ${r.data.apellido_materno}`,
            department: r.data.departamento,
            province: r.data.provincia,
            district: r.data.distrito,
            completeAddress: r.data.direccion_completa,
          });
        } else {
          const r = response as RESTRucResponse;
          this.form.set({
            ...this.form(),
            name: r.data.nombre_o_razon_social,
            lastname: r.data.tipo_contribuyente || 'PERSONA JURIDICA',
            department: r.data.departamento,
            province: r.data.provincia,
            district: r.data.distrito,
            completeAddress: r.data.direccion,
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

  useGenericContactData() {
    const f = this.form();
    this.form.set({
      ...f,
      phone: '999000000',
      email: `${f.documentNumber || 'cliente'}@cliente.pe`,
    });
  }

  onSubmit() {
    const f = this.form();
    if (!f.name.trim()) { this.error.set('El nombre es requerido'); return; }
    if (!f.phone.trim()) { this.error.set('El teléfono es requerido'); return; }
    if (!f.email.trim()) { this.error.set('El email es requerido'); return; }

    const phone = f.phone.trim();
    const data: CreateClientRequest = {
      ...f,
      phone: phone.startsWith('+51') ? phone : `+51${phone}`,
    };

    this.isSaving.set(true);
    this.error.set(null);

    const editId = this.editClientId();
    const obs$ = editId != null
      ? this.clientService.updateClient(editId, data)
      : this.clientService.createClient(data);

    obs$.subscribe({
      next: (client) => {
        this.isSaving.set(false);
        this.saved.emit(client);
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
