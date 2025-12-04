import { UUID } from '@src/app/orders/interfaces/order.interface';

export interface CreateCulqiOrder {
  amount: number;
  currencyIsoCode: string;
  description: string;
  orderNumber: UUID;
  expirationDate: string;
  confirm: boolean;
  clientDetailsRequest: ClientDetailsRequest;
  metadata: Metadata;
}
export interface Metadata {
  customer_id: number;
}

export interface ClientDetailsRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface RESTCulqiOrder {
  object: string;
  id: string;
  amount: number;
  payment_code: string;
  currency_code: string;
  description: string;
  order_number: UUID;
  state: string;
  total_fee: number | null;
  net_amount: number | null;
  fee_details: { [key: string]: any } | null;
  creation_date: number;
  expiration_date: number;
  updated_at: number;
  paid_at: number;
  available_on: Date | null;
  metadata: { [key: string]: any } | null;
  qr: string;
  cuotealo: string | null;
  url_pe: string;
}

export interface RESTChangeStatusCulqiOrder {
  object: string;
  id: string;
  amount: number;
  payment_code: string;
  currency_code: string;
  description: string;
  order_number: string;
  state: string;
  total_fee: number | null;
  net_amount: number | null;
  fee_details: { [key: string]: any } | null;
  creation_date: number;
  expiration_date: number;
  updated_at: number;
  paid_at: number;
  available_on: Date | null;
  metadata: { [key: string]: any } | null;
  qr: string;
  cuotealo: string | null;
  url_pe: string;
}
