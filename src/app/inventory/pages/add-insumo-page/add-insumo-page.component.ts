import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InventoryService } from '../../services/inventory.service';
import {
  InventoryRequest,
  InventoryType,
  UnitOfMeasure,
  INVENTORY_TYPE_LABELS,
  UNIT_OF_MEASURE_LABELS,
  ALLOWED_UNITS_BY_TYPE,
  validateInventoryItem,
  validateTypeAndUnitConsistency,
} from '../../interfaces/inventory.interface';

@Component({
  selector: 'app-add-insumo-page',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './add-insumo-page.component.html',
})
export class AddInsumoPageComponent {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  // Form state
  name = signal('');
  quantity = signal<number>(0);
  selectedType = signal<InventoryType>(InventoryType.INGREDIENT);
  selectedUnit = signal<UnitOfMeasure>(UnitOfMeasure.G);

  // UI state
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Opciones
  inventoryTypes = Object.values(InventoryType);
  typeLabels = INVENTORY_TYPE_LABELS;
  unitLabels = UNIT_OF_MEASURE_LABELS;

  // Unidades permitidas según tipo seleccionado
  // REGLA: BEVERAGE y DISPOSABLE SOLO permiten UNIDAD
  get allowedUnits(): UnitOfMeasure[] {
    return ALLOWED_UNITS_BY_TYPE[this.selectedType()];
  }

  // Determinar step para el input de cantidad
  // REGLA: UNIDAD solo acepta enteros
  get quantityStep(): string {
    return this.selectedUnit() === UnitOfMeasure.UNIDAD ? '1' : '0.01';
  }

  onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const type = target.value as InventoryType;
    this.selectedType.set(type);

    // REGLA: Si es BEVERAGE o DISPOSABLE, forzar UNIDAD
    const allowedUnits = ALLOWED_UNITS_BY_TYPE[type];
    if (!allowedUnits.includes(this.selectedUnit())) {
      this.selectedUnit.set(allowedUnits[0]); // Será UNIDAD
      
      // Si la cantidad tiene decimales, redondear
      if (allowedUnits[0] === UnitOfMeasure.UNIDAD && !Number.isInteger(this.quantity())) {
        this.quantity.set(Math.round(this.quantity()));
      }
    }
    
    this.clearError();
  }

  onUnitChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const unit = target.value as UnitOfMeasure;
    
    // Validar antes de cambiar
    const validation = validateTypeAndUnitConsistency(
      this.selectedType(),
      unit,
      this.quantity()
    );
    
    if (!validation.valid) {
      this.errorMessage.set(validation.message!);
      return;
    }
    
    this.selectedUnit.set(unit);
    
    // Si cambia a UNIDAD, redondear cantidad
    if (unit === UnitOfMeasure.UNIDAD && !Number.isInteger(this.quantity())) {
      this.quantity.set(Math.round(this.quantity()));
    }
    
    this.clearError();
  }

  onQuantityChange(value: number): void {
    // Si es UNIDAD, forzar entero
    if (this.selectedUnit() === UnitOfMeasure.UNIDAD) {
      this.quantity.set(Math.round(value));
    } else {
      this.quantity.set(value);
    }
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
      this.selectedType(),
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
      type: this.selectedType(),
      unitOfMeasure: this.selectedUnit(),
    };

    this.inventoryService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/inventory']);
      },
      error: (err) => {
        console.error('Error creating inventory item:', err);
        this.errorMessage.set(
          err.error?.message || 'Error al crear el insumo'
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
