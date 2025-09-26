import { Component, inject, output, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideMenuComponent } from '../../components/side-menu/side-menu.component';
import { HeaderStateService } from '../../../shared/services/header-state.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterOutlet, SideMenuComponent, NavbarComponent],
  templateUrl: './dashboard-page.component.html',
})
export default class DashboardPageComponent {
  headerStateService = inject(HeaderStateService);

  headerChange(header: string) {
    this.headerStateService.changeHeader(header);
  }
}
