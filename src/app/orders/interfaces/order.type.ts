import { RestOrderStatus } from './order.interface';

export type OrderKitchenStatus =
  | RestOrderStatus.PENDING
  | RestOrderStatus.PREPARING
  | RestOrderStatus.READY;
