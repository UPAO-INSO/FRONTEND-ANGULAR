export interface PersonResponse {
  id: number;
  name: string;
  lastname: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonByFullName {
  name: string;
  lastname: string;
}

export interface Order {
  id: number;
  mesa: number;
  productos: ProductOrder[];
  estado: OrderStatus | string;
  total: number;
  createdAt: Date;
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
  orderStatus: OrderStatus;
  comment: string;
  paid: boolean;
  tableId: number;
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
  productName: string;
  productTypeName: string;
  quantity: number;
  servedQuantity: number;
  unitPrice: number;
  subtotal: number;
  orderId: number;
  productId: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
}

export interface RequestOrder {
  comment: string;
  tableId: number;
  productOrders: RequestProductOrder[];
  orderEmployees: RequestOrderEmployee[];
}

export interface RequestOrderEmployee {
  employeeId: number;
}

export interface RequestProductOrder {
  quantity: number;
  unitPrice: number;
  subtotal: number;
  orderId: number;
  productId: number;
}
