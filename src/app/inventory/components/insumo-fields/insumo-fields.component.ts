import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UnitOfMeasure, UNIT_OF_MEASURE_LABELS } from '../../interfaces/inventory.interface';

@Component({
  selector: 'app-insumo-fields',
  imports: [FormsModule],
  templateUrl: './insumo-fields.component.html',
})
export class InsumoFieldsComponent {
  name         = model.required<string>();
  quantity     = model<number | null>(null);
  selectedUnit = model<UnitOfMeasure>(UnitOfMeasure.G);
  allowedUnits = input.required<UnitOfMeasure[]>();
  quantityStep = input<number | string>(1);

  readonly unitLabels = UNIT_OF_MEASURE_LABELS;

  unitChange = output<Event>();
}
