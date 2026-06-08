import { Routes } from '@angular/router';

const clientsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/clients-page/clients-page.component').then(
        (m) => m.ClientsPageComponent
      ),
  },
];

export default clientsRoutes;
