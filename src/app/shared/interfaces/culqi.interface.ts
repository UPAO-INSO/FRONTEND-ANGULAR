export interface CreateCulqiOrder {
  amount: number;
  currencyIsoCode: string;
  description: string;
  orderNumber: string;
  expirationDate: string;
  confirm: boolean;
  clientDetailsRequest: ClientDetailsRequest;
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
  order_number: string;
  state: string;
  total_fee: null;
  net_amount: null;
  fee_details: null;
  creation_date: number;
  expiration_date: number;
  updated_at: null;
  paid_at: null;
  available_on: null;
  metadata: null;
  qr: string;
  cuotealo: null;
  url_pe: string;
}
