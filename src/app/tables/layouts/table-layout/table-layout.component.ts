import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderStateService } from '@src/app/shared/services/header-state.service';

@Component({
  selector: 'app-table-layout',
  imports: [RouterOutlet],
  templateUrl: './table-layout.component.html',
})
export class TableLayoutComponent {
  headerStateService = inject(HeaderStateService);

  headerChange(header: string) {
    this.headerStateService.changeHeader(header);
  }
}
