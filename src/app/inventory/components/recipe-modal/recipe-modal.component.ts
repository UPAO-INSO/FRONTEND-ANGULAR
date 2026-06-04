import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InventoryService } from '../../services/inventory.service';
import { InventoryItem, InventoryType, UnitOfMeasure } from '../../interfaces/inventory.interface';

export interface RecipeItem {
  inventoryId: number;
  name: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

@Component({
  selector: 'app-recipe-modal',
  imports: [FormsModule],
  templateUrl: './recipe-modal.component.html',
})
export class RecipeModalComponent implements OnInit {
  private inventoryService = inject(InventoryService);

  initialItems = input<RecipeItem[]>([]);
  close      = output<void>();
  addRecipe  = output<RecipeItem[]>();

  searchTerm    = signal('');
  searchResults = signal<InventoryItem[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);
  selectedItems  = signal<RecipeItem[]>([]);

  currentPage = signal(1);
  pageSize    = signal(5);
  totalPages  = signal(1);

  currentItem   = signal<InventoryItem | null>(null);
  quantity      = signal<number | null>(null);
  quantityError = signal<string | null>(null);

  ngOnInit() {
    if (this.initialItems().length > 0) {
      this.selectedItems.set([...this.initialItems()]);
    }
    this.loadInventoryItems();
  }

  loadInventoryItems() {
    this.inventoryService
      .findAll({ page: this.currentPage(), limit: this.pageSize() }, InventoryType.INGREDIENT)
      .subscribe({
        next: (res) => {
          this.inventoryItems.set(res.content);
          this.totalPages.set(res.totalPages);
        },
        error: (err) => console.error('Error loading inventory items:', err),
      });
  }

  changePage(delta: number) {
    const newPage = this.currentPage() + delta;
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadInventoryItems();
    }
  }

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
    if (!term) { this.searchResults.set([]); return; }

    this.inventoryService.findAll({ page: 1, limit: 100 }, InventoryType.INGREDIENT).subscribe({
      next: (res) => {
        this.searchResults.set(res.content.filter(item =>
          item.name.toLowerCase().includes(term)
        ));
      },
      error: (err) => console.error(err),
    });
  }

  selectItem(item: InventoryItem) {
    this.currentItem.set(item);
    this.quantity.set(null);
    this.quantityError.set(null);
  }

  isDecimalAllowed(unit: string): boolean { return unit !== 'UNIDAD'; }
  getStep(unit: string): number  { return this.isDecimalAllowed(unit) ? 0.1 : 1; }
  getMin(unit: string): number   { return this.isDecimalAllowed(unit) ? 0.1 : 1; }

  addItem() {
    const item = this.currentItem();
    const qtyValue = this.quantity();
    if (!item || qtyValue === null || qtyValue <= 0) return;

    const qty = this.isDecimalAllowed(item.unitOfMeasure)
      ? this.round2(qtyValue)
      : Math.floor(qtyValue);

    this.selectedItems.update(items => {
      const idx = items.findIndex(i => i.inventoryId === item.id);
      if (idx !== -1) {
        const updated = [...items];
        updated[idx] = { ...updated[idx], quantity: this.round2(updated[idx].quantity + qty) };
        return updated;
      }
      return [...items, { inventoryId: item.id, name: item.name, quantity: qty, unitOfMeasure: item.unitOfMeasure }];
    });

    this.currentItem.set(null);
    this.quantity.set(null);
    this.searchTerm.set('');
    this.searchResults.set([]);
  }

  removeItem(index: number) {
    this.selectedItems.update(items => items.filter((_, i) => i !== index));
  }

  updateItemQuantity(index: number, quantity: number) {
    if (quantity <= 0) return;
    this.selectedItems.update(items => {
      const updated = [...items];
      const item = updated[index];
      updated[index] = {
        ...item,
        quantity: this.isDecimalAllowed(item.unitOfMeasure) ? this.round2(quantity) : Math.floor(quantity),
      };
      return updated;
    });
  }

  onQuantityChange(value: number | null): void {
    if (value === null) { this.quantity.set(null); this.quantityError.set(null); return; }

    const item = this.currentItem();
    if (item && !this.isDecimalAllowed(item.unitOfMeasure) && !Number.isInteger(value)) {
      this.quantityError.set('Las unidades solo aceptan números enteros');
      this.quantity.set(Math.floor(value));
      return;
    }
    this.quantityError.set(null);
    this.quantity.set(this.isDecimalAllowed(item?.unitOfMeasure ?? 'KG') ? this.round2(value) : value);
  }

  confirm() {
    this.addRecipe.emit(this.selectedItems());
    this.close.emit();
  }

  private round2(v: number): number { return Math.round(v * 100) / 100; }
}
