import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    loadComponent: () =>
      import('./pages/inventory-page/inventory-page.component').then(
        (m) => m.InventoryPageComponent
      ),
  },
  {
    path: 'add-insumo',
    loadComponent: () =>
      import('./pages/add-insumo-page/add-insumo-page.component').then(
        (m) => m.AddInsumoPageComponent
      ),
  },
  {
    path: 'add-product',
    loadComponent: () =>
      import('./pages/add-product-page/add-product-page.component').then(
        (m) => m.AddProductPageComponent
      ),
  },
  {
    path: 'edit-insumo/:id',
    loadComponent: () =>
      import('./pages/edit-insumo-page/edit-insumo-page.component').then(
        (m) => m.EditInsumoPageComponent
      ),
  },
  {
    path: 'edit-product/:id',
    loadComponent: () =>
      import('./pages/edit-product-page/edit-product-page.component').then(
        (m) => m.EditProductPageComponent
      ),
  },
];

export default inventoryRoutes;
