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

type ViewFilter = 'all' | 'products' | 'insumos';

const ITEMS_PER_PAGE = 10;

@Component({
  selector: 'app-inventory-page',
  imports: [RouterLink, FormsModule, ListStateComponent],
  templateUrl: './inventory-page.component.html',
})
export class InventoryPageComponent {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private router = inject(Router);

  // Filtros
  searchTerm = signal('');
  viewFilter = signal<ViewFilter>('all');
  productCategoryFilter = signal<number | null>(null);

  // Paginación
  currentPage = signal(1);

  readonly viewTabs: { value: ViewFilter; label: string }[] = [
    { value: 'all',      label: 'Todos'     },
    { value: 'products', label: 'Productos' },
    { value: 'insumos',  label: 'Items'     },
  ];

  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

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

  // Mapa de inventario por nombre para obtener cantidades de bebidas/descartables
  private inventoryByName = computed<Map<string, { quantity: number; unitOfMeasure: string }>>(() => {
    const map = new Map<string, { quantity: number; unitOfMeasure: string }>();
    const inventoryData = this.inventoryResource.value();
    if (inventoryData?.content) {
      for (const inv of inventoryData.content) {
        const item = inv as InventoryItem;
        // Solo bebidas y descartables
        if (item.type === InventoryType.BEVERAGE || item.type === InventoryType.DISPOSABLE) {
          map.set(item.name.toLowerCase(), {
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure
          });
        }
      }
    }
    return map;
  });

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

  isLoading = computed(
    () =>
      this.inventoryResource.isLoading() || this.productsResource.isLoading()
  );

  // Total de páginas basado en paginación local
  totalPages = computed(() => {
    const totalItems = this.allUnifiedItems().length;
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  });

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
      // Para productos, verificar si es bebida o descartable (tienen inventario)
      const typeName = item.productTypeName?.toUpperCase();
      if (typeName === 'BEBIDAS' || typeName === 'DESCARTABLES') {
        // Buscar la cantidad en el inventario por nombre
        const invData = this.inventoryByName().get(item.name.toLowerCase());
        if (invData) {
          return invData.quantity.toString();
        }
      }
      // Para platos (ENTRADAS, CARTA, SEGUNDOS) no tienen cantidad directa
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
    // Resetear filtro de categoría si no estamos en productos
    if (filter !== 'products') {
      this.productCategoryFilter.set(null);
    }
    // Resetear a página 1
    this.currentPage.set(1);
  }

  setCategoryFilter(categoryId: number | null): void {
    this.productCategoryFilter.set(categoryId);
    // Resetear a página 1 al cambiar categoría
    this.currentPage.set(1);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    // Resetear a página 1 al buscar
    this.currentPage.set(1);
  }

  // Navegación de páginas
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  editItem(item: UnifiedInventoryItem): void {
    if (item.itemType === 'inventory') {
      this.router.navigate(['/dashboard/inventory/edit-insumo', item.id]);
    } else {
      this.router.navigate(['/dashboard/inventory/edit-product', item.id]);
    }
  }

  /** Clase del tab de vista (Todos / Productos / Items) */
  viewTabClass(filter: ViewFilter): string {
    return this.viewFilter() === filter
      ? 'bg-surface-nav text-white shadow-sm'
      : 'text-gray-400 hover:text-gray-200 hover:bg-surface-nav/50';
  }

  /** Clase del botón de categoría de producto */
  categoryBtnClass(id: number | null): string {
    return this.productCategoryFilter() === id
      ? 'bg-brand text-white'
      : 'bg-background-secondary text-gray-400 hover:text-white hover:bg-surface';
  }
}
