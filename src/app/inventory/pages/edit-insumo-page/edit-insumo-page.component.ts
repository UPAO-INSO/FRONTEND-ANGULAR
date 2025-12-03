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
  validateTypeChange,
  validateUnitChange,
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
  quantity = signal<number>(0);
  selectedType = signal<InventoryType>(InventoryType.INGREDIENT);
  selectedUnit = signal<UnitOfMeasure>(UnitOfMeasure.G);

  // UI state
  isLoading = signal(true);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  errorMessage = signal<string | null>(null);

  // Opciones
  inventoryTypes = Object.values(InventoryType);
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

  get allowedUnits(): UnitOfMeasure[] {
    return ALLOWED_UNITS_BY_TYPE[this.selectedType()];
  }

  get quantityStep(): string {
    return this.selectedUnit() === UnitOfMeasure.UNIDAD ? '1' : '0.01';
  }

  onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newType = target.value as InventoryType;
    const originalType = this.originalItem()?.type ?? InventoryType.INGREDIENT;

    // Validar cambio de tipo según reglas del backend
    const validation = validateTypeChange(
      originalType,
      newType,
      this.selectedUnit(),
      this.quantity()
    );

    if (!validation.valid) {
      this.errorMessage.set(validation.message!);
      // Revertir al tipo anterior
      target.value = this.selectedType();
      return;
    }

    this.selectedType.set(newType);

    // Si es BEVERAGE o DISPOSABLE, forzar UNIDAD
    const allowedUnits = ALLOWED_UNITS_BY_TYPE[newType];
    if (!allowedUnits.includes(this.selectedUnit())) {
      this.selectedUnit.set(allowedUnits[0]);
      
      // Redondear cantidad si es UNIDAD
      if (allowedUnits[0] === UnitOfMeasure.UNIDAD && !Number.isInteger(this.quantity())) {
        this.quantity.set(Math.round(this.quantity()));
      }
    }

    this.clearError();
  }

  onUnitChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newUnit = target.value as UnitOfMeasure;
    const originalUnit = this.originalItem()?.unitOfMeasure ?? UnitOfMeasure.G;

    // Validar cambio de unidad según reglas del backend
    const validation = validateUnitChange(
      this.selectedType(),
      originalUnit,
      newUnit,
      this.quantity()
    );

    if (!validation.valid) {
      this.errorMessage.set(validation.message!);
      target.value = this.selectedUnit();
      return;
    }

    this.selectedUnit.set(newUnit);

    // Si cambia a UNIDAD, redondear cantidad
    if (newUnit === UnitOfMeasure.UNIDAD && !Number.isInteger(this.quantity())) {
      this.quantity.set(Math.round(this.quantity()));
    }

    this.clearError();
  }

  onQuantityChange(value: number): void {
    if (this.selectedUnit() === UnitOfMeasure.UNIDAD) {
      this.quantity.set(Math.round(value));
    } else {
      this.quantity.set(value);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.name().trim()) {
      this.errorMessage.set('El nombre es requerido');
      return;
    }

    // Validación completa
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

    const request: InventoryUpdate = {
      name: this.name().trim(),
      quantity: this.quantity(),
      type: this.selectedType(),
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
