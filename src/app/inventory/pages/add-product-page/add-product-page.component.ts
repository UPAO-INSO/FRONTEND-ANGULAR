import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '@src/app/products/services/product.service';
import { ProductType } from '@src/app/products/interfaces/product.type';
import { RecipeModalComponent, RecipeItem } from '../../components/recipe-modal/recipe-modal.component';

@Component({
  selector: 'app-add-product-page',
  imports: [CommonModule, FormsModule, RecipeModalComponent],
  templateUrl: './add-product-page.component.html',
})
export class AddProductPageComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);

  // Form state
  name = signal('');
  price = signal<number>(0);
  description = signal('');
  selectedTypeId = signal<number | null>(null);
  
  // Para bebidas y descartables - cantidad inicial en inventario
  initialQuantity = signal<number>(1);

  // Recipe state (solo para platos)
  showRecipeModal = signal(false);
  recipeItems = signal<RecipeItem[]>([]);

  // UI state
  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Opciones
  productTypes = signal<ProductType[]>([]);

  // Computed: detectar si es bebida o descartable
  isBeverageOrDisposable = computed(() => {
    const typeId = this.selectedTypeId();
    if (!typeId) return false;
    const type = this.productTypes().find(t => t.id === typeId);
    if (!type) return false;
    const typeName = type.name.toUpperCase();
    return typeName === 'BEBIDAS' || typeName === 'DESCARTABLES';
  });

  // Computed: nombre del tipo seleccionado
  selectedTypeName = computed(() => {
    const typeId = this.selectedTypeId();
    if (!typeId) return '';
    const type = this.productTypes().find(t => t.id === typeId);
    return type?.name || '';
  });

  ngOnInit(): void {
    this.loadProductTypes();
  }

  private loadProductTypes(): void {
    this.productService.fetchProductsType().subscribe({
      next: (types) => {
        this.productTypes.set(types);
        if (types.length > 0) {
          this.selectedTypeId.set(types[0].id);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading product types:', err);
        this.errorMessage.set('Error al cargar las categorías');
        this.isLoading.set(false);
      },
    });
  }

  onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedTypeId.set(+target.value);
    // Limpiar receta cuando cambia el tipo
    this.recipeItems.set([]);
    this.errorMessage.set(null);
  }

  openRecipeModal() {
    this.showRecipeModal.set(true);
  }

  closeRecipeModal() {
    this.showRecipeModal.set(false);
  }

  onRecipeAdded(items: RecipeItem[]) {
    this.recipeItems.set(items);
    this.closeRecipeModal();
  }

  removeRecipeItem(index: number) {
    this.recipeItems.update(items => items.filter((_, i) => i !== index));
  }

  // Redondear precio a 2 decimales
  onPriceChange(value: number): void {
    const rounded = Math.round(value * 100) / 100;
    this.price.set(rounded);
  }

  // Para bebidas/descartables: solo enteros
  onInitialQuantityChange(value: number): void {
    this.initialQuantity.set(Math.round(value));
  }

  goBack(): void {
    this.router.navigate(['/dashboard/inventory']);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    // Validaciones básicas
    if (!this.name().trim()) {
      this.errorMessage.set('El nombre es requerido');
      return;
    }

    if (this.price() <= 0) {
      this.errorMessage.set('El precio debe ser mayor a 0');
      return;
    }

    if (!this.selectedTypeId()) {
      this.errorMessage.set('Debe seleccionar una categoría');
      return;
    }

    // Validaciones específicas según tipo
    if (this.isBeverageOrDisposable()) {
      // Para bebidas/descartables: validar cantidad inicial
      if (this.initialQuantity() < 0) {
        this.errorMessage.set('La cantidad inicial no puede ser negativa');
        return;
      }
    } else {
      // Para platos: validar receta
      if (this.recipeItems().length === 0) {
        this.errorMessage.set('Debe agregar al menos un ingrediente a la receta');
        return;
      }
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    // Construir request según el tipo
    const request: any = {
      name: this.name().trim(),
      price: this.price(),
      description: this.description().trim(),
      productTypeId: this.selectedTypeId()!,
    };

    if (this.isBeverageOrDisposable()) {
      // Para bebidas/descartables: enviar cantidad inicial
      request.initialQuantity = this.initialQuantity();
    } else {
      // Para platos: enviar receta
      request.recipe = this.recipeItems().map(item => ({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure
      }));
    }

    this.productService
      .createProduct(request)
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard/inventory']);
        },
        error: (err) => {
          console.error('Error creating product:', err);
          this.errorMessage.set(
            err.error?.message || 'Error al crear el producto'
          );
          this.isSubmitting.set(false);
        },
      });
  }
}
