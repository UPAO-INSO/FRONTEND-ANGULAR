import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock-section',
  imports: [FormsModule],
  templateUrl: './stock-section.component.html',
})
export class StockSectionComponent {
  /** Cantidad actual. Usar model() para two-way binding con la señal del padre. */
  quantity = model<number | null>(null);
  /** Si true, el label dice "Cantidad Inicial"; si false, "Cantidad actual". */
  isNew      = input<boolean>(false);
  /** Nombre del tipo (Bebidas, Descartables…) para el hint. */
  typeName   = input<string>('');
  /** Si false, muestra un aviso de que no hay inventario asociado. */
  hasInventory = input<boolean>(true);
}
