import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductType } from '@src/app/products/interfaces/product.type';

@Component({
  selector: 'app-product-fields',
  imports: [FormsModule],
  templateUrl: './product-fields.component.html',
})
export class ProductFieldsComponent {
  name        = model.required<string>();
  price       = model<number | null>(null);
  description = model<string>('');
  selectedTypeId = model<number | null>(null);

  productTypes         = input.required<ProductType[]>();
  categoryChangeWarning = input<string | null>(null);

  typeChange = output<Event>();
}
