import { OrderStatus } from './order.interface';

export type OrderKitchenStatus =
  | OrderStatus.PENDING
  | OrderStatus.PREPARING
  | OrderStatus.READY;
