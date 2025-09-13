import { Component, signal, input, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderStateService } from './shared/services/header-state.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('pov-app');

  headerStateService = inject(HeaderStateService);
}
