import { Component, input, output } from '@angular/core';
import { Client } from '../../interfaces/client.interface';

@Component({
  selector: 'app-client-list',
  templateUrl: 'client-list.component.html',
})
export class ClientListComponent {
  client = input.required<Client>();
  selectedClient = input<Client | null>();
  selectClient = output<Client>();

  getClientFullName(client: Client): string {
    return `${client.name} ${client.lastname}`;
  }

  onSelectClient(client: Client) {
    if (client !== null) this.selectClient.emit(client);
  }
}
