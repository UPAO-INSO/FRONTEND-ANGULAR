export interface Order {
  id: number;
  mesa: number;
  productos: ProductOrder[];
  estado: OrderStatus | string;
  total: number;
  createdAt: Date;
}

export interface Product {
  id: number;
  name: string;
}

export enum OrderStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PREPARACION = 'EN_PREPARACION',
  TERMINADO = 'TERMINADO',
  LISTO = 'LISTO',
  CANCELADO = 'CANCELADO',
}

export interface RESTOrder {
  content: ContentOrder[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}

export interface ContentOrder {
  id: number;
  orderStatus: string;
  comment: string;
  paid: boolean;
  tableId: number;
  clientId: number;
  totalItems: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  productOrders: ProductOrder[];
  orderEmployees: OrderEmployee[];
}

export interface OrderEmployee {
  id: number;
  orderId: number;
  employeeId: number;
  minutesSpent: number;
  employeeName: string;
  employeeLastname: string;
}

export interface ProductOrder {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  orderId: number;
  productId: number;
}

export enum RestOrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
}
