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
  quantity = signal<number>(0);

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
  
  search() {
    if (!this.searchTerm().trim()) return;
    
    this.inventoryService.searchByName({}, this.searchTerm()).subscribe({
      next: (res) => {
        // Cast content to InventoryItem[] because the interface might be generic
        this.searchResults.set(res.content as unknown as InventoryItem[]);
      },
      error: (err) => console.error(err)
    });
  }

  selectItem(item: InventoryItem) {
    this.currentItem.set(item);
    this.quantity.set(0);
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
    let qty = this.quantity();
    
    if (item && qty > 0) {
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
      this.quantity.set(0);
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

  onQuantityChange(value: number): void {
    const item = this.currentItem();
    if (item) {
      if (!this.isDecimalAllowed(item.unitOfMeasure)) {
        this.quantity.set(Math.floor(value));
      } else {
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
