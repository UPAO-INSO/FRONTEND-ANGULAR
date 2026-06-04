import { OrderStatus } from '@src/app/orders/interfaces/order.interface';

/** Texto legible para cada estado de pedido */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:   'Pendiente',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]:     'Listo',
  [OrderStatus.PAID]:      'Pagado',
  [OrderStatus.COMPLETED]: 'Completado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

/** Clases Tailwind para el badge de estado (fondo + texto) */
export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:   'bg-status-pending   text-status-text-pending',
  [OrderStatus.PREPARING]: 'bg-status-preparing text-status-text-preparing',
  [OrderStatus.READY]:     'bg-status-ready     text-status-text-ready',
  [OrderStatus.PAID]:      'bg-status-paid      text-white',
  [OrderStatus.COMPLETED]: 'bg-status-completed text-gray-300',
  [OrderStatus.CANCELLED]: 'bg-status-cancelled text-white',
};

/** Clase del borde izquierdo de tarjetas de pedido */
export const ORDER_STATUS_BORDER_CLASS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:   'border-status-pending',
  [OrderStatus.PREPARING]: 'border-status-preparing',
  [OrderStatus.READY]:     'border-status-ready',
  [OrderStatus.PAID]:      'border-status-paid',
  [OrderStatus.COMPLETED]: 'border-status-completed',
  [OrderStatus.CANCELLED]: 'border-status-cancelled',
};

/** Gradiente de fondo para el hover de tarjetas de pedido */
export const ORDER_STATUS_GRADIENT_CLASS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:   'bg-gradient-to-r from-status-pending   to-side-background',
  [OrderStatus.PREPARING]: 'bg-gradient-to-r from-status-preparing to-transparent',
  [OrderStatus.READY]:     'bg-gradient-to-r from-status-ready     to-transparent',
  [OrderStatus.PAID]:      'bg-gradient-to-r from-status-paid      to-transparent',
  [OrderStatus.COMPLETED]: 'bg-gradient-to-r from-status-completed to-transparent',
  [OrderStatus.CANCELLED]: 'bg-gradient-to-r from-status-cancelled to-transparent',
};

/** Color de fondo simple (sin gradiente) para indicadores de estado en mesas */
export const ORDER_STATUS_BG_CLASS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:   'bg-status-pending',
  [OrderStatus.PREPARING]: 'bg-status-preparing',
  [OrderStatus.READY]:     'bg-status-ready',
  [OrderStatus.PAID]:      'bg-status-paid',
  [OrderStatus.COMPLETED]: 'bg-status-completed',
  [OrderStatus.CANCELLED]: 'bg-status-cancelled',
};
