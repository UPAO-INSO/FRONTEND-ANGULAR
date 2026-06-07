export type SeparacionStatus = 'PENDIENTE' | 'LISTA' | 'ENTREGADA' | 'CANCELADA';

export interface SeparacionItem {
  id: number;
  productId: number;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
}

export interface Separacion {
  id: number;
  date: string;
  pensionistaId: number | null;
  pensionistaName: string | null;
  customerId: number | null;
  clientName: string;
  status: SeparacionStatus;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
  items: SeparacionItem[];
}

export interface SeparacionItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateSeparacionRequest {
  pensionistaId?: number | null;
  customerId?: number | null;
  clientName?: string | null;
  notes?: string | null;
  items: SeparacionItemRequest[];
}
