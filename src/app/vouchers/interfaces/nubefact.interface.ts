export interface NubefactItem {
  unidad_de_medida: string;
  codigo: string;
  codigo_producto_sunat: string;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  precio_unitario: number;
  subtotal: number;
  tipo_de_igv: number;
  igv: number;
  total: number;
  anticipo_regularizacion: boolean;
  descuento?: string;
  anticipo_documento_serie?: string;
  anticipo_documento_numero?: string;
}

export interface CreateVoucherRequest {
  serie: string;
  numero: number;
  sunat_transaction: number;
  cliente_tipo_de_documento: number;
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion: string;
  cliente_email: string;
  fecha_de_emision: string;
  moneda: number;
  porcentaje_de_igv: number;
  total_gravada: number;
  total_igv: number;
  total: number;
  observaciones: string;
  enviar_automaticamente_a_la_sunat: boolean;
  enviar_automaticamente_al_cliente: boolean;
  items: NubefactItem[];
}

export enum VoucherType {
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
}
