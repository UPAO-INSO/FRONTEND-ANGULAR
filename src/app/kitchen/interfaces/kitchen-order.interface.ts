// src/app/kitchen/interfaces/kitchen-order.interface.ts
export enum KitchenOrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
}

export interface KitchenOrder {
  id: number;
  mesa: number;
  createdAt: string;
  updatedAt: string;
  productos: KitchenOrderItem[];
  estado: KitchenOrderStatus;
  totalAmount: number;
  totalItems: number;
  comment: string;
  paid: boolean;
  paidAt?: string;
  empleados: KitchenOrderEmployee[];
}

export interface KitchenOrderItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productId: number;
}

export interface KitchenOrderEmployee {
  id: number;
  employeeName: string;
  employeeLastname: string;
  minutesSpent: number;
}

// Interfaces REST del backend
export interface RESTKitchenOrder {
  id: number;
  orderStatus: string;
  comment: string;
  paid: boolean;
  tableId: number;
  clientId: number;
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  productOrders: RESTProductOrder[];
  orderEmployees: RESTOrderEmployee[];
}

export interface RESTProductOrder {
  id: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  orderId: number;
  productId: number;
  productName: string;
}

export interface RESTOrderEmployee {
  id: number;
  orderId: number;
  employeeId: number;
  minutesSpent: number;
  employeeName: string;
  employeeLastname: string;
}

export interface KitchenOrderResponse {
  content: RESTKitchenOrder[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}
