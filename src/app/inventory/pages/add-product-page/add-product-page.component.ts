import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '@src/app/products/services/product.service';
import { ProductType } from '@src/app/products/interfaces/product.type';

@Component({
  selector: 'app-add-product-page',
  imports: [CommonModule, FormsModule],
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

  // UI state
  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Opciones
  productTypes = signal<ProductType[]>([]);

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
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    // Validaciones
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

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.productService
      .createProduct({
        name: this.name().trim(),
        price: this.price(),
        description: this.description().trim(),
        productTypeId: this.selectedTypeId()!,
      })
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

  goBack(): void {
    this.router.navigate(['/dashboard/inventory']);
  }
}
