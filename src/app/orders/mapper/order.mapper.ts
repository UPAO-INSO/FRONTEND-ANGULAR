import {
  ContentOrder,
  Order,
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
    cartItem: CartItem
  ): RequestProductOrder {
    return {
      productId: cartItem.product.id,
      quantity: cartItem.quantity,
    };
  }

  static mapCartItemsToRequestProductsOrder(
    cartItems: CartItem[]
  ): RequestProductOrder[] {
    return cartItems.map(OrderMapper.mapCartItemToRequestProductOrder);
  }
}
