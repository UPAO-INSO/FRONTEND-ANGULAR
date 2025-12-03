import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';

import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '@src/app/products/services/product.service';
import {
  InventoryItem,
  INVENTORY_TYPE_LABELS,
  UNIT_OF_MEASURE_SYMBOLS,
  UnifiedInventoryItem,
} from '../../interfaces/inventory.interface';
import { Product, ProductType } from '@src/app/products/interfaces/product.type';

type ViewFilter = 'all' | 'products' | 'insumos';

// Constante para items por página
const ITEMS_PER_PAGE = 5;

@Component({
  selector: 'app-inventory-page',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './inventory-page.component.html',
})
export class InventoryPageComponent {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private router = inject(Router);

  // Filtros
  searchTerm = signal('');
  viewFilter = signal<ViewFilter>('all');
  productCategoryFilter = signal<number | null>(null); // null = todas las categorías
  
  // Paginación local
  currentPage = signal(1);

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

  // Todos los items sin paginar (para calcular total)
  allUnifiedItems = computed<UnifiedInventoryItem[]>(() => {
    const filter = this.viewFilter();
    const searchQuery = this.searchTerm().trim().toLowerCase();
    const items: UnifiedInventoryItem[] = [];

    // Agregar insumos si corresponde
    if (filter === 'all' || filter === 'insumos') {
      const inventoryData = this.inventoryResource.value();
      if (inventoryData?.content) {
        for (const inv of inventoryData.content) {
          const item = inv as InventoryItem;
          
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
            status: item.status,
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
            available: prod.available,
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
  getStatusClass(status: InventoryItem['status'] | undefined): string {
    switch (status) {
      case 'in-stock':
        return 'bg-green-500';
      case 'low-stock':
        return 'bg-yellow-500';
      case 'out-of-stock':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

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
}
