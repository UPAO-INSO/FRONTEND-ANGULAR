import { ContentTable, Table } from '../interfaces/table.interface';

export class TableMapper {
  static mapRestOrderToOrder(content: ContentTable): Table {
    return {
      id: content.id,
      capacity: content.capacity,
      number: content.number,
      status: content.status,
    };
  }

  static mapRestTablesToTableArray(content: ContentTable[]): Table[] {
    return content.map(TableMapper.mapRestOrderToOrder);
  }
}
