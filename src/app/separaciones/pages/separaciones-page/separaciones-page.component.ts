import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { map } from 'rxjs';

import { SeparacionService } from '@separaciones/services/separacion.service';
import { PensionistaService } from '@pensionistas/services/pensionista.service';
import { MenuDiarioService } from '@menu/services/menu-diario.service';
import { ProductService } from '@products/services/product.service';
import { ClientService } from '@src/app/clients/service/client.service';
import { WebSocketService } from '@shared/services/websocket.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { KpiCardComponent } from '@shared/components/kpi-card/kpi-card.component';
import {
  CreateSeparacionRequest,
  Separacion,
  SeparacionItemRequest,
  SeparacionStatus,
} from '@separaciones/interfaces/separacion.interface';
import { Client } from '@src/app/clients/interfaces/client.interface';

type ClienteMode = 'pensionista' | 'libre';

interface ProductoParaSeparacion {
  productId:         number;
  productName:       string;
  productPrice:      number;
  productType:       string;
  imageUrl:          string | null;
  remainingPortions: number | null;
  soldOut:           boolean;
}

interface ItemCart {
  producto: ProductoParaSeparacion;
  quantity: number;
}

@Component({
  selector: 'app-separaciones-page',
  imports: [FormsModule, DecimalPipe, PageHeaderComponent, KpiCardComponent],
  templateUrl: './separaciones-page.component.html',
})
export default class SeparacionesPageComponent {
  private separacionService  = inject(SeparacionService);
  private pensionistaService = inject(PensionistaService);
  private menuService        = inject(MenuDiarioService);
  private productService     = inject(ProductService);
  private clientService      = inject(ClientService);
  private wsService          = inject(WebSocketService);
  private destroyRef         = inject(DestroyRef);

  // ── Resources ────────────────────────────────────────────────────
  separacionesResource = rxResource({
    stream: () => this.separacionService.findToday(),
  });

  pensionistasResource = rxResource({
    stream: () => this.pensionistaService.findAllActive(),
  });

  menuResource = rxResource({
    stream: () => this.menuService.findToday(),
  });

  // Productos available=true via ProductService (misma fuente que cocina)
  availableProductsResource = rxResource({
    stream: () => this.productService.fetchAllProducts(500).pipe(
      map(ps => ps.filter(p => p.available && p.active))
    ),
  });

  // ── Computed ─────────────────────────────────────────────────────
  separaciones      = computed(() => this.separacionesResource.value() ?? []);
  pensionistas      = computed(() => this.pensionistasResource.value() ?? []);
  menuItems         = computed(() => this.menuResource.value() ?? []);
  availableProducts = computed(() => this.availableProductsResource.value() ?? []);

  pendientes = computed(() => this.separaciones().filter(s => s.status === 'PENDIENTE').length);
  listas     = computed(() => this.separaciones().filter(s => s.status === 'LISTA').length);
  entregadas = computed(() => this.separaciones().filter(s => s.status === 'ENTREGADA').length);

  menuItemsMap = computed(() => new Map(this.menuItems().map(m => [m.productId, m])));

  /** Productos disponibles con porciones superpuestas del menú diario. */
  productosParaModal = computed<ProductoParaSeparacion[]>(() => {
    const menuMap = this.menuItemsMap();
    return this.availableProducts().map(p => {
      const menu = menuMap.get(p.id);
      return {
        productId:         p.id,
        productName:       p.name,
        productPrice:      p.price,
        productType:       p.productTypeName,
        imageUrl:          p.imageUrl ?? null,
        remainingPortions: menu?.remainingPortions ?? null,
        soldOut:           menu?.soldOut ?? false,
      };
    });
  });

  // ── Tiempo real: disponibilidad de productos ──────────────────────
  constructor() {
    this.wsService.productEvents$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => {
      if (event.type === 'PRODUCT_AVAILABILITY') {
        this.availableProductsResource.reload();
      }
    });
  }

  // ── Modal crear separación ────────────────────────────────────────
  showModal     = signal(false);
  clienteMode   = signal<ClienteMode>('libre');
  pensionistaId = signal<number | null>(null);

  // Búsqueda de cliente
  customerQuery          = signal('');
  customerResults        = signal<Client[]>([]);
  selectedCustomer       = signal<Client | null>(null);
  customerDropdownOpen   = signal(false);
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  notes     = signal('');
  cart      = signal<ItemCart[]>([]);
  saving    = signal(false);
  saveError = signal<string | null>(null);

  actionError = signal<string | null>(null);

  openModal() {
    this.clienteMode.set('libre');
    this.pensionistaId.set(null);
    this.customerQuery.set('');
    this.customerResults.set([]);
    this.selectedCustomer.set(null);
    this.customerDropdownOpen.set(false);
    this.notes.set('');
    this.cart.set([]);
    this.saveError.set(null);
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  onCustomerQueryChange(value: string) {
    this.customerQuery.set(value);
    this.selectedCustomer.set(null);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    const q = value.trim();
    if (q.length < 2) {
      this.customerResults.set([]);
      this.customerDropdownOpen.set(false);
      return;
    }
    this.searchDebounce = setTimeout(() => {
      this.clientService.searchByName(q).subscribe({
        next: (results) => {
          this.customerResults.set(results);
          this.customerDropdownOpen.set(true);
        },
      });
    }, 300);
  }

  selectCustomer(customer: Client) {
    this.selectedCustomer.set(customer);
    this.customerDropdownOpen.set(false);
    this.customerQuery.set('');
  }

  clearCustomer() {
    this.selectedCustomer.set(null);
    this.customerQuery.set('');
    this.customerDropdownOpen.set(false);
  }

  createAndSelectCustomer(name: string) {
    this.customerDropdownOpen.set(false);
    this.clientService.quickCreate(name.trim()).subscribe({
      next: (customer) => this.selectCustomer(customer),
    });
  }

  setQty(productId: number, qty: number) {
    if (qty <= 0) {
      this.cart.update(c => c.filter(i => i.producto.productId !== productId));
      return;
    }
    const exists = this.cart().find(i => i.producto.productId === productId);
    if (exists) {
      this.cart.update(c =>
        c.map(i => i.producto.productId === productId ? { ...i, quantity: qty } : i)
      );
    } else {
      const producto = this.productosParaModal().find(p => p.productId === productId);
      if (producto) this.cart.update(c => [...c, { producto, quantity: qty }]);
    }
  }

  getQty(productId: number): number {
    return this.cart().find(i => i.producto.productId === productId)?.quantity ?? 0;
  }

  totalEstimado = computed(() => {
    const mode = this.clienteMode();
    if (mode === 'pensionista' && this.pensionistaId() != null) {
      const p = this.pensionistas().find(p => p.id === this.pensionistaId());
      return p ? p.planPricePerMeal : 0;
    }
    return this.cart().reduce((sum, i) => sum + i.producto.productPrice * i.quantity, 0);
  });

  canSave = computed(() =>
    this.cart().length > 0 &&
    (this.clienteMode() === 'pensionista'
      ? this.pensionistaId() != null
      : this.selectedCustomer() != null)
  );

  save() {
    if (!this.canSave()) return;

    const items: SeparacionItemRequest[] = this.cart().map(i => ({
      productId: i.producto.productId,
      quantity:  i.quantity,
    }));

    const dto: CreateSeparacionRequest = {
      items,
      notes: this.notes() || null,
      ...(this.clienteMode() === 'pensionista'
        ? { pensionistaId: this.pensionistaId() }
        : { customerId: this.selectedCustomer()!.id }),
    };

    this.saving.set(true);
    this.saveError.set(null);

    this.separacionService.create(dto).subscribe({
      next: () => {
        this.closeModal();
        this.separacionesResource.reload();
        this.menuResource.reload();
      },
      error: (err) => {
        this.saveError.set(err?.error?.message ?? 'Error al guardar la separación');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  changeStatus(separacion: Separacion, status: SeparacionStatus) {
    this.actionError.set(null);
    this.separacionService.changeStatus(separacion.id, status).subscribe({
      next: () => this.separacionesResource.reload(),
      error: (err) => this.actionError.set(err?.error?.message ?? 'Error al cambiar estado'),
    });
  }

  cancel(separacion: Separacion) {
    this.actionError.set(null);
    this.separacionService.cancel(separacion.id).subscribe({
      next: () => { this.separacionesResource.reload(); this.menuResource.reload(); },
      error: (err) => this.actionError.set(err?.error?.message ?? 'Error al cancelar'),
    });
  }

  // ── Helpers de UI ─────────────────────────────────────────────────
  statusLabel(s: SeparacionStatus): string {
    const labels: Record<SeparacionStatus, string> = {
      PENDIENTE: 'Pendiente', LISTA: 'Lista', ENTREGADA: 'Entregada', CANCELADA: 'Cancelada',
    };
    return labels[s];
  }

  statusClass(s: SeparacionStatus): string {
    const classes: Record<SeparacionStatus, string> = {
      PENDIENTE: 'bg-status-pending/15 text-status-pending border border-status-pending/30',
      LISTA:     'bg-status-ready/15 text-status-ready border border-status-ready/30',
      ENTREGADA: 'bg-status-completed/15 text-status-completed border border-status-completed/30',
      CANCELADA: 'bg-status-cancelled/15 text-status-cancelled border border-status-cancelled/30',
    };
    return classes[s];
  }

  statusBorderClass(s: SeparacionStatus): string {
    const classes: Record<SeparacionStatus, string> = {
      PENDIENTE: 'border-l-yellow-400',
      LISTA:     'border-l-teal-400',
      ENTREGADA: 'border-l-gray-400',
      CANCELADA: 'border-l-red-500',
    };
    return classes[s];
  }
}
