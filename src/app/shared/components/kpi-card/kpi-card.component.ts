import { Component, input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
})
export class KpiCardComponent {
  /** Clase Font Awesome del icono, p.ej. "fa-solid fa-receipt" */
  icon       = input.required<string>();
  /** Clase de color del icono, p.ej. "text-brand" */
  iconColor  = input<string>('text-brand');
  /** Clase de color del fondo del icono, p.ej. "bg-brand/10" */
  iconBg     = input<string>('bg-brand/10');
  /** Etiqueta pequeña */
  label      = input.required<string>();
  /** Valor principal (puede ser string o number) */
  value      = input.required<string | number>();
  /** Clase de color del valor, p.ej. "text-brand" */
  valueColor = input<string>('text-text-primary');
}
