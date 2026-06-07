import { Routes } from '@angular/router';

export const pensionistasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pensionistas-page/pensionistas-page.component'),
  },
];

export default pensionistasRoutes;
