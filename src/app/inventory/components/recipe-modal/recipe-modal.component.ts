import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { InventoryItem, UnitOfMeasure, InventoryType } from '../../interfaces/inventory.interface';

export interface RecipeItem {
  inventoryId: number;
  name: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

@Component({
  selector: 'app-recipe-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-modal.component.html',
})
export class RecipeModalComponent implements OnInit {
  private inventoryService = inject(InventoryService);

  @Input() initialItems: RecipeItem[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() addRecipe = new EventEmitter<RecipeItem[]>();

  searchTerm = signal('');
  searchResults = signal<InventoryItem[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);
  selectedItems = signal<RecipeItem[]>([]);
  
  // Pagination
  currentPage = signal(1);
  pageSize = signal(5);
  totalPages = signal(1);

  // Temporary state for the item being added
  currentItem = signal<InventoryItem | null>(null);
  quantity = signal<number | null>(null);
  
  // Error message for validation
  quantityError = signal<string | null>(null);

  ngOnInit() {
    if (this.initialItems.length > 0) {
      this.selectedItems.set([...this.initialItems]);
    }
    this.loadInventoryItems();
  }

  loadInventoryItems() {
    this.inventoryService.findAll(
      { page: this.currentPage(), limit: this.pageSize() }, 
      InventoryType.INGREDIENT
    ).subscribe({
      next: (res) => {
        this.inventoryItems.set(res.content);
        this.totalPages.set(res.totalPages);
      },
      error: (err) => console.error('Error loading inventory items:', err)
    });
  }

  changePage(delta: number) {
    const newPage = this.currentPage() + delta;
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadInventoryItems();
    }
  }
  
  // Búsqueda dinámica mientras escribe
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    if (value.trim()) {
      this.search();
    } else {
      this.searchResults.set([]);
    }
  }

  search() {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      this.searchResults.set([]);
      return;
    }
    
    // Búsqueda local case-insensitive en los items cargados
    this.inventoryService.findAll({ page: 1, limit: 100 }, InventoryType.INGREDIENT).subscribe({
      next: (res) => {
        const filtered = res.content.filter(item => 
          item.name.toLowerCase().includes(term)
        );
        this.searchResults.set(filtered);
      },
      error: (err) => console.error(err)
    });
  }

  selectItem(item: InventoryItem) {
    this.currentItem.set(item);
    this.quantity.set(null);
    this.quantityError.set(null);
  }

  isDecimalAllowed(unit: string): boolean {
    return unit !== 'UNIDAD';
  }

  getStep(unit: string): number {
    return this.isDecimalAllowed(unit) ? 0.1 : 1;
  }

  getMin(unit: string): number {
    return this.isDecimalAllowed(unit) ? 0.1 : 1;
  }

  addItem() {
    const item = this.currentItem();
    const qtyValue = this.quantity();
    
    if (item && qtyValue !== null && qtyValue > 0) {
      let qty = qtyValue;
      // Enforce integer for UNIDAD, or max 2 decimals for others
      if (!this.isDecimalAllowed(item.unitOfMeasure)) {
        qty = Math.floor(qty);
      } else {
        qty = this.roundToTwoDecimals(qty);
      }

      this.selectedItems.update(items => {
        const existingIndex = items.findIndex(i => i.inventoryId === item.id);
        
        if (existingIndex !== -1) {
          // Item exists, update quantity
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: this.roundToTwoDecimals(updatedItems[existingIndex].quantity + qty)
          };
          return updatedItems;
        }
        
        // New item
        return [
          ...items, 
          {
            inventoryId: item.id,
            name: item.name,
            quantity: qty,
            unitOfMeasure: item.unitOfMeasure
          }
        ];
      });
      
      this.currentItem.set(null);
      this.quantity.set(null);
      this.searchTerm.set('');
      this.searchResults.set([]);
    }
  }

  removeItem(index: number) {
    this.selectedItems.update(items => items.filter((_, i) => i !== index));
  }

  updateItemQuantity(index: number, quantity: number) {
    if (quantity > 0) {
      this.selectedItems.update(items => {
        const newItems = [...items];
        const item = newItems[index];
        
        // Enforce integer for UNIDAD, or max 2 decimals for others
        let newQty = quantity;
        if (!this.isDecimalAllowed(item.unitOfMeasure)) {
          newQty = Math.floor(quantity);
        } else {
          newQty = this.roundToTwoDecimals(quantity);
        }

        newItems[index] = { ...item, quantity: newQty };
        return newItems;
      });
    }
  }

  onQuantityChange(value: number | null): void {
    if (value === null || value === undefined) {
      this.quantity.set(null);
      this.quantityError.set(null);
      return;
    }
    const item = this.currentItem();
    if (item) {
      if (!this.isDecimalAllowed(item.unitOfMeasure)) {
        // Verificar si tiene decimales
        if (!Number.isInteger(value)) {
          this.quantityError.set('Las unidades solo aceptan números enteros, no decimales');
          this.quantity.set(Math.floor(value));
          return;
        }
        this.quantityError.set(null);
        this.quantity.set(value);
      } else {
        this.quantityError.set(null);
        this.quantity.set(this.roundToTwoDecimals(value));
      }
    } else {
      this.quantity.set(value);
    }
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  confirm() {
    this.addRecipe.emit(this.selectedItems());
    this.close.emit();
  }
}
