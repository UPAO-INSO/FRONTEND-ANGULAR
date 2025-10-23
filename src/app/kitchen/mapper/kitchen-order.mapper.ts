import { ContentOrder } from '@src/app/orders/interfaces/order.interface';

export class KitchenOrderMapper {
  static mapRestKitchenOrderToKitchenOrder(
    restOrder: ContentOrder
  ): ContentOrder {
    return {
      id: restOrder.id,
      tableId: restOrder.tableId,
      createdAt: restOrder.createdAt,
      updatedAt: restOrder.updatedAt,
      productOrders: restOrder.productOrders,
      orderStatus: restOrder.orderStatus,
      totalPrice: restOrder.totalPrice,
      totalItems: restOrder.totalItems,
      comment: restOrder.comment,
      paid: restOrder.paid,
      paidAt: restOrder.paidAt,
      orderEmployees: restOrder.orderEmployees,
    };
  }

  static mapRestOrdersToOrderArray(restOrders: ContentOrder[]): ContentOrder[] {
    return restOrders.map((order) =>
      this.mapRestKitchenOrderToKitchenOrder(order)
    );
  }
}
