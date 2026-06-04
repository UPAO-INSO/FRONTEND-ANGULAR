import { Component, input } from '@angular/core';

@Component({
  selector: 'app-list-state',
  templateUrl: './list-state.component.html',
})
export class ListStateComponent {
  loading  = input<boolean>(false);
  error    = input<string | null>(null);
  empty    = input<boolean>(false);

  /** Icono FontAwesome para el estado vacío (sin el prefijo fa-solid fa-) */
  emptyIcon    = input<string>('inbox');
  emptyTitle   = input<string>('Sin resultados');
  emptyMessage = input<string>('');

  loadingMessage = input<string>('Cargando...');
}
