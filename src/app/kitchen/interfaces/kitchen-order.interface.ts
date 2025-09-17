export interface KitchenOrder {
  id: number;
  mesa: number;
  productos: KitchenProduct[];
  estado: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO';
  createdAt: Date;
}

export interface KitchenProduct {
  nombre: string;
  cantidad: number;
}