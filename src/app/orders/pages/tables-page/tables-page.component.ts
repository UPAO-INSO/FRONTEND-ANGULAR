import { Component, computed } from '@angular/core';
import { OrderStatusComponent } from '../../components/order-status/order-status.component';

export interface Table {
  id: number;
  number: string;
  capacity: string;
  status: string;
}

@Component({
  selector: 'app-orders-page',
  imports: [OrderStatusComponent],
  templateUrl: './tables-page.component.html',
})
export default class OrdersPageComponent {
  tables: Table[] = [
    {
      id: 1,
      number: '1',
      capacity: '4',
      status: 'Disponible',
    },
    {
      id: 2,
      number: '2',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 3,
      number: '3',
      capacity: '4',
      status: 'Disponible',
    },
    {
      id: 4,
      number: '4',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 5,
      number: '5',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 6,
      number: '6',
      capacity: '4',
      status: 'Disponible',
    },
    {
      id: 7,
      number: '7',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 8,
      number: '8',
      capacity: '4',
      status: 'Disponible',
    },
    {
      id: 9,
      number: '9',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 10,
      number: '10',
      capacity: '4',
      status: 'Disponible',
    },
    {
      id: 11,
      number: '11',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 12,
      number: '12',
      capacity: '4',
      status: 'Disponible',
    },
    {
      id: 13,
      number: '13',
      capacity: '4',
      status: 'Disponible',
    },
    {
      id: 14,
      number: '14',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 15,
      number: '15',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 16,
      number: '16',
      capacity: '4',
      status: 'Disponible',
    },
    {
      id: 17,
      number: '17',
      capacity: '4',
      status: 'Ocupada',
    },
    {
      id: 18,
      number: '18',
      capacity: '4',
      status: 'Disponible',
    },
  ];

  tablesGroup = computed(() => {
    const groups = [];

    for (let i = 0; i < this.tables.length; i += 1) {
      groups.push(this.tables.slice(i, i + 1));
    }

    return groups;
  });
}
