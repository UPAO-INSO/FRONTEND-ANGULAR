import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderStateService } from '@src/app/shared/services/header-state.service';

@Component({
  selector: 'app-order-layout',
  imports: [RouterOutlet],
  templateUrl: './order-layout.component.html',
})
export class OrderLayoutComponent {
  headerStateService = inject(HeaderStateService);

  headerChange(header: string) {
    this.headerStateService.changeHeader(header);
  }
}
