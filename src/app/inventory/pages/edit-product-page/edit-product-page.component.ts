import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ProductService } from '@src/app/products/services/product.service';
import { Product, ProductType } from '@src/app/products/interfaces/product.type';
import { InventoryService } from '../../services/inventory.service';
import { RecipeModalComponent, RecipeItem } from '../../components/recipe-modal/recipe-modal.component';

@Component({
  selector: 'app-edit-product-page',
  imports: [CommonModule, RouterLink, FormsModule, RecipeModalComponent],
  templateUrl: './edit-product-page.component.html',
})
export class EditProductPageComponent implements OnInit {
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Item original
  productId = signal<number>(0);
  originalProduct = signal<Product | null>(null);

  // Form state
  name = signal('');
  price = signal<number>(0);
  description = signal('');
  selectedTypeId = signal<number>(0);
  originalTypeId = signal<number>(0); // Tipo original para detectar cambios
  
  // Para bebidas y descartables - cantidad en inventario
  inventoryQuantity = signal<number>(0);
  inventoryId = signal<number | null>(null); // ID del registro en inventory

  // Recipe state
  showRecipeModal = signal(false);
  recipeItems = signal<RecipeItem[]>([]);

  // UI state
  isLoading = signal(true);
  isSubmitting = signal(false);
  isDeleting = signal(false);
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

  // Computed: detectar si el tipo ORIGINAL era bebida o descartable
  wasOriginallyBeverageOrDisposable = computed(() => {
    const typeId = this.originalTypeId();
    if (!typeId) return false;
    const type = this.productTypes().find(t => t.id === typeId);
    if (!type) return false;
    const typeName = type.name.toUpperCase();
    return typeName === 'BEBIDAS' || typeName === 'DESCARTABLES';
  });

  // Computed: detectar si hubo cambio de categoría que implica pérdida de datos
  categoryChangeWarning = computed(() => {
    const currentTypeId = this.selectedTypeId();
    const originalTypeId = this.originalTypeId();
    
    if (currentTypeId === originalTypeId) return null;
    
    const wasBevorDisp = this.wasOriginallyBeverageOrDisposable();
    const isNowBevOrDisp = this.isBeverageOrDisposable();
    
    if (wasBevorDisp && !isNowBevOrDisp) {
      // De bebida/descartable a plato
      return 'Al cambiar a esta categoría, se eliminará el registro de inventario asociado y deberás configurar una receta.';
    }
    
    if (!wasBevorDisp && isNowBevOrDisp) {
      // De plato a bebida/descartable
      return 'Al cambiar a esta categoría, se eliminará la receta actual y se creará un registro de inventario.';
    }
    
    return null; // Cambio sin pérdida de datos (ej: de entrada a segundo, o de bebida a descartable)
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.loadData(+id);
    }
  }

  private loadData(id: number): void {
    this.isLoading.set(true);

    forkJoin({
      product: this.productService.fetchProductById(id),
      types: this.productService.fetchProductsType(),
      recipe: this.inventoryService.getRecipe(id)
    }).subscribe({
      next: ({ product, types, recipe }) => {
        this.originalProduct.set(product);
        this.name.set(product.name);
        this.price.set(product.price);
        this.description.set(product.description);
        this.selectedTypeId.set(product.productTypeId);
        this.originalTypeId.set(product.productTypeId); // Guardar tipo original
        this.productTypes.set(types);
        
        // Map recipe response to RecipeItem
        const mappedRecipe: RecipeItem[] = recipe.map(item => ({
          inventoryId: item.inventoryId,
          name: item.inventoryName || 'Ingrediente',
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure
        }));
        this.recipeItems.set(mappedRecipe);
        
        // Para bebidas/descartables, obtener la cantidad del inventario y el inventoryId
        if (recipe.length > 0) {
          this.inventoryQuantity.set(recipe[0].inventoryQuantityAvailable || 0);
          this.inventoryId.set(recipe[0].inventoryId);
        }
        
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.errorMessage.set('No se pudo cargar el producto');
        this.isLoading.set(false);
      },
    });
  }

  onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedTypeId.set(+target.value);
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

  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.name().trim()) {
      this.errorMessage.set('El nombre es requerido');
      return;
    }

    if (this.price() <= 0) {
      this.errorMessage.set('El precio debe ser mayor a 0');
      return;
    }

    // Validar según el tipo de producto actual/nuevo
    const changingToBevOrDisp = !this.wasOriginallyBeverageOrDisposable() && this.isBeverageOrDisposable();
    const stayingAsPlato = !this.isBeverageOrDisposable();
    
    // Solo validar receta para platos que NO están cambiando a bebida/descartable
    if (stayingAsPlato && !changingToBevOrDisp && this.recipeItems().length === 0) {
      this.errorMessage.set('Debe agregar al menos un ingrediente a la receta');
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const request: any = {
      name: this.name().trim(),
      price: this.price(),
      description: this.description().trim(),
      productTypeId: this.selectedTypeId(),
      active: this.originalProduct()?.active ?? true,
    };

    // Si está cambiando de plato a bebida/descartable, enviar cantidad inicial
    if (changingToBevOrDisp) {
      request.initialQuantity = this.inventoryQuantity() || 0;
    }

    // Solo enviar receta si NO es bebida/descartable
    if (!this.isBeverageOrDisposable()) {
      request.recipe = this.recipeItems().map(item => ({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure
      }));
    }

    // Actualizar el producto
    this.productService
      .updateProductFull(this.productId(), request)
      .pipe(
        switchMap(() => {
          // Si es bebida/descartable y tenemos inventoryId, actualizar la cantidad en inventory
          if (this.isBeverageOrDisposable() && this.inventoryId()) {
            return this.inventoryService.update(this.inventoryId()!, {
              quantity: this.inventoryQuantity()
            });
          }
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard/inventory']);
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.errorMessage.set(
            err.error?.message || 'Error al actualizar el producto'
          );
          this.isSubmitting.set(false);
        },
      });
  }

  onPriceChange(value: number): void {
    this.errorMessage.set(null);
    this.price.set(this.roundToTwoDecimals(value));
  }

  onInventoryQuantityChange(value: number): void {
    // Para bebidas/descartables, solo enteros
    if (!Number.isInteger(value)) {
      this.errorMessage.set('La cantidad solo acepta números enteros, no decimales');
      this.inventoryQuantity.set(Math.floor(value));
      return;
    }
    this.errorMessage.set(null);
    this.inventoryQuantity.set(value);
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  onDelete(): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    this.isDeleting.set(true);
    this.productService.deleteProduct(this.productId()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/inventory']);
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.errorMessage.set('Error al eliminar el producto');
        this.isDeleting.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/inventory']);
  }
}
