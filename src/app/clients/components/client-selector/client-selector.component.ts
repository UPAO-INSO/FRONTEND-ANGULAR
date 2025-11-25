import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ClientService } from '../../service/client.service';
import { Client } from '../../interfaces/client.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { PaginationService } from '@src/app/shared/components/pagination/pagination.service';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';

@Component({
  selector: 'app-client-selector',
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './client-selector.component.html',
})
export class ClientSelectorComponent {
  private clientService = inject(ClientService);
  private paginationService = inject(PaginationService);

  isOpen = signal<boolean>(false);
  documentQuery = signal<string>('');
  currentPage = signal<number>(1);
  selectedClient = signal<Client | null>(null);
  clients = output<Client[]>();

  clientSelected = output<Client>();
  cancel = output<void>();

  private searchSubject = new Subject<string>();

  clientsResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
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

  getClientFullName(client: Client): string {
    return `${client.name} ${client.lastname}`;
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
