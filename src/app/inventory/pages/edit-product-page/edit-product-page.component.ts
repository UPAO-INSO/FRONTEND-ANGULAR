import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

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
  available = signal<boolean>(true);

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
        this.available.set(product.available);
        this.productTypes.set(types);
        
        // Map recipe response to RecipeItem
        const mappedRecipe: RecipeItem[] = recipe.map(item => ({
          inventoryId: item.inventoryId,
          name: item.inventoryName || 'Insumo', // Backend should provide name
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure
        }));
        this.recipeItems.set(mappedRecipe);
        
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

    if (this.recipeItems().length === 0) {
      this.errorMessage.set('Debe agregar al menos un insumo a la receta');
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.productService
      .updateProductFull(this.productId(), {
        name: this.name().trim(),
        price: this.price(),
        description: this.description().trim(),
        productTypeId: this.selectedTypeId(),
        active: this.originalProduct()?.active ?? true,
        available: this.available(),
        recipe: this.recipeItems().map(item => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure
        }))
      })
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

  toggleAvailable(): void {
    this.available.set(!this.available());
  }

  goBack(): void {
    this.router.navigate(['/dashboard/inventory']);
  }
}
