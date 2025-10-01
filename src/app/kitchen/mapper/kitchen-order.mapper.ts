import {
  KitchenOrder,
  KitchenOrderStatus,
  KitchenOrderItem,
  RESTProductOrder,
  KitchenOrderEmployee,
  RESTOrderEmployee,
  ContentKitchen,
} from '../interfaces/kitchen-order.interface';

export class KitchenOrderMapper {
  static mapRestKitchenOrderToKitchenOrder(
    restOrder: ContentKitchen
  ): KitchenOrder {
    return {
      id: restOrder.id,
      mesa: restOrder.tableId,
      createdAt: restOrder.createdAt,
      updatedAt: restOrder.updatedAt,
      productos: this.mapProductOrdersToOrderItems(
        restOrder.productOrders || []
      ),
      estado: this.mapStringToOrderStatus(restOrder.orderStatus),
      totalAmount: restOrder.totalPrice,
      totalItems: restOrder.totalItems,
      comment: restOrder.comment,
      paid: restOrder.paid,
      paidAt: restOrder.paidAt,
      empleados: this.mapOrderEmployeesToEmployees(
        restOrder.orderEmployees || []
      ),
    };
  }

  static mapRestOrdersToOrderArray(
    restOrders: ContentKitchen[]
  ): KitchenOrder[] {
    return restOrders.map((order) =>
      this.mapRestKitchenOrderToKitchenOrder(order)
    );
  }

  private static mapProductOrdersToOrderItems(
    productOrders: RESTProductOrder[]
  ): KitchenOrderItem[] {
    return productOrders.map((item) => ({
      id: item.id,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      productId: item.productId,
    }));
  }

  private static mapOrderEmployeesToEmployees(
    orderEmployees: RESTOrderEmployee[]
  ): KitchenOrderEmployee[] {
    return orderEmployees.map((emp) => ({
      id: emp.id,
      employeeName: emp.employeeName,
      employeeLastname: emp.employeeLastname,
      minutesSpent: emp.minutesSpent,
    }));
  }

  private static mapStringToOrderStatus(status: string): KitchenOrderStatus {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return KitchenOrderStatus.PENDING;
      case 'PREPARING':
        return KitchenOrderStatus.PREPARING;
      case 'READY':
        return KitchenOrderStatus.READY;
      default:
        return KitchenOrderStatus.PENDING;
    }
  }
}
