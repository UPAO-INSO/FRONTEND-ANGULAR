import { Routes } from '@angular/router';
import { KitchenLayoutComponent } from './layouts/kitchen-layout/kitchen-layout.component';
import KitchenPageComponent from './pages/kitchen-page/kitchen-page.component';

export const kitchenRoutes: Routes = [
  {
    path: '',
    component: KitchenLayoutComponent,
    children: [
      {
        path: '',
        component: KitchenPageComponent,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];

export default kitchenRoutes;
