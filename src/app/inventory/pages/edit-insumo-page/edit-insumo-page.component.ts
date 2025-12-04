import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InventoryService } from '../../services/inventory.service';
import {
  InventoryItem,
  InventoryUpdate,
  InventoryType,
  UnitOfMeasure,
  INVENTORY_TYPE_LABELS,
  UNIT_OF_MEASURE_LABELS,
  ALLOWED_UNITS_BY_TYPE,
  validateInventoryItem,
} from '../../interfaces/inventory.interface';

@Component({
  selector: 'app-edit-insumo-page',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './edit-insumo-page.component.html',
})
export class EditInsumoPageComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Item original
  itemId = signal<number>(0);
  originalItem = signal<InventoryItem | null>(null);

  // Form state
  name = signal('');
  quantity = signal<number | null>(null);
  selectedType = signal<InventoryType>(InventoryType.INGREDIENT);
  selectedUnit = signal<UnitOfMeasure>(UnitOfMeasure.G);

  // UI state
  isLoading = signal(true);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  errorMessage = signal<string | null>(null);

  // Opciones - Solo para ingredientes
  typeLabels = INVENTORY_TYPE_LABELS;
  unitLabels = UNIT_OF_MEASURE_LABELS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.itemId.set(+id);
      this.loadItem(+id);
    }
  }

  private loadItem(id: number): void {
    this.isLoading.set(true);
    this.inventoryService.getById(id).subscribe({
      next: (item) => {
        this.originalItem.set(item);
        this.name.set(item.name);
        this.quantity.set(item.quantity);
        this.selectedType.set(item.type);
        this.selectedUnit.set(item.unitOfMeasure);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading item:', err);
        this.errorMessage.set('No se pudo cargar el insumo');
        this.isLoading.set(false);
      },
    });
  }

  // Unidades permitidas para ingredientes (masa y volumen, no UNIDAD)
  get allowedUnits(): UnitOfMeasure[] {
    return ALLOWED_UNITS_BY_TYPE[InventoryType.INGREDIENT];
  }

  // Step dinámico: 1 para UNIDAD, 0.1 para otros
  get quantityStep(): string {
    return this.selectedUnit() === 'UNIDAD' ? '1' : '0.1';
  }

  onUnitChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedUnit.set(target.value as UnitOfMeasure);
    // Si cambia a UNIDAD, redondear la cantidad actual a entero
    if (target.value === 'UNIDAD' && this.quantity() !== null) {
      this.quantity.set(Math.round(this.quantity()!));
    }
    this.clearError();
  }

  // Validar según unidad: entero para UNIDAD, máximo 2 decimales para otros
  onQuantityChange(value: number | null): void {
    if (value === null || value === undefined) {
      this.quantity.set(null);
      this.clearError();
      return;
    }
    if (this.selectedUnit() === 'UNIDAD') {
      // Verificar si tiene decimales
      if (!Number.isInteger(value)) {
        this.errorMessage.set('Las unidades solo aceptan números enteros, no decimales');
        this.quantity.set(Math.floor(value));
        return;
      }
      this.clearError();
      this.quantity.set(value);
    } else {
      this.clearError();
      const rounded = Math.round(value * 100) / 100;
      this.quantity.set(rounded);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.name().trim()) {
      this.errorMessage.set('El nombre es requerido');
      return;
    }

    if (this.quantity() === null || this.quantity() === undefined) {
      this.errorMessage.set('La cantidad es requerida');
      return;
    }

    // Validación completa
    const validation = validateInventoryItem(
      this.selectedType(),
      this.selectedUnit(),
      this.quantity()!
    );

    if (!validation.valid) {
      this.errorMessage.set(validation.messages.join('. '));
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const request: InventoryUpdate = {
      name: this.name().trim(),
      quantity: this.quantity()!,
      type: InventoryType.INGREDIENT, // Siempre INGREDIENT
      unitOfMeasure: this.selectedUnit(),
    };

    this.inventoryService.update(this.itemId(), request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/inventory']);
      },
      error: (err) => {
        console.error('Error updating item:', err);
        this.errorMessage.set(
          err.error?.message || 'Error al actualizar el insumo'
        );
        this.isSubmitting.set(false);
      },
    });
  }

  onDelete(): void {
    if (!confirm('¿Estás seguro de eliminar este insumo?')) {
      return;
    }

    this.isDeleting.set(true);
    this.inventoryService.delete(this.itemId()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/inventory']);
      },
      error: (err) => {
        console.error('Error deleting item:', err);
        this.errorMessage.set(
          err.error?.message || 'Error al eliminar el insumo'
        );
        this.isDeleting.set(false);
      },
    });
  }

  private clearError(): void {
    this.errorMessage.set(null);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/inventory']);
  }
}
