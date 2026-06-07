import { Routes } from '@angular/router';
import { TablesPageComponent } from './pages/tables-page/tables-page.component';

export const tableRoutes: Routes = [
  { path: '', component: TablesPageComponent },
  { path: '**', redirectTo: '' },
];

export default tableRoutes;
