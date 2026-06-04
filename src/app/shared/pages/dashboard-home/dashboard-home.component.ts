import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, LowerCasePipe, TitleCasePipe } from '@angular/common';

import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { ContentOrder, OrderStatus } from '@src/app/orders/interfaces/order.interface';
import { TableStatus } from '@src/app/tables/interfaces/table.interface';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import {
  ORDER_STATUS_BG_CLASS,
  ORDER_STATUS_LABELS,
} from '../../utils/order-status.utils';

const REFRESH_INTERVAL = 30_000; // 30 segundos

@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, DatePipe, LowerCasePipe, TitleCasePipe, StatusBadgeComponent],
  templateUrl: './dashboard-home.component.html',
})
export default class DashboardHomeComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);

  // Estado
  stats   = signal<DashboardStats | null>(null);
  loading = signal(true);
  error   = signal<string | null>(null);

  readonly now   = new Date();
  readonly today = this.now.toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Exponer enums al template
  readonly OrderStatus  = OrderStatus;
  readonly TableStatus  = TableStatus;
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusBg     = ORDER_STATUS_BG_CLASS;

  private refreshTimer?: ReturnType<typeof setInterval>;

  /** KPI: ingresos formateados */
  revenue = computed(() => {
    const s = this.stats();
    if (!s) return '0.00';
    return s.todayRevenue.toFixed(2);
  });

  /** KPI: porcentaje de mesas ocupadas */
  tableOccupancyPct = computed(() => {
    const s = this.stats();
    if (!s || s.totalTables === 0) return 0;
    return Math.round((s.occupiedTables / s.totalTables) * 100);
  });

  /** Mini-badges de pedidos activos (PENDING/PREPARING/READY) para la KPI card */
  activeBadges = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { status: OrderStatus.PENDING,   count: s.ordersByStatus[OrderStatus.PENDING]   ?? 0 },
      { status: OrderStatus.PREPARING, count: s.ordersByStatus[OrderStatus.PREPARING] ?? 0 },
      { status: OrderStatus.READY,     count: s.ordersByStatus[OrderStatus.READY]     ?? 0 },
    ].filter(b => b.count > 0);
  });

  /** Breakdown de estados para el día */
  statusBreakdown = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { status: OrderStatus.PENDING,   label: 'Pendiente',   count: s.ordersByStatus[OrderStatus.PENDING]   ?? 0 },
      { status: OrderStatus.PREPARING, label: 'Preparando',  count: s.ordersByStatus[OrderStatus.PREPARING] ?? 0 },
      { status: OrderStatus.READY,     label: 'Listo',       count: s.ordersByStatus[OrderStatus.READY]     ?? 0 },
      { status: OrderStatus.PAID,      label: 'Pagado',      count: s.ordersByStatus[OrderStatus.PAID]      ?? 0 },
      { status: OrderStatus.COMPLETED, label: 'Completado',  count: s.ordersByStatus[OrderStatus.COMPLETED] ?? 0 },
      { status: OrderStatus.CANCELLED, label: 'Cancelado',   count: s.ordersByStatus[OrderStatus.CANCELLED] ?? 0 },
    ].filter(b => b.count > 0);
  });

  ngOnInit(): void {
    this.refresh();
    this.refreshTimer = setInterval(() => this.refresh(), REFRESH_INTERVAL);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer);
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.loadAll().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el dashboard. Verifica la conexión.');
        this.loading.set(false);
      },
    });
  }

  /** Retorna la clase de color para el estado de una mesa */
  tableStatusClass(status: TableStatus): string {
    switch (status) {
      case TableStatus.OCCUPIED:  return 'bg-status-preparing/20 border-status-preparing text-status-preparing';
      case TableStatus.RESERVED:  return 'bg-status-pending/20 border-status-pending text-status-pending';
      default:                    return 'bg-surface-nav border-border text-text-muted';
    }
  }

  /** Nombre de productos de un pedido como string legible */
  productNames(order: ContentOrder): string {
    return (order.productOrders ?? [])
      .slice(0, 3)
      .map(p => p.productName)
      .join(', ')
      + (order.productOrders?.length > 3 ? ` +${order.productOrders.length - 3}` : '');
  }

  /** Quick links con ícono, label, ruta y color */
  readonly quickLinks = [
    { icon: 'fa-solid fa-table',        label: 'Mesas',       route: '/dashboard/tables',    color: 'text-table-available' },
    { icon: 'fa-solid fa-receipt',      label: 'Pedidos',     route: '/dashboard/orders',    color: 'text-status-preparing' },
    { icon: 'fa-solid fa-utensils',     label: 'Cocina',      route: '/dashboard/kitchen',   color: 'text-status-to-preparation' },
    { icon: 'fa-solid fa-credit-card',  label: 'Pagos',       route: '/dashboard/payments',  color: 'text-brand' },
    { icon: 'fa-solid fa-file-invoice', label: 'Comprobantes',route: '/dashboard/vouchers',  color: 'text-status-paid' },
    { icon: 'fa-solid fa-warehouse',    label: 'Inventario',  route: '/dashboard/inventory', color: 'text-status-ready' },
  ] as const;
}
