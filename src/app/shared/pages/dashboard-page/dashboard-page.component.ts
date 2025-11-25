import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './dashboard-page.component.html',
})
export default class DashboardPageComponent {
  envs = environment;
}
