import {
  ContentOrder,
  Order,
  RequestOrder,
  RequestProductOrder,
} from '../interfaces/order.interface';
import { CartItem } from '../services/order-cart.service';

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

  static mapCartItemToRequestProductOrder(
    orderId: number,
    cartItem: CartItem
  ): RequestProductOrder {
    return {
      orderId,
      subtotal: cartItem.subtotal,
      unitPrice: cartItem.product.price,
      productId: cartItem.product.id,
      quantity: cartItem.quantity,
    };
  }

  static mapCartItemsToRequestProductsOrder(
    orderId: number,
    cartItems: CartItem[]
  ): RequestProductOrder[] {
    return cartItems.map((item) =>
      OrderMapper.mapCartItemToRequestProductOrder(orderId, item)
    );
  }

  // static mapRequestOrderToContentOrder(order: RequestOrder): {};
}
