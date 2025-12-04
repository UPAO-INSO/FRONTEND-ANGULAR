export interface Voucher {
  id: number;
  pdfUrl: string;
}

export interface RESTVoucher {
  content: Voucher[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}
