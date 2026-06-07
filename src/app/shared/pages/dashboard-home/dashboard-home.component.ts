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
import { debounceTime, merge, Subject, Subscription } from 'rxjs';

import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { WebSocketService } from '../../services/websocket.service';
import { ContentOrder, OrderStatus } from '@src/app/orders/interfaces/order.interface';
import { TableStatus } from '@src/app/tables/interfaces/table.interface';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import {
  ORDER_STATUS_BG_CLASS,
  ORDER_STATUS_LABELS,
} from '../../utils/order-status.utils';

/** Intervalo de seguridad (fallback si WebSocket no funciona) */
const REFRESH_INTERVAL = 60_000; // 60 s — el WS se encarga de las actualizaciones frecuentes
/** Agrupa ráfagas de eventos WS para evitar recargas múltiples seguidas */
const DEBOUNCE_MS = 1_200;

@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, DatePipe, LowerCasePipe, TitleCasePipe, StatusBadgeComponent],
  templateUrl: './dashboard-home.component.html',
})
export default class DashboardHomeComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private ws               = inject(WebSocketService);

  // Estado
  stats        = signal<DashboardStats | null>(null);
  loading      = signal(true);
  error        = signal<string | null>(null);
  lastWsUpdate = signal<Date | null>(null);  // timestamp del último update por WS

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
  private wsSub?: Subscription;
  private readonly wsRefresh$ = new Subject<void>();

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

    // ── Actualización por WebSocket ──────────────────────────────
    // Combina eventos de pedidos y mesas, agrupa ráfagas con debounce
    this.wsSub = merge(this.ws.orderEvents$, this.ws.tableEvents$)
      .pipe(debounceTime(DEBOUNCE_MS))
      .subscribe(() => {
        this.lastWsUpdate.set(new Date());
        this.refresh();
      });

    // ── Fallback: timer de seguridad (60 s) ──────────────────────
    this.refreshTimer = setInterval(() => this.refresh(), REFRESH_INTERVAL);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer);
    this.wsSub?.unsubscribe();
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
      case TableStatus.AVAILABLE: return 'bg-table-available/15 border-table-available text-table-available';
      case TableStatus.OCCUPIED:  return 'bg-table-occupied/15  border-table-occupied  text-table-occupied';
      case TableStatus.RESERVED:  return 'bg-status-pending/15  border-status-pending  text-status-pending';
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
    { icon: 'fa-solid fa-table',        label: 'Mesas',       route: '/tables',    color: 'text-table-available' },
    { icon: 'fa-solid fa-receipt',      label: 'Pedidos',     route: '/orders',    color: 'text-status-preparing' },
    { icon: 'fa-solid fa-utensils',     label: 'Cocina',      route: '/kitchen',   color: 'text-status-to-preparation' },
    { icon: 'fa-solid fa-credit-card',  label: 'Pagos',       route: '/payments',  color: 'text-brand' },
    { icon: 'fa-solid fa-file-invoice', label: 'Comprobantes',route: '/vouchers',  color: 'text-status-paid' },
    { icon: 'fa-solid fa-warehouse',    label: 'Inventario',  route: '/inventory', color: 'text-status-ready' },
  ] as const;
}
