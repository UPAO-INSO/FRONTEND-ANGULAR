import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { map, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ClientService } from '../../service/client.service';
import { Client, RESTClient } from '../../interfaces/client.interface';
import { ClientMapper } from '../../mapper/client.mapper';
import { PaginationService } from '@src/app/shared/components/pagination/pagination.service';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { ListStateComponent } from '@src/app/shared/components/list-state/list-state.component';
import { PageHeaderComponent } from '@src/app/shared/components/page-header/page-header.component';
import { ClientFormModalComponent } from '../../components/client-form-modal/client-form-modal.component';

@Component({
  selector: 'app-clients-page',
  imports: [
    FormsModule,
    PaginationComponent,
    ListStateComponent,
    PageHeaderComponent,
    ClientFormModalComponent,
  ],
  templateUrl: './clients-page.component.html',
  providers: [PaginationService],
})
export class ClientsPageComponent {
  private clientService = inject(ClientService);
  readonly paginationService = inject(PaginationService);

  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  showFormModal = signal(false);
  selectedClient = signal<Client | null>(null);

  showDeleteConfirm = signal(false);
  clientToDelete = signal<Client | null>(null);
  deleteError = signal<string | null>(null);
  isDeleting = signal(false);

  clientsResource = rxResource<RESTClient, { page: number; search: string }>({
    params: () => ({
      page: this.paginationService.currentPage(),
      search: this.searchTerm(),
    }),
    stream: ({ params }) => {
      const term = params.search.trim();
      if (term.length >= 2) {
        const src = /^\d+$/.test(term)
          ? this.clientService.searchByDocument(term)
          : this.clientService.searchByName(term);
        return src.pipe(
          map(clients => ({
            content: clients,
            totalPages: 1,
            totalElements: clients.length,
            size: clients.length,
            page: 1,
            empty: clients.length === 0,
          } as RESTClient))
        );
      }
      return this.clientService.fetchClientsPage({ page: params.page, limit: 10 });
    },
  });

  clients = computed<Client[]>(() => this.clientsResource.value()?.content ?? []);
  totalPages = computed<number>(() => this.clientsResource.value()?.totalPages ?? 1);

  isLoading = computed(() => this.clientsResource.isLoading());
  loadError = computed(
    () => (this.clientsResource.error() as Error | undefined)?.message ?? null,
  );
  isEmpty = computed(
    () => !this.isLoading() && !this.loadError() && this.clients().length === 0,
  );

  constructor() {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.paginationService.resetPage();
      });
  }

  onSearchInput(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  openCreate() {
    this.selectedClient.set(null);
    this.showFormModal.set(true);
  }

  openEdit(client: Client) {
    this.selectedClient.set(client);
    this.showFormModal.set(true);
  }

  onFormSaved() {
    this.showFormModal.set(false);
    this.selectedClient.set(null);
    this.clientsResource.reload();
  }

  onFormCancel() {
    this.showFormModal.set(false);
    this.selectedClient.set(null);
  }

  openDeleteConfirm(client: Client) {
    this.clientToDelete.set(client);
    this.deleteError.set(null);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
    this.clientToDelete.set(null);
    this.deleteError.set(null);
  }

  confirmDelete() {
    const client = this.clientToDelete();
    if (!client) return;

    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.clientService.deleteClient(client.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
        this.clientToDelete.set(null);
        this.clientsResource.reload();
      },
      error: (err: Error) => {
        this.isDeleting.set(false);
        this.deleteError.set(err.message);
      },
    });
  }

  getFullName = ClientMapper.getFullName;
  getDocumentLabel = ClientMapper.getDocumentLabel;
}
