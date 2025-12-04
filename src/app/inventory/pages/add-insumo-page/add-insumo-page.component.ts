import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InventoryService } from '../../services/inventory.service';
import {
  InventoryRequest,
  InventoryType,
  UnitOfMeasure,
  UNIT_OF_MEASURE_LABELS,
  ALLOWED_UNITS_BY_TYPE,
  validateInventoryItem,
} from '../../interfaces/inventory.interface';

@Component({
  selector: 'app-add-insumo-page',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './add-insumo-page.component.html',
})
export class AddInsumoPageComponent {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  // Form state - Ahora solo para INGREDIENTES
  name = signal('');
  quantity = signal<number>(0);
  selectedUnit = signal<UnitOfMeasure>(UnitOfMeasure.G);

  // UI state
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Opciones - Solo unidades para ingredientes (MASS y VOLUME)
  unitLabels = UNIT_OF_MEASURE_LABELS;

  // Unidades permitidas para ingredientes
  get allowedUnits(): UnitOfMeasure[] {
    return ALLOWED_UNITS_BY_TYPE[InventoryType.INGREDIENT];
  }

  // Determinar step para el input de cantidad
  get quantityStep(): string {
    return this.selectedUnit() === UnitOfMeasure.UNIDAD ? '1' : '0.1';
  }

  onUnitChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const unit = target.value as UnitOfMeasure;
    this.selectedUnit.set(unit);
    this.clearError();
  }

  onQuantityChange(value: number): void {
    this.quantity.set(value);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    // Validaciones
    if (!this.name().trim()) {
      this.errorMessage.set('El nombre es requerido');
      return;
    }

    // Validación completa usando las reglas del backend
    const validation = validateInventoryItem(
      InventoryType.INGREDIENT,
      this.selectedUnit(),
      this.quantity()
    );

    if (!validation.valid) {
      this.errorMessage.set(validation.messages.join('. '));
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const request: InventoryRequest = {
      name: this.name().trim(),
      quantity: this.quantity(),
      type: InventoryType.INGREDIENT, // Siempre INGREDIENT
      unitOfMeasure: this.selectedUnit(),
    };

    this.inventoryService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/inventory']);
      },
      error: (err) => {
        console.error('Error creating inventory item:', err);
        this.errorMessage.set(
          err.error?.message || 'Error al crear el ingrediente'
        );
        this.isSubmitting.set(false);
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
