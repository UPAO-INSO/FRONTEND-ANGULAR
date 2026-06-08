import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { ClientService } from '../../service/client.service';
import { Client, CreateClientRequest } from '../../interfaces/client.interface';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { ClientListComponent } from '../client-list/client-list.component';
import { ClientFormInlineComponent } from '../client-form-inline/client-form-inline.component';
import { RESTDniResponse, RESTRucResponse } from '@src/app/shared/interfaces/factiliza.interface';

@Component({
  selector: 'app-client-selector',
  imports: [FormsModule, PaginationComponent, ClientListComponent, ClientFormInlineComponent],
  templateUrl: './client-selector.component.html',
})
export class ClientSelectorComponent {
  private clientService = inject(ClientService);

  isOpen = signal(false);
  documentQuery = signal('');
  currentPage = signal(1);
  selectedClient = signal<Client | null>(null);

  isLookingUpDocument = signal(false);
  lookupError = signal<string | null>(null);
  createInitialData = signal<CreateClientRequest | null>(null);

  clientSelected = output<Client>();
  cancel = output<void>();

  private searchSubject = new Subject<string>();

  clientsResource = rxResource({
    params: () => ({ page: this.currentPage(), query: this.documentQuery() }),
    stream: ({ params }) => {
      if (params.query && params.query.length >= 3) {
        return this.clientService.searchByDocument(params.query);
      }
      return this.clientService.fetchClients({ page: params.page });
    },
  });

  constructor() {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((query) => {
        this.documentQuery.set(query);
        this.currentPage.set(1);
      });
  }

  startClientCreation() {
    const document = this.documentQuery().trim();
    const isDNI = /^\d{8}$/.test(document);
    const isRUC = /^\d{11}$/.test(document);

    if (!isDNI && !isRUC) {
      this.lookupError.set('Formato de documento inválido. Debe ser DNI (8 dígitos) o RUC (11 dígitos)');
      return;
    }

    this.isLookingUpDocument.set(true);
    this.lookupError.set(null);

    const obs$ = isDNI
      ? this.clientService.consultarDNI(document)
      : this.clientService.consultarRUC(document);

    obs$.subscribe({
      next: (response: any) => {
        this.isLookingUpDocument.set(false);
        if (!response.success) {
          this.lookupError.set(response.message || 'No se encontró información del documento');
          return;
        }
        if (isDNI) {
          const r = response as RESTDniResponse;
          this.createInitialData.set({
            documentNumber: document,
            name: r.data.nombres,
            lastname: `${r.data.apellido_paterno} ${r.data.apellido_materno}`,
            completeAddress: r.data.direccion_completa,
            phone: '', email: '',
            department: r.data.departamento,
            province: r.data.provincia,
            district: r.data.distrito,
          });
        } else {
          const r = response as RESTRucResponse;
          this.createInitialData.set({
            documentNumber: document,
            name: r.data.nombre_o_razon_social,
            lastname: r.data.tipo_contribuyente || 'PERSONA JURIDICA',
            completeAddress: r.data.direccion,
            phone: '', email: '',
            department: r.data.departamento,
            province: r.data.provincia,
            district: r.data.distrito,
          });
        }
      },
      error: () => {
        this.isLookingUpDocument.set(false);
        this.lookupError.set('Error al consultar el documento. Intenta nuevamente.');
      },
    });
  }

  onClientCreated(client: Client) {
    this.selectedClient.set(client);
    this.createInitialData.set(null);
    this.clientsResource.reload();
  }

  cancelCreate() {
    this.createInitialData.set(null);
    this.lookupError.set(null);
  }

  open() {
    this.isOpen.set(true);
    this.documentQuery.set('');
    this.selectedClient.set(null);
    this.currentPage.set(1);
    this.createInitialData.set(null);
    this.lookupError.set(null);
  }

  close() {
    this.isOpen.set(false);
    this.cancel.emit();
  }

  onSearchInput(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  onSelectClient(client: Client) {
    this.selectedClient.set(client);
  }

  onConfirm() {
    const client = this.selectedClient();
    if (client) {
      this.clientSelected.emit(client);
      this.close();
    }
  }

  clearSearch() {
    this.documentQuery.set('');
    this.currentPage.set(1);
  }

  getClients(): Client[] {
    return this.clientsResource.value() ?? [];
  }

  getTotalPages(): number {
    const value = this.clientsResource.value();
    if (!value || !('totalPages' in value)) return 1;
    return (value as any).totalPages;
  }
}
