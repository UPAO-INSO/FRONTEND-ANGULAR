import { Routes } from '@angular/router';

export const separacionesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/separaciones-page/separaciones-page.component'),
  },
];

export default separacionesRoutes;
