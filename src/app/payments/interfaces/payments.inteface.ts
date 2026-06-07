export interface RESTPayment {
  content: ContentPayment[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}

/** Cliente embebido en la respuesta de pago (viene completo desde el backend) */
export interface PaymentCustomer {
  id: number;
  name: string;
  lastname: string;
  phone: string;
  documentNumber: string;
  documentType: string;
  email: string;
  departament: string;
  province: string;
  district: string;
  completeAddress: string;
}

export interface ContentPayment {
  id: number;
  provider: string;
  externalId: string;
  amount: number;
  currencyCode: string;
  description: string;
  order: Order;
  paymentType: PaymentType;
  state: string;
  totalFee: null;
  netAmount: null;
  qr: string;
  urlPe: string;
  creationDate: Date;
  expirationDate: Date;
  updatedAt: Date;
  paidAt: Date;
  rawResponse: string;
  createdAt: Date;
  modifiedAt: Date;
  customerId: number;
  /** Cliente con datos completos (incluido en la respuesta del backend) */
  customer?: PaymentCustomer;
}

export interface Order {
  comment: string;
  createdAt: Date;
  id: string;
  orderEmployees: OrderEmployee[];
  orderStatus: string;
  paid: boolean;
  paidAt: Date;
  productOrders: ProductOrder[];
  tableId: number;
  totalItems: number;
  totalPrice: number;
  updatedAt: Date;
}

export interface OrderEmployee {
  id: number;
  orderId: string;
  employeeId: number;
  minutesSpent: number;
  employeeName: string;
  employeeLastname: string;
}

export interface ProductOrder {
  id: number;
  orderId: string;
  productId: number;
  productName: string;
  productTypeName: string;
  quantity: number;
  servedQuantity: number;
  status: string;
  subtotal: number;
  unitPrice: number;
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
}

export enum PaymentType {
  MOBILE_WALLET = 'MOBILE_WALLET',
  CASH = 'CASH',
}

export interface CreatePaymentRequest {
  provider: string;
  externalId: string;
  amount: number;
  currencyCode: string;
  description: string;
  orderId: string;
  customerId: number;
  paymentType: PaymentType;
  state: string;
  qr: string;
  urlPe: string;
  creationDate: string;
  expirationDate: string;
  updatedAt: string;
  paidAt: string;
  rawResponse: string;
}
