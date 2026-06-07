import {
  Component,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { map } from 'rxjs';

import { MenuDiarioService } from '@menu/services/menu-diario.service';
import { ProductService } from '@products/services/product.service';

@Component({
  selector: 'app-menu-diario-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './menu-diario-modal.component.html',
})
export class MenuDiarioModalComponent {
  private menuService = inject(MenuDiarioService);
  private productService = inject(ProductService);

  closeModal = output<void>();

  // Productos disponibles via ProductService (mismo sistema que cocina)
  productsResource = rxResource({
    stream: () =>
      this.productService
        .fetchAllProducts(500)
        .pipe(
          map((ps) =>
            ps.filter(
              (p) =>
                p.available &&
                p.active &&
                !['bebidas', 'descartables'].includes(
                  p.productTypeName.toLowerCase(),
                ),
            ),
          ),
        ),
  });

  // Porciones ya guardadas hoy (overlay)
  menuResource = rxResource({
    stream: () => this.menuService.findToday(),
  });

  products = computed(() => this.productsResource.value() ?? []);
  menuItems = computed(() => this.menuResource.value() ?? []);
  menuItemsMap = computed(
    () => new Map(this.menuItems().map((m) => [m.productId, m])),
  );

  isLoading = computed(
    () => this.productsResource.isLoading() || this.menuResource.isLoading(),
  );

  // Inputs mutables ([(ngModel)] no funciona bien con signals)
  portionInputs: Record<number, number> = {};

  saving = signal(false);
  saveError = signal<string | null>(null);
  saveOk = signal(false);

  constructor() {
    // Inicializar inputs cuando cargan los datos
    effect(() => {
      const ps = this.products();
      const map = this.menuItemsMap();
      ps.forEach((p) => {
        if (!(p.id in this.portionInputs)) {
          this.portionInputs[p.id] = map.get(p.id)?.estimatedPortions ?? 0;
        }
      });
    });
  }

  getUsed(productId: number): number {
    return this.menuItemsMap().get(productId)?.usedPortions ?? 0;
  }

  getEstimated(productId: number): number {
    return this.portionInputs[productId] ?? 0;
  }

  getRemaining(productId: number): number | null {
    const est = Number(this.portionInputs[productId] ?? 0);
    if (est === 0) return null;
    return Math.max(0, est - this.getUsed(productId));
  }

  save() {
    const items = Object.entries(this.portionInputs)
      .map(([id, qty]) => ({
        productId: Number(id),
        estimatedPortions: Math.max(0, Math.floor(Number(qty) || 0)),
      }))
      .filter((i) => i.estimatedPortions > 0);

    if (items.length === 0) {
      this.close();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.saveOk.set(false);

    this.menuService.saveBulk(items).subscribe({
      next: () => {
        this.saveOk.set(true);
        setTimeout(() => this.close(), 1200);
      },
      error: (err) => {
        this.saveError.set(err?.error?.message ?? 'Error al guardar');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  close() {
    this.closeModal.emit();
  }
}
