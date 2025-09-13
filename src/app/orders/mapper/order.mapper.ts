import { ContentOrder, Order } from '../interfaces/order.interface';

export class OrderMapper {
  static mapRestOrderToOrder(restOrder: ContentOrder): Order {
    return {
      id: restOrder.id,
      mesa: restOrder.tableId,
      estado: restOrder.orderStatus,
      productos: [],
      total: restOrder.totalPrice,
      createdAt: restOrder.createdAt,
    };
  }

  static mapRestOrdersToOrdersArray(restOrders: ContentOrder[]) {
    return restOrders.map(OrderMapper.mapRestOrderToOrder);
  }
}
