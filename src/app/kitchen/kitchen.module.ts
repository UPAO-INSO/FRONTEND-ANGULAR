import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KitchenPageComponent } from './kitchen-page/kitchen-page.component';

@NgModule({
  declarations: [KitchenPageComponent],
  imports: [CommonModule],
  exports: [KitchenPageComponent]
})
export class KitchenModule {}