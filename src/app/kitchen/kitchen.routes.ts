import { Routes } from '@angular/router';
import KitchenPageComponent from './pages/kitchen-page/kitchen-page.component';

export const kitchenRoutes: Routes = [
  { path: '', component: KitchenPageComponent },
  { path: '**', redirectTo: '' },
];

export default kitchenRoutes;
