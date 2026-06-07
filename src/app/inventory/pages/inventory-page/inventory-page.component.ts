import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';

import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '@src/app/products/services/product.service';
import {
  InventoryItem,
  InventoryType,
  INVENTORY_TYPE_LABELS,
  UNIT_OF_MEASURE_SYMBOLS,
  UnifiedInventoryItem,
} from '../../interfaces/inventory.interface';
import { ProductType } from '@src/app/products/interfaces/product.type';
import { ListStateComponent } from '@src/app/shared/components/list-state/list-state.component';
import { PageHeaderComponent } from '@src/app/shared/components/page-header/page-header.component';
import { KpiCardComponent } from '@src/app/shared/components/kpi-card/kpi-card.component';
import { PaginationComponent } from '@src/app/shared/components/pagination/pagination.component';
import { PaginationService } from '@src/app/shared/components/pagination/pagination.service';

type ViewFilter = 'all' | 'products' | 'insumos';

const ITEMS_PER_PAGE = 10;

@Component({
  selector: 'app-inventory-page',
  imports: [RouterLink, FormsModule, ListStateComponent, PageHeaderComponent, KpiCardComponent, PaginationComponent],
  templateUrl: './inventory-page.component.html',
})
export class InventoryPageComponent {
  private inventoryService  = inject(InventoryService);
  private productService    = inject(ProductService);
  private router            = inject(Router);
  readonly paginationService = inject(PaginationService);

  // Filtros
  searchTerm            = signal('');
  viewFilter            = signal<ViewFilter>('all');
  productCategoryFilter = signal<number | null>(null);

  // Paginación local (usa PaginationService como fuente de verdad)
  currentPage = computed(() => this.paginationService.currentPage());

  readonly viewTabs: { value: ViewFilter; label: string }[] = [
    { value: 'all',      label: 'Todos'     },
    { value: 'products', label: 'Productos' },
    { value: 'insumos',  label: 'Items'     },
  ];

  // Tipos de productos (cargar una sola vez)
  productTypesResource = rxResource({
    stream: () => this.productService.fetchProductsType(),
  });

  productTypes = computed<ProductType[]>(() => {
    return this.productTypesResource.value() ?? [];
  });

  // Recursos - traemos todos los datos, filtrado se hace localmente
  inventoryResource = rxResource({
    stream: () => {
      return this.inventoryService.findAll({ page: 1, limit: 100 });
    },
  });

  productsResource = rxResource({
    stream: () => {
      return this.productService.fetchAllProducts(100).pipe(
        map((products) => ({
          content: products,
          totalPages: 1,
          page: 1,
        }))
      );
    },
  });

  // inventoryByName eliminado — el stock ahora viene directamente del backend
  // via ProductResponseDto.stock (FK directo inventory_id en product)

  // Todos los items sin paginar (para calcular total)
  allUnifiedItems = computed<UnifiedInventoryItem[]>(() => {
    const filter = this.viewFilter();
    const searchQuery = this.searchTerm().trim().toLowerCase();
    const items: UnifiedInventoryItem[] = [];

    // Agregar insumos si corresponde
    // NOTA: Excluir BEVERAGE y DISPOSABLE ya que ahora son productos
    if (filter === 'all' || filter === 'insumos') {
      const inventoryData = this.inventoryResource.value();
      if (inventoryData?.content) {
        for (const inv of inventoryData.content) {
          const item = inv as InventoryItem;
          
          // Excluir bebidas y descartables - ahora se manejan como productos
          if (item.type === InventoryType.BEVERAGE || item.type === InventoryType.DISPOSABLE) {
            continue;
          }
          
          // Filtrar por búsqueda (case-insensitive)
          if (searchQuery && !item.name.toLowerCase().includes(searchQuery)) {
            continue;
          }
          
          items.push({
            id: item.id,
            name: item.name,
            itemType: 'inventory',
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            inventoryType: item.type,
          });
        }
      }
    }

    // Agregar productos si corresponde
    if (filter === 'all' || filter === 'products') {
      const productsData = this.productsResource.value();
      const categoryFilter = this.productCategoryFilter();
      if (productsData?.content) {
        for (const prod of productsData.content) {
          // Filtrar por búsqueda (case-insensitive)
          if (searchQuery && !prod.name.toLowerCase().includes(searchQuery)) {
            continue;
          }
          
          // Filtrar por categoría si está seleccionada
          if (categoryFilter !== null && prod.productTypeId !== categoryFilter) {
            continue;
          }
          items.push({
            id: prod.id,
            name: prod.name,
            itemType: 'product',
            price: prod.price,
            description: prod.description,
            productTypeId: prod.productTypeId,
            productTypeName: prod.productTypeName,
            quantity: prod.stock ?? undefined,  // stock directo del backend (para bebidas/descartables)
          });
        }
      }
    }

    return items;
  });

  // Vista unificada PAGINADA
  unifiedItems = computed<UnifiedInventoryItem[]>(() => {
    const allItems = this.allUnifiedItems();
    const page = this.currentPage();
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allItems.slice(startIndex, endIndex);
  });

  isLoading = computed(() =>
    (this.inventoryResource.isLoading()  && !this.inventoryResource.error()) ||
    (this.productsResource.isLoading()   && !this.productsResource.error())
  );

  loadError = computed(() =>
    (this.inventoryResource.error() as Error | undefined)?.message ??
    (this.productsResource.error()  as Error | undefined)?.message ??
    null
  );

  totalPages = computed(() =>
    Math.ceil(this.allUnifiedItems().length / ITEMS_PER_PAGE)
  );

  // ── KPI computed ──────────────────────────────────────────────────
  totalInsumos   = computed(() =>
    (this.inventoryResource.value()?.content ?? [])
      .filter((i: InventoryItem) =>
        i.type !== InventoryType.BEVERAGE && i.type !== InventoryType.DISPOSABLE
      ).length
  );
  totalProductos = computed(() =>
    (this.productsResource.value()?.content ?? []).length
  );
  totalAll       = computed(() => this.totalInsumos() + this.totalProductos());

  // Helpers para template
  getCategoryLabel(item: UnifiedInventoryItem): string {
    if (item.itemType === 'product') {
      return item.productTypeName ?? 'Producto';
    }
    if (item.inventoryType) {
      return INVENTORY_TYPE_LABELS[item.inventoryType];
    }
    return 'Insumo';
  }

  getQuantityDisplay(item: UnifiedInventoryItem): string {
    if (item.itemType === 'product') {
      const typeName = item.productTypeName?.toUpperCase();
      if ((typeName === 'BEBIDAS' || typeName === 'DESCARTABLES') && item.quantity != null) {
        // Stock real del backend via FK directo (sin nombre matching)
        return item.quantity.toString();
      }
      // Para platos no hay stock directo (depende de ingredientes)
      return 'N/A';
    }
    return item.quantity?.toString() ?? '-';
  }

  getUnitOrPrice(item: UnifiedInventoryItem): string {
    if (item.itemType === 'product') {
      return `S/ ${item.price?.toFixed(2) ?? '0.00'}`;
    }
    if (item.unitOfMeasure) {
      return UNIT_OF_MEASURE_SYMBOLS[item.unitOfMeasure];
    }
    return '-';
  }

  // Acciones
  setFilter(filter: ViewFilter): void {
    this.viewFilter.set(filter);
    if (filter !== 'products') this.productCategoryFilter.set(null);
    this.paginationService.resetPage();
  }

  setCategoryFilter(categoryId: number | null): void {
    this.productCategoryFilter.set(categoryId);
    this.paginationService.resetPage();
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.paginationService.resetPage();
  }

  editItem(item: UnifiedInventoryItem): void {
    if (item.itemType === 'inventory') {
      this.router.navigate(['/inventory/edit-insumo', item.id]);
    } else {
      this.router.navigate(['/inventory/edit-product', item.id]);
    }
  }

  viewTabClass(filter: ViewFilter): string {
    return this.viewFilter() === filter
      ? 'bg-surface-nav text-white shadow-sm'
      : 'text-gray-400 hover:text-gray-200 hover:bg-surface-nav/50';
  }

  categoryBtnClass(id: number | null): string {
    return this.productCategoryFilter() === id
      ? 'bg-brand text-white'
      : 'bg-background-secondary text-gray-400 hover:text-white hover:bg-surface';
  }

  // ── Helpers visuales ────────────────────────────────────────────

  /** Icono Font Awesome para el tipo de ítem */
  getItemIcon(item: UnifiedInventoryItem): string {
    if (item.itemType === 'inventory') return 'fa-solid fa-flask';
    const t = item.productTypeName?.toUpperCase() ?? '';
    if (t.includes('BEBIDA')) return 'fa-solid fa-bottle-water';
    if (t.includes('DESCARTABLE')) return 'fa-solid fa-box';
    return 'fa-solid fa-utensils';
  }

  /** Color del icono */
  getItemIconColor(item: UnifiedInventoryItem): string {
    if (item.itemType === 'inventory') return 'text-amber-400';
    const t = item.productTypeName?.toUpperCase() ?? '';
    if (t.includes('BEBIDA')) return 'text-blue-400';
    if (t.includes('DESCARTABLE')) return 'text-gray-400';
    return 'text-brand';
  }

  /** Fondo del icono */
  getItemIconBg(item: UnifiedInventoryItem): string {
    if (item.itemType === 'inventory') return 'bg-amber-500/10';
    const t = item.productTypeName?.toUpperCase() ?? '';
    if (t.includes('BEBIDA')) return 'bg-blue-500/10';
    if (t.includes('DESCARTABLE')) return 'bg-gray-500/10';
    return 'bg-brand/10';
  }

  /** Color del stock según cantidad */
  getStockColorClass(item: UnifiedInventoryItem): string {
    const qty = item.quantity;
    if (qty == null) return 'text-text-muted';
    if (qty <= 0)    return 'text-red-400';
    if (qty <= 5)    return 'text-orange-400';
    if (qty <= 20)   return 'text-amber-400';
    return 'text-status-ready';
  }

  /** Texto del stock con unidad */
  getStockDisplay(item: UnifiedInventoryItem): { value: string; label: string } {
    if (item.itemType === 'product') {
      const t = item.productTypeName?.toUpperCase() ?? '';
      if ((t.includes('BEBIDA') || t.includes('DESCARTABLE')) && item.quantity != null) {
        return { value: item.quantity.toString(), label: 'und' };
      }
      return { value: '—', label: 'por receta' };
    }
    const symbol = item.unitOfMeasure ? UNIT_OF_MEASURE_SYMBOLS[item.unitOfMeasure] : '';
    return { value: item.quantity?.toString() ?? '—', label: symbol };
  }
}
