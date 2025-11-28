import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ClientService } from '../../service/client.service';
import { Client, CreateClientRequest } from '../../interfaces/client.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { PaginationService } from '@src/app/shared/components/pagination/pagination.service';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { ClientListComponent } from '../client-list/client-list.component';
import {
  RESTDniResponse,
  RESTRucResponse,
} from '@src/app/shared/interfaces/factiliza.interface';

@Component({
  selector: 'app-client-selector',
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    ClientListComponent,
  ],
  templateUrl: './client-selector.component.html',
})
export class ClientSelectorComponent {
  private clientService = inject(ClientService);
  private paginationService = inject(PaginationService);

  isOpen = signal<boolean>(false);
  documentQuery = signal<string>('');
  currentPage = signal<number>(1);
  selectedClient = signal<Client | null>(null);
  isCreatingClient = signal<boolean>(false);
  isSavingClient = signal<boolean>(false);
  newClientData = signal<CreateClientRequest | null>(null);
  creationError = signal<string | null>(null);

  clients = output<Client[]>();
  clientSelected = output<Client>();
  cancel = output<void>();

  private searchSubject = new Subject<string>();

  clientsResource = rxResource({
    params: () => ({
      page: this.currentPage(),
      query: this.documentQuery(),
    }),

    stream: ({ params }) => {
      if (params.query && params.query.length >= 3) {
        return this.clientService.searchByDocument(params.query);
      }

      return (
        this.clientService.fetchClients({
          page: params.page,
        }) ?? []
      );
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
    if (document.length < 8) return;

    this.isCreatingClient.set(true);
    this.creationError.set(null);

    const isDNI = /^\d{8}$/.test(document);
    const isRUC = /^\d{11}$/.test(document);

    if (!isDNI && !isRUC) {
      this.creationError.set(
        'Formato de documento inválido. Debe ser DNI (8 dígitos) o RUC (11 dígitos)'
      );
      this.isCreatingClient.set(false);
      return;
    }

    const consultation$ = isDNI
      ? this.clientService.consultarDNI(document)
      : this.clientService.consultarRUC(document);

    consultation$.subscribe({
      next: (response: any) => {
        if (response.success) {
          if (isDNI) {
            this.handleDNIResponse(document, response as RESTDniResponse);
          } else {
            this.handleRUCResponse(document, response as RESTRucResponse);
          }
        } else {
          this.creationError.set(
            response.message || 'No se encontró información del documento'
          );
        }
        this.isCreatingClient.set(false);
      },
      error: (error: any) => {
        console.error('Error consultando documento:', error);
        this.creationError.set(
          'Error al consultar el documento. Intenta nuevamente.'
        );
        this.isCreatingClient.set(false);
      },
    });
  }

  private handleDNIResponse(dni: string, response: RESTDniResponse) {
    this.newClientData.set({
      documentNumber: dni,
      name: response.data.nombres,
      lastname: `${response.data.apellido_paterno} ${response.data.apellido_materno}`,
      completeAddress: response.data.direccion_completa,
      phone: '',
      email: '',
      department: response.data.departamento,
      province: response.data.provincia,
      district: response.data.distrito,
    });
  }

  private handleRUCResponse(ruc: string, response: RESTRucResponse) {
    this.newClientData.set({
      documentNumber: ruc,
      name: response.data.nombre_o_razon_social,
      lastname: response.data.tipo_contribuyente,
      completeAddress: response.data.direccion,
      phone: '',
      email: '',
      department: response.data.departamento,
      province: response.data.provincia,
      district: response.data.distrito,
    });
  }

  updateNewClientField(field: keyof CreateClientRequest, event: Event) {
    const input = event.target as HTMLInputElement;
    const current = this.newClientData();
    if (current) {
      this.newClientData.set({
        ...current,
        [field]: input.value,
      });
    }
  }

  confirmClientCreation() {
    const clientData = this.newClientData();
    if (!clientData) return;

    clientData.phone = '+51' + clientData.phone.trim();

    this.isSavingClient.set(true);
    this.creationError.set(null);

    this.clientService.createClient(clientData).subscribe({
      next: (newClient) => {
        this.selectedClient.set(newClient);

        this.cancelClientCreation();

        this.clientsResource.reload();

        this.isSavingClient.set(false);
      },
      error: (error) => {
        console.error('Error creando cliente:', error);
        this.creationError.set(
          'Error al crear el cliente. Intenta nuevamente.'
        );
        this.isSavingClient.set(false);
      },
    });
  }

  cancelClientCreation() {
    this.newClientData.set(null);
    this.isCreatingClient.set(false);
    this.isSavingClient.set(false);
    this.creationError.set(null);
  }

  open() {
    this.isOpen.set(true);
    this.documentQuery.set('');
    this.selectedClient.set(null);
    this.currentPage.set(1);
  }

  close() {
    this.isOpen.set(false);
    this.cancel.emit();
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
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

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  clearSearch() {
    this.documentQuery.set('');
    this.currentPage.set(1);
  }

  getClients(): Client[] {
    const value = this.clientsResource.value();
    if (!value) return [];

    return value;
  }

  getTotalPages(): number {
    const value = this.clientsResource.value();
    if (!value || !('totalPages' in value)) return 1;
    return (value as any).totalPages;
  }
}
