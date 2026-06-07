export type VoucherType = 'RECEIPT' | 'INVOICE';

export interface Voucher {
  id: number;
  series: string;
  number: string;
  voucherType: VoucherType;
  issuedAt: string;
  totalGravada: number;
  totalIgv: number;
  total: number;
  igvPercentage: number;
  currency: string;
  observations: string;
  pdfUrl: string;
  xmlUrl: string;
  qrCodeString: string;
  paymentId: number | null;
}

export interface VoucherResponse extends Voucher {}

export interface RESTVoucher {
  content: Voucher[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}
